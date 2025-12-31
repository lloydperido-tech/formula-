const db = require('./config/db');

(async () => {
  try {
    console.log('Updating request statuses...\n');

    // Update Pending Payment to Requested
    const { error: e1 } = await db.supabase
      .from('requests')
      .update({ status: 'Requested' })
      .eq('status', 'Pending Payment');
    
    if (e1) {
      console.log('Error updating Pending Payment:', e1);
    } else {
      console.log('✅ Updated "Pending Payment" → "Requested"');
    }

    // Update Payment Submitted to Verifying
    const { error: e2 } = await db.supabase
      .from('requests')
      .update({ status: 'Verifying' })
      .eq('status', 'Payment Submitted');
    
    if (e2) {
      console.log('Error updating Payment Submitted:', e2);
    } else {
      console.log('✅ Updated "Payment Submitted" → "Verifying"');
    }

    console.log('\n✅ Database statuses updated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
