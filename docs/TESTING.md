# Testing the Admin Template Management System

## Prerequisites
Before testing, make sure you have:
1. ✅ MySQL running (XAMPP or standalone)
2. ✅ Database `smartq_db` created
3. ✅ Schema and seed data imported
4. ✅ Backend server running (`npm start` in server folder)
5. ✅ Frontend served (Live Server or similar on port 5500)

## Quick Setup Commands

### 1. Database Setup
```bash
# Start MySQL (XAMPP users: start from control panel)

# Create database and import data
cd server
.\setup-db.bat
# Or manually:
# mysql -u root -p -e "CREATE DATABASE smartq_db;"
# mysql -u root -p smartq_db < database/schema.sql
# mysql -u root -p smartq_db < database/seed.sql
```

### 2. Start Backend Server
```bash
cd server
npm start
```

You should see:
```
Server running on http://localhost:3000
MySQL connected successfully
```

### 3. Start Frontend
- Install **Live Server** extension in VS Code
- Right-click `landing.html` → "Open with Live Server"
- Or use any static server on port 5500

## Testing the Template Management System

### Step 1: Register Admin Account
1. Navigate to: http://localhost:5500/admin/register.html
2. Fill in the form:
   - First Name: `Test`
   - Last Name: `Admin`
   - Email: `testadmin@cvsu.edu.ph` (must end with @cvsu.edu.ph)
   - Password: `Admin@123` (min 8 characters)
   - Confirm Password: `Admin@123`
   - Admin Secret Code: `CVSU2024ADMIN` (from .env file)
3. Click **Register**
4. You'll be redirected to login page

### Step 2: Login
1. Navigate to: http://localhost:5500/login.html
2. Enter credentials:
   - Email: `testadmin@cvsu.edu.ph`
   - Password: `Admin@123`
3. Click **Login**
4. You should be redirected to: http://localhost:5500/admin/dashboard.html

### Step 3: Access Template Management
1. From the dashboard, click **"Template Management"** card
2. Or navigate directly to: http://localhost:5500/admin/templates.html

### Step 4: Create a Template

#### Prepare a Test PDF
You'll need a PDF file to upload. You can:
- Use any existing PDF (max 10MB)
- Create a simple PDF with form fields (optional for now)
- Download a sample form PDF online

#### Create Template
1. Click **"Create Template"** button
2. Fill in the form:
   - **Document Name**: `Certificate of Grades`
   - **Document Code**: `COG`
   - **Base Price**: `50.00`
   - **Price Per Copy**: `10.00`
   - **Processing Days**: `3`
3. Upload your PDF file (drag & drop or click to browse)
4. Configure fields:
   - **Predefined fields** (pre-checked):
     - ✅ Student Name
     - ✅ Student Number
     - ✅ Program
     - ✅ Purpose
     - ✅ Quantity
   - **Custom fields** (optional):
     - Click "Add Custom Field"
     - Enter field name like `semester`, `school_year`, etc.
5. Click **"Save Template"**

### Step 5: Verify Template Creation
After successful creation, you should see:
- ✅ Success message appears
- ✅ Modal closes
- ✅ New template card appears in the grid
- ✅ Template shows "Active" status badge

### Step 6: Test Template Operations

#### View Template
- Click **"View"** button on any template
- Check the alert showing template details (JSON format)

#### Edit Template
1. Click **"Edit"** button
2. Modify any field (e.g., change processing days to `5`)
3. Optionally upload a new PDF to replace
4. Click **"Save Template"**
5. Verify the version number increments

#### Toggle Status
1. Click **"Deactivate"** button
2. Confirm the action
3. Notice the card becomes grayed out
4. Status badge changes to "Inactive"
5. Click **"Activate"** to re-enable

#### Delete Template
1. Click **"Delete"** button
2. Confirm the action
3. Template disappears from the list
4. ⚠️ **Note**: Cannot delete templates with active requests

### Step 7: Test Search and Filters
1. Create multiple templates with different names
2. Use the search bar to find specific templates
3. Toggle **"Show Active Only"** checkbox
4. Verify pagination appears when you have 10+ templates

## Expected API Responses

### Create Template Success
```json
{
  "success": true,
  "message": "Template created successfully",
  "templateId": 6
}
```

### List Templates Success
```json
{
  "success": true,
  "templates": [
    {
      "id": 1,
      "document_name": "Certificate of Grades",
      "document_code": "COG",
      "base_price": "50.00",
      "price_per_copy": "10.00",
      "processing_days": 3,
      "is_active": true,
      "version": 1,
      "created_at": "2024-12-10T10:30:00.000Z",
      "updated_at": "2024-12-10T10:30:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalItems": 1,
    "itemsPerPage": 9
  }
}
```

