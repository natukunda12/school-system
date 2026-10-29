// Adds the first Super Admin and starter data (safe to run more than once)
require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

(async () => {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'Admin@12345';
  const [ex] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
  if (!ex.length) {
    const [[role]] = await pool.query("SELECT id FROM roles WHERE name = 'super_admin'");
    await pool.query('INSERT INTO users (role_id, full_name, username, password_hash) VALUES (?,?,?,?)',
      [role.id, 'Super Administrator', username, await bcrypt.hash(password, 10)]);
    console.log(`Super admin created -> username: ${username}  password: ${password}`);
  } else console.log('Super admin already exists');

  for (const [n, l] of [['S1', 1], ['S2', 2], ['S3', 3], ['S4', 4], ['S5', 5], ['S6', 6]])
    await pool.query('INSERT IGNORE INTO classes (name, level) VALUES (?,?)', [n, l]);
  for (const [c, n] of [['SOD', 'Software Development'], ['MPC', 'Maths-Physics-Computer'], ['PCB', 'Physics-Chemistry-Biology'], ['MEG', 'Maths-Economics-Geography']])
    await pool.query('INSERT IGNORE INTO combinations (code, name) VALUES (?,?)', [c, n]);

  const year = new Date().getFullYear();
  await pool.query('INSERT IGNORE INTO academic_years (name, start_date, end_date, is_current) VALUES (?,?,?,1)', [String(year), `${year}-01-15`, `${year}-11-30`]);
  const [[y]] = await pool.query('SELECT id FROM academic_years WHERE name = ?', [String(year)]);
  const terms = [['Term 1', `${year}-01-15`, `${year}-04-30`, 1], ['Term 2', `${year}-05-15`, `${year}-08-15`, 0], ['Term 3', `${year}-09-01`, `${year}-11-30`, 0]];
  for (const [n, s, e, cur] of terms) await pool.query('INSERT IGNORE INTO terms (academic_year_id, name, start_date, end_date, is_current) VALUES (?,?,?,?,?)', [y.id, n, s, e, cur]);

  await pool.query("INSERT IGNORE INTO settings (setting_key, setting_value) VALUES ('school_name', 'College Mont Sion')");

  const [[{ n }]] = await pool.query('SELECT COUNT(*) n FROM requirements');
  if (!n) {
    const reqs = [
      ['School uniform', 'item', 'all', 'all'], ['School shoes', 'item', 'all', 'all'], ['School bag', 'item', 'new', 'all'],
      ['Notebooks', 'item', 'all', 'all'], ['Medical document', 'document', 'new', 'all'], ['Identification document', 'document', 'new', 'all'],
      ['Bed', 'item', 'new', 'boarding'], ['Mattress', 'item', 'new', 'boarding'], ['Bed sheets', 'item', 'all', 'boarding'], ['Blanket', 'item', 'new', 'boarding'],
    ];
    for (const [name, cat, type, boarding] of reqs)
      await pool.query('INSERT INTO requirements (name, category, applies_to_type, applies_to_boarding) VALUES (?,?,?,?)', [name, cat, type, boarding]);
    console.log('Starter requirements added');
  }
  console.log('Seed finished.');
  await pool.end();
})().catch((e) => { console.error(e.message); process.exit(1); });
