const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const userController = require('../controllers/userController');
const authenticateToken = require('../middleware/authMiddleware');

router.get('/languages', courseController.getLanguages);
router.get('/languages/:id', courseController.getLanguageById);
router.get('/units/:id/lessons', courseController.getLessonsByUnit);

// Fetching detailed questions is protected by JWT
router.get('/lessons/:id', authenticateToken, courseController.getLessonDetails);
router.post('/lessons/:id/submit', authenticateToken, userController.submitLesson);

module.exports = router;
