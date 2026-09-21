const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../utils/http');

// Teachers manage their own tests and see who took them
router.use(authenticateToken, requireRole('teacher'));

router.get('/tests', asyncHandler(teacherController.listTests));
router.post('/tests', asyncHandler(teacherController.createTest));
router.get('/tests/:id', asyncHandler(teacherController.getTest));
router.put('/tests/:id', asyncHandler(teacherController.updateTest));
router.patch('/tests/:id/publish', asyncHandler(teacherController.setPublished));
router.delete('/tests/:id', asyncHandler(teacherController.deleteTest));

router.get('/tests/:id/attempts', asyncHandler(teacherController.listAttempts));
router.get('/tests/:id/attempts/:attemptId', asyncHandler(teacherController.getAttempt));
router.delete('/tests/:id/attempts/:attemptId', asyncHandler(teacherController.resetAttempt));

module.exports = router;
