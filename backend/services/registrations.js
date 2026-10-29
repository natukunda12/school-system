const { HttpError } = require('../utils/http');

// Creates the checklist of requirements that apply to this registration.
async function syncRequirements(conn, registrationId) {
  const [[reg]] = await conn.query('SELECT * FROM registrations WHERE id = ?', [registrationId]);
  await conn.query(
    `INSERT IGNORE INTO student_requirements (registration_id, requirement_id)
     SELECT ?, id FROM requirements
     WHERE is_active = 1
       AND (applies_to_type = 'all' OR applies_to_type = ?)
       AND (applies_to_boarding = 'all' OR applies_to_boarding = ?)
       AND (term_id IS NULL OR term_id = ?)
       AND (class_id IS NULL OR class_id = ?)`,
    [registrationId, reg.student_type, reg.boarding_status, reg.term_id, reg.class_id]
  );
}

async function applyToStudent(conn, reg) {
  await conn.query(
    'UPDATE students SET current_class_id = ?, current_combination_id = ?, boarding_status = ? WHERE id = ?',
    [reg.class_id, reg.combination_id, reg.boarding_status, reg.student_id]
  );
}

// opts: { term_id, class_id, combination_id, boarding_status, approve, reviewerId }
async function createRegistration(conn, studentId, opts) {
  const [[term]] = await conn.query('SELECT * FROM terms WHERE id = ?', [opts.term_id]);
  if (!term) throw new HttpError(400, 'Term not found');
  if (!opts.class_id) throw new HttpError(400, 'Class is required');

  const [[{ n }]] = await conn.query('SELECT COUNT(*) n FROM registrations WHERE student_id = ?', [studentId]);
  const [dup] = await conn.query('SELECT id FROM registrations WHERE student_id = ? AND term_id = ?', [studentId, term.id]);
  if (dup.length) throw new HttpError(409, 'This student is already registered for this term');

  const status = opts.approve ? 'approved' : 'pending';
  const [r] = await conn.query(
    `INSERT INTO registrations (student_id, academic_year_id, term_id, class_id, combination_id, student_type,
       boarding_status, status, reviewed_by, reviewed_at)
     VALUES (?,?,?,?,?,?,?,?,?,?)`,
    [
      studentId, term.academic_year_id, term.id, opts.class_id, opts.combination_id || null,
      n === 0 ? 'new' : 'returning', opts.boarding_status || 'day', status,
      opts.approve ? opts.reviewerId : null, opts.approve ? new Date() : null,
    ]
  );
  await syncRequirements(conn, r.insertId);
  if (opts.approve) {
    const [[reg]] = await conn.query('SELECT * FROM registrations WHERE id = ?', [r.insertId]);
    await applyToStudent(conn, reg);
  }
  return r.insertId;
}

module.exports = { createRegistration, syncRequirements, applyToStudent };
