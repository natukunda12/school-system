const router = require('express').Router();
const pool = require('../config/db');
const withTx = require('../utils/tx');
const audit = require('../utils/audit');
const { authenticate, authorize, ADMINS } = require('../middleware/auth');
const { wrap, required } = require('../utils/http');

router.use(authenticate);

// everything the forms need in one call
router.get('/lookups', wrap(async (req, res) => {
  const [years] = await pool.query('SELECT * FROM academic_years ORDER BY start_date DESC');
  const [terms] = await pool.query('SELECT t.*, y.name AS year_name FROM terms t JOIN academic_years y ON y.id = t.academic_year_id ORDER BY t.start_date DESC');
  const [classes] = await pool.query('SELECT * FROM classes ORDER BY level, name');
  const [combinations] = await pool.query('SELECT * FROM combinations ORDER BY code');
  res.json({ years, terms, classes, combinations });
}));

router.post('/years', authorize(...ADMINS), wrap(async (req, res) => {
  required(req.body, ['name', 'start_date', 'end_date']);
  const id = await withTx(async (conn) => {
    if (req.body.is_current) await conn.query('UPDATE academic_years SET is_current = 0');
    const [r] = await conn.query('INSERT INTO academic_years (name, start_date, end_date, is_current) VALUES (?,?,?,?)',
      [req.body.name, req.body.start_date, req.body.end_date, req.body.is_current ? 1 : 0]);
    return r.insertId;
  });
  await audit(req, 'CREATE_YEAR', 'academic_year', id);
  res.status(201).json({ id });
}));

router.post('/terms', authorize(...ADMINS), wrap(async (req, res) => {
  required(req.body, ['academic_year_id', 'name', 'start_date', 'end_date']);
  const [r] = await pool.query('INSERT INTO terms (academic_year_id, name, start_date, end_date) VALUES (?,?,?,?)',
    [req.body.academic_year_id, req.body.name, req.body.start_date, req.body.end_date]);
  await audit(req, 'CREATE_TERM', 'term', r.insertId);
  res.status(201).json({ id: r.insertId });
}));

router.patch('/terms/:id/current', authorize(...ADMINS), wrap(async (req, res) => {
  await withTx(async (conn) => {
    await conn.query('UPDATE terms SET is_current = 0');
    await conn.query('UPDATE terms SET is_current = 1 WHERE id = ?', [req.params.id]);
    await conn.query('UPDATE academic_years SET is_current = 0');
    await conn.query('UPDATE academic_years SET is_current = 1 WHERE id = (SELECT academic_year_id FROM terms WHERE id = ?)', [req.params.id]);
  });
  await audit(req, 'SET_CURRENT_TERM', 'term', Number(req.params.id));
  res.json({ message: 'Current term updated' });
}));

router.post('/classes', authorize(...ADMINS), wrap(async (req, res) => {
  required(req.body, ['name']);
  const [r] = await pool.query('INSERT INTO classes (name, level) VALUES (?,?)', [req.body.name, req.body.level || null]);
  res.status(201).json({ id: r.insertId });
}));

router.post('/combinations', authorize(...ADMINS), wrap(async (req, res) => {
  required(req.body, ['code']);
  const [r] = await pool.query('INSERT INTO combinations (code, name) VALUES (?,?)', [req.body.code, req.body.name || null]);
  res.status(201).json({ id: r.insertId });
}));

router.get('/settings', wrap(async (req, res) => {
  const [rows] = await pool.query('SELECT setting_key, setting_value FROM settings');
  res.json(Object.fromEntries(rows.map((r) => [r.setting_key, r.setting_value])));
}));

router.put('/settings', authorize('super_admin'), wrap(async (req, res) => {
  for (const [k, v] of Object.entries(req.body)) {
    await pool.query('INSERT INTO settings (setting_key, setting_value) VALUES (?,?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)', [k, String(v)]);
  }
  await audit(req, 'UPDATE_SETTINGS', 'settings', null, Object.keys(req.body));
  res.json({ message: 'Settings saved' });
}));

module.exports = router;
