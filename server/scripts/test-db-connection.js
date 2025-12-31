const db = require('../config/db');

async function testDatabase() {
  try {
    console.log('Testing database connection...\n');

    // Test 1: Check if we can query users table
    console.log('Test 1: Querying all users...');
    const { data: allUsers, error: error1 } = await db.supabase
      .from('users')
      .select('email, role');
    
    if (error1) {
      console.error('❌ Error querying users:', error1);
    } else {
      console.log('✅ Found users:', allUsers.length);
      console.log('Users:', allUsers);
    }

    // Test 2: Query specific student account
    console.log('\nTest 2: Querying student@cvsu.edu.ph...');
    const { data: student, error: error2 } = await db.supabase
      .from('users')
      .select('*')
      .eq('email', 'student@cvsu.edu.ph')
      .single();
    
    if (error2) {
      console.error('❌ Error:', error2);
    } else {
      console.log('✅ Found student:', student.email, student.role);
    }

    // Test 3: Check RLS policies
    console.log('\nTest 3: Checking connection info...');
    console.log('Using Service Role Key:', process.env.SUPABASE_SERVICE_KEY.substring(0, 20) + '...');
    console.log('Supabase URL:', process.env.SUPABASE_URL);

    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

testDatabase();
