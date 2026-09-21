const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const lessonController = require('../controllers/lessonController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../utils/http');

router.get('/languages', asyncHandler(courseController.getLanguages));
router.get('/languages/:id', asyncHandler(courseController.getLanguageById));
router.get('/units/:id/lessons', asyncHandler(courseController.getLessonsByUnit));

// Taking lessons is protected by JWT and limited to students
const student = [authenticateToken, requireRole('student')];
router.get('/lessons/:id', student, asyncHandler(lessonController.getLessonDetails));
router.post('/lessons/:id/check', student, asyncHandler(lessonController.checkAnswer));
router.post('/lessons/:id/submit', student, asyncHandler(lessonController.submitLesson));

module.exports = router;
