const router = require('express').Router();
const crypto = require('crypto');
const path = require('path');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const pool = require('../config/db');
const withTx = require('../utils/tx');
const audit = require('../utils/audit');
const { drawCardHeader } = require('../utils/pdf');
const { authenticate, authorize, STAFF, DEAN, SECRETARY } = require('../middleware/auth');
const { HttpError, wrap, required } = require('../utils/http');

router.use(authenticate);

const expireOld = () =>
  pool.query("UPDATE permission_requests SET status = 'expired' WHERE status IN ('approved','pending','awaiting_confirmation') AND expected_return_at < NOW()");

const LIST = `SELECT pr.*, s.full_name, s.student_code, c.name AS class_name, pc.permission_number,
    u.full_name AS reviewer, dn.full_name AS dean_name
  FROM permission_requests pr JOIN students s ON s.id = pr.student_id
  LEFT JOIN classes c ON c.id = s.current_class_id
  LEFT JOIN permission_cards pc ON pc.permission_request_id = pr.id
  LEFT JOIN users u ON u.id = pr.reviewed_by
  LEFT JOIN users dn ON dn.id = pr.dean_id`;

function checkDates(departure_at, expected_return_at) {
  const dep = new Date(departure_at), ret = new Date(expected_return_at);
  if (isNaN(dep) || isNaN(ret)) throw new HttpError(400, 'Invalid date or time');
  if (ret <= dep) throw new HttpError(400, 'Return must be after departure');
  if (ret < new Date()) throw new HttpError(400, 'Return time is already in the past');
}

// Student submits a request
router.post('/', authorize('student'), wrap(async (req, res) => {
  required(req.body, ['destination', 'reason', 'departure_at', 'expected_return_at']);
  checkDates(req.body.departure_at, req.body.expected_return_at);
  const [r] = await pool.query(
    `INSERT INTO permission_requests (student_id, destination, reason, departure_at, expected_return_at, additional_info)
     VALUES (?,?,?,?,?,?)`,
    [req.user.studentId, req.body.destination, req.body.reason, req.body.departure_at, req.body.expected_return_at, req.body.additional_info || null]);
  await audit(req, 'REQUEST_PERMISSION', 'permission_request', r.insertId);
  res.status(201).json({ id: r.insertId, status: 'pending' });
}));

router.get('/mine', authorize('student'), wrap(async (req, res) => {
  await expireOld();
  const [rows] = await pool.query(`${LIST} WHERE pr.student_id = ? ORDER BY pr.id DESC`, [req.user.studentId]);
  res.json(rows);
}));

router.get('/', authorize(...STAFF), wrap(async (req, res) => {
  await expireOld();
  const where = ['1=1'], p = [];
  if (req.query.status) { where.push('pr.status = ?'); p.push(req.query.status); }
  const [rows] = await pool.query(`${LIST} WHERE ${where.join(' AND ')} ORDER BY pr.id DESC LIMIT 500`, p);
  res.json(rows);
}));

// Dean of Discipline creates a permission directly (it then waits for the Secretary)
router.post('/direct', authorize(...DEAN), wrap(async (req, res) => {
  required(req.body, ['student_code', 'destination', 'reason', 'departure_at', 'expected_return_at']);
  checkDates(req.body.departure_at, req.body.expected_return_at);
  const [s] = await pool.query('SELECT id FROM students WHERE student_code = ?', [String(req.body.student_code).trim()]);
  if (!s.length) throw new HttpError(404, 'Student ID not found');
  const [r] = await pool.query(
    `INSERT INTO permission_requests (student_id, destination, reason, departure_at, expected_return_at, additional_info,
       status, dean_id, dean_at, created_by)
     VALUES (?,?,?,?,?,?, 'awaiting_confirmation', ?, NOW(), ?)`,
    [s[0].id, req.body.destination, req.body.reason, req.body.departure_at, req.body.expected_return_at,
      req.body.additional_info || null, req.user.id, req.user.id]);
  await audit(req, 'DEAN_CREATE_PERMISSION', 'permission_request', r.insertId);
  res.status(201).json({ id: r.insertId, status: 'awaiting_confirmation' });
}));

// Step 1: Dean of Discipline reviews a student's request
router.patch('/:id/dean', authorize(...DEAN), wrap(async (req, res) => {
  const next = { approve: 'awaiting_confirmation', reject: 'rejected', return: 'returned' }[req.body.decision];
  if (!next) throw new HttpError(400, 'Decision must be approve, reject or return');
  const note = req.body.note || null;
  await withTx(async (conn) => {
    const [[pr]] = await conn.query('SELECT * FROM permission_requests WHERE id = ? FOR UPDATE', [req.params.id]);
    if (!pr) throw new HttpError(404, 'Request not found');
    if (pr.status !== 'pending') throw new HttpError(409, 'This request is not waiting for the Dean of Discipline');
    if (new Date(pr.expected_return_at) < new Date()) throw new HttpError(409, 'This request has already expired');
    await conn.query(
      `UPDATE permission_requests SET status = ?, dean_id = ?, dean_at = NOW(), dean_note = ?,
         review_note = IF(? = 'awaiting_confirmation', review_note, ?) WHERE id = ?`,
      [next, req.user.id, note, next, note, pr.id]);
  });
  await audit(req, `DEAN_${req.body.decision.toUpperCase()}`, 'permission_request', Number(req.params.id));
  res.json({ message: next === 'awaiting_confirmation' ? 'Approved. Now waiting for the Secretary to confirm' : `Request ${next}` });
}));

