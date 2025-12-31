// Admin Routes
const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');
const requestController = require('../controllers/requestController');
const receiptController = require('../controllers/receiptController');
const notificationController = require('../controllers/notificationController');

// Middleware to verify admin access on this route
router.use(verifyToken, isAdmin);

// Request Management Routes (Admin Only)
router.get('/queue', requestController.getRequestQueue);
router.patch('/requests/:id/status', requestController.updateRequestStatus);
router.get('/requests/stats/overview', requestController.getStatistics);

// Notification Routes (Admin Only)
router.get('/notifications', notificationController.getAdminNotifications);
router.get('/notifications/latest', notificationController.getLatestRequest);
router.post('/notifications/read', notificationController.markNotificationsAsRead);

// Receipt Management Routes (Admin Only)
router.patch('/receipts/:id/verify', receiptController.verifyReceipt);
router.get('/receipts/:id/download', receiptController.downloadReceipt);

module.exports = router;

