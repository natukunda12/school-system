
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const host = process.env.DB_HOST || 'localhost';
const isLocalDatabase = ['localhost', '127.0.0.1', '::1'].includes(host);
const ssl = isLocalDatabase
  ? undefined
  : {
      ca: fs.readFileSync(path.join(__dirname, '..', 'certs', 'ca.pem'), 'utf8'),
      rejectUnauthorized: true,
    };

const pool = mysql.createPool({
  host,
  port: Number(process.env.DB_PORT || (isLocalDatabase ? 3306 : 11747)),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'school_management',
  ...(ssl ? { ssl } : {}),
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true,
});

module.exports = pool;
