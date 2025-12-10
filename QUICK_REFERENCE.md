# 🚀 Quick Reference Guide

## File Locations

### HTML Pages (Root Directory)
```
index.html              → Landing redirect
landing.html            → Homepage
login.html              → Login page
register.html           → Registration
contact.html            → Contact page
faq.html                → FAQ page
admin_dashboard.html    → Admin panel
s_dashboard.html        → Student dashboard
s_request.html          → Request form
s_track.html            → Track requests
s_fees.html             → Fee information
s_profile.html          → User profile
```

### Stylesheets (`public/css/`)
```
landing.css
login.css
contact.css
faq.css
admin_dashboard.css
s_dashboard.css
s_request.css
s_track.css
s_fees.css
s_profile.css
```

### Scripts (`public/js/`)
```
admin_dashboard.js      → Admin functionality
s_profile.js            → Profile management
s_request.js            → Request submission
s_track.js              → Tracking logic
```

### Assets (`public/assets/`)
```
logo/                   → CvSU branding
icons/                  → Social media icons
pictures/               → Page images
```

### Documentation (`docs/`)
```
PHASE5_QUICK_START.md   → Start here! Quick setup guide
API_DOCUMENTATION.md    → Complete API reference
STUDENT_WORKFLOW.md     → User workflows & database schema
INTEGRATION_GUIDE.md    → Integration patterns
SETUP.md                → Installation instructions
TESTING.md              → Testing procedures
SUPABASE_*.md           → Database setup guides
WEBSITE_NAVIGATION_FLOW.md → Site navigation map
```

## Path Conventions

### In HTML Files
```html
<!-- CSS -->
<link rel="stylesheet" href="public/css/filename.css" />

<!-- JavaScript -->
<script src="public/js/filename.js"></script>

<!-- Images -->
<img src="public/assets/logo/filename.svg" />
<img src="public/assets/icons/filename.svg" />
<img src="public/assets/pictures/filename.jpg" />

<!-- CDN (unchanged) -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/..." />
```

### In CSS Files
```css
/* Background images */
background-image: url('../assets/pictures/filename.jpg');

/* Icons */
content: url('../assets/icons/filename.svg');
```

### In JavaScript Files
```javascript
// When making API calls
fetch('http://localhost:3001/api/...')

// No path changes needed for server endpoints
```

## Server Configuration

### Backend (`server/`)
- **Entry Point**: `server/test-server.js` or `server/index.js`
- **Port**: 3001
- **API Base**: `http://localhost:3001/api`
- **Configuration**: `server/.env`

### Start Server
```bash
cd server
npm install
npm start
```

### Demo Credentials
```
Student: student@cvsu.edu.ph / StudentPass123
Admin: admin@cvsu.edu.ph / AdminPass123 + DRS-ADMIN-2025
```

## Common Tasks

### Adding a New Page
1. Create HTML file in root directory
2. Create CSS in `public/css/`
3. Create JS (if needed) in `public/js/`
4. Use standard path conventions (see above)

### Adding New Assets
- **Logo**: `public/assets/logo/`
- **Icons**: `public/assets/icons/`
- **Images**: `public/assets/pictures/`

### Updating Documentation
- Edit files in `docs/` folder
- Update README.md if adding new docs

## Project URLs

- **GitHub**: https://github.com/Niiflheim01/cvsu-document-request-system
- **Local Dev**: http://localhost:3001
- **Landing**: Open `index.html` or navigate to root

## Need Help?

1. **Quick Start**: Read `docs/PHASE5_QUICK_START.md`
2. **API Questions**: Check `docs/API_DOCUMENTATION.md`
3. **Workflows**: See `docs/STUDENT_WORKFLOW.md`
4. **Setup Issues**: Consult `docs/SETUP.md`
5. **Testing**: Follow `docs/TESTING.md`

## ✨ Everything is Organized and Ready to Use!
