const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/env');
const { User } = require('../models');
const { asyncHandler } = require('../utils/http');

// Verifies the Bearer token and loads the current user from the database, so a
// deleted account or a changed role takes effect immediately.
const authenticateToken = asyncHandler(async (req, res, next) => {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Please log in to continue.' });
  }

  let payload;
  try {
    payload = jwt.verify(token, jwtSecret);
  } catch {
    return res.status(401).json({ message: 'Your session has expired. Please log in again.' });
  }

  const user = await User.findByPk(payload.id, { attributes: ['id', 'name', 'email', 'role'] });
  if (!user) {
    return res.status(401).json({ message: 'Your account no longer exists. Please log in again.' });
  }

  req.user = user.get({ plain: true });
  next();
});

const requireRole = (role) => (req, res, next) => {
  if (req.user?.role !== role) {
    return res.status(403).json({ message: `Only ${role}s can do that.` });
  }
  next();
};

module.exports = { authenticateToken, requireRole };
