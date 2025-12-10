const express = require('express');
const router = express.Router();
const receiptController = require('../controllers/receiptController');
const authMiddleware = require('../middleware/authMiddleware');
const { uploadReceipt } = require('../middleware/uploadMiddleware');

// Middleware
router.use(authMiddleware.verifyToken);

// Student routes
router.post('/:requestId/receipt', uploadReceipt.single('receipt'), receiptController.uploadReceipt);
router.get('/:requestId/receipt', receiptController.getReceipt);

// Admin routes
router.patch('/:requestId/receipt/verify', authMiddleware.isAdmin, receiptController.verifyReceipt);
router.get('/:requestId/receipt/download', authMiddleware.isAdmin, receiptController.downloadReceipt);

module.exports = router;
