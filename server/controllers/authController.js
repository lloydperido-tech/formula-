const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../config/db');
const emailService = require('../services/emailService');

// Student registration
const registerStudent = async (req, res) => {
  try {
    const { email, password, firstName, middleName, lastName, studentNumber, program, address, contactNumber } = req.body;

    // Validate @cvsu.edu.ph domain
    if (!email.endsWith('@cvsu.edu.ph')) {
      return res.status(400).json({
        success: false,
        message: 'Only @cvsu.edu.ph email addresses are allowed'
      });
    }

    // Check if user already exists
    const { data: existingUser } = await db.supabase
      .from('users')
      .select('id')
      .or(`email.eq.${email},student_number.eq.${studentNumber}`)
      .single();

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email or student number already registered'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Insert user
    const { data: newUser, error } = await db.supabase
      .from('users')
      .insert([{
        email,
        password: hashedPassword,
        first_name: firstName,
        middle_name: middleName || null,
        last_name: lastName,
        student_number: studentNumber,
        program,
        address,
        contact_number: contactNumber,
        role: 'student',
        verification_token: verificationToken,
        verification_token_expiry: tokenExpiry.toISOString(),
        is_verified: false
      }])
      .select()
      .single();

    if (error) {
      console.error('Registration error:', error);
      return res.status(500).json({
        success: false,
        message: 'Registration failed'
      });
    }

    // Send verification email
    const verificationLink = `${process.env.FRONTEND_URL}/verify.html?token=${verificationToken}`;
    await emailService.sendVerificationEmail(email, firstName, verificationLink);

    res.json({
      success: true,
      message: 'Registration successful! Please check your email to verify your account.'
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed'
    });
  }
};

// Admin registration (requires secret code)
const registerAdmin = async (req, res) => {
  try {
    const { email, password, firstName, lastName, adminCode } = req.body;

    // Validate admin code
    if (adminCode !== process.env.ADMIN_SECRET_CODE) {
      return res.status(403).json({
        success: false,
        message: 'Invalid admin code'
      });
    }

    // Validate @cvsu.edu.ph domain
    if (!email.endsWith('@cvsu.edu.ph')) {
      return res.status(400).json({
        success: false,
        message: 'Only @cvsu.edu.ph email addresses are allowed'
      });
    }

    // Check if user already exists
    const { data: existingUser } = await db.supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert admin user (auto-verified)
    const { data: newUser, error } = await db.supabase
      .from('users')
      .insert([{
        email,
        password: hashedPassword,
        first_name: firstName,
        last_name: lastName,
        role: 'admin',
        is_verified: true
      }])
      .select()
      .single();

    if (error) {
      console.error('Admin registration error:', error);
      return res.status(500).json({
        success: false,
        message: 'Registration failed'
      });
    }

    res.json({
      success: true,
      message: 'Admin registration successful! You can now login.'
    });

  } catch (error) {
    console.error('Admin registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Admin registration failed'
    });
  }
};

// Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Get user
    const { data: user, error } = await db.supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if student account is verified
    if (user.role === 'student' && !user.is_verified) {
      return res.status(401).json({
        success: false,
        message: 'Please verify your email before logging in'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Remove sensitive data
    delete user.password;
    delete user.verification_token;
    delete user.verification_token_expiry;

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
};

// Verify email
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    // Find user with valid token
    const { data: user, error } = await db.supabase
      .from('users')
      .select('*')
      .eq('verification_token', token)
      .single();

    if (error || !user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }

    // Check if token expired
    if (new Date(user.verification_token_expiry) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Verification token has expired. Please register again.'
      });
    }

    // Update user as verified
    const { error: updateError } = await db.supabase
      .from('users')
      .update({
        is_verified: true,
        verification_token: null,
        verification_token_expiry: null
      })
      .eq('id', user.id);

    if (updateError) {
      return res.status(500).json({
        success: false,
        message: 'Verification failed'
      });
    }

    res.json({
      success: true,
      message: 'Email verified successfully! You can now login.'
    });

  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({
      success: false,
      message: 'Verification failed'
    });
  }
};

module.exports = {
  registerStudent,
  registerAdmin,
  login,
  verifyEmail
};
