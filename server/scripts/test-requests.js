const db = require('../config/db');

async function testRequests() {
  console.log('Testing requests...');

  try {
    // Get a student user
    const { data: student, error: studentError } = await db.supabase
      .from('users')
      .select('id')
      .eq('role', 'student')
      .single();

    if (studentError || !student) {
      console.error('No student found');
      return;
    }

    console.log('Found student:', student.id);

    // Get a template
    const { data: template, error: templateError } = await db.supabase
      .from('document_templates')
      .select('id')
      .eq('is_active', true)
      .limit(1)
      .single();

    if (templateError || !template) {
      console.error('No template found');
      return;
    }

    console.log('Found template:', template.id);

    // Create a test request
    const { data: request, error: createError } = await db.supabase
      .from('requests')
      .insert([{
        student_id: student.id,
        template_id: template.id,
        reference_number: `2025-1230-${String(Math.floor(Math.random() * 10000) + 1).padStart(5, '0')}`,
        quantity: 1,
        purpose: 'Test request',
        total_amount: 100.00,
        status: 'Pending Payment'
      }])
      .select()
      .single();

    if (createError) {
      console.error('Error creating request:', createError);
      return;
    }

    console.log('Created test request:', request);

    // Now fetch the requests for this student
    const { data: requests, error: fetchError } = await db.supabase
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
      `)
      .eq('student_id', student.id);

    if (fetchError) {
      console.error('Error fetching requests:', fetchError);
      return;
    }

    console.log('Fetched requests:', requests);
    console.log('Number of requests:', requests.length);

  } catch (error) {
    console.error('Error:', error);
  }
}

testRequests()
  .then(() => {
    console.log('Test completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });
