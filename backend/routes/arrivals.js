const router = require('express').Router();
const PDFDocument = require('pdfkit');
const pool = require('../config/db');
const withTx = require('../utils/tx');
const audit = require('../utils/audit');
const { drawCardHeader } = require('../utils/pdf');
const { reportArrival, assignMissing } = require('../services/arrivals');
const { authenticate, authorize, STAFF } = require('../middleware/auth');
const { HttpError, wrap, required } = require('../utils/http');

router.use(authenticate, authorize(...STAFF));

async function termOf(req) {
  if (req.query.term_id) return Number(req.query.term_id);
  const [r] = await pool.query('SELECT id FROM terms WHERE is_current = 1 LIMIT 1');
  return r[0]?.id || null;
}

// Approved registrations of a term with their arrival, bed and table
router.get('/', wrap(async (req, res) => {
  const termId = await termOf(req);
  if (!termId) return res.json({ term_id: null, rows: [] });
  const where = ['r.term_id = ?', "r.status = 'approved'"], p = [termId];
  if (req.query.search) { where.push('(s.full_name LIKE ? OR s.student_code LIKE ?)'); p.push(`%${req.query.search}%`, `%${req.query.search}%`); }
  if (req.query.status === 'arrived') where.push('a.id IS NOT NULL');
  if (req.query.status === 'waiting') where.push('a.id IS NULL');
  if (req.query.status === 'missing') where.push("a.id IS NOT NULL AND r.boarding_status = 'boarding' AND (a.bed_id IS NULL OR a.table_id IS NULL)");
  if (req.query.boarding_status) { where.push('r.boarding_status = ?'); p.push(req.query.boarding_status); }
  const [rows] = await pool.query(
    `SELECT r.id AS registration_id, r.boarding_status, s.id AS student_id, s.full_name, s.student_code, s.gender, c.name AS class_name,
       a.id AS arrival_id, a.arrived_at, CONCAT(b.bed_number, b.position) AS bed_label,
       IF(b.position = 'A', 'Lower bunk', IF(b.position = 'B', 'Upper bunk', NULL)) AS bunk,
       d.name AS dormitory, t.number AS table_number
     FROM registrations r JOIN students s ON s.id = r.student_id JOIN classes c ON c.id = r.class_id
     LEFT JOIN arrivals a ON a.registration_id = r.id
     LEFT JOIN beds b ON b.id = a.bed_id LEFT JOIN dormitories d ON d.id = b.dormitory_id
     LEFT JOIN refectory_tables t ON t.id = a.table_id
     WHERE ${where.join(' AND ')} ORDER BY s.full_name LIMIT 1000`, p);
  if (rows.length) {
    const registrationIds = rows.map((row) => row.registration_id);
    const [requirements] = await pool.query(
      `SELECT sr.id, sr.registration_id, sr.status, rq.name, rq.category
       FROM student_requirements sr
       JOIN requirements rq ON rq.id = sr.requirement_id
       WHERE sr.registration_id IN (?) ORDER BY rq.name`,
      [registrationIds]
    );
    const byRegistration = new Map(rows.map((row) => [row.registration_id, []]));
    requirements.forEach((item) => {
      byRegistration.get(item.registration_id).push({
        id: item.id,
        name: item.name,
        category: item.category,
        status: item.status,
      });
    });
    rows.forEach((row) => { row.requirements = byRegistration.get(row.registration_id); });
  }
  res.json({ term_id: termId, rows });
}));

