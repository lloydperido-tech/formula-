# SmartQ Development Setup Guide

## Prerequisites
1. **MySQL Database** (XAMPP, MySQL Workbench, or standalone MySQL)
2. **Node.js** (version 14 or higher)

## Setup Instructions

### Step 1: Start MySQL
If using XAMPP:
1. Open XAMPP Control Panel
2. Start Apache and MySQL services

### Step 2: Create Database
1. Open phpMyAdmin (http://localhost/phpmyadmin) or MySQL Workbench
2. Create a new database named `smartq_db`
3. Run the schema file: `server/database/schema.sql`
4. Run the seed file: `server/database/seed.sql`

Or use command line:
```bash
# Create database
mysql -u root -p -e "CREATE DATABASE smartq_db;"

# Import schema
mysql -u root -p smartq_db < server/database/schema.sql

# Import test data
mysql -u root -p smartq_db < server/database/seed.sql
```

### Step 3: Configure Environment
1. Update `server/.env` file with your database credentials
2. Update email settings (optional for testing, required for email verification)

### Step 4: Start Backend Server
```bash
cd server
npm start
```
Server will run on http://localhost:3000

### Step 5: Start Frontend
1. Open the project folder in VS Code
2. Install Live Server extension
3. Right-click `landing.html` and select "Open with Live Server"
4. Or use any static file server on port 5500

## Test Accounts (from seed.sql)
**Students:**
- Email: alellhy.derueda@cvsu.edu.ph / Password: Test@123
- Email: juan.delacruz@cvsu.edu.ph / Password: Test@123
- Email: maria.santos@cvsu.edu.ph / Password: Test@123

**Admin:**
- You need to register via: http://localhost:5500/admin/register.html
- Admin Secret Code: CVSU2024ADMIN (from .env file)

## API Endpoints
- POST `/api/auth/register` - Student registration
- POST `/api/auth/register-admin` - Admin registration
- POST `/api/auth/login` - Login
- GET `/api/auth/verify/:token` - Email verification

## File Upload Limits
- Payment Receipts: 5MB (jpg, png, pdf)
- Document Templates: 10MB (pdf only)

## Important Notes
⚠️ **Test data is marked for deletion before production**
- Run `npm run clean-test-data` before deploying

⚠️ **Email verification is disabled for test accounts**
- Test accounts are pre-verified
- New registrations require email verification

⚠️ **Admin Registration**
- Requires secret code: CVSU2024ADMIN
- Only @cvsu.edu.ph emails allowed

## Troubleshooting

### Database Connection Failed
- Ensure MySQL is running
- Check credentials in `.env` file
- Verify database `smartq_db` exists

### Email Not Sending
- Update EMAIL_* variables in `.env`
- For Gmail: Enable "Less secure app access" or use App Password
- For testing: Check console logs (emails are logged)

### Port Already in Use
- Change PORT in `.env` file
- Or stop the process using port 3000

## Next Steps
1. ✅ Authentication system complete
2. 🔄 Admin template management (PRIORITY)
3. 🔄 Student request workflow
4. 🔄 Receipt upload & tracking
5. 🔄 Admin dashboard with PDF generation
