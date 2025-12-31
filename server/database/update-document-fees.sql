-- Update Document Templates with Fees from s_fees.html
-- This script syncs the database document fees with the official fee schedule
-- Run this to ensure all documents match the displayed fees

-- Update Certificate of Enrollment
UPDATE document_templates 
SET first_copy_fee = 30.00, additional_copy_fee = 0.00, processing_days = '1-2 days'
WHERE document_type LIKE '%Enrollment%' OR document_code = 'COE';

-- Update Certificate of Good Moral
UPDATE document_templates 
SET first_copy_fee = 50.00, additional_copy_fee = 0.00, processing_days = '2-4 days'
WHERE document_type LIKE '%Good Moral%' OR document_code = 'CGM';

-- Update Certificate of Grades
UPDATE document_templates 
SET first_copy_fee = 50.00, additional_copy_fee = 10.00, processing_days = '2-4 days'
WHERE document_type LIKE '%Grades%' OR document_code = 'COG';

-- Update Certificate of Registration
UPDATE document_templates 
SET first_copy_fee = 30.00, additional_copy_fee = 0.00, processing_days = '1-2 days'
WHERE document_type LIKE '%Registration%' OR document_code = 'COR';

-- Update Certification of Units Earned
UPDATE document_templates 
SET first_copy_fee = 50.00, additional_copy_fee = 0.00, processing_days = '2-4 days'
WHERE document_type LIKE '%Units Earned%' OR document_code = 'CUE';

-- Update Course Description
UPDATE document_templates 
SET first_copy_fee = 50.00, additional_copy_fee = 30.00, processing_days = '4-6 days'
WHERE document_type = 'Course Description' OR document_code = 'CD';

-- Update Diploma/Degree Certificate
UPDATE document_templates 
SET first_copy_fee = 200.00, additional_copy_fee = 0.00, processing_days = '13-15 days'
WHERE document_type LIKE '%Diploma%' OR document_code = 'DDC';

-- Update Honorable Dismissal
UPDATE document_templates 
SET first_copy_fee = 100.00, additional_copy_fee = 0.00, processing_days = '4-6 days'
WHERE document_type LIKE '%Honorable Dismissal%' OR document_code = 'HD';

-- Update Transcript of Records
UPDATE document_templates 
SET first_copy_fee = 150.00, additional_copy_fee = 50.00, processing_days = '6-8 days'
WHERE document_type = 'Transcript of Records' OR document_code = 'TOR';

-- Verify the updates
SELECT document_type, first_copy_fee, additional_copy_fee, processing_days 
FROM document_templates 
ORDER BY document_type;
