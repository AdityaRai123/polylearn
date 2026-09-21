const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { User, UserStats, sequelize } = require('../models');
const { jwtSecret, teacherInviteCode } = require('../config/env');
const { HttpError } = require('../utils/http');

const toPublicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
});

const signToken = (user) => jwt.sign({ id: user.id, role: user.role }, jwtSecret, { expiresIn: '30d' });

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const isValidTeacherCode = (code) => {
  if (!teacherInviteCode) return false;
  const given = Buffer.from(String(code || '').trim());
  const expected = Buffer.from(teacherInviteCode);
  return given.length === expected.length && crypto.timingSafeEqual(given, expected);
};

// GET /api/auth/config
exports.getConfig = (req, res) => {
  res.json({ teacherSignupEnabled: Boolean(teacherInviteCode) });
};

// POST /api/auth/signup
exports.signup = async (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = normalizeEmail(req.body.email);
  const password = String(req.body.password || '');
  const role = req.body.role === 'teacher' ? 'teacher' : 'student';

  if (!name || !email || !password) {
    throw new HttpError(400, 'Name, email and password are required.');
  }
  if (name.length > 80) {
    throw new HttpError(400, 'Name must be 80 characters or fewer.');
  }
  if (password.length < 6) {
    throw new HttpError(400, 'Password must be at least 6 characters long.');
  }
  if (role === 'teacher' && !isValidTeacherCode(req.body.teacherCode)) {
    throw new HttpError(
      403,
      teacherInviteCode
        ? 'That teacher access code is not valid.'
        : 'Teacher sign-up is turned off on this server. Ask your administrator for a teacher account.'
    );
  }

  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    throw new HttpError(409, 'An account with this email already exists.');
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await sequelize.transaction(async (transaction) => {
    const created = await User.create({ name, email, passwordHash, role }, { transaction });
    // XP, streaks and hearts only apply to students
    if (role === 'student') {
      await UserStats.create({ userId: created.id }, { transaction });
    }
    return created;
  });

  res.status(201).json({ token: signToken(user), user: toPublicUser(user) });
};

// POST /api/auth/login
exports.login = async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const password = String(req.body.password || '');

  if (!email || !password) {
    throw new HttpError(400, 'Email and password are required.');
  }

  const user = await User.findOne({ where: { email } });
  const isMatch = user && (await bcrypt.compare(password, user.passwordHash));
  if (!isMatch) {
    throw new HttpError(401, 'Invalid email or password.');
  }

  res.json({ token: signToken(user), user: toPublicUser(user) });
};

// GET /api/auth/me (Protected)
exports.me = (req, res) => {
  res.json({ user: toPublicUser(req.user) });
};