// Step 2: Secretary confirms. Only now the permission number and card are created.
router.patch('/:id/confirm', authorize(...SECRETARY), wrap(async (req, res) => {
  const next = { confirm: 'approved', reject: 'rejected', return: 'returned' }[req.body.decision];
  if (!next) throw new HttpError(400, 'Decision must be confirm, reject or return');
  const note = req.body.note || null;
  const number = await withTx(async (conn) => {
    const [[pr]] = await conn.query('SELECT * FROM permission_requests WHERE id = ? FOR UPDATE', [req.params.id]);
    if (!pr) throw new HttpError(404, 'Request not found');
    if (pr.status !== 'awaiting_confirmation') throw new HttpError(409, 'The Dean of Discipline has not approved this request yet');
    if (next === 'approved' && pr.dean_id === req.user.id) throw new HttpError(403, 'The person who approved this first cannot also confirm it');
    if (new Date(pr.expected_return_at) < new Date()) throw new HttpError(409, 'This request has already expired');
    await conn.query('UPDATE permission_requests SET status = ?, reviewed_by = ?, reviewed_at = NOW(), review_note = ? WHERE id = ?',
      [next, req.user.id, note, pr.id]);
    if (next !== 'approved') return null;
    const num = `PRM-${new Date().getFullYear()}-${String(pr.id).padStart(6, '0')}`;
    await conn.query('INSERT INTO permission_cards (permission_request_id, permission_number, verification_token, issued_by) VALUES (?,?,?,?)',
      [pr.id, num, crypto.randomBytes(32).toString('hex'), req.user.id]);
    return num;
  });
  await audit(req, `SECRETARY_${req.body.decision.toUpperCase()}`, 'permission_request', Number(req.params.id));
  res.json({ message: `Request ${next}`, permission_number: number });
}));

const CARD_SQL = `SELECT pr.*, s.full_name, s.student_code, c.name AS class_name, pc.permission_number,
    s.id AS student_id, s.gender, s.date_of_birth, s.place_of_birth, s.email, s.phone,
    s.previous_school, s.boarding_status AS student_boarding_status, s.status AS student_status,
    cb.code AS combination, pc.verification_token, u.full_name AS approver, dn.full_name AS dean_name
  FROM permission_requests pr JOIN students s ON s.id = pr.student_id
  LEFT JOIN classes c ON c.id = s.current_class_id
  LEFT JOIN combinations cb ON cb.id = s.current_combination_id
  JOIN permission_cards pc ON pc.permission_request_id = pr.id
  LEFT JOIN users u ON u.id = pr.reviewed_by
  LEFT JOIN users dn ON dn.id = pr.dean_id`;

