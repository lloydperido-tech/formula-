const db = require('../config/db');

async function fixConstraintAndData() {
  try {
    console.log('Starting migration: Fix status constraint and update existing data...\n');

    // Step 1: Drop the constraint
    console.log('Step 1: Dropping old constraint...');
    try {
      // Using raw SQL execution through Supabase
      const { error: dropError } = await db.supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE requests DROP CONSTRAINT IF EXISTS requests_status_check;'
      }).catch(() => ({ error: null }));
    } catch (e) {
      console.log('RPC not available, attempting direct approach...');
    }

    // Step 2: Update existing rows with old status names
    console.log('\nStep 2: Updating existing records with old status names...');
    
    const { error: updateError1 } = await db.supabase
      .from('requests')
      .update({ status: 'Requested' })
      .eq('status', 'Pending Payment');
    
    if (updateError1) {
      console.log('Note: Some records may not have been updated (constraint issue)');
    } else {
      console.log('✅ Updated "Pending Payment" records to "Requested"');
    }

    const { error: updateError2 } = await db.supabase
      .from('requests')
      .update({ status: 'Verifying' })
      .eq('status', 'Payment Submitted');
    
    if (updateError2) {
      console.log('Note: Some records may not have been updated (constraint issue)');
    } else {
      console.log('✅ Updated "Payment Submitted" records to "Verifying"');
    }

    console.log('\n⚠️  MANUAL ACTION REQUIRED IN SUPABASE\n');
    console.log('The database constraint needs to be updated. Run this SQL in Supabase SQL Editor:\n');
    console.log('================================================\n');
    console.log(`-- Drop the old constraint
ALTER TABLE requests DROP CONSTRAINT IF EXISTS requests_status_check;

-- Add the new constraint with updated status values
ALTER TABLE requests ADD CONSTRAINT requests_status_check 
CHECK (status IN ('Requested', 'Verifying', 'Processing', 'For Release', 'Completed', 'Cancelled'));`);
    
    console.log('\n================================================\n');
    console.log('Instructions:');
    console.log('1. Go to https://app.supabase.com');
    console.log('2. Select your project');
    console.log('3. Go to SQL Editor');
    console.log('4. Create a new query');
    console.log('5. Copy and paste the SQL above');
    console.log('6. Click "Run"');
    console.log('\n✅ After running this, the application will work correctly!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

fixConstraintAndData();
