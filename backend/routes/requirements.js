const router = require('express').Router();
const pool = require('../config/db');
const withTx = require('../utils/tx');
const audit = require('../utils/audit');
const { syncRequirements } = require('../services/registrations');
const { authenticate, authorize, ADMINS, STAFF } = require('../middleware/auth');
const { HttpError, wrap, required } = require('../utils/http');

router.use(authenticate);

router.get('/', authorize(...STAFF), wrap(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM requirements ORDER BY is_active DESC, name');
  res.json(rows);
}));

const cols = ['name', 'description', 'category', 'applies_to_type', 'applies_to_boarding', 'term_id', 'class_id', 'is_active'];

router.post('/', authorize(...ADMINS), wrap(async (req, res) => {
  required(req.body, ['name']);
  const b = req.body;
  const [r] = await pool.query(
    `INSERT INTO requirements (name, description, category, applies_to_type, applies_to_boarding, term_id, class_id, is_active)
     VALUES (?,?,?,?,?,?,?,?)`,
    [b.name, b.description || null, b.category || 'item', b.applies_to_type || 'all', b.applies_to_boarding || 'all',
      b.term_id || null, b.class_id || null, b.is_active === false ? 0 : 1]);
  await audit(req, 'CREATE_REQUIREMENT', 'requirement', r.insertId);
  res.status(201).json({ id: r.insertId });
}));

router.put('/:id', authorize(...ADMINS), wrap(async (req, res) => {
  const sets = [], vals = [];
  for (const c of cols) if (req.body[c] !== undefined) { sets.push(`${c} = ?`); vals.push(req.body[c] === '' ? null : req.body[c]); }
  if (!sets.length) throw new HttpError(400, 'Nothing to update');
  await pool.query(`UPDATE requirements SET ${sets.join(', ')} WHERE id = ?`, [...vals, req.params.id]);
  await audit(req, 'UPDATE_REQUIREMENT', 'requirement', Number(req.params.id));
  res.json({ message: 'Updated' });
}));

// After adding/changing rules, add missing checklist items for registrations of a term
router.post('/sync', authorize(...ADMINS), wrap(async (req, res) => {
  required(req.body, ['term_id']);
  const n = await withTx(async (conn) => {
    const [regs] = await conn.query("SELECT id FROM registrations WHERE term_id = ? AND status = 'approved'", [req.body.term_id]);
    for (const r of regs) await syncRequirements(conn, r.id);
    return regs.length;
  });
  res.json({ message: `Checklist refreshed for ${n} registrations` });
}));

// Checklist of one registration (staff, or the student who owns it)
router.get('/registration/:registrationId', wrap(async (req, res) => {
  const [[reg]] = await pool.query('SELECT student_id FROM registrations WHERE id = ?', [req.params.registrationId]);
  if (!reg) throw new HttpError(404, 'Registration not found');
  if (req.user.role === 'student' && reg.student_id !== req.user.studentId) throw new HttpError(403, 'Not your record');
  if (req.user.role === 'parent') throw new HttpError(403, 'Not allowed');
  const [rows] = await pool.query(
    `SELECT sr.id, sr.status, sr.checked_at, sr.note, rq.name, rq.category FROM student_requirements sr
     JOIN requirements rq ON rq.id = sr.requirement_id WHERE sr.registration_id = ? ORDER BY rq.name`, [req.params.registrationId]);
  res.json({ items: rows, completed: rows.filter((r) => r.status === 'complete').length, total: rows.length });
}));

router.patch('/student-requirements/:id', authorize(...STAFF), wrap(async (req, res) => {
  const { status, note } = req.body;
  if (!['pending', 'complete'].includes(status)) throw new HttpError(400, 'Status must be pending or complete');
  await pool.query('UPDATE student_requirements SET status = ?, checked_by = ?, checked_at = NOW(), note = ? WHERE id = ?',
    [status, req.user.id, note || null, req.params.id]);
  await audit(req, 'CHECK_REQUIREMENT', 'student_requirement', Number(req.params.id), { status });
  res.json({ message: 'Updated' });
}));

module.exports = router;
