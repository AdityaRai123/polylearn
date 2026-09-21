const express = require('express');
const router = express.Router();
const testController = require('../controllers/testController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../utils/http');

// Students browse, take and review tests
router.use(authenticateToken, requireRole('student'));

router.get('/', asyncHandler(testController.listTests));
router.get('/:id', asyncHandler(testController.getTest));
router.post('/:id/submit', asyncHandler(testController.submitTest));
router.get('/:id/result', asyncHandler(testController.getMyResult));

module.exports = router;
