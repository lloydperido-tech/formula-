-- Demo Accounts Creation Script
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/YOUR_PROJECT/sql)

-- Note: Passwords for demo accounts:
-- Student: StudentPass123
-- Admin: AdminPass123

-- Delete existing demo accounts if they exist
DELETE FROM users WHERE email IN ('student@cvsu.edu.ph', 'admin@cvsu.edu.ph');

-- Insert Student Demo Account
-- Email: student@cvsu.edu.ph
-- Password: StudentPass123
INSERT INTO users (
  email, password, role, first_name, middle_name, last_name,
  student_number, program, address, contact_number, is_verified
) VALUES (
  'student@cvsu.edu.ph',
  '$2b$10$ASQhN5cdOLlbi8CUPrSO1OYPSeDnvcxLXlw5S.pheV5XI6iSAj0mm',
  'student',
  'Demo',
  'Test',
  'Student',
  '202100001',
  'BS Computer Science',
  '123 Demo Street, Indang, Cavite',
  '09123456789',
  true
);

-- Insert Admin Demo Account  
-- Email: admin@cvsu.edu.ph
-- Password: AdminPass123
INSERT INTO users (
  email, password, role, first_name, last_name,
  contact_number, is_verified
) VALUES (
  'admin@cvsu.edu.ph',
  '$2b$10$hh7Hv8tXkIKmGqsi9xD6Cex1oVyX5.anL6LKFUO3MSJkvjh9h2Zeu',
  'admin',
  'Demo',
  'Admin',
  '09123456788',
  true
);

-- Verify accounts were created
SELECT email, role, first_name, last_name, is_verified 
FROM users 
WHERE email IN ('student@cvsu.edu.ph', 'admin@cvsu.edu.ph');

