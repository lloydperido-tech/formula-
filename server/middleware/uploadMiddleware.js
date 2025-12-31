const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const createUploadDirs = () => {
  const dirs = [
    'uploads/receipts',
    'uploads/documents',
    'uploads/templates'
  ];
  
  dirs.forEach(dir => {
    const fullPath = path.join(__dirname, '..', dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  });
};

createUploadDirs();

// Storage configuration for payment receipts
const receiptStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads/receipts'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'receipt-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Storage configuration for PDF templates
const templateStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads/templates'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'template-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Storage configuration for manual documents
const documentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads/documents'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'document-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter for receipts (images and PDFs)
const receiptFileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG, PNG, and PDF files are allowed for receipts'));
  }
};

// File filter for templates (PDF only)
const templateFileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed for templates'));
  }
};

// Upload configurations
const uploadReceipt = multer({
  storage: receiptStorage,
  fileFilter: receiptFileFilter,
  limits: {
    fileSize: (process.env.MAX_FILE_SIZE_MB || 5) * 1024 * 1024 // 5MB default
  }
});

const uploadTemplate = multer({
  storage: templateStorage,
  fileFilter: templateFileFilter,
  limits: {
    fileSize: (process.env.MAX_TEMPLATE_SIZE_MB || 10) * 1024 * 1024 // 10MB default
  }
});

const uploadDocument = multer({
  storage: documentStorage,
  fileFilter: templateFileFilter,
  limits: {
    fileSize: (process.env.MAX_TEMPLATE_SIZE_MB || 10) * 1024 * 1024
  }
});

module.exports = {
  uploadReceipt,
  uploadTemplate,
  uploadDocument
};
