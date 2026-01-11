const { supabase } = require('../config/db');
require('dotenv').config();

async function deleteAllRequests() {
  try {
    console.log('🔄 Starting deletion of all requests...');

    // Delete all requests
    const { data, error } = await supabase
      .from('requests')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all by using a condition that matches everything

    if (error) {
      console.error('❌ Error deleting requests:', error);
      return;
    }

    console.log('✅ Successfully deleted all requests from the database');
    console.log(`📊 Deletion complete`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    process.exit(1);
  }
}

deleteAllRequests();
