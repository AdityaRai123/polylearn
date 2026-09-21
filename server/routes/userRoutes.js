const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../utils/http');

router.use(authenticateToken);

// Dashboard endpoints (students)
router.get('/dashboard', requireRole('student'), asyncHandler(userController.getDashboard));
router.post('/refill-hearts', requireRole('student'), asyncHandler(userController.refillHearts));

// Any signed-in user
router.delete('/', asyncHandler(userController.deleteAccount));

module.exports = router;
