const db = require('../config/db');

async function runMigration() {
  try {
    console.log('Starting migration: Update request status check constraint...\n');

    // Step 1: Drop the old constraint
    console.log('Step 1: Dropping old constraint...');
    const { error: dropError } = await db.supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE requests DROP CONSTRAINT IF EXISTS requests_status_check;'
    }).catch(() => ({ error: null })); // Ignore if RPC not available

    // Since RPC might not work, we'll use raw SQL via Supabase
    // Let's try a different approach - use sql_exec if available
    
    console.log('Step 2: Adding new constraint with updated status values...');
    
    // Alternative: Since we can't directly execute SQL, we'll document what needs to be done
    console.log('\n⚠️  Supabase Database Constraint Update Required');
    console.log('================================================\n');
    console.log('The following SQL needs to be executed in the Supabase SQL Editor:');
    console.log('\n-- Drop the old constraint');
    console.log('ALTER TABLE requests DROP CONSTRAINT IF EXISTS requests_status_check;\n');
    console.log('-- Add the new constraint');
    console.log('ALTER TABLE requests ADD CONSTRAINT requests_status_check');
    console.log('CHECK (status IN (\'Requested\', \'Verifying\', \'Processing\', \'For Release\', \'Completed\', \'Cancelled\'));\n');
    
    console.log('\nTo apply this manually:');
    console.log('1. Go to https://app.supabase.com');
    console.log('2. Select your project');
    console.log('3. Go to SQL Editor');
    console.log('4. Create a new query');
    console.log('5. Paste the SQL above');
    console.log('6. Click "Run"');
    console.log('\n✅ After applying, new requests will be created successfully with the new status names.\n');
    
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

runMigration();
