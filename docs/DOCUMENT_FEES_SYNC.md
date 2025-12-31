# Document Fees Database Synchronization Guide

## Overview
This document explains how to synchronize the document fees displayed in `s_fees.html` with the database records in the `document_templates` table.

## Current Fees from s_fees.html

The following fee schedule is displayed to students:

| Document Type | First Copy | Additional Copies | Processing Time |
|---|---|---|---|
| Certificate of Enrollment | ₱30.00 | ₱0.00 each | 1-2 days |
| Certificate of Good Moral | ₱50.00 | ₱0.00 each | 2-4 days |
| Certificate of Grades | ₱50.00 | ₱10.00 each | 2-4 days |
| Certificate of Registration | ₱30.00 | ₱0.00 each | 1-2 days |
| Certification of Units Earned | ₱50.00 | ₱0.00 each | 2-4 days |
| Course Description | ₱50.00 | ₱30.00 each | 4-6 days |
| Diploma/Degree Certificate | ₱200.00 | ₱0.00 each | 13-15 days |
| Honorable Dismissal | ₱100.00 | ₱0.00 each | 4-6 days |
| Transcript of Records | ₱150.00 | ₱50.00 each | 6-8 days |

## Database Update Scripts

### For MySQL/MariaDB
Use the script: `server/database/update-document-fees.sql`

This script updates the `document_templates` table with:
- `first_copy_fee` - Base price for the first copy
- `additional_copy_fee` - Price per additional copy
- `processing_days` - Processing time in days

### For Supabase PostgreSQL
Use the script: `server/database/update-fees-supabase.sql`

The Supabase version uses:
- `base_price` - Base price for the first copy (replaces `first_copy_fee`)
- `price_per_copy` - Price per additional copy (replaces `additional_copy_fee`)
- `processing_days` - Processing time as integer (number of days)

## How to Update Fees

### Step 1: Update the Database
1. **For Supabase:**
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Copy and paste the contents of `server/database/update-fees-supabase.sql`
   - Execute the script

2. **For MySQL/MariaDB:**
   - Connect to your database server
   - Run the script: `server/database/update-document-fees.sql`

### Step 2: Verify the Updates
Run this query to confirm all documents are updated:

```sql
-- For Supabase/PostgreSQL
SELECT id, document_name, document_code, base_price, price_per_copy, processing_days
FROM document_templates
WHERE is_deleted = false AND is_active = true
ORDER BY document_name;

-- For MySQL/MariaDB
SELECT id, document_type, first_copy_fee, additional_copy_fee, processing_days
FROM document_templates
WHERE is_active = true
ORDER BY document_type;
```

## Dynamic Fee Display

### Option 1: Use the Dynamic Version (Recommended)
Use `s_fees_dynamic.html` instead of `s_fees.html`. This version:
- ✅ Automatically loads fees from the `/api/templates/active` endpoint
- ✅ Always displays the most current fees
- ✅ No manual updates needed when fees change
- ✅ Stays in sync with the database

**To implement:**
1. Rename or replace `s_fees.html` with `s_fees_dynamic.html`
2. Update any references to `s_fees.html` to point to the new file
3. Test the page to ensure fees load correctly

### Option 2: Keep Using Static HTML
If you prefer to keep the hardcoded HTML version:
- Remember to manually update `s_fees.html` whenever fees change in the database
- Update both the HTML table AND the database to keep them in sync

## API Endpoint Reference

The fees are retrieved from the public API endpoint:

```
GET /api/templates/active
```

**Response format:**
```json
{
  "success": true,
  "templates": [
    {
      "id": "uuid",
      "document_name": "Transcript of Records",
      "document_code": "TOR",
      "base_price": 50.00,
      "price_per_copy": 25.00,
      "processing_days": 3
    },
    ...
  ]
}
```

## How Fees are Used in the System

1. **s_request.html** - Displays fees when a student selects a document
2. **Admin Dashboard** - Shows fees for template management
3. **s_fees.html (or s_fees_dynamic.html)** - Displays the complete fee schedule

All pages that display fees should use the API endpoint to ensure consistency.

## Troubleshooting

### Issue: Fees not loading in s_fees_dynamic.html
- Check that the server is running and `/api/templates/active` is accessible
- Verify the user's authentication token is valid
- Check browser console for error messages

### Issue: Database updates didn't reflect in the UI
- Clear browser cache (Ctrl+Shift+Delete)
- Verify the API is returning the updated values
- Check that `is_active` flag is set to `true` for all documents

### Issue: Processing days format is incorrect
- The system expects integer values in the database
- The frontend converts them to ranges (e.g., 3 → "2-3 days")
- You can also store strings like "3-5 days" directly

## Database Column Mapping

| Field | MySQL | Supabase | Value Type | Example |
|---|---|---|---|---|
| First Copy Price | `first_copy_fee` | `base_price` | DECIMAL | 50.00 |
| Additional Copy Price | `additional_copy_fee` | `price_per_copy` | DECIMAL | 25.00 |
| Processing Time | `processing_days` | `processing_days` | INT or VARCHAR | 3 or "3-5 days" |

## When to Update Fees

Update the fees in both places:
1. Database (`document_templates` table)
2. If using static HTML, update `s_fees.html`

**Recommendation:** Use `s_fees_dynamic.html` to eliminate manual synchronization.

## Support

For issues or questions about fee management:
- Contact the CvSU IT Support Team
- Email: support@cvsu.edu.ph
- Visit: s_fees.html (or s_fees_dynamic.html) and click "Need Help?" → "contact our support team"
