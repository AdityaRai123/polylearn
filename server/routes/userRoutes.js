const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authenticateToken = require('../middleware/authMiddleware');

// Dashboard endpoints
router.get('/dashboard', authenticateToken, userController.getDashboard);
router.post('/refill-hearts', authenticateToken, userController.refillHearts);
router.delete('/', authenticateToken, userController.deleteAccount);

module.exports = router;
