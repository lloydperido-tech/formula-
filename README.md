# 📖 CvSU Document Request System

## 🚀 Quick Start

A modern, full-stack web application for managing academic document requests at Cavite State University with role-based authentication, real-time tracking, and payment verification.

## 📁 Project Structure

```
cvsu-document-request-system/
├── public/                  # Frontend assets
│   ├── css/                # Stylesheets
│   ├── js/                 # Client-side JavaScript
│   └── assets/             # Images, icons, logos
├── server/                  # Backend application
│   ├── config/             # Configuration files
│   ├── controllers/        # Request handlers
│   ├── routes/             # API routes
│   ├── middleware/         # Authentication & validation
│   └── database/           # Database migrations
├── docs/                    # Documentation
│   ├── API_DOCUMENTATION.md
│   ├── STUDENT_WORKFLOW.md
│   ├── INTEGRATION_GUIDE.md
│   └── SETUP.md
├── *.html                   # Frontend pages
└── README.md
```

## 📚 Documentation

### Essential Guides

1. **[docs/PHASE5_QUICK_START.md](./docs/PHASE5_QUICK_START.md)** ⭐ START HERE
   - Quick setup and deployment
   - Environment configuration
   - Running the application

2. **[docs/STUDENT_WORKFLOW.md](./docs/STUDENT_WORKFLOW.md)**
   - Complete student request workflow
   - Database schema explanation
   - Admin workflow guide
   - Testing procedures

3. **[docs/API_DOCUMENTATION.md](./docs/API_DOCUMENTATION.md)**
   - All endpoint specifications
   - Request/response formats
   - Authentication details
   - cURL examples

4. **[docs/INTEGRATION_GUIDE.md](./docs/INTEGRATION_GUIDE.md)**
   - Component overview
   - Integration patterns

## 🌟 Features

### Student Portal
- ✅ Document request submission
- ✅ Real-time request tracking
- ✅ Payment status monitoring
- ✅ Receipt upload
- ✅ Document fee reference
- ✅ User profile management

### Admin Dashboard
- ✅ Request queue management
- ✅ Receipt verification
- ✅ Status updates
- ✅ Statistics overview
- ✅ Document template management

## 🛠️ Tech Stack

**Frontend:**
- HTML5, CSS3, JavaScript (Vanilla)
- Font Awesome 6.5.2
- Responsive design

**Backend:**
- Node.js + Express.js
- Supabase (PostgreSQL)
- JWT Authentication
- Multer (File uploads)

## 📦 Installation

1. **Clone the repository**
```bash
git clone https://github.com/Niiflheim01/cvsu-document-request-system.git
cd cvsu-document-request-system
```

2. **Install dependencies**
```bash
cd server
npm install
```

3. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your Supabase credentials
```

4. **Start the server**
```bash
npm start
# Server runs on http://localhost:3001
```

5. **Open the application**
- Navigate to `http://localhost:3001` or open `index.html`
- Demo credentials in [docs/PHASE5_QUICK_START.md](./docs/PHASE5_QUICK_START.md)

## 📄 Pages

- `index.html` - Entry point (redirects to landing)
- `landing.html` - Homepage
- `login.html` - Authentication
- `register.html` - User registration
- `s_dashboard.html` - Student dashboard
- `s_request.html` - Document request form
- `s_track.html` - Request tracking
- `s_fees.html` - Fee reference
- `s_profile.html` - User profile
- `admin_dashboard.html` - Admin panel
- `contact.html` - Contact page
- `faq.html` - FAQ page

## 🔐 Authentication

**Demo Accounts:**
- **Student:** student@cvsu.edu.ph / StudentPass123
- **Admin:** admin@cvsu.edu.ph / AdminPass123 + Secret: DRS-ADMIN-2025

## 🗂️ File Structure

```
├── public/                    # Static assets
│   ├── css/                  # All stylesheets
│   ├── js/                   # Client-side scripts
│   └── assets/               # Images, icons, logos
├── server/                    # Backend API
│   ├── controllers/          # Business logic
│   ├── routes/               # API endpoints
│   ├── middleware/           # Auth & validation
│   └── database/             # Schema & migrations
├── docs/                      # Documentation
└── *.html                     # Frontend pages
├── success.html                       (Confirmation page) ⭐ NEW
├── s_track.html                       (Track requests - to update)
├── s_track.js                         (Track logic - to update)
├── s_dashboard.html                   (Student dashboard)
├── s_fees.html                        (Fee information)
├── login.html                         (Login page)
├── landing.html                       (Landing page)
│
├── SUPABASE_SETUP.md                  (Supabase setup guide)
├── SUPABASE_MIGRATION.md              (MySQL → Supabase changes)
├── SUPABASE_QUICKSTART.md             (5-minute quick start)
├── STUDENT_WORKFLOW.md                (Workflow guide) ⭐ PHASE 4
├── API_DOCUMENTATION.md               (API reference) ⭐ PHASE 4
├── PHASE4_CHECKLIST.md                (Testing checklist) ⭐ PHASE 4
├── INTEGRATION_GUIDE.md               (Integration guide) ⭐ PHASE 4
├── PHASE4_SUMMARY.md                  (Completion summary) ⭐ PHASE 4
└── README.md                          (This file)
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 14+
- npm or yarn
- Supabase account (https://supabase.com)
- Git (optional)

### Quick Start (5 minutes)

#### 1. Set up Supabase
```bash
# Create account at supabase.com
# Create new project
# Note your Project URL and API keys
```

#### 2. Configure Environment
```bash
cd server
cp .env.example .env
# Edit .env with Supabase credentials:
# SUPABASE_URL=your-url
# SUPABASE_SERVICE_KEY=your-key
# SUPABASE_ANON_KEY=your-anon-key
```

#### 3. Initialize Database
```bash
# In Supabase SQL Editor, run:
# 1. server/database/supabase-schema.sql
# 2. server/database/supabase-seed.sql
```

#### 4. Install Dependencies & Start
```bash
npm install
npm start

