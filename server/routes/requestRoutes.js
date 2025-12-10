const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');
const authMiddleware = require('../middleware/authMiddleware');

// Middleware
router.use(authMiddleware.verifyToken);

// Student routes
router.post('/', requestController.createRequest);
router.get('/', requestController.getStudentRequests);
router.get('/details/:id', requestController.getRequestDetails);
router.delete('/:id', requestController.cancelRequest);
router.get('/stats/overview', requestController.getStatistics);

// Admin routes
router.get('/admin/queue', requestController.getRequestQueue);
router.patch('/:id/status', requestController.updateRequestStatus);

module.exports = router;
