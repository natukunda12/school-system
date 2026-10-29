const { HttpError } = require('../utils/http');
const { syncRequirements } = require('./registrations');

const freeBedSql = `SELECT b.id FROM beds b JOIN dormitories d ON d.id = b.dormitory_id
  WHERE d.is_active = 1 AND d.gender = ?
    AND NOT EXISTS (SELECT 1 FROM arrivals a WHERE a.term_id = ? AND a.bed_id = b.id)`;
const freeTableSql = `SELECT t.id FROM refectory_tables t WHERE t.is_active = 1
  AND (SELECT COUNT(*) FROM arrivals a WHERE a.term_id = ? AND a.table_id = t.id) < t.capacity`;

// Gives a boarding student a bed and a refectory table. Returns a list of warnings.
async function place(conn, arrival, student) {
  const warnings = [];
  const [prevRows] = await conn.query(
    'SELECT bed_id, table_id FROM arrivals WHERE student_id = ? AND id <> ? ORDER BY id DESC LIMIT 1',
    [student.id, arrival.id]
  );
  const prev = prevRows[0] || {};
  let bedId = arrival.bed_id, tableId = arrival.table_id;

  if (!bedId) {
    if (prev.bed_id) { // returning student: same bed if still free (and still the right dormitory gender)
      const [r] = await conn.query(`${freeBedSql} AND b.id = ?`, [student.gender, arrival.term_id, prev.bed_id]);
      if (r.length) bedId = r[0].id;
    }
    if (!bedId) {
      const [r] = await conn.query(`${freeBedSql} ORDER BY d.id, b.bed_number, b.position LIMIT 1`, [student.gender, arrival.term_id]);
      if (r.length) bedId = r[0].id;
      else warnings.push(`No free bed in the ${student.gender === 'Male' ? 'boys' : 'girls'} dormitories. Add beds, then press "Assign bed/table".`);
    }
  }
  if (!tableId) {
    if (prev.table_id) {
      const [r] = await conn.query(`${freeTableSql} AND t.id = ?`, [arrival.term_id, prev.table_id]);
      if (r.length) tableId = r[0].id;
    }
    if (!tableId) {
      const [r] = await conn.query(`${freeTableSql} ORDER BY t.number LIMIT 1`, [arrival.term_id]);
      if (r.length) tableId = r[0].id;
      else warnings.push('No free refectory table. Add tables, then press "Assign bed/table".');
    }
  }
  await conn.query('UPDATE arrivals SET bed_id = ?, table_id = ? WHERE id = ?', [bedId, tableId, arrival.id]);
  return warnings;
}

async function getArrival(db, registrationId) {
  const [r] = await db.query(
    `SELECT a.id, a.arrived_at, CONCAT(b.bed_number, b.position) AS bed_label,
       IF(b.position = 'A', 'Lower bunk', IF(b.position = 'B', 'Upper bunk', NULL)) AS bunk,
       d.name AS dormitory, t.number AS table_number
     FROM arrivals a LEFT JOIN beds b ON b.id = a.bed_id LEFT JOIN dormitories d ON d.id = b.dormitory_id
     LEFT JOIN refectory_tables t ON t.id = a.table_id WHERE a.registration_id = ?`,
    [registrationId]
  );
  return r[0] || null;
}

async function reportArrival(conn, registrationId, userId) {
  const [[reg]] = await conn.query(
    'SELECT r.*, s.gender FROM registrations r JOIN students s ON s.id = r.student_id WHERE r.id = ?',
    [registrationId]
  );
  if (!reg) throw new HttpError(404, 'Registration not found');
  if (reg.status !== 'approved') throw new HttpError(409, 'The registration must be approved first');
  await conn.query('SELECT id FROM terms WHERE id = ? FOR UPDATE', [reg.term_id]); // one arrival at a time per term
  const [ex] = await conn.query('SELECT id FROM arrivals WHERE registration_id = ?', [registrationId]);
  if (ex.length) throw new HttpError(409, 'Arrival already reported for this student');
  await syncRequirements(conn, registrationId);

  const [ins] = await conn.query('INSERT INTO arrivals (registration_id, student_id, term_id, recorded_by) VALUES (?,?,?,?)',
    [registrationId, reg.student_id, reg.term_id, userId]);
  let warnings = [];
  if (reg.boarding_status === 'boarding') {
    warnings = await place(conn, { id: ins.insertId, term_id: reg.term_id, bed_id: null, table_id: null }, { id: reg.student_id, gender: reg.gender });
  }
  return { arrival_id: ins.insertId, boarding: reg.boarding_status === 'boarding', warnings, arrival: await getArrival(conn, registrationId) };
}

// Retry bed/table assignment (after more beds or tables were added)
async function assignMissing(conn, arrivalId) {
  const [[a]] = await conn.query(
    `SELECT a.*, r.boarding_status, s.gender FROM arrivals a JOIN registrations r ON r.id = a.registration_id
     JOIN students s ON s.id = a.student_id WHERE a.id = ?`, [arrivalId]);
  if (!a) throw new HttpError(404, 'Arrival not found');
  if (a.boarding_status !== 'boarding') throw new HttpError(400, 'Day students do not get a bed or table');
  await conn.query('SELECT id FROM terms WHERE id = ? FOR UPDATE', [a.term_id]);
  const [[fresh]] = await conn.query('SELECT * FROM arrivals WHERE id = ?', [arrivalId]);
  const warnings = await place(conn, fresh, { id: a.student_id, gender: a.gender });
  return { warnings, arrival: await getArrival(conn, a.registration_id) };
}

module.exports = { reportArrival, assignMissing, getArrival };
