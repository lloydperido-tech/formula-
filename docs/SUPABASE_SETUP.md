# Supabase Migration Guide for SmartQ

## What Changed?
- ✅ Migrated from MySQL to **Supabase (PostgreSQL)**
- ✅ Updated all database queries to use Supabase JS Client
- ✅ Converted schema from MySQL to PostgreSQL syntax
- ✅ Updated authentication controller
- ✅ Updated auth middleware
- ✅ Template controller ready for Supabase

## Benefits of Supabase
- 🚀 **Cloud-hosted** - No local MySQL setup needed
- 🔐 **Built-in authentication** (we're using custom auth for now)
- 📦 **Free tier** - Perfect for development and small projects
- 🌐 **Automatic API** - REST and Realtime APIs
- 💾 **PostgreSQL** - More powerful than MySQL
- 📊 **Dashboard** - Visual database management
- 🔒 **Row Level Security** - Built-in security policies

---

## Setup Instructions

### Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click **"Start your project"** and sign up (free)
3. Click **"New Project"**
4. Fill in project details:
   - **Name**: `smartq-cvsu`
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to Philippines (Singapore recommended)
5. Click **"Create new project"**
6. Wait 2-3 minutes for project to be ready

### Step 2: Get Your Credentials

Once project is ready:

1. Go to **Project Settings** (gear icon in sidebar)
2. Click **"API"** section
3. You'll see:
   - **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
   - **anon/public key**: `eyJhbGc...` (for frontend - not used yet)
   - **service_role key**: `eyJhbGc...` (for backend - **keep secret!**)

### Step 3: Configure Backend

1. Open `server/.env` file
2. Update with your Supabase credentials:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key-here
SUPABASE_ANON_KEY=your-anon-key-here

# JWT Configuration (keep existing)
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_12345
JWT_EXPIRES_IN=7d

# Admin Configuration (keep existing)
ADMIN_SECRET_CODE=CVSU2024ADMIN

# Email Configuration (keep existing)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=CvSU Document Request System <your-email@gmail.com>

# Server Configuration (keep existing)
PORT=3000
NODE_ENV=development

# Frontend URL (keep existing)
FRONTEND_URL=http://localhost:5500
```

### Step 4: Create Database Tables

1. In Supabase Dashboard, click **"SQL Editor"** in sidebar
2. Click **"New query"**
3. Copy entire contents of `server/database/supabase-schema.sql`
4. Paste into SQL Editor
5. Click **"Run"** button (or press F5)
6. Wait for success message: "Success. No rows returned"

**What this creates:**
- ✅ 8 tables (users, document_templates, requests, etc.)
- ✅ Indexes for performance
- ✅ Triggers for auto-updating timestamps
- ✅ Row Level Security policies

### Step 5: Add Test Data (Optional)

1. In SQL Editor, click **"New query"**
2. Copy contents of `server/database/supabase-seed.sql`
3. Paste and click **"Run"**
4. This adds:
   - 3 test students (password: `Test@123`)
   - 5 document templates

**Test Accounts:**
- Email: `alellhy.derueda@cvsu.edu.ph` / Password: `Test@123`
- Email: `juan.delacruz@cvsu.edu.ph` / Password: `Test@123`
- Email: `maria.santos@cvsu.edu.ph` / Password: `Test@123`

### Step 6: Verify Tables

1. Click **"Table Editor"** in Supabase sidebar
2. You should see all 8 tables listed
3. Click on `users` table - you should see 3 test students
4. Click on `document_templates` - you should see 5 templates

### Step 7: Install Dependencies & Start Server

```bash
# Make sure you're in server directory
cd server

# Install Supabase client (if not already done)
npm install

# Start server
npm start
```

You should see:
```
Server running on http://localhost:3000
✅ Supabase connected successfully
```

---

## Testing Authentication

### Test 1: Register New Student

```bash
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "email": "test.student@cvsu.edu.ph",
  "password": "Test@12345",
  "firstName": "Test",
  "lastName": "Student",
  "studentNumber": "202099999",
  "program": "BS Computer Science",
  "address": "Test Address",
  "contactNumber": "09171234567"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Registration successful! Please check your email to verify your account."
}
```

**Check in Supabase:**
1. Go to Table Editor → users
2. You should see new row with email `test.student@cvsu.edu.ph`
3. Note the `verification_token` and `is_verified = false`

### Test 2: Login with Test Account

```bash
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "alellhy.derueda@cvsu.edu.ph",
  "password": "Test@123"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-here",
    "email": "alellhy.derueda@cvsu.edu.ph",
    "role": "student",
    "first_name": "Alellhy",
    "last_name": "De Rueda"
  }
}
```

### Test 3: Register Admin

1. Open browser: http://localhost:5500/admin/register.html
2. Fill form:
   - First Name: Admin
   - Last Name: User
   - Email: admin@cvsu.edu.ph
   - Password: Admin@123
   - Admin Code: `CVSU2024ADMIN`
3. Click Register
4. Should redirect to login

### Test 4: Access Templates

```bash
GET http://localhost:3000/api/templates/active
```

**Expected Response:**
```json
{
  "success": true,
  "templates": [
    {
      "id": "uuid",
      "document_name": "Certificate of Enrollment",
      "document_code": "COE",
      "base_price": "30.00",
      "price_per_copy": "0.00",
      "processing_days": 1
    },
    ...
  ]
}
```

---

## Supabase Dashboard Features

### Table Editor
- View and edit data visually
- Add/delete rows manually
- Filter and search records
- Export data as CSV

### SQL Editor
- Run custom SQL queries
- Save queries for reuse
- View query history

### Authentication (Not used yet, but available)
- Built-in user management
- Social login providers
- Magic links
- JWT tokens

### Storage (For future file uploads)
- Can replace local `uploads/` folder
- Store PDFs, receipts, documents
- Automatic CDN
- Image transformations

### Database
- View all tables
- Check indexes
- Monitor performance
- Backup and restore

### Logs
- View all database queries
- Track API requests
- Monitor errors

---

## File Storage Migration (Next Steps)

Currently files are stored locally in `uploads/` folder. To migrate to Supabase Storage:

### Create Storage Buckets

1. In Supabase Dashboard, click **"Storage"**
2. Click **"New bucket"**
3. Create 3 buckets:
   - `templates` - For document template PDFs
   - `receipts` - For payment receipt uploads
   - `documents` - For generated documents

### Update Upload Middleware

Replace local file storage with Supabase storage:

```javascript
// Instead of multer local storage
const { data, error } = await supabase.storage
  .from('receipts')
  .upload(`${userId}/${Date.now()}-${file.originalname}`, file.buffer);
