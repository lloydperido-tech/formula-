const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');

// Public route - submit contact message
router.post('/submit', contactController.submitContactMessage);

// Admin routes - get all messages
router.get('/messages', contactController.getAllContactMessages);

// Admin route - get specific message
router.get('/messages/:id', contactController.getContactMessage);

// Admin route - update message status
router.patch('/messages/:id/status', contactController.updateContactMessageStatus);

// Admin route - delete message
router.delete('/messages/:id', contactController.deleteContactMessage);

module.exports = router;
