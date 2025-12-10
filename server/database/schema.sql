-- SmartQ Database Schema
-- Cavite State University - Document Request System
-- ⚠️ Run this script to create the database structure

CREATE DATABASE IF NOT EXISTS smartq_db;
USE smartq_db;

-- Users table (students and admin)
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('student', 'admin') DEFAULT 'student',
  first_name VARCHAR(100) NOT NULL,
  middle_name VARCHAR(100),
  last_name VARCHAR(100) NOT NULL,
  student_number VARCHAR(50) UNIQUE,
  program VARCHAR(255),
  address TEXT,
  contact_number VARCHAR(20),
  is_verified BOOLEAN DEFAULT FALSE,
  verification_token VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_student_number (student_number),
  INDEX idx_role (role)
);

-- Document types/templates
CREATE TABLE IF NOT EXISTS document_templates (
  id INT PRIMARY KEY AUTO_INCREMENT,
  document_type VARCHAR(100) NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  description TEXT,
  first_copy_fee DECIMAL(10, 2) NOT NULL,
  additional_copy_fee DECIMAL(10, 2) NOT NULL,
  processing_days VARCHAR(50),
  template_filename VARCHAR(255),
  config_filename VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  version INT DEFAULT 1,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_active (is_active),
  INDEX idx_document_type (document_type)
);

-- Document requests
CREATE TABLE IF NOT EXISTS requests (
  id INT PRIMARY KEY AUTO_INCREMENT,
  reference_id VARCHAR(50) UNIQUE NOT NULL,
  student_id INT NOT NULL,
  document_template_id INT NOT NULL,
  template_version INT NOT NULL,
  quantity INT DEFAULT 1,
  purpose VARCHAR(255),
  total_amount DECIMAL(10, 2) NOT NULL,
  status ENUM('Requested', 'Verifying', 'Processing', 'For Release', 'Completed', 'Rejected') DEFAULT 'Requested',
  notes TEXT,
  payment_verified BOOLEAN DEFAULT FALSE,
  payment_verified_by INT,
  payment_verified_at TIMESTAMP NULL,
  document_generated BOOLEAN DEFAULT FALSE,
  generated_document_path VARCHAR(255),
  is_manual_fulfillment BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (document_template_id) REFERENCES document_templates(id) ON DELETE RESTRICT,
  FOREIGN KEY (payment_verified_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_reference_id (reference_id),
  INDEX idx_student_id (student_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);

-- Payment receipts
CREATE TABLE IF NOT EXISTS payment_receipts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  request_id INT NOT NULL,
  filename VARCHAR(255) NOT NULL,
  file_path VARCHAR(255) NOT NULL,
  file_size INT NOT NULL,
  mime_type VARCHAR(50) NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE,
  INDEX idx_request_id (request_id)
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  request_id INT,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_is_read (is_read)
);

-- Request status history (for tracking)
CREATE TABLE IF NOT EXISTS request_status_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  request_id INT NOT NULL,
  status VARCHAR(50) NOT NULL,
  changed_by INT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_request_id (request_id)
);

-- Auto-deletion log for compliance
CREATE TABLE IF NOT EXISTS deletion_log (
  id INT PRIMARY KEY AUTO_INCREMENT,
  request_id INT,
  reference_id VARCHAR(50),
  document_type VARCHAR(100),
  student_email VARCHAR(255),
  deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reason VARCHAR(255) DEFAULT '90-day retention policy'
);
