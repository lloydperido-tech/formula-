const db = require('../config/db');
const fs = require('fs').promises;
const path = require('path');

// Helper to generate reference number
function generateReferenceNumber() {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `${year}-REG-${random}`;
}

// Helper to calculate total price
function calculateTotalPrice(basePrice, pricePerCopy, quantity) {
  const base = parseFloat(basePrice);
  const perCopy = parseFloat(pricePerCopy);
  return base + (perCopy * quantity);
}

// Create new request
exports.createRequest = async (req, res) => {
  try {
    const { templateId, quantity, purpose, formData } = req.body;
    const studentId = req.user.id;

    // Validate inputs
    if (!templateId || !quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid template or quantity'
      });
    }

    // Get template details
    const { data: template, error: templateError } = await db.supabase
      .from('document_templates')
      .select('*')
      .eq('id', templateId)
      .eq('is_active', true)
      .eq('is_deleted', false)
      .single();

    if (templateError || !template) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or inactive template'
      });
    }

    // Calculate total price
    const totalAmount = calculateTotalPrice(
      template.base_price,
      template.price_per_copy,
      quantity
    );

    // Generate reference number
    const referenceNumber = generateReferenceNumber();

    // Create request
    const { data: request, error: createError } = await db.supabase
      .from('requests')
      .insert([{
        student_id: studentId,
        template_id: templateId,
        reference_number: referenceNumber,
        quantity: parseInt(quantity),
        purpose: purpose || null,
        form_data: formData || {},
        total_amount: totalAmount,
        status: 'Pending Payment'
      }])
      .select()
      .single();

    if (createError) {
      console.error('Create request error:', createError);
      return res.status(500).json({
        success: false,
        message: 'Failed to create request'
      });
    }

    // Log status change
    await db.supabase
      .from('request_status_history')
      .insert([{
        request_id: request.id,
        old_status: null,
        new_status: 'Pending Payment',
        changed_by: studentId,
        notes: 'Request created'
      }])
      .catch(err => console.error('Error logging status:', err));

    res.json({
      success: true,
      message: 'Request created successfully',
      request: {
        id: request.id,
        referenceNumber: request.reference_number,
        totalAmount: request.total_amount,
        processingDays: template.processing_days
      }
    });

  } catch (error) {
    console.error('Create request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create request'
    });
  }
};

// Get student's requests
exports.getStudentRequests = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = db.supabase
      .from('requests')
      .select(`
        id,
        reference_number,
        status,
        total_amount,
        quantity,
        purpose,
        created_at,
        updated_at,
        document_templates (
          id,
          document_name,
          document_code,
          processing_days
        )
      `, { count: 'exact' })
      .eq('student_id', studentId);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: requests, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (error) {
      console.error('Get requests error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch requests'
      });
    }

    res.json({
      success: true,
      requests,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil((count || 0) / parseInt(limit)),
        totalItems: count || 0
      }
    });

  } catch (error) {
    console.error('Get requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch requests'
    });
  }
};

// Get request details
exports.getRequestDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = req.user.id;

    // For students, only allow viewing their own requests
    if (req.user.role === 'student') {
      const { data: request, error } = await db.supabase
        .from('requests')
        .select(`
          *,
          document_templates (
            document_name,
            document_code,
            processing_days,
            field_config
          ),
          payment_receipts (
            id,
            file_path,
            verification_status,
            verified_at,
            verification_notes
          )
        `)
        .eq('id', id)
        .eq('student_id', studentId)
        .single();

      if (error || !request) {
        return res.status(404).json({
          success: false,
          message: 'Request not found'
        });
      }

      return res.json({
        success: true,
        request
      });
    }

    // Admins can view any request
    const { data: request, error } = await db.supabase
      .from('requests')
      .select(`
        *,
        document_templates (
          document_name,
          document_code,
          processing_days,
          field_config
        ),
        payment_receipts (
          id,
          file_path,
          verification_status,
          verified_at,
          verification_notes
        ),
        users (
          id,
          email,
          first_name,
          last_name,
          student_number
        )
      `)
      .eq('id', id)
      .single();

    if (error || !request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    res.json({
      success: true,
      request
    });

  } catch (error) {
    console.error('Get request details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch request details'
    });
  }
};

