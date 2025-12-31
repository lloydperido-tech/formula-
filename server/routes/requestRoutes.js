const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');
const authMiddleware = require('../middleware/authMiddleware');

// Middleware
router.use(authMiddleware.verifyToken);

// Student routes - specific routes first to avoid conflicts
router.get('/next-reference-number', requestController.getNextReferenceNumber);
router.get('/stats/overview', requestController.getStatistics);
router.get('/', requestController.getStudentRequests);
router.post('/', requestController.createRequest);
router.get('/details/:id', requestController.getRequestDetails);
router.delete('/:id', requestController.cancelRequest);

// Admin routes
router.get('/admin/queue', requestController.getRequestQueue);
router.patch('/:id/status', requestController.updateRequestStatus);

module.exports = router;
