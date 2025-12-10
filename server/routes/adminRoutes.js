// Admin Routes
const express = require('express');
const router = express.Router();
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');
const requestController = require('../controllers/requestController');
const receiptController = require('../controllers/receiptController');

// Middleware to verify admin access on this route
router.use(verifyToken, verifyAdmin);

// Request Management Routes (Admin Only)
router.get('/queue', requestController.getRequestQueue);
router.patch('/requests/:id/status', requestController.updateRequestStatus);
router.get('/requests/stats/overview', requestController.getStatistics);

// Receipt Management Routes (Admin Only)
router.patch('/receipts/:id/verify', receiptController.verifyReceipt);
router.get('/receipts/:id/download', receiptController.downloadReceipt);

module.exports = router;
