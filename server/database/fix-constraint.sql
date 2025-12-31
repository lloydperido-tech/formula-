-- Fix: Update status constraint with data migration
-- This script handles both updating existing data and the constraint

-- Step 1: First, drop the constraint
ALTER TABLE requests DROP CONSTRAINT IF EXISTS requests_status_check;

-- Step 2: Update all existing rows with old status names to new ones
UPDATE requests SET status = 'Requested' WHERE status = 'Pending Payment';
UPDATE requests SET status = 'Verifying' WHERE status = 'Payment Submitted';

-- Step 3: Add the new constraint
ALTER TABLE requests ADD CONSTRAINT requests_status_check 
CHECK (status IN ('Requested', 'Verifying', 'Processing', 'For Release', 'Completed', 'Cancelled'));

-- Done! All existing records have been migrated and the new constraint is in place.
