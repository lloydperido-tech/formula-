-- Migration: Change processing_days from integer to text to support ranges like "4-6"
-- Run this in your Supabase SQL Editor

ALTER TABLE document_templates 
ALTER COLUMN processing_days TYPE TEXT;

-- Update existing data with ranges based on original requirements
UPDATE document_templates 
SET processing_days = '1-2' 
WHERE document_name IN ('Certificate of Registration', 'Certificate of Grades', 'Certificate of Enrollment');

UPDATE document_templates 
SET processing_days = '4-7' 
WHERE document_name IN ('Certificate of Graduation', 'Certificate of GWA', 'Certificate of English as Medium of Instruction');

UPDATE document_templates 
SET processing_days = '4-20' 
WHERE document_name IN ('Transcript of Records', 'Honorable Dismissal', 'Transcript of Records - For Board Examination');
