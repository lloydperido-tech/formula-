-- SmartQ Test Data for Supabase
-- Run this AFTER running supabase-schema.sql
-- ⚠️ WARNING: THIS IS TEST DATA - DELETE BEFORE PRODUCTION!

-- Insert test students
-- Password for all test accounts: Test@123
-- Hashed with bcrypt (10 rounds)
INSERT INTO users (email, password, role, first_name, middle_name, last_name, student_number, program, address, contact_number, is_verified) VALUES
('alellhy.derueda@cvsu.edu.ph', '$2b$10$rXqZ5jM9YqNhP5zF.n5xheJlQZ5mEJZyHvX8KzqZwQx7Z8Yq5KqYO', 'student', 'Alellhy', 'M', 'De Rueda', '202012345', 'BS Computer Science', '123 Main St, Indang, Cavite', '09171234567', TRUE),
('juan.delacruz@cvsu.edu.ph', '$2b$10$rXqZ5jM9YqNhP5zF.n5xheJlQZ5mEJZyHvX8KzqZwQx7Z8Yq5KqYO', 'student', 'Juan', 'P', 'Dela Cruz', '202012346', 'BS Information Technology', '456 Oak Ave, Indang, Cavite', '09171234568', TRUE),
('maria.santos@cvsu.edu.ph', '$2b$10$rXqZ5jM9YqNhP5zF.n5xheJlQZ5mEJZyHvX8KzqZwQx7Z8Yq5KqYO', 'student', 'Maria', 'L', 'Santos', '202012347', 'BS Computer Engineering', '789 Pine St, Indang, Cavite', '09171234569', TRUE);

-- Get student IDs for reference (we'll need to update these after insertion)
-- Note: In PostgreSQL/Supabase, we'll use the actual UUIDs generated

-- Insert document templates
INSERT INTO document_templates (document_name, document_code, template_file_path, field_config, base_price, price_per_copy, processing_days, is_active) VALUES
('Transcript of Records', 'TOR', 'uploads/templates/tor-template.pdf', '{"predefined":["student_name","student_number","program","purpose","quantity"],"custom":["graduation_year","cum_laude"]}', 150.00, 50.00, 7, TRUE),
('Certificate of Grades', 'COG', 'uploads/templates/cog-template.pdf', '{"predefined":["student_name","student_number","program","purpose","quantity"],"custom":["semester","school_year"]}', 50.00, 10.00, 3, TRUE),
('Certificate of Good Moral', 'CGM', 'uploads/templates/cgm-template.pdf', '{"predefined":["student_name","student_number","program","purpose"],"custom":[]}', 50.00, 0.00, 3, TRUE),
('Certificate of Enrollment', 'COE', 'uploads/templates/coe-template.pdf', '{"predefined":["student_name","student_number","program","purpose"],"custom":["semester","school_year"]}', 30.00, 0.00, 1, TRUE),
('Honorable Dismissal', 'HD', 'uploads/templates/hd-template.pdf', '{"predefined":["student_name","student_number","program","purpose"],"custom":["last_semester_attended"]}', 100.00, 0.00, 5, TRUE),
('Certificate of Registration', 'COR', 'uploads/templates/cor-template.pdf', '{"predefined":["student_name","student_number","program","purpose"],"custom":["semester","school_year"]}', 30.00, 0.00, 1, TRUE),
('Diploma/Degree Certificate', 'DDC', 'uploads/templates/ddc-template.pdf', '{"predefined":["student_name","student_number","program","purpose"],"custom":["graduation_date","degree"]}', 200.00, 0.00, 14, TRUE),
('Course Description', 'CD', 'uploads/templates/cd-template.pdf', '{"predefined":["student_name","student_number","program","purpose","quantity"],"custom":["course_code","course_title"]}', 50.00, 30.00, 5, TRUE),
('Certification of Units Earned', 'CUE', 'uploads/templates/cue-template.pdf', '{"predefined":["student_name","student_number","program","purpose"],"custom":["units_earned"]}', 50.00, 0.00, 3, TRUE);

-- Note: To insert requests with proper foreign keys, you'll need to:
-- 1. First get the actual UUIDs of inserted students and templates
-- 2. Then insert requests using those UUIDs
-- Here's a template for reference:

-- Sample request (uncomment and update with actual UUIDs after students/templates are inserted)
/*
WITH student AS (SELECT id FROM users WHERE email = 'alellhy.derueda@cvsu.edu.ph'),
     template AS (SELECT id FROM document_templates WHERE document_code = 'TOR')
INSERT INTO requests (student_id, template_id, reference_number, quantity, purpose, form_data, total_amount, status)
SELECT 
  student.id,
  template.id,
  '2024-REG-00001',
  2,
  'Job application requirements',
  '{"student_name":"Alellhy M. De Rueda","student_number":"202012345","program":"BS Computer Science","graduation_year":"2024","cum_laude":"Yes"}',
  250.00,
  'Pending Payment'
FROM student, template;
*/

-- ⚠️ IMPORTANT NOTES:
-- 1. The password hash above is for 'Test@123'
-- 2. Template file paths are placeholders - actual files need to be uploaded
-- 3. UUIDs are auto-generated, so foreign key references need to be done carefully
-- 4. DELETE ALL THIS DATA BEFORE PRODUCTION!
-- 5. To clean test data, you can run:
--    DELETE FROM requests WHERE reference_number LIKE '2024-REG-%';
--    DELETE FROM document_templates WHERE document_code IN ('TOR','COG','CGM','COE','HD');
--    DELETE FROM users WHERE email LIKE '%@cvsu.edu.ph' AND role = 'student';
