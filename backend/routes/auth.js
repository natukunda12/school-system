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
  return jwt.sign({ id: u.id, role: u.role, name: u.full_name, studentId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES || '8h',
  });
}

router.post('/login', loginLimiter, wrap(async (req, res) => {
  required(req.body, ['username', 'password']);
  const [rows] = await pool.query(
    'SELECT u.*, r.name AS role FROM users u JOIN roles r ON r.role_id = u.role_id WHERE u.username = ?',
    [String(req.body.username).trim()]
  );
  const u = rows[0];
  if (!u || !u.is_active || !(await bcrypt.compare(String(req.body.password), u.password_hash))) {
    throw new HttpError(401, 'Wrong username or password');
  }
  let studentId = null;
  if (u.role === 'student') {
    const [s] = await pool.query('SELECT id FROM students WHERE user_id = ?', [u.id]);
    studentId = s[0]?.id || null;
  }
  await pool.query('UPDATE users SET last_login_at = NOW() WHERE id = ?', [u.id]);
  req.user = { id: u.id };
  await audit(req, 'LOGIN', 'user', u.id);
  res.json({ token: signToken(u, studentId), user: { id: u.id, name: u.full_name, username: u.username, role: u.role, studentId } });
}));

// Student creates an account with Student ID + registered phone number
router.post('/student-account', loginLimiter, wrap(async (req, res) => {
  required(req.body, ['student_code', 'phone', 'password']);
  const { student_code, phone, password } = req.body;
  if (String(password).length < 8) throw new HttpError(400, 'Password must be at least 8 characters');

  const bad = new HttpError(400, 'Student ID or phone number is not correct');
  const [rows] = await pool.query('SELECT * FROM students WHERE student_code = ?', [String(student_code).trim()]);
  const s = rows[0];
  if (!s) throw bad;
  if (s.user_id) throw new HttpError(409, 'This student already has an account. Please log in');

  // limit wrong guesses per student (5 attempts, then wait 30 minutes)
  let [vr] = await pool.query(
    'SELECT * FROM account_verifications WHERE student_id = ? AND used_at IS NULL AND expires_at > NOW() ORDER BY id DESC LIMIT 1',
    [s.id]
  );
  let v = vr[0];
  if (!v) {
    const [ins] = await pool.query(
      "INSERT INTO account_verifications (student_id, channel, code_hash, expires_at) VALUES (?, 'phone', '-', DATE_ADD(NOW(), INTERVAL 30 MINUTE))",
      [s.id]
    );
    v = { id: ins.insertId, attempts: 0 };
  }
  if (v.attempts >= 5) throw new HttpError(429, 'Too many wrong attempts. Try again in 30 minutes or ask the school');

  const [ps] = await pool.query(
    'SELECT p.phone FROM student_parents sp JOIN parents p ON p.id = sp.parent_id WHERE sp.student_id = ?',
    [s.id]
  );
  const phones = [s.phone, ...ps.map((p) => p.phone)].filter(Boolean).map(norm);
  if (!norm(phone) || !phones.includes(norm(phone))) {
    await pool.query('UPDATE account_verifications SET attempts = attempts + 1 WHERE id = ?', [v.id]);
    throw bad;
  }

  const username = await withTx(async (conn) => {
    const base = s.full_name.toLowerCase().split(/\s+/).map((w) => w.replace(/[^a-z0-9]/g, '')).filter(Boolean).slice(0, 2).join('.') || 'student';
    let name;
    for (;;) {
      name = `${base.slice(0, 20)}${Math.floor(100 + Math.random() * 900)}`;
      const [ex] = await conn.query('SELECT id FROM users WHERE username = ?', [name]);
      if (!ex.length) break;
    }
    const hash = await bcrypt.hash(String(password), 10);
    const [role] = await conn.query("SELECT id FROM roles WHERE name = 'student'");
    const [u] = await conn.query(
      'INSERT INTO users (role_id, full_name, email, phone, username, password_hash) VALUES (?,?,?,?,?,?)',
      [role[0].id, s.full_name, s.email, s.phone, name, hash]
    );
    await conn.query('UPDATE students SET user_id = ? WHERE id = ?', [u.insertId, s.id]);
    await conn.query('UPDATE account_verifications SET used_at = NOW() WHERE id = ?', [v.id]);
    return name;
  });
  res.status(201).json({ message: 'Account created. Use this username to log in', username });
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
