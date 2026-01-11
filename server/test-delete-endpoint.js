const db = require('./config/db');

async function testGetAdminToken() {
  try {
    // First, get an admin user
    const { data: adminUser, error: userError } = await db.supabase
      .from('users')
      .select('id, email')
      .eq('role', 'admin')
      .single();
    
    if (userError || !adminUser) {
      console.error('Error getting admin user:', userError);
      return;
    }
    
    console.log('Admin user:', adminUser.email);
    
    // Generate a test JWT token
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { id: adminUser.id, email: adminUser.email, role: 'admin' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '24h' }
    );
    
    console.log('Test JWT token:', token.substring(0, 50) + '...');
    
    // Now let's get a request with a receipt
    const { data: receipts, error: receiptError } = await db.supabase
      .from('payment_receipts')
      .select('request_id')
      .limit(1);
    
    if (receiptError || !receipts || receipts.length === 0) {
      console.error('No receipts found');
      return;
    }
    
    const requestId = receipts[0].request_id;
    console.log('\nTest requestId:', requestId);
    
    // Make the HTTP request
    const http = require('http');
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: `/api/receipts/${requestId}/receipt`,
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
    
    console.log('\nMaking DELETE request to:', `http://localhost:3000/api/receipts/${requestId}/receipt`);
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('\nResponse status:', res.statusCode);
        console.log('Response body:', data);
        process.exit(0);
      });
    });
    
    req.on('error', (e) => {
      console.error('Request error:', e);
      process.exit(1);
    });
    
    req.write(JSON.stringify({ reason: 'Test deletion' }));
    req.end();
    
  } catch (error) {
    console.error('Test error:', error);
    process.exit(1);
  }
}

// Wait a bit for the server to be ready
setTimeout(testGetAdminToken, 1000);
