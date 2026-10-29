const router = require('express').Router();
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const multer = require('multer');
const QRCode = require('qrcode');
const pool = require('../config/db');
const withTx = require('../utils/tx');
const audit = require('../utils/audit');
const { createStudent } = require('../services/students');
const { createRegistration } = require('../services/registrations');
const { getArrival } = require('../services/arrivals');
const { authenticate, authorize, ADMINS, STAFF } = require('../middleware/auth');
const { HttpError, wrap, required } = require('../utils/http');

router.use(authenticate);

const PHOTO_DIR = path.join(__dirname, '..', 'uploads', 'students');
const photoUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const PHOTO_TYPES = {
  'image/jpeg': { ext: 'jpg', signature: (b) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  'image/png': { ext: 'png', signature: (b) => b.length > 8 && b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) },
  'image/webp': { ext: 'webp', signature: (b) => b.length > 12 && b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP' },
};

const BASE = `SELECT s.id, s.student_code, s.user_id, s.full_name, s.gender, s.date_of_birth,
    s.place_of_birth, s.email, s.phone, s.previous_school, s.current_class_id, s.current_combination_id,
    s.boarding_status, s.status, s.created_at, s.updated_at, c.name AS class_name, cb.code AS combination
  FROM students s LEFT JOIN classes c ON c.id = s.current_class_id
  LEFT JOIN combinations cb ON cb.id = s.current_combination_id`;

function isManagedPhoto(photoPath) {
  return typeof photoPath === 'string' && /^[a-f0-9]{32}\.(jpg|png|webp)$/.test(path.basename(photoPath));
}

async function removeManagedPhoto(photoPath) {
  if (!isManagedPhoto(photoPath)) return;
  await fs.unlink(path.join(PHOTO_DIR, path.basename(photoPath))).catch((e) => {
    if (e.code !== 'ENOENT') throw e;
  });
}

// student's own dashboard data
router.get('/me/overview', authorize('student'), wrap(async (req, res) => {
  const sid = req.user.studentId;
  if (!sid) throw new HttpError(404, 'No student record is linked to this account');
  const [[student]] = await pool.query(`${BASE} WHERE s.id = ?`, [sid]);
  const [registrations] = await pool.query(
    `SELECT r.*, t.name AS term_name, y.name AS year_name, c.name AS class_name
     FROM registrations r JOIN terms t ON t.id = r.term_id JOIN academic_years y ON y.id = r.academic_year_id
     JOIN classes c ON c.id = r.class_id WHERE r.student_id = ? ORDER BY r.id DESC`, [sid]);
  let requirements = [];
  const latest = registrations.find((r) => r.status === 'approved') || registrations[0];
  if (latest) {
    [requirements] = await pool.query(
      `SELECT sr.id, sr.status, rq.name, rq.category FROM student_requirements sr
       JOIN requirements rq ON rq.id = sr.requirement_id WHERE sr.registration_id = ? ORDER BY rq.name`, [latest.id]);
  }
  const arrival = latest ? await getArrival(pool, latest.id) : null;
  res.json({ student, registrations, requirements, arrival, currentRegistrationId: latest?.id || null });
}));

router.get('/', authorize(...STAFF), wrap(async (req, res) => {
  const { search, class_id, combination_id, boarding_status } = req.query;
  const where = ['1=1'], p = [];
  if (search) { where.push('(s.full_name LIKE ? OR s.student_code LIKE ?)'); p.push(`%${search}%`, `%${search}%`); }
  if (class_id) { where.push('s.current_class_id = ?'); p.push(class_id); }
  if (combination_id) { where.push('s.current_combination_id = ?'); p.push(combination_id); }
  if (boarding_status) { where.push('s.boarding_status = ?'); p.push(boarding_status); }
  const lim = Math.min(parseInt(req.query.limit) || 20, 200);
  const off = (Math.max(parseInt(req.query.page) || 1, 1) - 1) * lim;
  const [rows] = await pool.query(`${BASE} WHERE ${where.join(' AND ')} ORDER BY s.full_name LIMIT ? OFFSET ?`, [...p, lim, off]);
  const [[{ total }]] = await pool.query(`SELECT COUNT(*) total FROM students s WHERE ${where.join(' AND ')}`, p);
  res.json({ rows, total, page: Math.floor(off / lim) + 1, limit: lim });
}));

router.get('/scan/:token', authorize(...STAFF), wrap(async (req, res) => {
  const token = String(req.params.token);
  if (!/^[a-f0-9]{64}$/i.test(token)) throw new HttpError(404, 'Invalid student QR code');
  const [[student]] = await pool.query('SELECT id FROM students WHERE qr_token = ?', [token]);
  if (!student) throw new HttpError(404, 'Invalid student QR code');
  await audit(req, 'SCAN_STUDENT_ID', 'student', student.id);
  res.setHeader('Cache-Control', 'no-store');
  res.json({ student_id: student.id });
}));

router.get('/:id/qr', authorize(...STAFF), wrap(async (req, res) => {
  const [[student]] = await pool.query('SELECT id, qr_token FROM students WHERE id = ?', [req.params.id]);
  if (!student) throw new HttpError(404, 'Student not found');
  const refererOrigin = req.get('referer')?.match(/^https?:\/\/[^/]+/)?.[0];
  const clientUrl = process.env.PUBLIC_APP_URL || req.get('origin') || refererOrigin ||
    process.env.CLIENT_URL || 'http://localhost:5173';
  const url = `${clientUrl.replace(/\/+$/, '')}/student-scan/${student.qr_token}`;
  const qr = await QRCode.toBuffer(url, { margin: 2, width: 400 });
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'private, no-store');
  res.send(qr);
}));

