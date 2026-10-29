const router = require('express').Router();
const multer = require('multer');
const XLSX = require('xlsx');
const pool = require('../config/db');
const withTx = require('../utils/tx');
const audit = require('../utils/audit');
const { createStudent } = require('../services/students');
const { authenticate, authorize, ADMINS } = require('../middleware/auth');
const { HttpError, wrap } = require('../utils/http');

router.use(authenticate, authorize(...ADMINS));
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const COLUMNS = ['student_code', 'full_name', 'gender', 'date_of_birth', 'class', 'combination', 'parent_name', 'parent_phone', 'boarding_status', 'email', 'phone'];
const sendBook = (res, rows, sheet, filename) => {
  const ws = rows.length ? XLSX.utils.json_to_sheet(rows) : XLSX.utils.aoa_to_sheet([COLUMNS]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheet);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
};

router.get('/template', (req, res) => {
  const example = {
    student_code: '', full_name: 'Jean Bosco', gender: 'Male', date_of_birth: '2008-04-12', class: 'S5', combination: 'SOD',
    parent_name: 'John Bosco', parent_phone: '0780000000', boarding_status: 'boarding', email: 'example@email.com', phone: '',
  };
  sendBook(res, [example], 'Students', 'students_template.xlsx');
});

// ---------- validation ----------
const clean = (v) => String(v ?? '').trim();

async function validate(rows, type) {
  const [classes] = await pool.query('SELECT id, name FROM classes');
  const [combos] = await pool.query('SELECT id, code FROM combinations');
  const classMap = new Map(classes.map((c) => [c.name.toLowerCase(), c.id]));
  const comboMap = new Map(combos.map((c) => [c.code.toLowerCase(), c.id]));
  const [existing] = await pool.query(
    `SELECT s.*, c.name AS class_name, cb.code AS combination FROM students s
     LEFT JOIN classes c ON c.id = s.current_class_id LEFT JOIN combinations cb ON cb.id = s.current_combination_id`);
  const byCode = new Map(existing.map((s) => [s.student_code, s]));
  const byNameDob = new Set(existing.map((s) => `${s.full_name.toLowerCase()}|${s.date_of_birth}`));

  const errors = [], valid = [], seenCodes = new Set(), seenNameDob = new Set();
  rows.forEach((raw, i) => {
    const rowNo = i + 2;
    const r = {};
    COLUMNS.forEach((c) => (r[c] = clean(raw[c])));
    if (Object.values(r).every((v) => v === '')) return; // skip empty lines
    const err = (field, message) => errors.push({ row: rowNo, field, message });
    const before = errors.length;

    if (r.gender) {
      const g = r.gender.toLowerCase();
      if (['male', 'm'].includes(g)) r.gender = 'Male';
      else if (['female', 'f'].includes(g)) r.gender = 'Female';
      else err('gender', 'Must be Male or Female');
    }
    if (r.boarding_status) {
      const b = r.boarding_status.toLowerCase();
      if (['boarding', 'day'].includes(b)) r.boarding_status = b;
      else err('boarding_status', 'Must be boarding or day');
    }
    if (r.date_of_birth && (!/^\d{4}-\d{2}-\d{2}$/.test(r.date_of_birth) || isNaN(Date.parse(r.date_of_birth)))) err('date_of_birth', 'Use format YYYY-MM-DD');
    if (r.class && !classMap.has(r.class.toLowerCase())) err('class', `Unknown class "${r.class}"`);
    if (r.combination && !comboMap.has(r.combination.toLowerCase())) err('combination', `Unknown combination "${r.combination}"`);
    if (r.email && !/^\S+@\S+\.\S+$/.test(r.email)) err('email', 'Invalid email');

    if (r.student_code) {
      if (seenCodes.has(r.student_code)) err('student_code', 'Duplicate Student ID in this file');
      seenCodes.add(r.student_code);
    }

    let changes = null;
    if (type === 'new') {
      ['full_name', 'gender', 'date_of_birth', 'class'].forEach((f) => { if (!r[f]) err(f, 'Required'); });
      if (!r.phone && !r.parent_phone) err('parent_phone', 'Parent phone or student phone is required');
      if (r.student_code && byCode.has(r.student_code)) err('student_code', 'Student ID already exists');
      if (r.full_name && r.date_of_birth) {
        const key = `${r.full_name.toLowerCase()}|${r.date_of_birth}`;
        if (byNameDob.has(key) || seenNameDob.has(key)) err('full_name', 'Duplicate: same name and date of birth');
        seenNameDob.add(key);
      }
    } else {
      const s = byCode.get(r.student_code);
      if (!r.student_code) err('student_code', 'Required for updates');
      else if (!s) err('student_code', 'Student ID not found');
      else {
        const cmp = { full_name: s.full_name, gender: s.gender, date_of_birth: s.date_of_birth, class: s.class_name, combination: s.combination,
          boarding_status: s.boarding_status, email: s.email, phone: s.phone };
        changes = [];
        for (const [f, old] of Object.entries(cmp)) {
          if (r[f] && String(old ?? '').toLowerCase() !== r[f].toLowerCase()) changes.push({ field: f, from: old ?? '', to: r[f] });
        }
        if (r.parent_name) changes.push({ field: 'parent_name', from: '', to: r.parent_name });
        if (r.parent_phone) changes.push({ field: 'parent_phone', from: '', to: r.parent_phone });
      }
    }
    if (errors.length === before) valid.push({ row: rowNo, data: r, changes });
  });
  return { errors, valid };
}

