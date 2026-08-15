const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

// Route pubbliche
router.post('/register', authController.register);
router.post('/login', authController.login);

// Route protette (richiedono autenticazione)
router.get('/profile', authenticate, authController.getProfile);

module.exports = router;