router.get('/:id/photo', authorize(...STAFF), wrap(async (req, res) => {
  const [[student]] = await pool.query('SELECT photo_path FROM students WHERE id = ?', [req.params.id]);
  if (!student) throw new HttpError(404, 'Student not found');
  if (!isManagedPhoto(student.photo_path)) throw new HttpError(404, 'No student photo uploaded');
  const filename = path.basename(student.photo_path);
  const image = await fs.readFile(path.join(PHOTO_DIR, filename)).catch((e) => {
    if (e.code === 'ENOENT') throw new HttpError(404, 'Student photo not found');
    throw e;
  });
  res.setHeader('Content-Type', `image/${filename.split('.').pop() === 'jpg' ? 'jpeg' : filename.split('.').pop()}`);
  res.setHeader('Cache-Control', 'private, no-store');
  res.send(image);
}));

router.put('/:id/photo', authorize(...ADMINS), (req, res, next) => {
  photoUpload.single('photo')(req, res, (e) => {
    if (e) return next(new HttpError(e.code === 'LIMIT_FILE_SIZE' ? 413 : 400, e.message));
    next();
  });
}, wrap(async (req, res) => {
  if (!req.file) throw new HttpError(400, 'Choose a student photo to upload');
  const [[student]] = await pool.query('SELECT photo_path FROM students WHERE id = ?', [req.params.id]);
  if (!student) throw new HttpError(404, 'Student not found');
  const imageType = PHOTO_TYPES[req.file.mimetype];
  if (!imageType || !imageType.signature(req.file.buffer)) {
    throw new HttpError(400, 'Photo must be a valid JPEG, PNG, or WebP image');
  }

  await fs.mkdir(PHOTO_DIR, { recursive: true });
  const filename = `${crypto.randomBytes(16).toString('hex')}.${imageType.ext}`;
  const filePath = path.join(PHOTO_DIR, filename);
  await fs.writeFile(filePath, req.file.buffer, { flag: 'wx' });
  try {
    await pool.query('UPDATE students SET photo_path = ? WHERE id = ?', [filename, req.params.id]);
    await audit(req, 'UPDATE_STUDENT_PHOTO', 'student', Number(req.params.id));
  } catch (e) {
    await fs.unlink(filePath).catch((cleanupError) => {
      if (cleanupError.code !== 'ENOENT') console.error('Unable to remove failed student photo upload:', cleanupError.message);
    });
    throw e;
  }
  await removeManagedPhoto(student.photo_path);
  res.json({ message: 'Student photo updated' });
}));

