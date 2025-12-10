const express = require('express');
const router = express.Router();
const {
  registerStudent,
  registerAdmin,
  login,
  verifyEmail
} = require('../controllers/authController');

// Student registration
router.post('/register', registerStudent);

// Admin registration (requires secret code)
router.post('/register-admin', registerAdmin);

// Login (both student and admin)
router.post('/login', login);

// Verify email
router.get('/verify/:token', verifyEmail);

module.exports = router;
