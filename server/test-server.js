// Simple Test Server for Phase 5 Frontend Demo
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Demo auth setup
const adminSecretCode = 'DRS-ADMIN-2025';
const users = [
    {
        id: 'admin-1',
        email: 'admin@cvsu.edu.ph',
        password: 'AdminPass123',
        name: 'Admin User',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin'
    },
    {
        id: 'student-1',
        email: 'student@cvsu.edu.ph',
        password: 'StudentPass123',
        name: 'Test Student',
        firstName: 'Test',
        lastName: 'Student',
        role: 'student',
        studentNumber: '2025-00001',
        program: 'Bachelor of Science in Computer Science',
        yearLevel: '3'
    }
];

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

// Root route - redirect to landing page
app.get('/', (req, res) => {
    res.redirect('/landing.html');
});

// Mock data
const mockRequests = [
    {
        id: '1',
        reference_number: '2025-REG-00001',
        student_name: 'Juan Dela Cruz',
        student_email: 'juan@cvsu.edu.ph',
        template_name: 'Transcript of Records',
        quantity: 3,
        total_amount: 150,
        status: 'Payment Submitted',
        receipt_status: 'Pending',
        created_at: new Date().toISOString(),
        purpose: 'For scholarship application'
    },
    {
        id: '2',
        reference_number: '2025-REG-00002',
        student_name: 'Maria Santos',
        student_email: 'maria@cvsu.edu.ph',
        template_name: 'Certificate of Enrollment',
        quantity: 1,
        total_amount: 50,
        status: 'Pending Payment',
        receipt_status: null,
        created_at: new Date().toISOString(),
        purpose: 'For internship requirement'
    },
    {
        id: '3',
        reference_number: '2025-REG-00003',
        student_name: 'Pedro Reyes',
        student_email: 'pedro@cvsu.edu.ph',
        template_name: 'Good Moral Certificate',
        quantity: 2,
        total_amount: 50,
        status: 'Processing',
        receipt_status: 'Verified',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        purpose: 'For job application'
    },
    {
        id: '4',
        reference_number: '2025-REG-00004',
        student_name: 'Ana Lopez',
        student_email: 'ana@cvsu.edu.ph',
        template_name: 'Certificate of Grades',
        quantity: 1,
        total_amount: 30,
        status: 'For Release',
        receipt_status: 'Verified',
        created_at: new Date(Date.now() - 172800000).toISOString(),
        purpose: 'Personal records'
    },
    {
        id: '5',
        reference_number: '2025-REG-00005',
        student_name: 'Carlos Garcia',
        student_email: 'carlos@cvsu.edu.ph',
        template_name: 'Honorable Dismissal',
        quantity: 1,
        total_amount: 100,
        status: 'Completed',
        receipt_status: 'Verified',
        created_at: new Date(Date.now() - 259200000).toISOString(),
        purpose: 'Transfer to another university'
    }
];

// Mock authentication with role + admin secret code
app.post('/api/auth/login', (req, res) => {
    const { email, password, role, secretCode } = req.body || {};

    if (!email || !password || !role) {
        return res.status(400).json({ success: false, message: 'Email, password, and role are required.' });
    }

    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (!user || user.password !== password) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (role === 'admin') {
        if (user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Admin access only.' });
        }
        if (secretCode !== adminSecretCode) {
            return res.status(401).json({ success: false, message: 'Admin secret code is incorrect.' });
        }
    } else if (role === 'student' && user.role !== 'student') {
        return res.status(403).json({ success: false, message: 'Student access only.' });
    }

    const token = 'mock-jwt-token-' + Date.now();
    const safeUser = {
        id: user.id,
        email: user.email,
        name: user.name,
        firstName: user.firstName || user.name.split(' ')[0],
        lastName: user.lastName || user.name.split(' ').slice(1).join(' '),
        role: user.role,
        studentNumber: user.studentNumber || null,
        program: user.program || null,
        yearLevel: user.yearLevel || null
    };

    return res.json({ success: true, token, user: safeUser, message: 'Login successful.' });
});

// Mock Google login (students by default; allows admin email for demo)
app.post('/api/auth/google', (req, res) => {
    const { email } = req.body || {};

    if (!email) {
        return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    if (!email.toLowerCase().endsWith('@cvsu.edu.ph')) {
        return res.status(403).json({ success: false, message: 'Please use your @cvsu.edu.ph Google account.' });
    }

    let user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
        const nameParts = email.split('@')[0].split('.');
        const firstName = nameParts[0] || 'Student';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        user = {
            id: 'student-' + Date.now(),
            email,
            password: null,
            name: `${firstName} ${lastName}`.trim(),
            firstName,
            lastName,
            role: 'student',
            studentNumber: null,
            program: null,
            yearLevel: null
        };
        users.push(user);
    }

    const token = 'mock-jwt-google-' + Date.now();
    const safeUser = {
        id: user.id,
        email: user.email,
        name: user.name,
        firstName: user.firstName || user.name.split(' ')[0],
        lastName: user.lastName || user.name.split(' ').slice(1).join(' '),
        role: user.role,
        studentNumber: user.studentNumber || null,
        program: user.program || null,
        yearLevel: user.yearLevel || null
    };

    return res.json({ success: true, token, user: safeUser, message: 'Google login successful.' });
});

