# 🚀 SmartQ - Supabase Quick Start

## Setup in 5 Minutes

### 1. Create Supabase Project (2 min)
1. Go to https://supabase.com → Sign up
2. Click "New Project"
3. Name: `smartq-cvsu`
4. Database Password: (create strong password)
5. Region: Singapore
6. Click "Create"

### 2. Get Your Keys (30 sec)
1. Go to Project Settings → API
2. Copy **Project URL**
3. Copy **service_role key** (secret!)

### 3. Configure Backend (30 sec)
Edit `server/.env`:
```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGc...your-key-here
```

### 4. Create Tables (1 min)
1. Open Supabase Dashboard → SQL Editor
2. Click "New query"
3. Paste contents of `server/database/supabase-schema.sql`
4. Click "Run" (F5)

### 5. Add Test Data (30 sec - Optional)
1. New query in SQL Editor
2. Paste contents of `server/database/supabase-seed.sql`
3. Click "Run"

### 6. Start Server (30 sec)
```bash
cd server
npm start
```

✅ Should see: "Supabase connected successfully"

---

## Test Accounts

**Students** (Password: `Test@123`):
- alellhy.derueda@cvsu.edu.ph
- juan.delacruz@cvsu.edu.ph
- maria.santos@cvsu.edu.ph

**Register Admin**:
- Go to: http://localhost:5500/admin/register.html
- Secret Code: `CVSU2024ADMIN`

---

## Quick Commands

```bash
# Start server
npm start

# Start with auto-reload
npm run dev

# Clean test data (before production)
npm run clean-test-data
```

---

## API Endpoints

### Authentication
```
POST /api/auth/register          - Student registration
POST /api/auth/register-admin    - Admin registration
POST /api/auth/login             - Login
GET  /api/auth/verify/:token     - Email verification
```

### Templates
```
GET  /api/templates/active       - Get active templates (public)
POST /api/templates              - Create template (admin)
GET  /api/templates              - List templates (admin)
GET  /api/templates/:id          - Get template details (admin)
PUT  /api/templates/:id          - Update template (admin)
PATCH /api/templates/:id/status  - Toggle active/inactive (admin)
DELETE /api/templates/:id        - Soft delete (admin)
```

---

## Verify Setup

### Check Tables
1. Supabase Dashboard → Table Editor
2. Should see 8 tables:
   - users
   - document_templates
   - requests
   - payment_receipts
   - notifications
   - request_status_history
   - deletion_log

### Check Test Data
1. Click `users` table
2. Should see 3 students
3. Click `document_templates` table
4. Should see 5 templates

### Test Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alellhy.derueda@cvsu.edu.ph","password":"Test@123"}'
```

Should return JWT token.

---

## Common Issues

❌ **"Invalid API key"**  
✅ Use **service_role** key, not anon key

❌ **"relation 'users' does not exist"**  
✅ Run `supabase-schema.sql` in SQL Editor

❌ **"Connection failed"**  
✅ Check SUPABASE_URL in .env

❌ **"Password doesn't match"**  
✅ Test password is `Test@123`

---

## Next Steps

After setup works:
1. ✅ Test authentication (register, login)
2. ✅ Test template management
3. 🔄 Continue with student request workflow
4. 🔄 Add receipt upload
5. 🔄 Build admin dashboard

---

## Full Documentation

- `SUPABASE_SETUP.md` - Detailed setup guide
- `SUPABASE_MIGRATION.md` - What changed from MySQL
- `TESTING.md` - Complete testing guide

---

**Need Help?**
- Supabase Docs: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com
