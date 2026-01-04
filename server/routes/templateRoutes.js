const express = require('express');
const router = express.Router();
const templateController = require('../controllers/templateController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');
const { uploadTemplate } = require('../middleware/uploadMiddleware');

// Multer error handling middleware for template uploads
const handleMulterError = (err, req, res, next) => {
  if (err) {
    console.error('Template upload error:', err);
    return res.status(400).json({
      success: false,
      message: err.message || 'File upload error'
    });
  }
  next();
};

// Public route - Get active templates (for student request form)
router.get('/active', templateController.getActiveTemplates);

// Admin routes - require authentication and admin role
router.post('/', 
  verifyToken, 
  isAdmin, 
  uploadTemplate.single('template'),
  handleMulterError,
  templateController.createTemplate
);

router.get('/', 
  verifyToken, 
  isAdmin, 
  templateController.listTemplates
);

router.get('/:id', 
  verifyToken, 
  isAdmin, 
  templateController.getTemplateById
);

router.put('/:id', 
  verifyToken, 
  isAdmin, 
  uploadTemplate.single('template'),
  handleMulterError,
  templateController.updateTemplate
);

router.patch('/:id/status', 
  verifyToken, 
  isAdmin, 
  templateController.toggleTemplateStatus
);

router.delete('/:id', 
  verifyToken, 
  isAdmin, 
  templateController.deleteTemplate
);

module.exports = router;

