# SmartQ Student Request Workflow Guide

## Overview

The student request workflow is the core feature of SmartQ - it allows students to request official documents from the registrar with payment verification. This guide covers the complete workflow from request creation to payment receipt.

## Architecture

### Components

```
Frontend (s_request.html + s_request.js)
          ↓
     API Layer (/api/requests)
          ↓
Request Controller (requestController.js)
          ↓
Supabase Database
```

### Database Tables Involved

1. **document_templates** - Template configurations
2. **requests** - Request records
3. **payment_receipts** - Payment verification
4. **request_status_history** - Audit trail

## Student Workflow

### Phase 1: Document Selection & Form Filling

#### Frontend Flow (s_request.html)

```javascript
// 1. Load active templates from API
GET /api/templates/active

// Response:
{
  "success": true,
  "templates": [
    {
      "id": "uuid",
      "document_name": "Transcript of Records",
      "document_code": "TOR",
      "base_price": 150.00,
      "price_per_copy": 25.00,
      "processing_days": 5,
      "field_config": [
        {
          "name": "degree_program",
          "label": "Degree Program",
          "type": "select",
          "required": true,
          "options": ["BS Computer Science", "BS Information Technology"]
        }
      ]
    }
  ]
}
```

#### Dynamic Form Building

When a student selects a template, `s_request.js` dynamically builds form fields based on `field_config`:

```javascript
// Field types supported:
- text (name, address, etc.)
- email
- number
- date
- select (dropdown)
- textarea (description, notes)
- checkbox (agreements)
```

#### Cost Calculation

```javascript
totalCost = base_price + (price_per_copy × quantity)

Example:
- Base Price: ₱150.00
- Price per Copy: ₱25.00
- Quantity: 3 copies
- Total: ₱150 + (₱25 × 3) = ₱225.00
```

### Phase 2: Request Submission

#### API Endpoint

```
POST /api/requests
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "templateId": "uuid",
  "quantity": 3,
  "purpose": "Employment",
  "formData": {
    "field_degree_program": "BS Computer Science",
    "field_special_notes": "For visa application"
  }
}
```

#### Request Controller Logic

```javascript
// requestController.createRequest()

1. Validate input
   - templateId required
   - quantity >= 1
   - Check template exists and is active

2. Generate Reference Number
   - Format: YYYY-REG-XXXXX
   - Example: 2024-REG-A7K9Q
   - Stored in requests.reference_number

3. Calculate Total Price
   - total = template.base_price + (template.price_per_copy × quantity)

4. Create Request Record
   INSERT INTO requests:
   - student_id: from JWT token
   - template_id: from request
   - reference_number: generated
   - quantity: from request
   - purpose: from request (optional)
   - form_data: from request (stored as JSONB)
   - total_amount: calculated
   - status: "Pending Payment"

5. Log Status Change
   INSERT INTO request_status_history:
   - request_id: newly created
   - old_status: null
   - new_status: "Pending Payment"
   - changed_by: student_id
   - notes: "Request created"

6. Return Response
   {
     "success": true,
     "request": {
       "id": "uuid",
       "referenceNumber": "2024-REG-A7K9Q",
       "totalAmount": 225.00,
       "processingDays": 5
     }
   }
```

### Phase 3: Success Page (success.html)

After successful submission, student is redirected to `success.html` which displays:

```
✓ Request Submitted Successfully

📋 Your Reference Number: 2024-REG-A7K9Q
💰 Total Amount Due: ₱225.00
⏱️ Processing Time: 5 Days

📝 Next Steps:
1. Pay at Cashier - Visit registrar with reference number
2. Get Receipt - Obtain payment receipt from cashier
3. Upload Receipt - Return here and upload receipt (important!)
4. Wait for Processing - Email notifications sent on status updates
5. Collect Document - Notified when ready for pickup
```

**Data Flow:**
```javascript
// s_request.js stores in localStorage
localStorage.setItem('lastRequestId', data.request.id);
localStorage.setItem('lastReferenceNumber', data.request.referenceNumber);
localStorage.setItem('lastTotalAmount', data.request.totalAmount);
localStorage.setItem('lastProcessingDays', data.request.processingDays);

// success.html reads and displays
document.getElementById('referenceNumber').textContent = 
  localStorage.getItem('lastReferenceNumber');
```

### Phase 4: Payment & Receipt Upload

#### Student Views Request in Track Page

```
GET /api/requests
Response: List of all student's requests with status
```

#### Upload Payment Receipt

```
POST /api/receipts/:requestId/receipt
Authorization: Bearer <JWT_TOKEN>
Content-Type: multipart/form-data

FormData:
- receipt: File (image/pdf)
```

**Receipt Controller Logic:**