// Mock registration for students only
app.post('/api/auth/register', (req, res) => {
    const {
        email,
        password,
        firstName,
        middleName,
        lastName,
        studentNumber,
        program,
        address,
        contactNumber
    } = req.body || {};

    if (!email || !password || !firstName || !lastName || !studentNumber || !program || !address || !contactNumber) {
        return res.status(400).json({ success: false, message: 'Please complete all required fields.' });
    }

    if (!email.toLowerCase().endsWith('@cvsu.edu.ph')) {
        return res.status(400).json({ success: false, message: 'Please use a valid @cvsu.edu.ph email address.' });
    }

    if (password.length < 8) {
        return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
    }

    const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
        return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const newUser = {
        id: 'student-' + Date.now(),
        email,
        password,
        name: [firstName, middleName, lastName].filter(Boolean).join(' '),
        role: 'student',
        studentNumber,
        program,
        address,
        contactNumber
    };

    users.push(newUser);

    const token = 'mock-jwt-token-' + Date.now();
    const safeUser = {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        studentNumber: newUser.studentNumber
    };

    return res.status(201).json({ success: true, token, user: safeUser, message: 'Registration successful.' });
});

// Get current user (returns the first admin for demo)
app.get('/api/auth/me', (req, res) => {
    const adminUser = users.find((u) => u.role === 'admin');

    if (!adminUser) {
        return res.status(404).json({ success: false, message: 'No user found.' });
    }

    const safeUser = {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role
    };

    res.json({ success: true, user: safeUser });
});

// Get statistics
app.get('/api/requests/stats/overview', (req, res) => {
    const stats = {
        'Pending Payment': 1,
        'Payment Submitted': 1,
        'Payment Verified': 0,
        'Processing': 1,
        'For Release': 1,
        'Completed': 1,
        'Cancelled': 0
    };
    res.json({ success: true, data: stats });
});

// Get request queue (admin)
app.get('/api/requests/admin/queue', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    res.json({
        success: true,
        data: {
            requests: mockRequests,
            total: mockRequests.length,
            page: page,
            totalPages: 1
        }
    });
});

// Get student's requests
app.get('/api/requests', (req, res) => {
    res.json({
        success: true,
        data: mockRequests.slice(0, 2) // Return first 2 for student view
    });
});

// Get request details
app.get('/api/requests/details/:id', (req, res) => {
    const request = mockRequests.find(r => r.id === req.params.id) || mockRequests[0];
    
    res.json({
        success: true,
        data: {
            ...request,
            status_history: [
                {
                    old_status: null,
                    new_status: 'Pending Payment',
                    changed_at: new Date(Date.now() - 86400000).toISOString(),
                    notes: 'Request submitted'
                },
                {
                    old_status: 'Pending Payment',
                    new_status: request.status,
                    changed_at: new Date().toISOString(),
                    notes: 'Status updated by admin'
                }
            ]
        }
    });
});

// Update request status
app.patch('/api/requests/:id/status', (req, res) => {
    const { status, notes } = req.body;
    
    res.json({
        success: true,
        message: 'Status updated successfully',
        data: { status, notes }
    });
});

// Get receipt
app.get('/api/receipts/:id/receipt', (req, res) => {
    res.json({
        success: true,
        data: {
            id: req.params.id,
            file_path: '/uploads/receipt-sample.jpg',
            verification_status: 'Pending',
            uploaded_at: new Date().toISOString()
        }
    });
});

// Upload receipt
app.post('/api/receipts/:id/receipt', (req, res) => {
    res.json({
        success: true,
        message: 'Receipt uploaded successfully',
        data: {
            file_path: '/uploads/receipt-' + Date.now() + '.jpg'
        }
    });
});

// Verify receipt
app.patch('/api/receipts/:id/receipt/verify', (req, res) => {
    const { verification_status, verification_notes } = req.body;
    
    res.json({
        success: true,
        message: 'Receipt verification updated',
        data: { verification_status, verification_notes }
    });
});

// Get active templates
app.get('/api/templates/active', (req, res) => {
    res.json({
        success: true,
        data: [
            {
                id: '1',
                name: 'Transcript of Records',
                base_price: 50,
                price_per_copy: 10,
                processing_days: 7,
                field_config: []
            },
            {
                id: '2',
                name: 'Certificate of Enrollment',
                base_price: 50,
                price_per_copy: 0,
                processing_days: 3,
                field_config: []
            }
        ]
    });
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'Server is running' });
});

// Start server
app.listen(PORT, () => {
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  ✅ CvSU Document Request System');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
    console.log('  🌐 Open in browser: http://localhost:' + PORT);
    console.log('');
    console.log('  Press Ctrl+C to stop');
    console.log('');
});

module.exports = app;