router.get('/:id', authorize(...STAFF), wrap(async (req, res) => {
  const [[student]] = await pool.query(`${BASE} WHERE s.id = ?`, [req.params.id]);
  if (!student) throw new HttpError(404, 'Student not found');
  const [parents] = await pool.query(
    'SELECT p.*, sp.relationship, sp.is_primary FROM student_parents sp JOIN parents p ON p.id = sp.parent_id WHERE sp.student_id = ?', [req.params.id]);
  const [registrations] = await pool.query(
    `SELECT r.id, r.term_id, r.academic_year_id, r.class_id, r.combination_id, r.student_type,
       r.boarding_status, r.status, r.reviewed_at, r.review_note, r.created_at,
       t.name AS term_name, y.name AS year_name, c.name AS class_name, cb.code AS combination,
       reviewer.full_name AS reviewed_by,
       a.id AS arrival_id, a.arrived_at, CONCAT(b.bed_number, b.position) AS bed_label,
       IF(b.position = 'A', 'Lower bunk', IF(b.position = 'B', 'Upper bunk', NULL)) AS bunk,
       d.name AS dormitory, rt.number AS table_number
     FROM registrations r JOIN terms t ON t.id = r.term_id JOIN academic_years y ON y.id = r.academic_year_id
     JOIN classes c ON c.id = r.class_id LEFT JOIN combinations cb ON cb.id = r.combination_id
     LEFT JOIN users reviewer ON reviewer.id = r.reviewed_by
     LEFT JOIN arrivals a ON a.registration_id = r.id
     LEFT JOIN beds b ON b.id = a.bed_id
     LEFT JOIN dormitories d ON d.id = b.dormitory_id
     LEFT JOIN refectory_tables rt ON rt.id = a.table_id
     WHERE r.student_id = ? ORDER BY r.id DESC`, [req.params.id]);
  if (registrations.length) {
    const registrationIds = registrations.map((registration) => registration.id);
    const [requirements] = await pool.query(
      `SELECT sr.id, sr.registration_id, sr.status, sr.checked_at, sr.note, rq.name, rq.category,
         checker.full_name AS checked_by
       FROM student_requirements sr JOIN requirements rq ON rq.id = sr.requirement_id
       LEFT JOIN users checker ON checker.id = sr.checked_by
       WHERE sr.registration_id IN (?) ORDER BY rq.name`,
      [registrationIds]
    );
    const requirementsByRegistration = new Map(registrationIds.map((registrationId) => [registrationId, []]));
    requirements.forEach((item) => requirementsByRegistration.get(item.registration_id).push(item));
    registrations.forEach((registration) => {
      registration.requirements = requirementsByRegistration.get(registration.id);
    });
  }
  const [permissions] = await pool.query(
    `SELECT pr.id, pr.destination, pr.reason, pr.additional_info, pr.departure_at, pr.expected_return_at,
       pr.status, pr.dean_at, pr.dean_note, pr.reviewed_at, pr.review_note, pr.created_at,
       pc.permission_number, pc.issued_at, dean.full_name AS dean_name, secretary.full_name AS secretary_name,
       (SELECT MAX(sc.scanned_at) FROM permission_scans sc WHERE sc.card_id = pc.id AND sc.scan_type = 'exit') AS actual_departure_at,
       (SELECT MAX(sc.scanned_at) FROM permission_scans sc WHERE sc.card_id = pc.id AND sc.scan_type = 'return') AS actual_return_at
     FROM permission_requests pr
     LEFT JOIN permission_cards pc ON pc.permission_request_id = pr.id
     LEFT JOIN users dean ON dean.id = pr.dean_id
     LEFT JOIN users secretary ON secretary.id = pr.reviewed_by
     WHERE pr.student_id = ? ORDER BY pr.id DESC`,
    [req.params.id]
  );
  const [history] = await pool.query(
    `SELECT al.action, al.created_at, u.full_name AS performed_by
     FROM audit_logs al LEFT JOIN users u ON u.id = al.user_id
     WHERE al.entity = 'student' AND al.entity_id = ? ORDER BY al.id DESC LIMIT 30`,
    [req.params.id]
  );
  const latest = registrations.find((r) => r.status === 'approved') || registrations[0];
  const [currentYearRows] = await pool.query('SELECT name FROM academic_years WHERE is_current = 1 ORDER BY id DESC LIMIT 1');
  res.setHeader('Cache-Control', 'no-store');
  res.json({
    student,
    parents,
    registrations,
    current_registration_id: latest?.id || null,
    current_academic_year: latest?.year_name || currentYearRows[0]?.name || String(new Date().getFullYear()),
    permissions,
    history,
  });
}));

// Register a brand new student (admin). If term_id is given, also registers them for that term.
router.post('/', authorize(...ADMINS), wrap(async (req, res) => {
  required(req.body, ['full_name', 'gender', 'date_of_birth', 'class_id']);
  if (!['Male', 'Female'].includes(req.body.gender)) throw new HttpError(400, 'Gender must be Male or Female');
  if (!req.body.phone && !req.body.parent_phone) throw new HttpError(400, 'Student phone or parent phone is required (used to verify account creation)');
  const out = await withTx(async (conn) => {
    const s = await createStudent(conn, req.body, req.user.id);
    let registrationId = null;
    if (req.body.term_id) {
      registrationId = await createRegistration(conn, s.id, {
        term_id: req.body.term_id, class_id: req.body.class_id, combination_id: req.body.combination_id,
        boarding_status: req.body.boarding_status, approve: true, reviewerId: req.user.id,
      });
    }
    return { ...s, registrationId };
  });
  await audit(req, 'CREATE_STUDENT', 'student', out.id, { code: out.student_code });
  res.status(201).json(out);
}));

router.put('/:id', authorize(...ADMINS), wrap(async (req, res) => {
  const map = {
    full_name: 'full_name', gender: 'gender', date_of_birth: 'date_of_birth', place_of_birth: 'place_of_birth',
    email: 'email', phone: 'phone', previous_school: 'previous_school', class_id: 'current_class_id',
    combination_id: 'current_combination_id', boarding_status: 'boarding_status', status: 'status',
  };
  const sets = [], vals = [];
  for (const [k, col] of Object.entries(map)) {
    if (req.body[k] !== undefined) { sets.push(`${col} = ?`); vals.push(req.body[k] === '' ? null : req.body[k]); }
  }
  if (!sets.length) throw new HttpError(400, 'Nothing to update');
  const [r] = await pool.query(`UPDATE students SET ${sets.join(', ')} WHERE id = ?`, [...vals, req.params.id]);
  if (!r.affectedRows) throw new HttpError(404, 'Student not found');
  await audit(req, 'UPDATE_STUDENT', 'student', Number(req.params.id), Object.keys(req.body));
  res.json({ message: 'Student updated' });
}));

module.exports = router;
