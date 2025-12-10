/**
 * ⚠️⚠️⚠️ PRODUCTION CLEANUP SCRIPT ⚠️⚠️⚠️
 * 
 * This script removes ALL test data from the database
 * RUN THIS BEFORE PRODUCTION LAUNCH
 * 
 * Usage: npm run clean-test-data
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

const cleanTestData = async () => {
  let connection;
  
  try {
    console.log('\n⚠️  CLEANING TEST DATA FROM DATABASE ⚠️\n');
    
    // Connect to database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'smartq_db',
      port: process.env.DB_PORT || 3306
    });

    console.log('✅ Connected to database');

    // Get counts before deletion
    const [studentCount] = await connection.execute(
      'SELECT COUNT(*) as count FROM users WHERE role = "student"'
    );
    const [requestCount] = await connection.execute(
      'SELECT COUNT(*) as count FROM requests'
    );

    console.log(`\n📊 Current data:`);
    console.log(`   - Test students: ${studentCount[0].count}`);
    console.log(`   - Test requests: ${requestCount[0].count}`);

    // Confirm deletion
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    readline.question('\n⚠️  Delete all test data? (yes/no): ', async (answer) => {
      if (answer.toLowerCase() === 'yes') {
        // Delete in correct order (due to foreign keys)
        await connection.execute('DELETE FROM request_status_history');
        await connection.execute('DELETE FROM payment_receipts');
        await connection.execute('DELETE FROM notifications');
        await connection.execute('DELETE FROM requests');
        await connection.execute('DELETE FROM users WHERE role = "student"');
        await connection.execute('DELETE FROM document_templates');

        console.log('\n✅ Test data cleaned successfully!');
        console.log('\n📝 Next steps:');
        console.log('   1. Delete server/database/seed.sql file');
        console.log('   2. Change ADMIN_SECRET_CODE in .env');
        console.log('   3. Review and remove console.log statements');
        console.log('   4. Test with real CvSU email addresses\n');
      } else {
        console.log('\n❌ Cleanup cancelled');
      }

      readline.close();
      if (connection) await connection.end();
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Error cleaning test data:', error.message);
    if (connection) await connection.end();
    process.exit(1);
  }
};

cleanTestData();
