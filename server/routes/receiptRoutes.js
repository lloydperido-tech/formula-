const express = require('express');
const router = express.Router();
const receiptController = require('../controllers/receiptController');
const authMiddleware = require('../middleware/authMiddleware');
const { uploadReceipt } = require('../middleware/uploadMiddleware');

// Debug endpoint (no auth required)
router.get('/:requestId/debug-receipt', async (req, res) => {
  // Debug endpoint to check what's in the database
  try {
    const db = require('../config/db');
    const fs = require('fs');
    const { requestId } = req.params;
    const { data: receipt, error } = await db.supabase
      .from('payment_receipts')
      .select('*')
      .eq('request_id', requestId)
      .single();
    
    let existsOnDisk = false;
    if (receipt && receipt.file_path) {
      existsOnDisk = fs.existsSync(receipt.file_path);
    }
    
    res.json({ 
      receipt, 
      error, 
      existsOnDisk,
      filePath: receipt?.file_path
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Middleware
router.use(authMiddleware.verifyToken);

// Multer error handling middleware
const handleMulterError = (err, req, res, next) => {
  if (err) {
    console.error('Multer error:', err);
    return res.status(400).json({
      success: false,
      message: err.message || 'File upload error'
    });
  }
  next();
};

// Student routes
router.post('/:requestId/upload', 
  (req, res, next) => {
    uploadReceipt.single('receipt')(req, res, (err) => {
      if (err) {
        console.error('Upload middleware error:', err);
        return res.status(400).json({
          success: false,
          message: err.message || 'Failed to upload file'
        });
      }
      next();
    });
  },
  receiptController.uploadReceipt
);
router.post('/:requestId/receipt', uploadReceipt.single('receipt'), handleMulterError, receiptController.uploadReceipt);
router.get('/:requestId/receipt', receiptController.getReceipt);
router.get('/:requestId/receipt/file', receiptController.viewReceipt);

// Admin routes
router.patch('/:requestId/receipt/verify', authMiddleware.isAdmin, receiptController.verifyReceipt);
router.get('/:requestId/receipt/download', authMiddleware.isAdmin, receiptController.downloadReceipt);

module.exports = router;
