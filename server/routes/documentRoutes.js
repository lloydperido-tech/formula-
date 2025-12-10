const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');

// Get active document templates
router.get('/active', async (req, res) => {
  try {
    const { pool } = require('../config/db');
    const [templates] = await pool.execute(
      'SELECT * FROM document_templates WHERE is_active = TRUE ORDER BY display_name'
    );
    
    res.json({
      success: true,
      templates
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch templates'
    });
  }
});

module.exports = router;
