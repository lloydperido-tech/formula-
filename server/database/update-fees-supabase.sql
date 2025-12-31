-- Update Document Templates to match s_fees.html fee schedule
-- For Supabase PostgreSQL

-- Update Certificate of Enrollment
UPDATE document_templates 
SET base_price = 30.00, price_per_copy = 0.00, processing_days = 1
WHERE document_name ILIKE 'Certificate of Enrollment' OR document_code = 'COE';

-- Update Certificate of Good Moral
UPDATE document_templates 
SET base_price = 50.00, price_per_copy = 0.00, processing_days = 2
WHERE document_name ILIKE '%Good Moral%' OR document_code = 'CGM';

-- Update Certificate of Grades
UPDATE document_templates 
SET base_price = 50.00, price_per_copy = 10.00, processing_days = 2
WHERE document_name ILIKE 'Certificate of Grades' OR document_code = 'COG';

-- Update Certificate of Registration
UPDATE document_templates 
SET base_price = 30.00, price_per_copy = 0.00, processing_days = 1
WHERE document_name ILIKE 'Certificate of Registration' OR document_code = 'COR';

-- Update Certification of Units Earned
UPDATE document_templates 
SET base_price = 50.00, price_per_copy = 0.00, processing_days = 2
WHERE document_name ILIKE 'Certification of Units%' OR document_code = 'CUE';

-- Update Course Description
UPDATE document_templates 
SET base_price = 50.00, price_per_copy = 30.00, processing_days = 4
WHERE document_name ILIKE 'Course Description' OR document_code = 'CD';

-- Update Diploma/Degree Certificate
UPDATE document_templates 
SET base_price = 200.00, price_per_copy = 0.00, processing_days = 13
WHERE document_name ILIKE 'Diploma%' OR document_code = 'DDC';

-- Update Honorable Dismissal
UPDATE document_templates 
SET base_price = 100.00, price_per_copy = 0.00, processing_days = 4
WHERE document_name ILIKE 'Honorable Dismissal%' OR document_code = 'HD';

-- Update Transcript of Records
UPDATE document_templates 
SET base_price = 150.00, price_per_copy = 50.00, processing_days = 6
WHERE document_name ILIKE 'Transcript of Records' OR document_code = 'TOR';

-- Verify updates
SELECT id, document_name, document_code, base_price, price_per_copy, processing_days
FROM document_templates
WHERE is_deleted = false AND is_active = true
ORDER BY document_name;
