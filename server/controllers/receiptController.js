const db = require('../config/db');
const fs = require('fs').promises;
const path = require('path');

// Upload payment receipt
exports.uploadReceipt = async (req, res) => {
  try {
    const { requestId } = req.params;
    const studentId = req.user.id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Receipt file is required'
      });
    }

    // Get request to verify ownership
    const { data: request, error: fetchError } = await db.supabase
      .from('requests')
      .select('id, student_id, status')
      .eq('id', requestId)
      .single();

    if (fetchError || !request) {
      await fs.unlink(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    // Verify student ownership
    if (request.student_id !== studentId) {
      await fs.unlink(req.file.path);
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // Check if request is in correct status
    if (request.status !== 'Pending Payment' && request.status !== 'Payment Submitted') {
      await fs.unlink(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Cannot upload receipt for this request status'
      });
    }

    // Delete existing receipt if present
    const { data: existingReceipt } = await db.supabase
      .from('payment_receipts')
      .select('file_path')
      .eq('request_id', requestId)
      .single();

    if (existingReceipt) {
      try {
        await fs.unlink(existingReceipt.file_path);
      } catch (error) {
        console.error('Error deleting old receipt:', error);
      }
    }

    // Create or update receipt record
    const { data: receipt, error: createError } = await db.supabase
      .from('payment_receipts')
      .upsert([{
        request_id: requestId,
        file_path: req.file.path,
        verification_status: 'Pending',
        uploaded_at: new Date().toISOString()
      }], { onConflict: 'request_id' })
      .select()
      .single();

    if (createError) {
      await fs.unlink(req.file.path);
      console.error('Create receipt error:', createError);
      return res.status(500).json({
        success: false,
        message: 'Failed to upload receipt'
      });
    }

    // Update request status
    await db.supabase
      .from('requests')
      .update({ status: 'Payment Submitted' })
      .eq('id', requestId);

    // Log status change
    await db.supabase
      .from('request_status_history')
      .insert([{
        request_id: requestId,
        old_status: request.status,
        new_status: 'Payment Submitted',
        changed_by: studentId,
        notes: 'Payment receipt uploaded'
      }])
      .catch(err => console.error('Error logging status:', err));

    res.json({
      success: true,
      message: 'Receipt uploaded successfully',
      receipt
    });

  } catch (error) {
    console.error('Upload receipt error:', error);
    
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Failed to upload receipt'
    });
  }
};

// Get receipt for request
exports.getReceipt = async (req, res) => {
  try {
    const { requestId } = req.params;
    const studentId = req.user.id;

    // Get request to verify ownership
    const { data: request, error: fetchError } = await db.supabase
      .from('requests')
      .select('id, student_id')
      .eq('id', requestId)
      .single();

    if (fetchError || !request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    // Verify student ownership or admin access
    if (req.user.role === 'student' && request.student_id !== studentId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const { data: receipt, error } = await db.supabase
      .from('payment_receipts')
      .select('*')
      .eq('request_id', requestId)
      .single();

    if (error || !receipt) {
      return res.status(404).json({
        success: false,
        message: 'Receipt not found'
      });
    }

    res.json({
      success: true,
      receipt
    });

  } catch (error) {
    console.error('Get receipt error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch receipt'
    });
  }
};

// Verify payment receipt (admin only)
exports.verifyReceipt = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { requestId } = req.params;
    const { verificationStatus, verificationNotes } = req.body;

    if (!['Verified', 'Rejected'].includes(verificationStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification status'
      });
    }

    // Update receipt verification
    const { error: updateError } = await db.supabase
      .from('payment_receipts')
      .update({
        verification_status: verificationStatus,
        verification_notes: verificationNotes || null,
        verified_at: verificationStatus === 'Verified' ? new Date().toISOString() : null
      })
      .eq('request_id', requestId);

    if (updateError) {
      return res.status(500).json({
        success: false,
        message: 'Failed to verify receipt'
      });
    }

    // Update request status based on verification
    let newStatus;
    if (verificationStatus === 'Verified') {
      newStatus = 'Payment Verified';
    } else {
      newStatus = 'Payment Submitted'; // Keep as submitted for rejection
    }

    const { data: request, error: getError } = await db.supabase
      .from('requests')
      .select('status')
      .eq('id', requestId)
      .single();

    if (!getError && request) {
      await db.supabase
        .from('requests')
        .update({ status: newStatus })
        .eq('id', requestId);

      // Log status change
      await db.supabase
        .from('request_status_history')
        .insert([{
          request_id: requestId,
          old_status: request.status,
          new_status: newStatus,
          changed_by: req.user.id,
          notes: verificationStatus === 'Verified' ? 'Payment verified' : `Payment rejected: ${verificationNotes}`
        }])
        .catch(err => console.error('Error logging status:', err));
    }

    res.json({
      success: true,
      message: `Receipt ${verificationStatus.toLowerCase()} successfully`
    });

  } catch (error) {
    console.error('Verify receipt error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify receipt'
    });
  }
};

// Download receipt file (admin only)
exports.downloadReceipt = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { requestId } = req.params;

    const { data: receipt, error } = await db.supabase
      .from('payment_receipts')
      .select('file_path')
      .eq('request_id', requestId)
      .single();

    if (error || !receipt || !receipt.file_path) {
      return res.status(404).json({
        success: false,
        message: 'Receipt not found'
      });
    }

    const filePath = receipt.file_path;
    
    // Security check: ensure path is within uploads directory
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    const resolvedPath = path.resolve(filePath);
    
    if (!resolvedPath.startsWith(uploadsDir)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.download(filePath, `receipt-${requestId}${path.extname(filePath)}`);

  } catch (error) {
    console.error('Download receipt error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download receipt'
    });
  }
};
