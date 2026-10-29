const { HttpError } = require('../utils/http');
const crypto = require('crypto');

async function nextStudentCode(conn) {
  const prefix = `STU-${new Date().getFullYear()}-`;
  const [r] = await conn.query(
    'SELECT student_code FROM students WHERE student_code LIKE ? ORDER BY student_code DESC LIMIT 1 FOR UPDATE',
    [prefix + '%']
  );
  const n = r.length ? parseInt(r[0].student_code.slice(prefix.length), 10) + 1 : 1;
  return prefix + String(n).padStart(4, '0');
}

// Creates a student (and primary parent when given). Returns { id, student_code }.
async function createStudent(conn, d, createdBy) {
  if (d.student_code) {
    const [ex] = await conn.query('SELECT id FROM students WHERE student_code = ?', [d.student_code]);
    if (ex.length) throw new HttpError(409, `Student ID ${d.student_code} already exists`);
  }
  const [dup] = await conn.query('SELECT student_code FROM students WHERE LOWER(full_name) = LOWER(?) AND date_of_birth = ?', [
    d.full_name,
    d.date_of_birth,
  ]);
  if (dup.length) throw new HttpError(409, `Possible duplicate: ${d.full_name} (${dup[0].student_code}) already exists`);

  const code = d.student_code || (await nextStudentCode(conn));
  const [r] = await conn.query(
    `INSERT INTO students (student_code, qr_token, full_name, gender, date_of_birth, place_of_birth, email, phone,
       previous_school, current_class_id, current_combination_id, boarding_status, created_by)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      code, crypto.randomBytes(32).toString('hex'), d.full_name, d.gender, d.date_of_birth, d.place_of_birth || null, d.email || null, d.phone || null,
      d.previous_school || null, d.class_id || null, d.combination_id || null, d.boarding_status || 'day', createdBy || null,
    ]
  );
  if (d.parent_name || d.parent_phone) {
    const [p] = await conn.query('INSERT INTO parents (full_name, phone, email) VALUES (?,?,?)', [
      d.parent_name || 'Parent/Guardian', d.parent_phone || '', d.parent_email || null,
    ]);
    await conn.query('INSERT INTO student_parents (student_id, parent_id, relationship, is_primary) VALUES (?,?,?,1)', [
      r.insertId, p.insertId, d.parent_relationship || 'Guardian',
    ]);
  }
  return { id: r.insertId, student_code: code };
}

module.exports = { createStudent, nextStudentCode };
