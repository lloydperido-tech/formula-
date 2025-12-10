# CvSU Document Request System - Website Navigation Flow

## Complete Website Structure

### Public Pages (No Login Required)
```
landing.html (Home)
    ↓
login.html ←→ contact.html
    ↓         ↓
    ↓      faq.html
    ↓
[LOGIN AUTHENTICATION]
```

### After Login - Routes to Different Dashboards

#### For Students:
```
login.html → [Student Login] → s_dashboard.html
                                      ↓
                    ┌─────────────────┼─────────────────┐
                    ↓                 ↓                  ↓
            s_request.html      s_track.html       s_fees.html
            (Request Doc)    (Track Requests)   (View Fees)
                    ↓                 ↓                  ↓
                    └─────────────────┴──────────────────┘
                                      ↓
                              [Logout] → login.html
```

#### For Admins:
```
login.html → [Admin Login] → admin_dashboard.html
                                    ↓
                            [Manage All Requests]
                            [Verify Receipts]
                            [Update Status]
                                    ↓
                              [Logout] → login.html
```

## How It All Connects

### 1. **Landing Page (landing.html)**
   - First page users see
   - Has "Log-in" and "Request Document" buttons → both go to login.html
   - Links to: Contact, FAQs, About sections

### 2. **Login Page (login.html)**
   - Authentication page for all users
   - After successful login:
     - **Students** → redirected to `s_dashboard.html`
     - **Admins** → redirected to `admin_dashboard.html`
   - Credentials stored in localStorage (token + user info)

### 3. **Student Dashboard Area**
   All student pages share the same left navigation:
   - **s_dashboard.html** - Overview, recent requests, student info
   - **s_request.html** - Create new document request
   - **s_track.html** - Track existing requests, upload payment receipts
   - **s_fees.html** - View document fees
   - **Logout** button - clears localStorage, returns to login.html

### 4. **Admin Dashboard (admin_dashboard.html)**
   - View all student requests
   - Search and filter requests
   - Update request status
   - Verify payment receipts
   - View statistics
   - Logout button - returns to login.html

## Current Test URLs (Local Server)

### Public Pages:
- Home: `http://localhost:3000/landing.html`
- Login: `http://localhost:3000/login.html`
- Contact: `http://localhost:3000/contact.html`
- FAQs: `http://localhost:3000/faq.html`

### Student Pages (After Login):
- Dashboard: `http://localhost:3000/s_dashboard.html`
- Request: `http://localhost:3000/s_request.html`
- Track: `http://localhost:3000/s_track.html`
- Fees: `http://localhost:3000/s_fees.html`

### Admin Pages (After Login):
- Dashboard: `http://localhost:3000/admin_dashboard.html`

## Mock Test Credentials

### Student Account:
- Email: `student@cvsu.edu.ph`
- Password: `password123`

### Admin Account:
- Email: `admin@cvsu.edu.ph`
- Password: `admin123`

## Navigation Features

### Authenticated Navigation:
- All pages check for `localStorage.getItem('token')`
- If no token found, redirect to login.html
- Logout clears token and redirects to login.html

### Seamless Flow:
1. User visits **landing.html**
2. Clicks "Log-in" → **login.html**
3. Enters credentials
4. System checks role:
   - Student → **s_dashboard.html** (access to all student pages)
   - Admin → **admin_dashboard.html** (access to admin features)
5. User navigates within their dashboard area
6. Logout returns to **login.html**

## Status: Fully Connected ✅

All pages are now properly connected as a single cohesive website. The test server serves all pages together, and authentication properly routes users to their respective dashboards.