// Get admin request queue
exports.getRequestQueue = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { status, search, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = db.supabase
      .from('requests')
      .select(`
        id,
        reference_number,
        status,
        total_amount,
        quantity,
        created_at,
        updated_at,
        document_templates (
          id,
          document_name,
          document_code
        ),
        users (
          id,
          email,
          first_name,
          last_name,
          student_number
        ),
        payment_receipts (
          id,
          verification_status,
          verified_at
        )
      `, { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`reference_number.ilike.%${search}%,users.email.ilike.%${search}%`);
    }

    const { data: requests, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (error) {
      console.error('Get request queue error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch request queue'
      });
    }

    res.json({
      success: true,
      requests,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil((count || 0) / parseInt(limit)),
        totalItems: count || 0
      }
    });

  } catch (error) {
    console.error('Get request queue error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch request queue'
    });
  }
};

// Update request status
exports.updateRequestStatus = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { id } = req.params;
    const { newStatus, notes } = req.body;

    const validStatuses = [
      'Pending Payment',
      'Payment Submitted',
      'Payment Verified',
      'Processing',
      'For Release',
      'Completed',
      'Cancelled'
    ];

    if (!validStatuses.includes(newStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    // Get current request
    const { data: request, error: fetchError } = await db.supabase
      .from('requests')
      .select('status')
      .eq('id', id)
      .single();

    if (fetchError || !request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    // Update status
    const { error: updateError } = await db.supabase
      .from('requests')
      .update({ 
        status: newStatus,
        payment_verified_at: newStatus === 'Payment Verified' ? new Date().toISOString() : undefined,
        completed_at: newStatus === 'Completed' ? new Date().toISOString() : undefined
      })
      .eq('id', id);

    if (updateError) {
      console.error('Update status error:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Failed to update status'
      });
    }

    // Log status change
    await db.supabase
      .from('request_status_history')
      .insert([{
        request_id: id,
        old_status: request.status,
        new_status: newStatus,
        changed_by: req.user.id,
        notes: notes || null
      }])
      .catch(err => console.error('Error logging status:', err));

    res.json({
      success: true,
      message: 'Status updated successfully'
    });

  } catch (error) {
    console.error('Update request status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update status'
    });
  }
};

// Cancel request
exports.cancelRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = req.user.id;

    // Get request
    const { data: request, error: fetchError } = await db.supabase
      .from('requests')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    // Check authorization (student can only cancel own requests)
    if (req.user.role === 'student' && request.student_id !== studentId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // Can only cancel if pending payment or payment submitted
    if (!['Pending Payment', 'Payment Submitted'].includes(request.status)) {
      return res.status(400).json({
        success: false,
        message: 'Can only cancel requests pending payment'
      });
    }

    // Update status
    const { error: updateError } = await db.supabase
      .from('requests')
      .update({ status: 'Cancelled' })
      .eq('id', id);

    if (updateError) {
      return res.status(500).json({
        success: false,
        message: 'Failed to cancel request'
      });
    }

    // Log status change
    await db.supabase
      .from('request_status_history')
      .insert([{
        request_id: id,
        old_status: request.status,
        new_status: 'Cancelled',
        changed_by: req.user.id,
        notes: 'Cancelled by ' + (req.user.role === 'student' ? 'student' : 'admin')
      }])
      .catch(err => console.error('Error logging status:', err));

    res.json({
      success: true,
      message: 'Request cancelled successfully'
    });

  } catch (error) {
    console.error('Cancel request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel request'
    });
  }
};

// Get request statistics
exports.getStatistics = async (req, res) => {
  try {
    if (req.user.role === 'student') {
      // Student statistics
      const studentId = req.user.id;

      const { count: total } = await db.supabase
        .from('requests')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', studentId);

      const { count: pending } = await db.supabase
        .from('requests')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', studentId)
        .eq('status', 'Pending Payment');

      const { count: completed } = await db.supabase
        .from('requests')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', studentId)
        .eq('status', 'Completed');

      return res.json({
        success: true,
        statistics: {
          totalRequests: total || 0,
          pendingRequests: pending || 0,
          completedRequests: completed || 0
        }
      });
    }

    // Admin statistics
    const statuses = [
      'Pending Payment',
      'Payment Submitted',
      'Payment Verified',
      'Processing',
      'For Release',
      'Completed',
      'Cancelled'
    ];

    const statistics = {};

    for (const status of statuses) {
      const { count } = await db.supabase
        .from('requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', status);
      statistics[status] = count || 0;
    }

    res.json({
      success: true,
      statistics
    });

  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
};
