const path = require('path');
const crypto = require('crypto');

// Load environment variables once (root .env first, then server/.env)
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const isProduction = process.env.NODE_ENV === 'production';

let jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  if (isProduction) {
    // Never fall back to a well-known secret in production: anyone could forge tokens.
    // A random secret keeps the server safe, but sessions end whenever it restarts.
    jwtSecret = crypto.randomBytes(48).toString('hex');
    console.warn('WARNING: JWT_SECRET is not set. Using a random secret; users will be logged out on every restart.');
  } else {
    jwtSecret = 'polylearn_dev_only_secret';
  }
}

module.exports = {
  isProduction,
  port: Number(process.env.PORT) || 5000,
  jwtSecret,
  // Comma-separated list of allowed frontend origins, e.g. "https://polylearn.vercel.app,http://localhost:5173"
  clientUrls: (process.env.CLIENT_URL || '')
    .split(',')
    .map((url) => url.trim().replace(/\/$/, ''))
    .filter(Boolean),
  // Code a new user must enter to sign up as a teacher. Teacher sign-up is disabled when empty.
  teacherInviteCode: (process.env.TEACHER_INVITE_CODE || '').trim(),
  db: {
    url: process.env.DATABASE_URL || '',
    ssl: process.env.DB_SSL === 'true',
    dialect: process.env.DB_DIALECT || 'mysql',
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    pass: process.env.DB_PASS || '',
    name: process.env.DB_NAME || 'polylearn',
  },
};