router.get('/:registrationId/card', wrap(async (req, res) => {
  const [[row]] = await pool.query(
    `SELECT r.id, r.term_id, r.status, r.boarding_status, s.id AS student_id, s.full_name, s.student_code,
       s.gender, c.name AS class_name, t.name AS term_name, y.name AS year_name, a.arrived_at,
       CONCAT(b.bed_number, b.position) AS bed_label,
       IF(b.position = 'A', 'Lower bunk', IF(b.position = 'B', 'Upper bunk', NULL)) AS bunk,
       d.name AS dormitory, rt.number AS table_number
     FROM registrations r
     JOIN students s ON s.id = r.student_id
     JOIN classes c ON c.id = r.class_id
     JOIN terms t ON t.id = r.term_id
     JOIN academic_years y ON y.id = r.academic_year_id
     LEFT JOIN arrivals a ON a.registration_id = r.id
     LEFT JOIN beds b ON b.id = a.bed_id
     LEFT JOIN dormitories d ON d.id = b.dormitory_id
     LEFT JOIN refectory_tables rt ON rt.id = a.table_id
     WHERE r.id = ?`,
    [req.params.registrationId]
  );
  if (!row) throw new HttpError(404, 'Registration not found');

  const [requirements] = await pool.query(
    `SELECT rq.name, rq.category, sr.status
     FROM student_requirements sr
     JOIN requirements rq ON rq.id = sr.requirement_id
     WHERE sr.registration_id = ?
     ORDER BY rq.name`,
    [row.id]
  );
  const [schoolRows] = await pool.query("SELECT setting_value FROM settings WHERE setting_key = 'school_name'");
  const schoolName = schoolRows[0]?.setting_value || 'School';
  const completed = requirements.filter((item) => item.status === 'complete').length;
  const missing = requirements.length - completed;

  const doc = new PDFDocument({ size: 'A5', margin: 36 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="arrival-${row.student_code}.pdf"`);
  doc.pipe(res);
  doc.rect(18, 18, doc.page.width - 36, doc.page.height - 36).lineWidth(1.5).stroke('#2F6B3A');
  drawCardHeader(doc, schoolName, 'STUDENT ARRIVAL & REQUIREMENTS');

  const lines = [
    ['Student', row.full_name],
    ['Student ID', row.student_code],
    ['Class', row.class_name],
    ['Term', `${row.year_name} ${row.term_name}`],
    ['Registration', row.status],
    ['Boarding', row.boarding_status],
    ['Arrival', row.arrived_at ? String(row.arrived_at).slice(0, 16) : 'Not reported'],
    ['Dormitory', row.dormitory || '-'],
    ['Bed', row.bed_label ? `${row.bed_label} (${row.bunk})` : row.boarding_status === 'day' ? 'Day student - not applicable' : 'Not assigned'],
    ['Refectory table', row.table_number ? `Table ${row.table_number}` : row.boarding_status === 'day' ? 'Day student - not applicable' : 'Not assigned'],
  ];
  lines.forEach(([label, value]) => {
    const y = doc.y;
    doc.fillColor('#555').fontSize(9).text(label, 36, y, { width: 90 });
    doc.fillColor('#000').fontSize(10).text(String(value), 128, y, { width: doc.page.width - 164 });
    doc.y = Math.max(doc.y, y + 12) + 4;
  });

  const drawRequirementsHeading = (continued = false) => {
    doc.moveDown(0.6).fillColor('#7A5230').fontSize(11)
      .text(continued ? 'REQUIREMENTS (CONTINUED)' : 'REQUIREMENTS');
    doc.fillColor('#555').fontSize(9)
      .text(`${completed} complete · ${missing} missing out of ${requirements.length}`);
    doc.moveDown(0.35);
  };
  drawRequirementsHeading();
  if (!requirements.length) {
    doc.fillColor('#555').fontSize(9).text('No requirements are assigned for this registration.');
  } else {
    requirements.forEach((item) => {
      const text = `[${item.status === 'complete' ? 'COMPLETE' : 'MISSING'}] ${item.name} (${item.category})`;
      const height = doc.heightOfString(text, { width: doc.page.width - 72, fontSize: 9 }) + 5;
      if (doc.y + height > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        drawRequirementsHeading(true);
      }
      doc.fillColor(item.status === 'complete' ? '#24542d' : '#a32d2d').fontSize(9)
        .text(text, { width: doc.page.width - 72 });
      doc.moveDown(0.25);
    });
  }
  doc.end();
}));

router.post('/report', wrap(async (req, res) => {
  required(req.body, ['registration_id']);
  const out = await withTx((conn) => reportArrival(conn, req.body.registration_id, req.user.id));
  await audit(req, 'REPORT_ARRIVAL', 'arrival', out.arrival_id, { warnings: out.warnings.length });
  res.status(201).json(out);
}));

router.post('/report-bulk', wrap(async (req, res) => {
  const ids = Array.isArray(req.body.registration_ids) ? req.body.registration_ids.slice(0, 300) : [];
  if (!ids.length) throw new HttpError(400, 'Choose at least one student');
  let reported = 0;
  const problems = [];
  for (const id of ids) {
    try {
      const out = await withTx((conn) => reportArrival(conn, id, req.user.id));
      reported++;
      out.warnings.forEach((w) => problems.push({ registration_id: id, message: w }));
    } catch (e) { problems.push({ registration_id: id, message: e.message }); }
  }
  await audit(req, 'REPORT_ARRIVAL_BULK', 'arrival', null, { reported });
  res.json({ reported, problems });
}));

router.post('/:id/assign', wrap(async (req, res) => {
  const out = await withTx((conn) => assignMissing(conn, req.params.id));
  await audit(req, 'ASSIGN_BED_TABLE', 'arrival', Number(req.params.id));
  res.json(out);
}));

module.exports = router;
