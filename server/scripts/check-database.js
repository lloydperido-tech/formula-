const db = require('../config/db');

async function checkDatabase() {
  console.log('Checking database...');

  try {
    // Check users
    const { data: users, error: usersError } = await db.supabase
      .from('users')
      .select('id, email, role');

    console.log('Users:', users);
    if (usersError) console.error('Users error:', usersError);

    // Check templates
    const { data: templates, error: templatesError } = await db.supabase
      .from('document_templates')
      .select('id, document_name, document_code');

    console.log('Templates:', templates);
    if (templatesError) console.error('Templates error:', templatesError);

    // Check requests
    const { data: requests, error: requestsError } = await db.supabase
      .from('requests')
      .select('*');

    console.log('Requests:', requests);
    console.log('Request count:', requests?.length);
    if (requestsError) console.error('Requests error:', requestsError);

  } catch (error) {
    console.error('Error:', error);
  }
}

checkDatabase()
  .then(() => {
    console.log('Check completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('Check failed:', error);
    process.exit(1);
  });
