const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../utils/http');

router.get('/config', authController.getConfig);
router.post('/signup', asyncHandler(authController.signup));
router.post('/login', asyncHandler(authController.login));
router.get('/me', authenticateToken, authController.me);

module.exports = router;
