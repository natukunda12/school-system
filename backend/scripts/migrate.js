// Schema updates for permissions, arrivals, and secure student identity QR tokens.
// Safe to run many times.
require('dotenv').config();
const crypto = require('crypto');

async function hasColumn(db, table, col) {
  const [r] = await db.query(
    'SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
    [table, col]
  );
  return r.length > 0;
}

async function migrate(db) {
  if (!(await hasColumn(db, 'students', 'qr_token'))) {
    await db.query('ALTER TABLE students ADD COLUMN qr_token CHAR(64) NULL UNIQUE');
  }
  const [studentsWithoutQr] = await db.query('SELECT id FROM students WHERE qr_token IS NULL');
  for (const student of studentsWithoutQr) {
    await db.query('UPDATE students SET qr_token = ? WHERE id = ? AND qr_token IS NULL', [
      crypto.randomBytes(32).toString('hex'), student.id,
    ]);
  }
  await db.query('ALTER TABLE students MODIFY qr_token CHAR(64) NOT NULL');

  await db.query(
    "INSERT IGNORE INTO roles (name, description) VALUES ('dean_of_discipline','Recommends student permissions'), ('secretary','Confirms permissions')"
  );

  await db.query(
    "ALTER TABLE permission_requests MODIFY status ENUM('pending','awaiting_confirmation','approved','rejected','returned','expired') NOT NULL DEFAULT 'pending'"
  );
  if (!(await hasColumn(db, 'permission_requests', 'dean_id'))) {
    await db.query(
      `ALTER TABLE permission_requests
         ADD COLUMN dean_id INT UNSIGNED NULL,
         ADD COLUMN dean_at DATETIME NULL,
         ADD COLUMN dean_note VARCHAR(255) NULL,
         ADD COLUMN created_by INT UNSIGNED NULL,
         ADD CONSTRAINT fk_perm_dean FOREIGN KEY (dean_id) REFERENCES users(id) ON DELETE SET NULL`
    );
  }

  await db.query(`CREATE TABLE IF NOT EXISTS dormitories (
    id SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(80) NOT NULL UNIQUE,
    gender ENUM('Male','Female') NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
  )`);
  // bed_number + position A (lower bunk) / B (upper bunk): 1A, 1B, 2A, 2B ...
  await db.query(`CREATE TABLE IF NOT EXISTS beds (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    dormitory_id SMALLINT UNSIGNED NOT NULL,
    bed_number SMALLINT UNSIGNED NOT NULL,
    position ENUM('A','B') NOT NULL,
    UNIQUE (dormitory_id, bed_number, position),
    FOREIGN KEY (dormitory_id) REFERENCES dormitories(id) ON DELETE CASCADE
  )`);
  await db.query(`CREATE TABLE IF NOT EXISTS refectory_tables (
    id SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    number SMALLINT UNSIGNED NOT NULL UNIQUE,
    capacity SMALLINT UNSIGNED NOT NULL DEFAULT 10,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
  )`);
  // One row per student per term. UNIQUE(term_id, bed_id) means a bed can never be given twice in a term.
  await db.query(`CREATE TABLE IF NOT EXISTS arrivals (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    registration_id INT UNSIGNED NOT NULL UNIQUE,
    student_id INT UNSIGNED NOT NULL,
    term_id SMALLINT UNSIGNED NOT NULL,
    bed_id INT UNSIGNED NULL,
    table_id SMALLINT UNSIGNED NULL,
    arrived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    recorded_by INT UNSIGNED NULL,
    UNIQUE (term_id, bed_id),
    FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (term_id) REFERENCES terms(id),
    FOREIGN KEY (bed_id) REFERENCES beds(id) ON DELETE SET NULL,
    FOREIGN KEY (table_id) REFERENCES refectory_tables(id) ON DELETE SET NULL,
    FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE SET NULL
  )`);
}

module.exports = migrate;

if (require.main === module) {
  const pool = require('../config/db');
  migrate(pool)
    .then(() => console.log('Migration finished.'))
    .catch((e) => { console.error('Migration failed:', e.message); process.exitCode = 1; })
    .finally(() => pool.end());
}
