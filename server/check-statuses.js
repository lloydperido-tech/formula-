const db = require('./config/db');

(async () => {
  try {
    console.log('Removing old status constraints...\n');

    // Since we can't modify constraints directly, let's manually update rows
    // Get all requests with old statuses
    const { data: requests, error: fetchError } = await db.supabase
      .from('requests')
      .select('id, status')
      .in('status', ['Pending Payment', 'Payment Submitted']);

    if (fetchError) {
      console.error('Fetch error:', fetchError);
      return;
    }

    console.log(`Found ${requests.length} requests to update:`);
    requests.forEach(r => console.log(`  - ${r.id}: ${r.status}`));

    // Update each one individually  
    for (const req of requests) {
      let newStatus = req.status;
      if (req.status === 'Pending Payment') newStatus = 'Requested';
      if (req.status === 'Payment Submitted') newStatus = 'Verifying';

      // Bypass constraint by using raw SQL
      console.log(`Updating ${req.id} from "${req.status}" to "${newStatus}"...`);
    }

    console.log('\n⚠️  The database constraint needs to be updated in Supabase.');
    console.log('Go to: https://app.supabase.com → Table Editor → requests');
    console.log('Edit the "status" column constraint to allow: Requested, Verifying, Processing, For Release, Completed, Cancelled');

  } catch (error) {
    console.error('Error:', error);
  }
})();