### Get Template Details
```json
{
  "success": true,
  "template": {
    "id": 1,
    "document_name": "Certificate of Grades",
    "document_code": "COG",
    "template_file_path": "uploads/templates/1733834400000-abc123.pdf",
    "field_config": {
      "predefined": ["student_name", "student_number", "program", "purpose", "quantity"],
      "custom": ["semester", "school_year"]
    },
    "base_price": "50.00",
    "price_per_copy": "10.00",
    "processing_days": 3,
    "is_active": true,
    "version": 1,
    "created_at": "2024-12-10T10:30:00.000Z",
    "updated_at": "2024-12-10T10:30:00.000Z"
  }
}
```

## Testing Checklist

### Authentication
- [ ] Admin registration works with correct secret code
- [ ] Admin registration fails with wrong secret code
- [ ] Admin registration fails with non-@cvsu.edu.ph email
- [ ] Login redirects admin to dashboard
- [ ] Accessing templates.html without login redirects to login page
- [ ] Logout clears session and redirects to login

### Template CRUD Operations
- [ ] Create template with all fields
- [ ] Create template fails without PDF file
- [ ] Create template fails with invalid field config JSON
- [ ] Create template fails with duplicate document code
- [ ] List templates shows all templates
- [ ] List templates with active_only filter
- [ ] Search templates by name or code
- [ ] Pagination works correctly
- [ ] Get template by ID shows full details
- [ ] Update template modifies fields correctly
- [ ] Update template with new PDF replaces old file
- [ ] Update template increments version number
- [ ] Toggle template status (activate/deactivate)
- [ ] Delete template (soft delete)
- [ ] Cannot delete template with active requests

### File Upload
- [ ] PDF upload works (drag & drop)
- [ ] PDF upload works (file picker)
- [ ] Upload fails for non-PDF files
- [ ] Upload fails for files > 10MB
- [ ] File is saved in uploads/templates/ directory
- [ ] Old file is deleted when updating template

### Field Configuration
- [ ] Predefined fields can be selected/deselected
- [ ] Custom fields can be added
- [ ] Custom fields can be removed
- [ ] Field config is saved as JSON
- [ ] Field config is correctly parsed on edit

### UI/UX
- [ ] Success alerts appear and auto-dismiss
- [ ] Error alerts appear for failed operations
- [ ] Loading state shows while fetching data
- [ ] Empty state shows when no templates
- [ ] Modal opens and closes correctly
- [ ] Form validation works (required fields)
- [ ] Template cards display all information
- [ ] Status badges show correct colors
- [ ] Inactive templates are grayed out

## Common Issues & Solutions

### Issue: "MySQL not connected"
**Solution:** 
- Start MySQL service (XAMPP or Windows Services)
- Check DB_HOST, DB_USER, DB_PASSWORD in `.env`
- Verify database `smartq_db` exists

### Issue: "Token expired" or redirect to login
**Solution:**
- Re-login to get fresh JWT token
- Check JWT_SECRET in `.env` matches
- Clear localStorage and login again

### Issue: "File upload failed"
**Solution:**
- Check file size (must be ≤ 10MB)
- Check file type (must be PDF)
- Verify `uploads/templates/` directory exists and is writable

### Issue: "CORS error" in browser console
**Solution:**
- Backend server must be running on port 3000
- Frontend must be on port 5500 (or update CORS config)

### Issue: Templates not showing after creation
**Solution:**
- Check browser console for errors
- Verify API response in Network tab
- Check if pagination is working correctly

## Next Steps After Template Management

Once template management is working:
1. ✅ **Template Management** - DONE!
2. 🔄 **Student Request Workflow** - NEXT
   - Students can select templates
   - Calculate fees dynamically
   - Generate reference ID
3. 🔄 **Receipt Upload & Tracking**
4. 🔄 **Admin Request Queue & PDF Generation**

## Test Data Available

From `seed.sql` (if imported):
- **5 Document Templates** already created:
  - Transcript of Records (TOR)
  - Certificate of Grades (COG)
  - Certificate of Good Moral (CGM)
  - Certificate of Enrollment (COE)
  - Honorable Dismissal (HD)

- **3 Test Student Accounts**:
  - alellhy.derueda@cvsu.edu.ph / Test@123
  - juan.delacruz@cvsu.edu.ph / Test@123
  - maria.santos@cvsu.edu.ph / Test@123

⚠️ **Remember**: Run `npm run clean-test-data` before production!

## Need Help?

Check these files:
- `SETUP.md` - Initial setup instructions
- `STATUS.md` - Complete project status
- `server/.env.example` - Environment variable template
- Browser DevTools Console - Error messages
- Terminal running `npm start` - Server logs
