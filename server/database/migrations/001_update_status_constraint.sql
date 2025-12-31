-- Migration: Update request status check constraint
-- This script updates the CHECK constraint on the requests table to use new status names

-- Step 1: Drop the old constraint
ALTER TABLE requests 
DROP CONSTRAINT IF EXISTS requests_status_check;

-- Step 2: Add the new constraint with updated status values
ALTER TABLE requests 
ADD CONSTRAINT requests_status_check 
CHECK (status IN ('Requested', 'Verifying', 'Processing', 'For Release', 'Completed', 'Cancelled'));

-- Migration complete
-- The requests table now accepts the new status names: Requested, Verifying, Processing, For Release, Completed, Cancelled
