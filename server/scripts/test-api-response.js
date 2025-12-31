const db = require('../config/db');

async function testAPIResponse() {
  console.log('Testing API response format...');

  try {
    const studentId = '89e23226-1cc8-48d9-a738-5afa929bed47';

    const { data: requests, error, count } = await db.supabase
      .from('requests')
      .select(`
        id,
        reference_number,
        status,
        total_amount,
        quantity,
        purpose,
        created_at,
        updated_at,
        document_templates (
          id,
          document_name,
          document_code,
          processing_days
        )
      `, { count: 'exact' })
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    console.log('Error:', error);
    console.log('Count:', count);
    console.log('Requests:', JSON.stringify(requests, null, 2));

  } catch (error) {
    console.error('Error:', error);
  }
}

testAPIResponse()
  .then(() => {
    console.log('Test completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });
