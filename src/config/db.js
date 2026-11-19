
require('dotenv').config();

const mysql = require('mysql2/promise');

const isProduction = process.env.NODE_ENV === 'production';

const useSSL = process.env.DB_SSL === 'true';

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'nexa_store',

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,

  decimalNumbers: true,
  timezone: 'local',

  ...(useSSL ? {
    ssl: {
      minVersion: 'TLSv1.2',
      rejectUnauthorized: true
    }
  } : {})
});

module.exports = pool;