function readSheet(file) {
  if (!file) throw new HttpError(400, 'Please upload an Excel file (field name: file)');
  const wb = XLSX.read(file.buffer, { type: 'buffer', cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { defval: '', raw: false, dateNF: 'yyyy-mm-dd' });
  if (!rows.length) throw new HttpError(400, 'The file has no data rows');
  if (rows.length > 5000) throw new HttpError(400, 'Maximum 5000 rows per file');
  const headers = Object.keys(rows[0]);
  const missing = ['full_name', 'student_code'].filter((h) => !headers.includes(h));
  if (missing.length) throw new HttpError(400, `Columns missing: ${missing.join(', ')}. Download the template and use its columns`);
  return rows;
}

// Step 1: upload + validate + preview (nothing is saved to students yet)
router.post('/import/:type(new|update)/preview', upload.single('file'), wrap(async (req, res) => {
  const type = req.params.type;
  const rows = readSheet(req.file);
  const { errors, valid } = await validate(rows, type);
  const [b] = await pool.query(
    "INSERT INTO import_batches (import_type, file_name, total_rows, valid_rows, error_rows, status, error_report, rows_data, uploaded_by) VALUES (?,?,?,?,?,'validated',?,?,?)",
    [type === 'new' ? 'students_new' : 'students_update', req.file.originalname, rows.length, valid.length,
      new Set(errors.map((e) => e.row)).size, JSON.stringify(errors.slice(0, 500)), JSON.stringify(valid), req.user.id]);
  res.json({
    batch_id: b.insertId, total: rows.length, valid: valid.length, error_rows: new Set(errors.map((e) => e.row)).size,
    errors: errors.slice(0, 200), preview: valid.slice(0, 30),
    unchanged: type === 'update' ? valid.filter((v) => !v.changes.length).length : 0,
  });
}));

// Step 2: administrator confirms -> only the valid rows are saved
router.post('/import/:batchId/confirm', wrap(async (req, res) => {
  const [[batch]] = await pool.query('SELECT * FROM import_batches WHERE id = ?', [req.params.batchId]);
  if (!batch) throw new HttpError(404, 'Import not found');
  if (batch.status !== 'validated') throw new HttpError(409, `This import is already ${batch.status}`);
  const valid = typeof batch.rows_data === 'string' ? JSON.parse(batch.rows_data) : batch.rows_data;

  const [classes] = await pool.query('SELECT id, name FROM classes');
  const [combos] = await pool.query('SELECT id, code FROM combinations');
  const classId = (n) => classes.find((c) => c.name.toLowerCase() === String(n).toLowerCase())?.id || null;
  const comboId = (n) => combos.find((c) => c.code.toLowerCase() === String(n).toLowerCase())?.id || null;

  const result = await withTx(async (conn) => {
    let created = 0, updated = 0;
    for (const { data: d, changes } of valid) {
      if (batch.import_type === 'students_new') {
        await createStudent(conn, { ...d, class_id: classId(d.class), combination_id: d.combination ? comboId(d.combination) : null }, req.user.id);
        created++;
      } else if (changes.length) {
        const sets = [], vals = [];
        const col = { full_name: 'full_name', gender: 'gender', date_of_birth: 'date_of_birth', boarding_status: 'boarding_status', email: 'email', phone: 'phone' };
        for (const ch of changes) {
          if (col[ch.field]) { sets.push(`${col[ch.field]} = ?`); vals.push(ch.to); }
          else if (ch.field === 'class') { sets.push('current_class_id = ?'); vals.push(classId(ch.to)); }
          else if (ch.field === 'combination') { sets.push('current_combination_id = ?'); vals.push(comboId(ch.to)); }
        }
        const [[s]] = await conn.query('SELECT id FROM students WHERE student_code = ?', [d.student_code]);
        if (sets.length) await conn.query(`UPDATE students SET ${sets.join(', ')} WHERE id = ?`, [...vals, s.id]);
        if (d.parent_name || d.parent_phone) {
          const [p] = await conn.query('SELECT parent_id FROM student_parents WHERE student_id = ? ORDER BY is_primary DESC LIMIT 1', [s.id]);
          if (p.length) {
            if (d.parent_name) await conn.query('UPDATE parents SET full_name = ? WHERE id = ?', [d.parent_name, p[0].parent_id]);
            if (d.parent_phone) await conn.query('UPDATE parents SET phone = ? WHERE id = ?', [d.parent_phone, p[0].parent_id]);
          } else {
            const [np] = await conn.query('INSERT INTO parents (full_name, phone) VALUES (?,?)', [d.parent_name || 'Parent/Guardian', d.parent_phone || '']);
            await conn.query('INSERT INTO student_parents (student_id, parent_id, relationship, is_primary) VALUES (?,?,?,1)', [s.id, np.insertId, 'Guardian']);
          }
        }
        updated++;
      }
    }
    await conn.query("UPDATE import_batches SET status = 'confirmed', confirmed_at = NOW() WHERE id = ?", [batch.id]);
    return { created, updated };
  });
  await audit(req, 'EXCEL_IMPORT_CONFIRM', 'import_batch', batch.id, result);
  res.json({ message: 'Import completed', ...result });
}));

router.post('/import/:batchId/cancel', wrap(async (req, res) => {
  await pool.query("UPDATE import_batches SET status = 'cancelled' WHERE id = ? AND status = 'validated'", [req.params.batchId]);
  res.json({ message: 'Import cancelled' });
}));

// ---------- export ----------
router.get('/export/students', wrap(async (req, res) => {
  const { class_id, combination_id, boarding_status, incomplete, student_type } = req.query;
  const where = ['1=1'], p = [];
  if (class_id) { where.push('s.current_class_id = ?'); p.push(class_id); }
  if (combination_id) { where.push('s.current_combination_id = ?'); p.push(combination_id); }
  if (boarding_status) { where.push('s.boarding_status = ?'); p.push(boarding_status); }
  if (student_type) {
    where.push(`EXISTS (SELECT 1 FROM registrations r JOIN terms t ON t.id = r.term_id AND t.is_current = 1
      WHERE r.student_id = s.id AND r.student_type = ? AND r.status = 'approved')`);
    p.push(student_type);
  }
  if (incomplete === '1') {
    where.push(`EXISTS (SELECT 1 FROM registrations r JOIN terms t ON t.id = r.term_id AND t.is_current = 1
      JOIN student_requirements sr ON sr.registration_id = r.id AND sr.status = 'pending' WHERE r.student_id = s.id)`);
  }
  const [rows] = await pool.query(
    `SELECT s.student_code, s.full_name, s.gender, s.date_of_birth, c.name AS class, cb.code AS combination,
       p.full_name AS parent_name, p.phone AS parent_phone, s.boarding_status, s.email, s.phone
     FROM students s LEFT JOIN classes c ON c.id = s.current_class_id LEFT JOIN combinations cb ON cb.id = s.current_combination_id
     LEFT JOIN student_parents sp ON sp.student_id = s.id AND sp.is_primary = 1 LEFT JOIN parents p ON p.id = sp.parent_id
     WHERE ${where.join(' AND ')} ORDER BY c.name, s.full_name`, p);
  await audit(req, 'EXCEL_EXPORT', 'students', null, { count: rows.length });
  sendBook(res, rows, 'Students', 'students_export.xlsx');
}));

router.get('/export/permissions', wrap(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT pc.permission_number, s.student_code, s.full_name, pr.destination, pr.reason, pr.departure_at, pr.expected_return_at, pr.status
     FROM permission_requests pr JOIN students s ON s.id = pr.student_id LEFT JOIN permission_cards pc ON pc.permission_request_id = pr.id
     ORDER BY pr.id DESC`);
  sendBook(res, rows, 'Permissions', 'permissions_export.xlsx');
}));

module.exports = router;
