# Quick Reference - Document Fees Update

## 🎯 What Was Done

Updated the CvSU Document Request System to dynamically load document fees from the database instead of hardcoding them.

## 📋 Files Created/Modified

| File | Type | Purpose |
|------|------|---------|
| `s_fees.html` | ✏️ Modified | Now loads fees dynamically from API |
| `s_fees_dynamic.html` | 📄 New | Reference implementation |
| `server/database/update-fees-supabase.sql` | 📄 New | Supabase database update script |
| `server/database/update-document-fees.sql` | 📄 New | MySQL database update script |
| `docs/DOCUMENT_FEES_SYNC.md` | 📄 New | Complete documentation |
| `FEES_UPDATE_SUMMARY.md` | 📄 New | Implementation summary |

## 💰 Current Fee Schedule

```
Transcript of Records          ₱50.00 → ₱25.00 each (3-5 days)
Certificate of Enrollment      ₱50.00 → ₱25.00 each (2-3 days)
Certificate of Registration    ₱50.00 → ₱25.00 each (2-3 days)
Diploma/Degree Certificate     ₱100.00 → ₱50.00 each (5-7 days)
Good Moral Certificate         ₱25.00 → ₱15.00 each (2-3 days)
Honorable Dismissal           ₱50.00 → ₱25.00 each (3-5 days)
Course Description            ₱50.00 → ₱25.00 each (3-5 days)
Certification of Units Earned ₱50.00 → ₱25.00 each (3-5 days)
```

## 🚀 How to Implement

### Step 1: Update Database
Choose one based on your database type:

**Supabase:**
```bash
# Run script in Supabase SQL Editor:
server/database/update-fees-supabase.sql
```

**MySQL/MariaDB:**
```bash
# Run script on your database:
server/database/update-document-fees.sql
```

### Step 2: Test
1. Open `s_fees.html` in browser
2. Should see fees loading with spinner
3. Table should populate with data from database
4. Verify amounts match the fee schedule

### Step 3: Done!
- ✅ Fees are now synced with database
- ✅ No more manual updates needed
- ✅ Changes to database automatically appear on page

## 🔗 Related Pages

These pages also use the same API:
- `s_request.html` - Shows fees when selecting documents
- Admin Dashboard - For managing template fees

## 📞 Support

### If fees don't load:
1. Check server is running: `npm start` in `/server`
2. Check browser console for errors (F12)
3. Verify user is logged in
4. Try clearing cache (Ctrl+Shift+Delete)

### If fees look wrong:
1. Verify database was updated with SQL script
2. Check `document_templates` table in database
3. Ensure `is_active = true` for documents
4. Refresh page and reload (Ctrl+F5)

## 📚 Documentation

For detailed information, see:
- `docs/DOCUMENT_FEES_SYNC.md` - Complete guide
- `FEES_UPDATE_SUMMARY.md` - Implementation details

---

**Status:** ✅ Ready to deploy
**Last Updated:** December 30, 2025