```javascript
// receiptController.uploadReceipt()

1. Validate request ownership
   - Check request belongs to student

2. Validate request status
   - Must be "Pending Payment" or "Payment Submitted"

3. Delete existing receipt if present
   - Clean up old file from disk

4. Store receipt file
   - Multer saves to uploads/ directory
   - Path stored in database

5. Create/Update receipt record
   INSERT/UPDATE payment_receipts:
   - request_id
   - file_path
   - verification_status: "Pending"
   - uploaded_at: NOW()

6. Update request status
   UPDATE requests:
   - status: "Payment Submitted"

7. Log status change
   INSERT INTO request_status_history:
   - new_status: "Payment Submitted"
   - notes: "Payment receipt uploaded"
```

## Admin Workflow

### Viewing Requests

```
GET /api/requests/admin/queue
Authorization: Bearer <ADMIN_JWT>
Query params:
- status: filter by status
- search: search by reference number or email
- page: pagination
- limit: results per page

Response:
{
  "success": true,
  "requests": [
    {
      "id": "uuid",
      "reference_number": "2024-REG-A7K9Q",
      "status": "Payment Submitted",
      "total_amount": 225.00,
      "quantity": 3,
      "created_at": "2024-01-15T10:30:00Z",
      "document_templates": { ... },
      "users": { ... },
      "payment_receipts": [{ ... }]
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 47
  }
}
```

### Verify Payment Receipt

```
PATCH /api/receipts/:requestId/receipt/verify
Authorization: Bearer <ADMIN_JWT>

{
  "verificationStatus": "Verified",  // or "Rejected"
  "verificationNotes": "Payment confirmed via manual inspection"
}
```

**What happens:**
- Updates payment_receipts.verification_status
- Updates payment_receipts.verified_at (if verified)
- Updates requests.status to "Payment Verified" (if verified)
- Logs status change for audit trail
- Email notification can be sent to student

### Change Request Status

```
PATCH /api/requests/:id/status
Authorization: Bearer <ADMIN_JWT>

{
  "newStatus": "Processing",
  "notes": "Starting document preparation"
}
```

**Valid Status Flow:**

```
Pending Payment
     ↓
Payment Submitted
     ↓
Payment Verified ← (or Cancelled if rejected)
     ↓
Processing
     ↓
For Release
     ↓
Completed
```

## API Reference

### Request Endpoints

#### Create Request
```
POST /api/requests
Authorization: Bearer <TOKEN>
Content-Type: application/json

Body: {
  "templateId": "uuid",
  "quantity": number,
  "purpose": "string (optional)",
  "formData": object
}

Response 200:
{
  "success": true,
  "request": {
    "id": "uuid",
    "referenceNumber": "YYYY-REG-XXXXX",
    "totalAmount": number,
    "processingDays": number
  }
}
```

#### Get Student's Requests
```
GET /api/requests?status=Pending%20Payment&page=1&limit=10
Authorization: Bearer <TOKEN>

Response 200:
{
  "success": true,
  "requests": [...],
  "pagination": { ... }
}
```

#### Get Request Details
```
GET /api/requests/details/:requestId
Authorization: Bearer <TOKEN>

Response 200:
{
  "success": true,
  "request": {
    "id": "uuid",
    "reference_number": "2024-REG-A7K9Q",
    "status": "Payment Verified",
    "total_amount": 225.00,
    "quantity": 3,
    "form_data": { ... },
    "document_templates": { ... },
    "payment_receipts": [ ... ]
  }
}
```

#### Cancel Request
```
DELETE /api/requests/:requestId
Authorization: Bearer <TOKEN>

Response 200:
{
  "success": true,
  "message": "Request cancelled successfully"
}
```

### Receipt Endpoints

#### Upload Receipt
```
POST /api/receipts/:requestId/receipt
Authorization: Bearer <TOKEN>
Content-Type: multipart/form-data

Body:
- receipt: File

Response 200:
{
  "success": true,
  "message": "Receipt uploaded successfully",
  "receipt": { ... }
}
```

#### Get Receipt
```
GET /api/receipts/:requestId/receipt
Authorization: Bearer <TOKEN>

Response 200:
{
  "success": true,
  "receipt": {
    "id": "uuid",
    "request_id": "uuid",
    "file_path": "uploads/...",
    "verification_status": "Pending",
    "verified_at": null,
    "verification_notes": null
  }
}
```

#### Verify Receipt (Admin)
```
PATCH /api/receipts/:requestId/receipt/verify
Authorization: Bearer <ADMIN_TOKEN>

Body: {
  "verificationStatus": "Verified",
  "verificationNotes": "Receipt validated"
}

Response 200:
{
  "success": true,
  "message": "Receipt verified successfully"
}
```

## Status Flow

### Request Status Values

