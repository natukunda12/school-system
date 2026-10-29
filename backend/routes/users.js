const router = require('express').Router();
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const audit = require('../utils/audit');
const { authenticate, authorize } = require('../middleware/auth');
const { HttpError, wrap, required } = require('../utils/http');

router.use(authenticate, authorize('super_admin'));

router.get('/roles', wrap(async (req, res) => {
  const [rows] = await pool.query('SELECT id, name FROM roles');
  res.json(rows);
}));

router.get('/', wrap(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT u.id, u.full_name, u.username, u.email, u.phone, u.is_active, u.last_login_at, r.name AS role
     FROM users u JOIN roles r ON r.id = u.role_id WHERE r.name <> 'student' ORDER BY u.full_name`
  );
  res.json(rows);
}));

router.post('/', wrap(async (req, res) => {
  required(req.body, ['full_name', 'username', 'password', 'role']);
  if (String(req.body.password).length < 8) throw new HttpError(400, 'Password must be at least 8 characters');
  if (!['super_admin', 'registrar', 'staff', 'dean_of_discipline', 'secretary'].includes(req.body.role)) throw new HttpError(400, 'Role must be super_admin, registrar, staff, dean_of_discipline or secretary');
  const [role] = await pool.query('SELECT id FROM roles WHERE name = ?', [req.body.role]);
  const [r] = await pool.query(
    'INSERT INTO users (role_id, full_name, email, phone, username, password_hash) VALUES (?,?,?,?,?,?)',
    [role[0].id, req.body.full_name, req.body.email || null, req.body.phone || null, req.body.username.trim(), await bcrypt.hash(req.body.password, 10)]
  );
  await audit(req, 'CREATE_USER', 'user', r.insertId, { role: req.body.role });
  res.status(201).json({ id: r.insertId });
}));

router.patch('/:id', wrap(async (req, res) => {
  const { is_active, full_name, email, phone, password } = req.body;
  if (Number(req.params.id) === req.user.id && is_active === false) throw new HttpError(400, 'You cannot deactivate yourself');
  const sets = [], vals = [];
  if (is_active !== undefined) { sets.push('is_active = ?'); vals.push(is_active ? 1 : 0); }
  if (full_name) { sets.push('full_name = ?'); vals.push(full_name); }
  if (email !== undefined) { sets.push('email = ?'); vals.push(email || null); }
  if (phone !== undefined) { sets.push('phone = ?'); vals.push(phone || null); }
  if (password) {
    if (String(password).length < 8) throw new HttpError(400, 'Password must be at least 8 characters');
    sets.push('password_hash = ?'); vals.push(await bcrypt.hash(password, 10));
  }
  if (!sets.length) throw new HttpError(400, 'Nothing to update');
  await pool.query(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, [...vals, req.params.id]);
  await audit(req, 'UPDATE_USER', 'user', Number(req.params.id));
  res.json({ message: 'Updated' });
}));

module.exports = router;
