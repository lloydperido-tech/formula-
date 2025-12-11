
// Temporary in-memory mock database
const mockUsers = [
  { id: 1, email: 'admin@cvsu.edu.ph', role: 'admin', first_name: 'Admin', last_name: 'User' },
  { id: 2, email: 'student@cvsu.edu.ph', role: 'student', first_name: 'Student', last_name: 'User' }
];

const supabase = {
  from: (table) => ({
    select: () => ({
      limit: () => ({
        data: mockUsers,
        error: null
      })
    }),
    eq: (field, value) => ({
      single: () => ({
        data: mockUsers.find(u => u[field] === value),
        error: null
      })
    })
  })
};

const testConnection = async () => {
  console.log('✅ Mock Supabase connected successfully');
  return true;
};

const db = {
  supabase,
  testConnection
};

module.exports = db;