```
1. Pending Payment
   - Initial status after request creation
   - Waiting for student to pay at cashier

2. Payment Submitted
   - Receipt uploaded by student
   - Waiting for admin verification

3. Payment Verified
   - Admin verified the payment receipt
   - Ready for document processing

4. Processing
   - Admin is preparing the document
   - Can include editing, signing, etc.

5. For Release
   - Document is ready
   - Waiting for student to collect

6. Completed
   - Student collected the document
   - Request fulfilled

7. Cancelled
   - Student or admin cancelled
   - No further action needed
```

### Status History Tracking

Every status change is logged:

```
request_status_history table:
- request_id: which request
- old_status: previous status
- new_status: new status
- changed_by: who made the change (user_id)
- notes: reason or additional info
- changed_at: timestamp
```

**Example:**
```
Request 2024-REG-A7K9Q:
1. null → "Pending Payment" (created by student)
2. "Pending Payment" → "Payment Submitted" (receipt uploaded)
3. "Payment Submitted" → "Payment Verified" (admin verified)
4. "Payment Verified" → "Processing" (admin started prep)
5. "Processing" → "For Release" (document ready)
6. "For Release" → "Completed" (student collected)
```

## Error Handling

### Common Errors

```javascript
// Invalid template
{
  "success": false,
  "message": "Invalid or inactive template"
}

// Insufficient data
{
  "success": false,
  "message": "Invalid template or quantity"
}

// Template has required fields not filled
{
  "success": false,
  "message": "Missing required fields in form data"
}

// Unauthorized access
{
  "success": false,
  "message": "Unauthorized"
}

// Request not found
{
  "success": false,
  "message": "Request not found"
}

// Cannot cancel completed request
{
  "success": false,
  "message": "Can only cancel requests pending payment"
}

// Cannot delete template with active requests
{
  "success": false,
  "message": "Cannot delete template with active requests"
}
```

## Security Considerations

### 1. Authorization

- **Students** can only:
  - View/manage their own requests
  - Cancel pending requests
  - Upload receipts for their requests

- **Admins** can:
  - View all requests
  - Change request status
  - Verify payment receipts
  - View student form data

### 2. Data Validation

- Request quantity must be > 0
- Template must be active and not deleted
- Receipt file must be valid image/pdf
- Form data must match template field_config

### 3. File Security

- Uploaded files stored in `uploads/` directory
- File path validated before download
- Filenames sanitized by multer

### 4. JWT Tokens

- Extracted from Authorization header
- Verified before each request
- Contains user_id and role
- Used for ownership verification

## Testing Workflow

### 1. Create Template (Admin)

```bash
POST /api/templates
- Upload PDF template file
- Set pricing (base, per-copy)
- Define form fields
- Set active status
```

### 2. Create Request (Student)

```bash
POST /api/requests
- Select template
- Fill dynamic form fields
- Set quantity
- Submit
```

### 3. Verify Request Created

```bash
GET /api/requests
- Confirm request appears in list
- Check status = "Pending Payment"
- Confirm reference number generated
```

### 4. Upload Receipt

```bash
POST /api/receipts/:requestId/receipt
- Upload sample receipt image/pdf
- Confirm receipt stored
- Check request status = "Payment Submitted"
```

### 5. Verify Receipt (Admin)

```bash
PATCH /api/receipts/:requestId/receipt/verify
- Verify receipt
- Confirm request status = "Payment Verified"
```

### 6. Process Request (Admin)

```bash
PATCH /api/requests/:id/status
- Change status to "Processing"
- Then "For Release"
- Then "Completed"
```

## Troubleshooting

### Request Creation Fails

- Check template is active: `is_active = true`
- Check template not deleted: `is_deleted = false`
- Verify quantity > 0
- Check form data matches field_config requirements

### Receipt Upload Fails

- Check file size (max 5MB recommended)
- Check file type (jpg, png, pdf)
- Verify request status allows receipt (Pending/Submitted)
- Ensure student owns the request

### Status Update Fails

- Check valid status value
- Verify admin authorization
- Confirm request exists
- Check no active requests if deleting template

## Performance Optimization

### Database Queries

- Templates paginated: 10 per page default
- Requests paginated: 20 per page default
- Use search/filter to narrow results
- Status history indexed for quick lookup

### File Handling

- Use streaming for large files
- Multer automatically handles validation
- Old receipts deleted on re-upload
- Consider cloud storage (Supabase Storage) later

## Future Enhancements

1. **Batch Requests** - Allow multiple documents in one request
2. **Payment Integration** - Online payment gateway instead of manual
3. **Email Notifications** - Auto-notify on status changes
4. **SMS Alerts** - SMS notifications for important events
5. **QR Codes** - Generate QR for receipt verification
6. **Analytics Dashboard** - Request statistics for registrar
7. **Scheduled Release** - Auto-move to "Completed" after pickup deadline
8. **Document Preview** - Show filled PDF before final submission
