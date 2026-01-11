const db = require('./config/db');

async function testDeleteReceipt() {
  try {
    console.log('Testing receipt deletion...\n');
    
    // Get all requests with receipts
    const { data: requestsWithReceipts, error: fetchError } = await db.supabase
      .from('payment_receipts')
      .select('request_id, file_path, id');
    
    if (fetchError) {
      console.error('Error fetching receipts:', fetchError);
      return;
    }
    
    console.log('Found receipts:', requestsWithReceipts);
    
    if (requestsWithReceipts && requestsWithReceipts.length > 0) {
      const receipt = requestsWithReceipts[0];
      console.log('\nTesting delete with first receipt:', receipt);
      console.log('Request ID:', receipt.request_id);
      console.log('Request ID type:', typeof receipt.request_id);
      
      // Try to delete
      const { error: deleteError, data: deleteData } = await db.supabase
        .from('payment_receipts')
        .delete()
        .eq('request_id', receipt.request_id);
      
      console.log('\nDelete result:', { deleteError, deleteData });
      
      if (!deleteError) {
        console.log('✅ Delete succeeded!');
      } else {
        console.log('❌ Delete failed:', deleteError);
      }
    } else {
      console.log('No receipts found in database');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Test error:', error);
    process.exit(1);
  }
}

testDeleteReceipt();
