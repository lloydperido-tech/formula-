const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Send verification email
const sendVerificationEmail = async (email, firstName, token) => {
  const verificationUrl = `http://localhost:${process.env.PORT || 3000}/api/auth/verify/${token}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@cvsu.edu.ph',
    to: email,
    subject: 'Verify your CvSU-DRS Account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0f5d27;">Welcome to SmartQ - CvSU Document Request System</h2>
        <p>Hello ${firstName},</p>
        <p>Thank you for registering with the CvSU Document Request System. Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #0f5d27; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a>
        </div>
        <p>Or copy and paste this link in your browser:</p>
        <p style="color: #666; word-break: break-all;">${verificationUrl}</p>
        <p style="color: #999; font-size: 12px; margin-top: 30px;">This link will expire in 24 hours. If you didn't register for this account, please ignore this email.</p>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
};

// Send request confirmation email
const sendRequestConfirmation = async (email, firstName, referenceId, documentType, totalAmount) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@cvsu.edu.ph',
    to: email,
    subject: `Document Request Confirmation - ${referenceId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0f5d27;">Document Request Received</h2>
        <p>Hello ${firstName},</p>
        <p>Your document request has been received and is being processed.</p>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Reference ID:</strong> ${referenceId}</p>
          <p><strong>Document Type:</strong> ${documentType}</p>
          <p><strong>Total Amount:</strong> ₱${totalAmount}</p>
        </div>
        <h3 style="color: #0f5d27;">Next Steps:</h3>
        <ol>
          <li>Pay the document fee at the CvSU Cashier Office</li>
          <li>Upload your payment receipt through the SmartQ portal</li>
          <li>Wait for payment verification and document processing</li>
        </ol>
        <p>You can track your request status at any time using your reference ID.</p>
        <p style="color: #999; font-size: 12px; margin-top: 30px;">This is an automated email from SmartQ - CvSU Document Request System</p>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
};

// Send payment verification email
const sendPaymentVerified = async (email, firstName, referenceId) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@cvsu.edu.ph',
    to: email,
    subject: `Payment Verified - ${referenceId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0f5d27;">Payment Verified</h2>
        <p>Hello ${firstName},</p>
        <p>Your payment for request <strong>${referenceId}</strong> has been verified.</p>
        <p>Your document is now being processed. You will receive another notification when it's ready for release.</p>
        <p style="color: #999; font-size: 12px; margin-top: 30px;">This is an automated email from SmartQ - CvSU Document Request System</p>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
};

// Send document ready email
const sendDocumentReady = async (email, firstName, referenceId, documentType) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@cvsu.edu.ph',
    to: email,
    subject: `Document Ready for Release - ${referenceId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0f5d27;">Document Ready for Release</h2>
        <p>Hello ${firstName},</p>
        <p>Good news! Your <strong>${documentType}</strong> (${referenceId}) is now ready for release.</p>
        <p>Please visit the CvSU Registrar Office during office hours to claim your document:</p>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Office Hours:</strong> Monday - Friday, 8:00 AM - 5:00 PM</p>
          <p><strong>Location:</strong> Registrar Office, CvSU Main Campus</p>
        </div>
        <p>Please bring a valid ID for verification.</p>
        <p style="color: #999; font-size: 12px; margin-top: 30px;">This is an automated email from SmartQ - CvSU Document Request System</p>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
};

module.exports = {
  sendVerificationEmail,
  sendRequestConfirmation,
  sendPaymentVerified,
  sendDocumentReady
};
