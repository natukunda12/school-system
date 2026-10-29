const router = require('express').Router();
const pool = require('../config/db');
const withTx = require('../utils/tx');
const audit = require('../utils/audit');
const { createStudent } = require('../services/students');
const { createRegistration, applyToStudent } = require('../services/registrations');
const { authenticate, authorize, ADMINS, STAFF } = require('../middleware/auth');
const { HttpError, wrap, required } = require('../utils/http');

router.use(authenticate);

// Admin registers a student for a term: new student (student: {...}) or returning (student_code)
router.post('/', authorize(...ADMINS), wrap(async (req, res) => {
  required(req.body, ['term_id']);
  const b = req.body;
  const out = await withTx(async (conn) => {
    let studentId, code, cur = {};
    if (b.student_code) {
      const [s] = await conn.query('SELECT * FROM students WHERE student_code = ?', [b.student_code]);
      if (!s.length) throw new HttpError(404, 'Student ID not found');
      studentId = s[0].id; code = s[0].student_code;
      cur = { class_id: s[0].current_class_id, combination_id: s[0].current_combination_id, boarding_status: s[0].boarding_status };
    } else if (b.student) {
      required(b.student, ['full_name', 'gender', 'date_of_birth']);
      if (!b.student.phone && !b.student.parent_phone) throw new HttpError(400, 'Student phone or parent phone is required');
      const s = await createStudent(conn, { ...b.student, class_id: b.class_id }, req.user.id);
      studentId = s.id; code = s.student_code;
    } else throw new HttpError(400, 'Send student_code (returning) or student (new)');

    const registrationId = await createRegistration(conn, studentId, {
      term_id: b.term_id, class_id: b.class_id || cur.class_id, combination_id: b.combination_id ?? cur.combination_id,
      boarding_status: b.boarding_status || cur.boarding_status, approve: true, reviewerId: req.user.id,
    });
    return { registrationId, student_code: code };
  });
  await audit(req, 'REGISTER_STUDENT', 'registration', out.registrationId);
  res.status(201).json(out);
}));

// Student registers themself for a new term (needs admin approval)
router.post('/self', authorize('student'), wrap(async (req, res) => {
  required(req.body, ['term_id']);
  const [[s]] = await pool.query('SELECT * FROM students WHERE id = ?', [req.user.studentId]);
  const id = await withTx((conn) => createRegistration(conn, s.id, {
    term_id: req.body.term_id,
    class_id: req.body.class_id || s.current_class_id,
    combination_id: req.body.combination_id ?? s.current_combination_id,
    boarding_status: req.body.boarding_status || s.boarding_status,
    approve: false,
  }));
  await audit(req, 'SELF_REGISTER', 'registration', id);
  res.status(201).json({ id, status: 'pending' });
}));

router.get('/', authorize(...STAFF), wrap(async (req, res) => {
  const where = ['1=1'], p = [];
  if (req.query.term_id) { where.push('r.term_id = ?'); p.push(req.query.term_id); }
  if (req.query.status) { where.push('r.status = ?'); p.push(req.query.status); }
  if (req.query.class_id) { where.push('r.class_id = ?'); p.push(req.query.class_id); }
  const [rows] = await pool.query(
    `SELECT r.*, s.full_name, s.student_code, c.name AS class_name, cb.code AS combination, t.name AS term_name
     FROM registrations r JOIN students s ON s.id = r.student_id JOIN classes c ON c.id = r.class_id
     LEFT JOIN combinations cb ON cb.id = r.combination_id JOIN terms t ON t.id = r.term_id
     WHERE ${where.join(' AND ')} ORDER BY r.created_at DESC LIMIT 500`, p);
  res.json(rows);
}));

router.patch('/:id/review', authorize(...ADMINS), wrap(async (req, res) => {
  const { status, note } = req.body;
  if (!['approved', 'rejected'].includes(status)) throw new HttpError(400, 'Status must be approved or rejected');
  await withTx(async (conn) => {
    const [[reg]] = await conn.query('SELECT * FROM registrations WHERE id = ? FOR UPDATE', [req.params.id]);
    if (!reg) throw new HttpError(404, 'Registration not found');
    if (reg.status !== 'pending') throw new HttpError(409, `Already ${reg.status}`);
    await conn.query('UPDATE registrations SET status = ?, reviewed_by = ?, reviewed_at = NOW(), review_note = ? WHERE id = ?',
      [status, req.user.id, note || null, reg.id]);
    if (status === 'approved') await applyToStudent(conn, reg);
  });
  await audit(req, `REGISTRATION_${status.toUpperCase()}`, 'registration', Number(req.params.id));
  res.json({ message: `Registration ${status}` });
}));

module.exports = router;
