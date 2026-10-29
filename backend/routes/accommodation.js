const router = require('express').Router();
const pool = require('../config/db');
const withTx = require('../utils/tx');
const audit = require('../utils/audit');
const { authenticate, authorize, ADMINS, STAFF } = require('../middleware/auth');
const { HttpError, wrap, required } = require('../utils/http');

router.use(authenticate, authorize(...STAFF));

async function termOf(req) {
  if (req.query.term_id) return Number(req.query.term_id);
  const [r] = await pool.query('SELECT id FROM terms WHERE is_current = 1 LIMIT 1');
  return r[0]?.id || 0;
}

// ---------------- dormitories and bunk beds ----------------
router.get('/dormitories', wrap(async (req, res) => {
  const termId = await termOf(req);
  const [rows] = await pool.query(
    `SELECT d.*, (SELECT COUNT(*) FROM beds b WHERE b.dormitory_id = d.id) AS beds,
       (SELECT COUNT(*) FROM arrivals a JOIN beds b ON b.id = a.bed_id WHERE b.dormitory_id = d.id AND a.term_id = ?) AS occupied
     FROM dormitories d ORDER BY d.gender, d.name`, [termId]);
  res.json(rows);
}));

// Creates a dormitory with N bunks: each bunk has A (lower) and B (upper), e.g. 1A, 1B, 2A, 2B
router.post('/dormitories', authorize(...ADMINS), wrap(async (req, res) => {
  required(req.body, ['name', 'gender', 'bunks']);
  if (!['Male', 'Female'].includes(req.body.gender)) throw new HttpError(400, 'Gender must be Male or Female');
  const bunks = parseInt(req.body.bunks, 10);
  if (!(bunks >= 1 && bunks <= 300)) throw new HttpError(400, 'Number of bunks must be between 1 and 300');
  const id = await withTx(async (conn) => {
    const [d] = await conn.query('INSERT INTO dormitories (name, gender) VALUES (?,?)', [req.body.name.trim(), req.body.gender]);
    const vals = [];
    for (let n = 1; n <= bunks; n++) vals.push([d.insertId, n, 'A'], [d.insertId, n, 'B']);
    await conn.query('INSERT INTO beds (dormitory_id, bed_number, position) VALUES ?', [vals]);
    return d.insertId;
  });
  await audit(req, 'CREATE_DORMITORY', 'dormitory', id, { bunks });
  res.status(201).json({ id, beds: bunks * 2 });
}));

router.post('/dormitories/:id/bunks', authorize(...ADMINS), wrap(async (req, res) => {
  const add = parseInt(req.body.add, 10);
  if (!(add >= 1 && add <= 300)) throw new HttpError(400, 'Add between 1 and 300 bunks');
  await withTx(async (conn) => {
    const [[m]] = await conn.query('SELECT COALESCE(MAX(bed_number), 0) AS n FROM beds WHERE dormitory_id = ?', [req.params.id]);
    const vals = [];
    const last = Number(m.n);
    for (let n = last + 1; n <= last + add; n++) vals.push([Number(req.params.id), n, 'A'], [Number(req.params.id), n, 'B']);
    await conn.query('INSERT INTO beds (dormitory_id, bed_number, position) VALUES ?', [vals]);
  });
  await audit(req, 'ADD_BUNKS', 'dormitory', Number(req.params.id), { add });
  res.json({ message: `${add * 2} beds added` });
}));

router.patch('/dormitories/:id', authorize(...ADMINS), wrap(async (req, res) => {
  const sets = [], vals = [];
  if (req.body.is_active !== undefined) { sets.push('is_active = ?'); vals.push(req.body.is_active ? 1 : 0); }
  if (req.body.name) { sets.push('name = ?'); vals.push(req.body.name.trim()); }
  if (!sets.length) throw new HttpError(400, 'Nothing to update');
  await pool.query(`UPDATE dormitories SET ${sets.join(', ')} WHERE id = ?`, [...vals, req.params.id]);
  res.json({ message: 'Updated' });
}));

router.get('/dormitories/:id/beds', wrap(async (req, res) => {
  const termId = await termOf(req);
  const [rows] = await pool.query(
    `SELECT b.id, b.bed_number, b.position, s.full_name, s.student_code
     FROM beds b LEFT JOIN arrivals a ON a.bed_id = b.id AND a.term_id = ?
     LEFT JOIN students s ON s.id = a.student_id WHERE b.dormitory_id = ? ORDER BY b.bed_number, b.position`, [termId, req.params.id]);
  res.json(rows);
}));

// ---------------- refectory tables ----------------
router.get('/tables', wrap(async (req, res) => {
  const termId = await termOf(req);
  const [rows] = await pool.query(
    `SELECT t.*, (SELECT COUNT(*) FROM arrivals a WHERE a.table_id = t.id AND a.term_id = ?) AS occupied
     FROM refectory_tables t ORDER BY t.number`, [termId]);
  res.json(rows);
}));

router.post('/tables', authorize(...ADMINS), wrap(async (req, res) => {
  const count = parseInt(req.body.count, 10), capacity = parseInt(req.body.capacity || 10, 10);
  if (!(count >= 1 && count <= 200)) throw new HttpError(400, 'Create between 1 and 200 tables');
  if (!(capacity >= 1 && capacity <= 50)) throw new HttpError(400, 'Capacity must be between 1 and 50');
  await withTx(async (conn) => {
    const [[m]] = await conn.query('SELECT COALESCE(MAX(number), 0) AS n FROM refectory_tables');
    const vals = [];
    const last = Number(m.n);
    for (let n = last + 1; n <= last + count; n++) vals.push([n, capacity]);
    await conn.query('INSERT INTO refectory_tables (number, capacity) VALUES ?', [vals]);
  });
  await audit(req, 'CREATE_TABLES', 'refectory_table', null, { count, capacity });
  res.status(201).json({ message: `${count} tables created` });
}));

router.patch('/tables/:id', authorize(...ADMINS), wrap(async (req, res) => {
  const sets = [], vals = [];
  if (req.body.capacity !== undefined) { sets.push('capacity = ?'); vals.push(parseInt(req.body.capacity, 10)); }
  if (req.body.is_active !== undefined) { sets.push('is_active = ?'); vals.push(req.body.is_active ? 1 : 0); }
  if (!sets.length) throw new HttpError(400, 'Nothing to update');
  await pool.query(`UPDATE refectory_tables SET ${sets.join(', ')} WHERE id = ?`, [...vals, req.params.id]);
  res.json({ message: 'Updated' });
}));

router.get('/tables/:id/students', wrap(async (req, res) => {
  const termId = await termOf(req);
  const [rows] = await pool.query(
    `SELECT s.full_name, s.student_code, s.gender, c.name AS class_name FROM arrivals a
     JOIN students s ON s.id = a.student_id LEFT JOIN classes c ON c.id = s.current_class_id
     WHERE a.table_id = ? AND a.term_id = ? ORDER BY s.full_name`, [req.params.id, termId]);
  res.json(rows);
}));

module.exports = router;
