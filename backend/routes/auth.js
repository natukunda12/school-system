const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const pool = require('../config/db');
const withTx = require('../utils/tx');
const audit = require('../utils/audit');
const { authenticate } = require('../middleware/auth');
const { HttpError, wrap, required } = require('../utils/http');

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, message: { message: 'Too many attempts. Try again later' } });
const norm = (p) => String(p || '').replace(/\D/g, '').slice(-9);
function signToken(u, studentId) {
  return jwt.sign(
    {
      id: u.id,
      role: u.role,
      name: u.username,
      studentId
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES || '8h'
    }
  );
}
router.post('/login', loginLimiter, wrap(async (req, res) => {
  required(req.body, ['username', 'password']);

  const [rows] = await pool.query(
    `SELECT
       u.user_id AS id,
       u.username,
       u.email,
       u.password_hash,
       u.status,
       u.student_id,
       r.name AS role
     FROM users u
     JOIN roles r ON r.role_id = u.role_id
     WHERE u.username = ?`,
    [String(req.body.username).trim()]
  );

  const u = rows[0];

  if (
    !u ||
    u.status !== 'ACTIVE' ||
    !(await bcrypt.compare(
      String(req.body.password),
      u.password_hash
    ))
  ) {
    throw new HttpError(401, 'Wrong username or password');
  }

  const studentId = u.student_id || null;
  const role = String(u.role).toLowerCase();

  await pool.query(
    'UPDATE users SET last_login = NOW() WHERE user_id = ?',
    [u.id]
  );

  req.user = { id: u.id };

  await audit(req, 'LOGIN', 'user', u.id);

  const tokenUser = { ...u, role };

  res.json({
    token: signToken(tokenUser, studentId),
    user: {
      id: u.id,
      name: u.username,
      username: u.username,
      role,
      studentId
    }
  });
}));
router.get('/me', authenticate, wrap(async (req, res) => {
  const [rows] = await pool.query(
    'SELECT u.id, u.full_name, u.username, u.email, u.phone, r.name AS role FROM users u JOIN roles r ON r.role_id = u.role_id WHERE u.id = ?',
    [req.user.id]
  );
  res.json({ ...rows[0], studentId: req.user.studentId || null });
}));

router.post('/change-password', authenticate, wrap(async (req, res) => {
  required(req.body, ['current_password', 'new_password']);
  if (String(req.body.new_password).length < 8) throw new HttpError(400, 'New password must be at least 8 characters');
  const [rows] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
  if (!(await bcrypt.compare(String(req.body.current_password), rows[0].password_hash))) {
    throw new HttpError(400, 'Current password is wrong');
  }
  await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [await bcrypt.hash(String(req.body.new_password), 10), req.user.id]);
  await audit(req, 'CHANGE_PASSWORD', 'user', req.user.id);
  res.json({ message: 'Password changed' });
}));

module.exports = router;
