const pool = require('../config/db');

module.exports = async function audit(req, action, entity, entityId, details) {
  try {
    await pool.query(
      'INSERT INTO audit_logs (user_id, action, entity, entity_id, details, ip_address) VALUES (?,?,?,?,?,?)',
      [req.user?.id || null, action, entity || null, entityId || null, details ? JSON.stringify(details) : null, req.ip]
    );
  } catch (e) {
    console.error('audit failed:', e.message);
  }
};
