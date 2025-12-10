const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { testConnection } = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from parent COSC75 directory
app.use(express.static(path.join(__dirname, '..')));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/documents', require('./routes/documentRoutes'));
app.use('/api/requests', require('./routes/requestRoutes'));
app.use('/api/receipts', require('./routes/receiptRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/templates', require('./routes/templateRoutes'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'SmartQ API is running',
    version: '1.0.0-beta'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

// Start server
const startServer = async () => {
  // Test database connection
  const dbConnected = await testConnection();
  
  if (!dbConnected) {
    console.error('⚠️  Server starting without database connection');
  }

  app.listen(PORT, () => {
    console.log(`\n🚀 SmartQ Server running on http://localhost:${PORT}`);
    console.log(`📁 Admin panel: http://localhost:${PORT}/admin/dashboard.html`);
    console.log(`📄 Student portal: http://localhost:${PORT}/landing.html\n`);
  });
};

startServer();
