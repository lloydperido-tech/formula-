const db = require('../config/db');
const fs = require('fs').promises;
const path = require('path');

// Helper to generate reference number with uniqueness guarantee
// Format: YYYY-MMDD-XXXXX where XXXXX starts at 00001 each day
async function generateReferenceNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const datePrefix = `${year}-${month}${day}`;

  try {
    // Get the count of requests created today to determine the starting number
    const { count, error } = await db.supabase
      .from('requests')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', `${year}-${month}-${day}T00:00:00`)
      .lt('created_at', `${year}-${month}-${day}T23:59:59`);

    if (error) {
      console.error('Error counting requests:', error);
      // Fallback: start from a high number if count fails
      const random = Math.floor(Math.random() * 90000) + 10000;
      return `${datePrefix}-${String(random).padStart(5, '0')}`;
    }

    // Start sequential numbering from 1, increment by 1
    const sequentialNumber = (count || 0) + 1;
    const referenceNumber = `${datePrefix}-${String(sequentialNumber).padStart(5, '0')}`;
    
    console.log(`Generated reference number: ${referenceNumber} (daily sequence: ${sequentialNumber})`);
    return referenceNumber;
  } catch (err) {
    console.error('Error generating reference number:', err);
    // Final fallback
    const random = Math.floor(Math.random() * 90000) + 10000;
    return `${datePrefix}-${String(random).padStart(5, '0')}`;
  }
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

    console.log('Creating request:', { studentId, templateId, quantity, purpose });

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

    if (templateError) {
      console.error('Template lookup error:', templateError);
      return res.status(400).json({
        success: false,
        message: 'Invalid or inactive template'
      });
    }

    if (!template) {
      console.error('Template not found for ID:', templateId);
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

    console.log('Template found:', { name: template.document_name, totalAmount });

    // Try to create request with retry on duplicate reference number
    let request = null;
    let createError = null;
    let retries = 5;

    while (retries > 0) {
      // Generate reference number fresh each time
      const referenceNumber = await generateReferenceNumber();

      // Create request
      const result = await db.supabase
        .from('requests')
        .insert([{
          student_id: studentId,
          template_id: templateId,
          reference_number: referenceNumber,
          quantity: parseInt(quantity),
          purpose: purpose || null,
          form_data: formData || {},
          total_amount: totalAmount,
          status: 'Requested'
        }])
        .select()
        .single();

      if (result.error) {
        createError = result.error;
        console.error(`Database insert error (attempt ${6 - retries}):`, createError.message);
        
        // Check if it's a duplicate key error - if so, retry
        if (createError.code === '23505' || createError.message.includes('duplicate key')) {
          retries--;
          if (retries > 0) {
            console.log(`Duplicate key detected, regenerating and retrying... (${retries} attempts left)`);
            // Add a small delay before retrying to let other concurrent requests settle
            await new Promise(resolve => setTimeout(resolve, 50));
            continue;
          }
        }
        
        // If it's not a duplicate key error or we're out of retries, return error
        console.error('Error details:', createError.message, createError.code, createError.details);
        return res.status(500).json({
          success: false,
          message: 'Failed to create request: ' + (createError.message || 'Database error')
        });
      }

      // Success
      request = result.data;
      console.log('Request created successfully:', request.id, 'with reference:', request.reference_number);
      break;
    }

    if (!request) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create request after multiple attempts'
      });
    }

    // Log status change
    const { error: historyError } = await db.supabase
      .from('request_status_history')
      .insert([{
        request_id: request.id,
        old_status: null,
        new_status: 'Requested',
        changed_by: studentId,
        notes: 'Request created'
      }]);

    if (historyError) {
      console.error('Error logging status:', historyError);
      // Don't fail the request if history logging fails
    }

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
      message: 'Failed to create request: ' + (error.message || 'Unknown error')
    });
  }
};

// Get next reference number (for preview)
exports.getNextReferenceNumber = async (req, res) => {
  try {
    const referenceNumber = await generateReferenceNumber();
    res.json({
      success: true,
      referenceNumber
    });
  } catch (error) {
    console.error('Get next reference number error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate reference number'
    });
  }
};

// Get student's requests
exports.getStudentRequests = async (req, res) => {
  try {
    const studentId = req.user.id;
    console.log('Getting requests for student ID:', studentId);
    
    const { status } = req.query;

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
      .order('created_at', { ascending: false });

    console.log('Requests query result:', { count, error, requestCount: requests?.length });

    if (error) {
      console.error('Get requests error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch requests'
      });
    }

    console.log('Returning requests:', requests);

    res.json({
      success: true,
      requests
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
      // Search in reference_number only for nested relations safety
      query = query.ilike('reference_number', `%${search}%`);
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
      'Requested',
      'Verifying',
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
    const updateData = { status: newStatus };
    
    if (newStatus === 'Verifying') {
      updateData.payment_verified_at = new Date().toISOString();
    }
    if (newStatus === 'Completed') {
      updateData.completed_at = new Date().toISOString();
    }

    const { error: updateError } = await db.supabase
      .from('requests')
      .update(updateData)
      .eq('id', id);

    if (updateError) {
      console.error('Update status error:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Failed to update status'
      });
    }

    // Log status change
    const { error: historyError } = await db.supabase
      .from('request_status_history')
      .insert([{
        request_id: id,
        old_status: request.status,
        new_status: newStatus,
        changed_by: req.user.id,
        notes: notes || null
      }]);

    if (historyError) {
      console.error('Error logging status history:', historyError);
      // Don't fail the response - status was updated successfully
    }

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

    // Can only cancel if requested or verifying
    if (!['Requested', 'Verifying'].includes(request.status)) {
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
