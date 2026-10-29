const router = require('express').Router();
const pool = require('../config/db');
const { authenticate, authorize, STAFF } = require('../middleware/auth');
const { wrap } = require('../utils/http');

router.use(authenticate, authorize(...STAFF));

router.get('/summary', wrap(async (req, res) => {
  const q = async (sql, p = []) => (await pool.query(sql, p))[0];
  const [{ n: total }] = await q("SELECT COUNT(*) n FROM students WHERE status = 'active'");
  const byClass = await q(`SELECT COALESCE(c.name,'No class') label, COUNT(*) value FROM students s LEFT JOIN classes c ON c.id = s.current_class_id WHERE s.status = 'active' GROUP BY label ORDER BY label`);
  const byCombination = await q(`SELECT COALESCE(cb.code,'None') label, COUNT(*) value FROM students s LEFT JOIN combinations cb ON cb.id = s.current_combination_id WHERE s.status = 'active' GROUP BY label ORDER BY label`);
  const byBoarding = await q("SELECT boarding_status label, COUNT(*) value FROM students WHERE status = 'active' GROUP BY boarding_status");
  const [term] = await q('SELECT id, name FROM terms WHERE is_current = 1 LIMIT 1');
  let registrations = [], requirements = { complete: 0, pending: 0 }, regTypes = [];
  if (term) {
    registrations = await q('SELECT status label, COUNT(*) value FROM registrations WHERE term_id = ? GROUP BY status', [term.id]);
    regTypes = await q("SELECT student_type label, COUNT(*) value FROM registrations WHERE term_id = ? AND status = 'approved' GROUP BY student_type", [term.id]);
    const rq = await q(`SELECT sr.status label, COUNT(*) value FROM student_requirements sr JOIN registrations r ON r.id = sr.registration_id WHERE r.term_id = ? GROUP BY sr.status`, [term.id]);
    rq.forEach((x) => (requirements[x.label] = x.value));
  }
  await pool.query("UPDATE permission_requests SET status = 'expired' WHERE status IN ('approved','pending') AND expected_return_at < NOW()");
  const permissions = await q('SELECT status label, COUNT(*) value FROM permission_requests GROUP BY status');
  res.json({ total, term: term || null, byClass, byCombination, byBoarding, registrations, regTypes, requirements, permissions });
}));

// students with pending requirements in the current term
router.get('/pending-requirements', wrap(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT s.student_code, s.full_name, c.name AS class_name, GROUP_CONCAT(rq.name ORDER BY rq.name SEPARATOR ', ') AS missing
     FROM student_requirements sr JOIN registrations r ON r.id = sr.registration_id JOIN terms t ON t.id = r.term_id AND t.is_current = 1
     JOIN requirements rq ON rq.id = sr.requirement_id JOIN students s ON s.id = r.student_id
     LEFT JOIN classes c ON c.id = s.current_class_id WHERE sr.status = 'pending' AND r.status = 'approved'
     GROUP BY s.id, s.student_code, s.full_name, c.name ORDER BY s.full_name LIMIT 1000`);
  res.json(rows);
}));

module.exports = router;
