# SmartQ API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication
All endpoints except `/auth/login` and `/auth/register` require JWT token in Authorization header:
```
Authorization: Bearer <JWT_TOKEN>
```

---

## Authentication Endpoints

### POST /auth/register
Register a new student account.

**Request:**
```json
{
  "email": "student@cvsu.edu.ph",
  "password": "Password123!",
  "firstName": "John",
  "middleName": "Doe",
  "lastName": "Smith",
  "studentNumber": "202301234",
  "program": "BS Computer Science"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Registration successful. Please verify your email.",
  "userId": "uuid"
}
```

**Errors:**
- 400: Missing required fields
- 400: Email already registered
- 400: Invalid email format (must be @cvsu.edu.ph)
- 400: Password too weak

---

### POST /auth/login
Authenticate and get JWT token.

**Request:**
```json
{
  "email": "student@cvsu.edu.ph",
  "password": "Password123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "student@cvsu.edu.ph",
    "firstName": "John",
    "lastName": "Smith",
    "role": "student",
    "is_verified": true
  }
}
```

**Errors:**
- 401: Invalid email or password
- 403: Email not verified yet

---

### POST /auth/verify-email
Verify email with verification code.

**Request:**
```json
{
  "email": "student@cvsu.edu.ph",
  "verificationCode": "ABC123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

---

### POST /auth/resend-verification
Resend verification email.

**Request:**
```json
{
  "email": "student@cvsu.edu.ph"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Verification email sent"
}
```

---

## Template Endpoints

### GET /templates/active
Get all active document templates (no auth required).

**Query Params:**
- None required

**Response (200):**
```json
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
          "options": ["BS CS", "BS IT"]
        }
      ]
    }
  ]
}
```

---

### GET /templates
Get all templates with pagination (admin only).

**Query Params:**
- `page=1` (default)
- `limit=10` (default)
- `active_only=true` (optional)
- `search=transcript` (optional)

**Response (200):**
```json
{
  "success": true,
  "templates": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 47,
    "itemsPerPage": 10
  }
}
```

---

### GET /templates/:id
Get template details (admin only).

**Response (200):**
```json
{
  "success": true,
  "template": {
    "id": "uuid",
    "document_name": "Transcript of Records",
    "document_code": "TOR",
    "template_file_path": "uploads/templates/tor.pdf",
    "field_config": [...],
    "base_price": 150.00,
    "price_per_copy": 25.00,
    "processing_days": 5,
    "is_active": true,
    "version": 1,
    "created_at": "2024-01-10T10:00:00Z",
    "updated_at": "2024-01-10T10:00:00Z"
  }
}
```

---

### POST /templates
Create new document template (admin only).

**Headers:**
```
Content-Type: multipart/form-data
```

**Form Data:**
- `documentName` (string, required)
- `documentCode` (string, required, unique)
- `basePrice` (number, required)
- `pricePerCopy` (number, required)
- `processingDays` (number, required)
- `fieldConfig` (JSON string)
- `templateFile` (file, required, .pdf)

**Field Config Example:**
```json
[
  {
    "name": "student_id",
    "label": "Student ID",
    "type": "text",
    "required": true,
    "placeholder": "Enter your student ID"
  },
  {
    "name": "purpose",
    "label": "Purpose",
    "type": "select",
    "required": true,
    "options": ["Employment", "Transfer", "Other"]
  }
]
```

**Response (200):**
```json
{
  "success": true,
  "message": "Template created successfully",
  "templateId": "uuid"
}
```

---

### PUT /templates/:id
Update template (admin only).

**Headers:**
```
Content-Type: multipart/form-data
```

**Form Data:**
- `documentName` (string, optional)
- `basePrice` (number, optional)
- `pricePerCopy` (number, optional)
- `processingDays` (number, optional)
- `fieldConfig` (JSON string, optional)
- `templateFile` (file, optional)

**Response (200):**
```json
{
  "success": true,
  "message": "Template updated successfully"
}
```

---

### PATCH /templates/:id/status
Toggle template active status (admin only).

**Request:**
```json
{
  "isActive": true
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Template activated successfully"
}
```

---

### DELETE /templates/:id
Delete template - soft delete (admin only).

**Response (200):**
```json
{
  "success": true,
  "message": "Template deleted successfully"
}
```

**Errors:**
- 400: Cannot delete if active requests exist

---

## Request Endpoints

### POST /requests
Create new document request (student).

**Request:**
```json
{
  "templateId": "uuid",
  "quantity": 3,
  "purpose": "Employment",
  "formData": {
    "field_degree_program": "BS Computer Science",
    "field_special_notes": "For visa"
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Request created successfully",
  "request": {
    "id": "uuid",
    "referenceNumber": "2024-REG-A7K9Q",
    "totalAmount": 225.00,
    "processingDays": 5
  }
}
```

**Errors:**
- 400: Template not found
- 400: Template not active
- 400: Invalid quantity

---

### GET /requests
Get student's requests with pagination.

**Query Params:**
- `page=1` (default)
- `limit=10` (default)
- `status=Pending%20Payment` (optional)

**Response (200):**
```json
{
  "success": true,
  "requests": [
    {
      "id": "uuid",
      "reference_number": "2024-REG-A7K9Q",
      "status": "Pending Payment",
      "total_amount": 225.00,
      "quantity": 3,
      "purpose": "Employment",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z",
      "document_templates": {
        "id": "uuid",
        "document_name": "Transcript of Records",
        "document_code": "TOR",
        "processing_days": 5
      }
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 2,
    "totalItems": 15
  }
}
```

---

### GET /requests/details/:id
Get request details by ID.

**Response (200):**
```json
{
  "success": true,
  "request": {
    "id": "uuid",
    "reference_number": "2024-REG-A7K9Q",
    "status": "Payment Verified",
    "total_amount": 225.00,
    "quantity": 3,
    "form_data": {...},
    "created_at": "2024-01-15T10:30:00Z",
    "document_templates": {...},
    "payment_receipts": [
      {
        "id": "uuid",
        "file_path": "uploads/receipts/...",
        "verification_status": "Verified",
        "verified_at": "2024-01-15T15:00:00Z"
      }
    ]
  }
}
```

---

### GET /requests/admin/queue
Get all requests - admin queue (admin only).

**Query Params:**
- `page=1` (default)
- `limit=20` (default)
- `status=Payment%20Submitted` (optional)
- `search=2024-REG-A7K9Q` (optional)

**Response (200):**
```json
{
  "success": true,
  "requests": [...],
  "pagination": {...}
}
```

---

### PATCH /requests/:id/status
Update request status (admin only).

**Request:**
```json
{
  "newStatus": "Processing",
  "notes": "Starting document preparation"
}
```

**Valid Statuses:**
- Pending Payment
- Payment Submitted
- Payment Verified
- Processing
- For Release
- Completed
- Cancelled

**Response (200):**
```json
{
  "success": true,
  "message": "Status updated successfully"
}
```

---

### DELETE /requests/:id
Cancel request (student - only if pending payment).

**Response (200):**
```json
{
  "success": true,
  "message": "Request cancelled successfully"
}
```

**Errors:**
- 403: Cannot cancel completed request
- 404: Request not found

---

### GET /requests/stats/overview
Get request statistics.

**Response (200):**
```json
{
  "success": true,
  "statistics": {
    "totalRequests": 50,
    "pendingRequests": 5,
    "completedRequests": 30
  }
}
```

---

## Receipt Endpoints

### POST /receipts/:requestId/receipt
Upload payment receipt (student).

**Headers:**
```
Content-Type: multipart/form-data
```

**Form Data:**
- `receipt` (file, required, .jpg/.png/.pdf)

**Response (200):**
```json
{
  "success": true,
  "message": "Receipt uploaded successfully",
  "receipt": {
    "id": "uuid",
    "request_id": "uuid",
    "file_path": "uploads/receipts/...",
    "verification_status": "Pending",
    "uploaded_at": "2024-01-15T14:00:00Z"
  }
}
```

**Errors:**
- 400: No file uploaded
- 400: Request not in correct status
- 403: Unauthorized (not your request)
- 404: Request not found

---

### GET /receipts/:requestId/receipt
Get receipt details (student/admin).

**Response (200):**
```json
{
  "success": true,
  "receipt": {
    "id": "uuid",
    "request_id": "uuid",
    "file_path": "uploads/receipts/...",
    "verification_status": "Pending",
    "verified_at": null,
    "verification_notes": null,
    "uploaded_at": "2024-01-15T14:00:00Z"
  }
}
```

---

### PATCH /receipts/:requestId/receipt/verify
Verify receipt - admin only.

**Request:**
```json
{
  "verificationStatus": "Verified",
  "verificationNotes": "Receipt verified manually"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Receipt verified successfully"
}
```

---

### GET /receipts/:requestId/receipt/download
Download receipt file (admin only).

**Response:**
- 200: File download
- 404: Receipt not found

---

## Health Check

### GET /health
Check API status.

**Response (200):**
```json
{
  "status": "OK",
  "message": "SmartQ API is running",
  "version": "1.0.0-beta"
}
```

---

## Error Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | Request completed successfully |
| 201 | Created | New resource created |
| 400 | Bad Request | Missing/invalid parameters |
| 401 | Unauthorized | Invalid credentials |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 500 | Server Error | Internal error |

---

## JWT Token Payload

```json
{
  "id": "uuid",
  "email": "student@cvsu.edu.ph",
  "role": "student",
  "iat": 1700000000,
  "exp": 1700600000
}
```

**Token Expiry:** 7 days

---

## File Upload Limits

- **Template PDF:** Max 10MB
- **Receipt Image:** Max 5MB
- **Allowed Receipt Types:** jpg, jpeg, png, pdf

---

## Rate Limiting

No rate limiting currently implemented. Add in production:
```javascript
// Example: 100 requests per 15 minutes
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);
```

---

## CORS Settings

Currently allows all origins. Production configuration:
```javascript
const corsOptions = {
  origin: 'https://yourdomain.com',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
```

---

## Testing with cURL

### Register
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@cvsu.edu.ph",
    "password": "Test@123",
    "firstName": "Test",
    "lastName": "User",
    "studentNumber": "202301234",
    "program": "BS CS"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@cvsu.edu.ph",
    "password": "Test@123"
  }'
```

### Create Request
```bash
curl -X POST http://localhost:3000/api/requests \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "templateId": "template-uuid",
    "quantity": 3,
    "purpose": "Employment"
  }'
```

### Upload Receipt
```bash
curl -X POST http://localhost:3000/api/receipts/request-uuid/receipt \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "receipt=@receipt.jpg"
```
