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
    if (request.status !== 'Requested' && request.status !== 'Verifying') {
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
      
      // Delete the old receipt record
      await db.supabase
        .from('payment_receipts')
        .delete()
        .eq('request_id', requestId);
    }

    // Create new receipt record
    const { data: receipt, error: createError } = await db.supabase
      .from('payment_receipts')
      .insert([{
        request_id: requestId,
        file_path: req.file.path,
        verification_status: 'Pending'
      }])
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

    console.log('✅ Receipt saved to database:', receipt);

    // Update request status
    await db.supabase
      .from('requests')
      .update({ status: 'Verifying' })
      .eq('id', requestId);

    // Log status change
    const { error: historyError } = await db.supabase
      .from('request_status_history')
      .insert([{
        request_id: requestId,
        old_status: request.status,
        new_status: 'Verifying',
        changed_by: studentId,
        notes: 'Payment receipt uploaded'
      }]);
    
    if (historyError) {
      console.error('Error logging status:', historyError);
    }

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
      newStatus = 'Processing';
    } else {
      newStatus = 'Verifying'; // Keep as verifying for rejection
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

// Delete receipt (admin only)
exports.deleteReceipt = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { requestId } = req.params;
    const { reason } = req.body;

    console.log('🗑️ Attempting to delete receipt for requestId:', requestId);

    // Get receipt details first
    const { data: receipt, error: receiptError } = await db.supabase
      .from('payment_receipts')
      .select('*')
      .eq('request_id', requestId)
      .single();

    if (receiptError) {
      console.error('❌ Receipt fetch error:', receiptError);
      return res.status(404).json({
        success: false,
        message: 'Receipt not found: ' + receiptError.message
      });
    }

    if (!receipt) {
      console.error('❌ Receipt not found for requestId:', requestId);
      return res.status(404).json({
        success: false,
        message: 'Receipt not found'
      });
    }

    console.log('✅ Found receipt:', receipt.id);

    // Get request details to notify student later
    const { data: request, error: requestError } = await db.supabase
      .from('requests')
      .select('student_id, reference_number, status')
      .eq('id', requestId)
      .single();

    if (requestError || !request) {
      console.error('❌ Request fetch error:', requestError);
      return res.status(404).json({
        success: false,
        message: 'Request not found: ' + (requestError?.message || 'Unknown error')
      });
    }

    console.log('✅ Found request:', request.reference_number);

    // Delete file from disk (non-critical, continue if fails)
    if (receipt.file_path) {
      try {
        await fs.unlink(receipt.file_path);
        console.log('✅ File deleted from disk:', receipt.file_path);
      } catch (fileError) {
        console.warn('⚠️ Could not delete file from disk:', fileError.message);
        // Continue even if file deletion fails
      }
    }

    // Delete receipt record from database
    console.log('🗑️ Deleting receipt record from database...');
    const { error: deleteError } = await db.supabase
      .from('payment_receipts')
      .delete()
      .eq('request_id', requestId);

    if (deleteError) {
      console.error('❌ Delete error:', deleteError);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete receipt from database: ' + (deleteError.message || JSON.stringify(deleteError))
      });
    }

    console.log('✅ Receipt deleted successfully');

    // Update request status back to Requested
    console.log('📝 Updating request status to "Requested"...');
    const { error: updateError } = await db.supabase
      .from('requests')
      .update({ status: 'Requested' })
      .eq('id', requestId);

    if (updateError) {
      console.error('⚠️ Status update error:', updateError);
      // Don't fail the whole operation, just log it
    } else {
      console.log('✅ Request status updated');
    }

    // Log status change
    const { error: historyError } = await db.supabase
      .from('request_status_history')
      .insert([{
        request_id: requestId,
        old_status: request.status,
        new_status: 'Requested',
        changed_by: req.user.id,
        notes: `Receipt removed by admin. Reason: ${reason || 'No reason provided'}`
      }]);

    if (historyError) {
      console.error('⚠️ Error logging status change:', historyError.message);
    }

    // Create notification for student
    const notificationMessage = reason 
      ? `Your payment receipt for request ${request.reference_number} has been removed. Reason: ${reason}. Please upload a new receipt.`
      : `Your payment receipt for request ${request.reference_number} has been removed. Please upload a new receipt.`;

    console.log('📧 Creating notification for student...');
    const { error: notificationError } = await db.supabase
      .from('notifications')
      .insert([{
        user_id: request.student_id,
        type: 'receipt_removed',
        title: 'Receipt Removed',
        message: notificationMessage,
        reference_id: requestId,
        is_read: false
      }]);

    if (notificationError) {
      console.error('⚠️ Error creating notification:', notificationError.message);
    }

    console.log('✅ Notification created');

    res.json({
      success: true,
      message: 'Receipt deleted successfully and student has been notified'
    });

  } catch (error) {
    console.error('❌ Unexpected error in deleteReceipt:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete receipt: ' + (error.message || String(error))
    });
  }
};

// View receipt file (student can view their own, admin can view any)
exports.viewReceipt = async (req, res) => {
  try {
    const { requestId } = req.params;
    const studentId = req.user.id;

    // Get receipt with request ownership check
    const { data: receipt, error: receiptError } = await db.supabase
      .from('payment_receipts')
      .select('file_path, request_id')
      .eq('request_id', requestId)
      .single();

    if (receiptError || !receipt) {
      return res.status(404).json({
        success: false,
        message: 'Receipt not found'
      });
    }

    // Verify ownership for students
    if (req.user.role === 'student') {
      const { data: request, error: requestError } = await db.supabase
        .from('requests')
        .select('student_id')
        .eq('id', requestId)
        .single();

      if (requestError || !request || request.student_id !== studentId) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized'
        });
      }
    }

    // Use the stored file path
    let filePath = receipt.file_path;
    
    if (!filePath) {
      return res.status(404).json({
        success: false,
        message: 'Receipt file path not found'
      });
    }
    
    // Normalize the path
    const normalizedPath = path.normalize(filePath);
    
    // Check if file exists
    try {
      const stats = await fs.access(normalizedPath);
    } catch (err) {
      // Try to provide more helpful error
      return res.status(404).json({
        success: false,
        message: 'Receipt file not found',
        attemptedPath: normalizedPath
      });
    }

    // Verify path is within uploads directory (security check)
    const uploadsDir = path.normalize(path.join(__dirname, '..', 'uploads'));
    if (!normalizedPath.startsWith(uploadsDir) && !normalizedPath.toLowerCase().startsWith(uploadsDir.toLowerCase())) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Send the file
    res.sendFile(normalizedPath);

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to load receipt',
      error: error.message
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
    res.status(500).json({
      success: false,
      message: 'Failed to download receipt'
    });
  }
};