```

---

## Common Issues & Solutions

### Issue: "Invalid API key"
**Solution:** 
- Double-check SUPABASE_SERVICE_KEY in .env
- Make sure you copied the **service_role** key, not anon key
- No extra spaces or quotes in .env

### Issue: "relation 'users' does not exist"
**Solution:**
- Run supabase-schema.sql in SQL Editor
- Check Table Editor to verify tables exist
- Make sure query ran without errors

### Issue: "Cannot read property 'supabase' of undefined"
**Solution:**
- Restart server after updating .env
- Check that @supabase/supabase-js is installed
- Verify db.js exports supabase client

### Issue: "Row Level Security" errors
**Solution:**
- We're using service_role key which bypasses RLS
- If you see RLS errors, check you're using SERVICE_KEY not ANON_KEY

### Issue: "Password hash doesn't match"
**Solution:**
- Test data uses bcrypt hash for "Test@123"
- When registering new users, password is hashed automatically
- Don't try to login with unhashed passwords

---

## Differences from MySQL

### UUID vs Auto-Increment IDs
- **MySQL**: `id INT AUTO_INCREMENT`
- **Supabase**: `id UUID DEFAULT uuid_generate_v4()`
- **Impact**: IDs are now strings like `"550e8400-e29b-41d4-a716-446655440000"`

### Timestamp Columns
- **MySQL**: `DATETIME`, `TIMESTAMP`
- **Supabase**: `TIMESTAMP WITH TIME ZONE`
- **Impact**: Better timezone handling, use `NOW()` for current time

### JSON Columns
- **MySQL**: `JSON`
- **Supabase**: `JSONB` (binary JSON, faster)
- **Impact**: Better performance, more query options

### Boolean Type
- **MySQL**: `TINYINT(1)` or `BOOLEAN` (stored as 0/1)
- **Supabase**: Native `BOOLEAN` type
- **Impact**: Use `true`/`false` instead of 1/0

### Query Syntax
- **MySQL**: `pool.execute('SELECT * FROM users WHERE id = ?', [id])`
- **Supabase**: `supabase.from('users').select('*').eq('id', id).single()`
- **Impact**: No more raw SQL (mostly), use ORM methods

---

## Production Checklist

Before deploying to production:

- [ ] Change JWT_SECRET to random 64+ character string
- [ ] Change ADMIN_SECRET_CODE to random string
- [ ] Delete all test data
- [ ] Remove seed SQL files from deployment
- [ ] Set up Supabase production project (separate from development)
- [ ] Configure email service (SendGrid, AWS SES, etc.)
- [ ] Enable Supabase database backups
- [ ] Set up Supabase storage buckets with proper policies
- [ ] Configure CORS for production domain
- [ ] Set NODE_ENV=production
- [ ] Monitor Supabase usage and upgrade plan if needed

---

## Next Steps

Now that Supabase is set up:

1. ✅ Test authentication (register, login, verify)
2. ✅ Test template management
3. 🔄 Continue with student request workflow
4. 🔄 Add receipt upload and tracking
5. 🔄 Build admin dashboard features

---

## Need Help?

- **Supabase Docs**: https://supabase.com/docs
- **Supabase Discord**: https://discord.supabase.com
- **PostgreSQL Docs**: https://www.postgresql.org/docs/

Happy coding! 🚀