// Printable card (PDF) with QR code
router.get('/:id/card', wrap(async (req, res) => {
  const [[row]] = await pool.query(`${CARD_SQL} WHERE pr.id = ?`, [req.params.id]);
  if (!row) throw new HttpError(404, 'No card for this request (it must be approved first)');
  if (req.user.role === 'student' && row.student_id !== req.user.studentId) throw new HttpError(403, 'Not your permission');
  if (req.user.role !== 'student' && !STAFF.includes(req.user.role)) throw new HttpError(403, 'Not allowed');

  const [sn] = await pool.query("SELECT setting_value AS v FROM settings WHERE setting_key = 'school_name'");
  const school = sn[0] || { v: 'School' };
  const requestOrigin = req.get('origin');
  const sameOrigin = requestOrigin === `${req.protocol}://${req.get('host')}`;
  const clientUrl = process.env.PUBLIC_APP_URL || (sameOrigin && requestOrigin) ||
    process.env.CLIENT_URL || 'http://localhost:5173';
  const url = `${clientUrl.replace(/\/+$/, '')}/verify/${row.verification_token}`;
  const qr = await QRCode.toBuffer(url, { margin: 2, width: 400 });

  const doc = new PDFDocument({ size: 'A5', margin: 36 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${row.permission_number}.pdf"`);
  doc.pipe(res);

  doc.rect(18, 18, doc.page.width - 36, doc.page.height - 36).lineWidth(1.5).stroke('#2F6B3A');
  drawCardHeader(doc, school.v || 'School', 'STUDENT EXIT PERMISSION', {
    left: path.resolve(__dirname, '../../frontend/public/unilak.jpg'),
    right: path.resolve(__dirname, '../../frontend/public/apadem.png'),
  });
  doc.fillColor('#000').fontSize(10).text(`No: ${row.permission_number}`, { align: 'center' });
  doc.moveDown(1);

  const fmt = (d) => String(d).slice(0, 16).replace('T', ' ');
  const lines = [
    ['Student', row.full_name], ['Student ID', row.student_code], ['Class', row.class_name || '-'],
    ['Destination', row.destination], ['Reason', row.reason],
    ['Departure', fmt(row.departure_at)], ['Expected return', fmt(row.expected_return_at)],
    ['Dean of Discipline', row.dean_name || '-'], ['Secretary', row.approver || '-'], ['Confirmed on', fmt(row.reviewed_at)],
  ];
  const top = doc.y;
  lines.forEach(([k, v]) => {
    const y = doc.y;
    doc.fillColor('#555').fontSize(9).text(k, 36, y, { width: 80 });
    doc.fillColor('#000').fontSize(10).text(String(v), 118, y, { width: 120 });
    doc.y = Math.max(doc.y, y + 12) + 5;
  });
  doc.image(qr, doc.page.width - 36 - 120, top, { width: 120 });
  doc.fillColor('#777').fontSize(7).text('Scan to view student information', doc.page.width - 36 - 120, top + 122, { width: 120, align: 'center' });
  doc.end();
}));

// Staff scans QR: returns permission status and the student's school record.
router.get('/verify/:token', authorize(...STAFF), wrap(async (req, res) => {
  await expireOld();
  const [[row]] = await pool.query(`${CARD_SQL} WHERE pc.verification_token = ?`, [req.params.token]);
  if (!row) throw new HttpError(404, 'Invalid permission card');
  const type = ['verify', 'exit', 'return'].includes(req.query.type) ? req.query.type : 'verify';
  const [[card]] = await pool.query('SELECT id FROM permission_cards WHERE verification_token = ?', [req.params.token]);
  await pool.query('INSERT INTO permission_scans (card_id, scanned_by, scan_type) VALUES (?,?,?)', [card.id, req.user.id, type]);
  const [parents] = await pool.query(
    `SELECT p.full_name, p.phone, p.email, p.address, sp.relationship, sp.is_primary
     FROM student_parents sp JOIN parents p ON p.id = sp.parent_id
     WHERE sp.student_id = ? ORDER BY sp.is_primary DESC, p.full_name`,
    [row.student_id]
  );
  const [registrations] = await pool.query(
    `SELECT r.id, r.student_type, r.boarding_status, r.status, r.review_note, r.created_at,
       t.name AS term_name, y.name AS year_name, c.name AS class_name, cb.code AS combination,
       a.arrived_at, CONCAT(b.bed_number, b.position) AS bed_label,
       IF(b.position = 'A', 'Lower bunk', IF(b.position = 'B', 'Upper bunk', NULL)) AS bunk,
       d.name AS dormitory, rt.number AS table_number
     FROM registrations r
     JOIN terms t ON t.id = r.term_id
     JOIN academic_years y ON y.id = r.academic_year_id
     JOIN classes c ON c.id = r.class_id
     LEFT JOIN combinations cb ON cb.id = r.combination_id
     LEFT JOIN arrivals a ON a.registration_id = r.id
     LEFT JOIN beds b ON b.id = a.bed_id
     LEFT JOIN dormitories d ON d.id = b.dormitory_id
     LEFT JOIN refectory_tables rt ON rt.id = a.table_id
     WHERE r.student_id = ? ORDER BY r.id DESC`,
    [row.student_id]
  );
  if (registrations.length) {
    const registrationIds = registrations.map((registration) => registration.id);
    const [requirements] = await pool.query(
      `SELECT sr.registration_id, sr.status, sr.note, rq.name, rq.category
       FROM student_requirements sr JOIN requirements rq ON rq.id = sr.requirement_id
       WHERE sr.registration_id IN (?) ORDER BY rq.name`,
      [registrationIds]
    );
    const byRegistration = new Map(registrations.map((registration) => [registration.id, []]));
    requirements.forEach((item) => {
      byRegistration.get(item.registration_id).push({
        name: item.name,
        category: item.category,
        status: item.status,
        note: item.note,
      });
    });
    registrations.forEach((registration) => {
      registration.requirements = byRegistration.get(registration.id);
    });
  }
  res.json({
    valid: row.status === 'approved',
    status: row.status,
    permission_number: row.permission_number,
    student_name: row.full_name,
    student_code: row.student_code,
    destination: row.destination,
    reason: row.reason,
    additional_info: row.additional_info,
    departure_at: row.departure_at,
    expected_return_at: row.expected_return_at,
    dean_name: row.dean_name,
    approver: row.approver,
    reviewed_at: row.reviewed_at,
    student: {
      full_name: row.full_name,
      student_code: row.student_code,
      gender: row.gender,
      date_of_birth: row.date_of_birth,
      place_of_birth: row.place_of_birth,
      email: row.email,
      phone: row.phone,
      previous_school: row.previous_school,
      class_name: row.class_name,
      combination: row.combination,
      boarding_status: row.student_boarding_status,
      status: row.student_status,
    },
    parents,
    registrations,
  });
}));

module.exports = router;