# Server runs on http://localhost:3000
```

#### 5. Test the Workflow
```
1. Go to http://localhost:3000/landing.html
2. Click "Student Login" → Register
3. Login
4. Go to "Request Document" (s_request.html)
5. Fill form and submit
6. See reference number on success page
```

---

## 📋 Key Files by Role

### For Students
- **s_request.html** - Request form
- **s_request.js** - Form logic (dynamic fields, cost calculation)
- **success.html** - Confirmation with reference number & instructions
- **s_track.html** - Track request status (to be enhanced)

### For Admins
- **admin/templates.html** - Create/edit document templates
- **admin/templates.js** - Template management logic
- **admin/dashboard.html** - Coming in Phase 5

### For Developers
- **server/controllers/** - Business logic
- **server/routes/** - API endpoints
- **server/config/db.js** - Database configuration
- **STUDENT_WORKFLOW.md** - How everything works
- **API_DOCUMENTATION.md** - API reference

---

## 🔄 Main Workflow

### Student Request Flow
```
1. Student selects document template
2. Form fields appear (dynamically configured)
3. Student fills form & specifies quantity
4. Real-time cost calculation displayed
5. Submit button sends request to API
6. Reference number auto-generated
7. Success page shows reference & instructions
8. Student pays at cashier with reference number
9. Student uploads payment receipt
10. Admin verifies receipt
11. Request status updates automatically
12. Admin prepares & releases document
13. Student collects document
```

### Admin Workflow
```
1. Create document templates (admin/templates.html)
2. Configure form fields & pricing
3. Review request queue (admin/dashboard.html - Phase 5)
4. Verify payment receipts
5. Update request status
6. Generate final document
7. Mark as ready for pickup
```

---

## 🔗 API Endpoints Quick Reference

### Authentication
```
POST   /api/auth/register        - Register student
POST   /api/auth/login           - Login
POST   /api/auth/verify-email    - Verify email
```

### Templates
```
GET    /api/templates/active     - Get active templates (no auth)
POST   /api/templates            - Create (admin)
GET    /api/templates            - List (admin)
GET    /api/templates/:id        - Details (admin)
```

### Requests ⭐ NEW
```
POST   /api/requests             - Create request
GET    /api/requests             - List student's requests
GET    /api/requests/details/:id - Request details
DELETE /api/requests/:id         - Cancel request
GET    /api/requests/admin/queue - Admin request queue
PATCH  /api/requests/:id/status  - Change status (admin)
```

### Receipts ⭐ NEW
```
POST   /api/receipts/:id/receipt           - Upload receipt
GET    /api/receipts/:id/receipt           - Get receipt
PATCH  /api/receipts/:id/receipt/verify    - Verify (admin)
GET    /api/receipts/:id/receipt/download  - Download (admin)
```

Full details: See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

---

## 💾 Database Schema Overview

### Main Tables
1. **users** - Student/admin accounts
2. **document_templates** - Document types & pricing
3. **requests** ⭐ NEW - Student requests
4. **payment_receipts** ⭐ NEW - Receipt files
5. **request_status_history** ⭐ NEW - Audit trail

### Key Fields

**requests:**
- reference_number (YYYY-REG-XXXXX format)
- status (Pending Payment → Completed)
- form_data (JSONB - stores form field values)
- total_amount (calculated: base + copies)

**payment_receipts:**
- verification_status (Pending/Verified/Rejected)
- file_path (where receipt stored)

Full schema: See [STUDENT_WORKFLOW.md](./STUDENT_WORKFLOW.md)

---

## 🔐 Security Features

### Authentication
✅ JWT tokens (7-day expiration)
✅ Email verification required
✅ Password hashing (bcrypt)

### Authorization
✅ Students can only access own requests
✅ Admins verified by role
✅ File paths validated

### Data Protection
✅ Input validation before DB operations
✅ File type & size validation
✅ HTTPS recommended for production
✅ Audit trail for all changes

---

## 📊 Cost Calculation

### Formula
```
Total = Base Price + (Price per Copy × Quantity)
```

### Example
```
Document: Transcript of Records
Base Price: ₱150.00
Price per Copy: ₱25.00
Quantity: 3

