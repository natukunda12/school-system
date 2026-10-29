// Creates the database and all tables (safe to run again: it also applies newer changes)
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });
  try {
    await conn.query(fs.readFileSync(path.join(__dirname, '../database/schema.sql'), 'utf8'));
    console.log('Database and tables created.');
  } catch (e) {
    if (e.code === 'ER_TABLE_EXISTS_ERROR') console.log('Base tables already exist.');
    else { console.error('Failed:', e.message); process.exitCode = 1; await conn.end(); return; }
  }
  try {
    await conn.query('USE ' + (process.env.DB_NAME || 'school_management'));
    await require('./migrate')(conn);
    console.log('Latest changes applied (permissions, dormitories, refectory, arrivals).');
  } catch (e) {
    console.error('Migration failed:', e.message);
    process.exitCode = 1;
  } finally {
    await conn.end();
  }
})();
