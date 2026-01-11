const bcrypt = require('bcrypt');
const db = require('../config/db');

async function createDemoAccounts() {
  try {
    console.log('Creating demo accounts...');

    // Hash passwords
    const studentPasswordHash = await bcrypt.hash('StudentPass123', 10);
    const student2PasswordHash = await bcrypt.hash('StudentPass123', 10);
    const adminPasswordHash = await bcrypt.hash('AdminPass123', 10);

    // Create student account
    const { data: student, error: studentError } = await db.supabase
      .from('users')
      .upsert([{
        email: 'student@cvsu.edu.ph',
        password: studentPasswordHash,
        role: 'student',
        first_name: 'Demo',
        middle_name: 'Test',
        last_name: 'Student',
        student_number: '202100001',
        program: 'BS Computer Science',
        address: '123 Demo Street, Indang, Cavite',
        contact_number: '09123456789',
        is_verified: true
      }], {
        onConflict: 'email'
      })
      .select();

    if (studentError) {
      console.error('Error creating student:', studentError);
    } else {
      console.log('✅ Student account created: student@cvsu.edu.ph / StudentPass123');
    }

    // Create student2 account
    const { data: student2, error: student2Error } = await db.supabase
      .from('users')
      .upsert([{
        email: 'student2@cvsu.edu.ph',
        password: student2PasswordHash,
        role: 'student',
        first_name: 'Student',
        middle_name: 'Test',
        last_name: '2',
        student_number: '202100002',
        program: 'BS Information Technology',
        address: '456 Test Avenue, Indang, Cavite',
        contact_number: '09123456790',
        is_verified: true
      }], {
        onConflict: 'email'
      })
      .select();

    if (student2Error) {
      console.error('Error creating student2:', student2Error);
    } else {
      console.log('✅ Student2 account created: student2@cvsu.edu.ph / StudentPass123');
    }

    // Create admin account
    const { data: admin, error: adminError } = await db.supabase
      .from('users')
      .upsert([{
        email: 'admin@cvsu.edu.ph',
        password: adminPasswordHash,
        role: 'admin',
        first_name: 'Demo',
        middle_name: null,
        last_name: 'Admin',
        student_number: null,
        program: null,
        address: null,
        contact_number: '09123456788',
        is_verified: true
      }], {
        onConflict: 'email'
      })
      .select();

    if (adminError) {
      console.error('Error creating admin:', adminError);
    } else {
      console.log('✅ Admin account created: admin@cvsu.edu.ph / AdminPass123');
    }

    console.log('\n📋 Demo Accounts Created:');
    console.log('Student: student@cvsu.edu.ph / StudentPass123');
    console.log('Student2: student2@cvsu.edu.ph / StudentPass123');
    console.log('Admin: admin@cvsu.edu.ph / AdminPass123 + secret code: DRS-ADMIN-2025');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating demo accounts:', error);
    process.exit(1);
  }
}

createDemoAccounts();