Total = ₱150.00 + (₱25.00 × 3)
Total = ₱150.00 + ₱75.00
Total = ₱225.00
```

Calculation happens in real-time as student changes quantity!

---

## 📝 Testing Workflow

### Manual Testing Steps
1. ✅ Create test template with field configuration
2. ✅ Navigate to request form (s_request.html)
3. ✅ Select template → form fields appear
4. ✅ Fill form & adjust quantity
5. ✅ Verify cost calculation
6. ✅ Submit request
7. ✅ See reference number
8. ✅ Simulate payment receipt upload
9. ✅ Admin verification
10. ✅ Status changes

### Testing Checklist
See [PHASE4_CHECKLIST.md](./PHASE4_CHECKLIST.md) for comprehensive testing guide

---

## 🐛 Troubleshooting

### Server won't start
```bash
# Check Supabase credentials in .env
# Verify SUPABASE_URL is set
# Check port 3000 is available
```

### Templates not loading
```bash
# Check database migration ran
# Verify templates exist in database
# Check browser console for errors
```

### Form fields not showing
```bash
# Check field_config is valid JSON
# Verify template is active (is_active = true)
# Check browser console
```

### Receipt upload fails
```bash
# Check file < 5MB
# Check file type (jpg, png, pdf)
# Verify request status allows receipt upload
```

More solutions: See [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md#-common-issues--solutions)

---

## 📱 Browser Compatibility

Tested & supported:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

---

## 🔧 Development Tips

### Debug API Calls
```javascript
// In browser console:
fetch('/api/templates/active', {
  headers: {'Authorization': 'Bearer ' + localStorage.getItem('token')}
})
  .then(r => r.json())
  .then(d => console.log(d))
```

### Check Request Status
```javascript
// As admin:
fetch('/api/requests/admin/queue', {
  headers: {'Authorization': 'Bearer ' + localStorage.getItem('token')}
})
  .then(r => r.json())
  .then(d => console.log(d))
```

### View Database (Supabase)
```
1. Log in to https://supabase.com
2. Select your project
3. Go to "Table Editor"
4. Browse all data
5. Use SQL Editor for complex queries
```

---

## 🚀 Next Phase (Phase 5)

Coming soon:
- ✅ Admin dashboard (request queue)
- ✅ Track page enhancement (status timeline)
- ✅ Receipt viewer (admin)
- ✅ Quick status updates

### Phase 5 Features to Build
1. admin/dashboard.html - Request management interface
2. Enhanced s_track.html - Status tracking & receipt upload
3. Email notifications on status changes
4. Request statistics & reports

---

## 📞 Need Help?

### Documentation
1. [PHASE4_SUMMARY.md](./PHASE4_SUMMARY.md) - Overview
2. [STUDENT_WORKFLOW.md](./STUDENT_WORKFLOW.md) - Detailed workflow
3. [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - API reference
4. [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) - Integration tips

### Common Questions

**Q: How do students know their request was submitted?**
A: They see success.html with reference number and instructions.

**Q: How do admins know a receipt was uploaded?**
A: They view the admin queue and see status "Payment Submitted".

**Q: Can students cancel requests?**
A: Yes, only if status is "Pending Payment" or "Payment Submitted".

**Q: What happens if receipt verification fails?**
A: Status stays "Payment Submitted", admin can re-verify or add notes.

---

## 📈 Project Status

| Phase | Status | Details |
|-------|--------|---------|
| 1 | ✅ Complete | Backend setup, auth, DB |
| 2 | ✅ Complete | Admin template management |
| 3 | ✅ Complete | Supabase migration |
| **4** | **✅ COMPLETE** | **Request workflow** |
| 5 | ⏳ Next | Admin dashboard |
| 6 | 📋 Planned | Email notifications |
| 7+ | 📋 Planned | Advanced features |

---

## ✨ Highlights

🎯 **Complete Request Workflow**
- From submission to completion
- Full audit trail
- Automatic status updates

💰 **Real-time Cost Calculation**
- Instant total display
- Updates with quantity changes
- Based on configurable pricing

🔐 **Secure Authorization**
- JWT authentication
- Role-based access control
- File path validation

📊 **Comprehensive Tracking**
- Status history for all changes
- Admin queue with filtering
- Student request list

📚 **Extensive Documentation**
- 1500+ lines of guides
- API reference with examples
- Troubleshooting tips

---

## 📄 License

This project is developed for CvSU (Cavite State University).

---

## 👥 Support

For implementation questions or issues:
1. Read the relevant documentation file
2. Check troubleshooting section
3. Review API examples
4. Check Supabase dashboard

---

**SmartQ - CvSU Document Request System**
*Phase 4: Student Request Workflow*
**Status: ✅ COMPLETE**

Ready for Phase 5 implementation and testing!
