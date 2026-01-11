const db = require('../config/db');
const fs = require('fs').promises;
const path = require('path');

// Create new document template
exports.createTemplate = async (req, res) => {
  try {
    const {
      documentName,
      documentCode,
      basePrice,
      pricePerCopy,
      processingDays,
      fieldConfig
    } = req.body;

    // Validate required fields
    if (!documentName || !documentCode || !basePrice || !pricePerCopy || !processingDays) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Check if template file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'PDF template file is required'
      });
    }

    // Parse field configuration
    let parsedFieldConfig;
    try {
      parsedFieldConfig = typeof fieldConfig === 'string' ? JSON.parse(fieldConfig) : fieldConfig;
    } catch (error) {
      // Delete uploaded file if JSON parse fails
      await fs.unlink(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Invalid field configuration JSON'
      });
    }

    // Check if document code already exists
    const { data: existing, error: existError } = await db.supabase
      .from('document_templates')
      .select('id')
      .eq('document_code', documentCode)
      .eq('is_deleted', false)
      .single();

    if (existing) {
      await fs.unlink(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Document code already exists'
      });
    }

    // Insert template
    const { data: template, error: createError } = await db.supabase
      .from('document_templates')
      .insert([{
        document_name: documentName,
        document_code: documentCode,
        template_file_path: req.file.path,
        field_config: parsedFieldConfig,
        base_price: parseFloat(basePrice),
        price_per_copy: parseFloat(pricePerCopy),
        processing_days: processingDays,
        is_active: true,
        version: 1
      }])
      .select()
      .single();

    if (createError) {
      await fs.unlink(req.file.path);
      console.error('Create template error:', createError);
      return res.status(500).json({
        success: false,
        message: 'Failed to create template'
      });
    }

    res.json({
      success: true,
      message: 'Template created successfully',
      templateId: template.id
    });

  } catch (error) {
    console.error('Create template error:', error);
    
    // Clean up uploaded file on error
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError);
      }
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create template'
    });
  }
};

// Get all templates (with pagination and filters)
exports.listTemplates = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      active_only = 'false',
      search = ''
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = db.supabase
      .from('document_templates')
      .select('id, document_name, document_code, base_price, price_per_copy, processing_days, is_active, version, created_at, updated_at', { count: 'exact' })
      .eq('is_deleted', false);

    if (active_only === 'true') {
      query = query.eq('is_active', true);
    }

    if (search) {
      query = query.or(`document_name.ilike.%${search}%,document_code.ilike.%${search}%`);
    }

    const { data: templates, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (error) {
      console.error('List templates error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch templates'
      });
    }

    res.json({
      success: true,
      templates,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil((count || 0) / parseInt(limit)),
        totalItems: count || 0,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('List templates error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch templates'
    });
  }
};

// Get active templates (for student request form)
exports.getActiveTemplates = async (req, res) => {
  try {
    const { data: templates, error } = await db.supabase
      .from('document_templates')
      .select('id, document_name, document_code, base_price, price_per_copy, processing_days, field_config')
      .eq('is_active', true)
      .eq('is_deleted', false)
      .order('document_name', { ascending: true });

    if (error) {
      console.error('Get active templates error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch active templates'
      });
    }

    res.json({
      success: true,
      templates
    });

  } catch (error) {
    console.error('Get active templates error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active templates'
    });
  }
};

// Get template details by ID
exports.getTemplateById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: template, error } = await db.supabase
      .from('document_templates')
      .select('*')
      .eq('id', id)
      .eq('is_deleted', false)
      .single();

    if (error || !template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    res.json({
      success: true,
      template
    });

  } catch (error) {
    console.error('Get template by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch template details'
    });
  }
};

// Update template configuration
exports.updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      documentName,
      basePrice,
      pricePerCopy,
      processingDays,
      fieldConfig
    } = req.body;

    // Check if template exists
    const { data: existing, error: fetchError } = await db.supabase
      .from('document_templates')
      .select('id, template_file_path, version')
      .eq('id', id)
      .eq('is_deleted', false)
      .single();

    if (fetchError || !existing) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    const updates = {};
    let incrementVersion = false;

    if (documentName) {
      updates.document_name = documentName;
    }

    if (basePrice !== undefined) {
      updates.base_price = parseFloat(basePrice);
    }

    if (pricePerCopy !== undefined) {
      updates.price_per_copy = parseFloat(pricePerCopy);
    }

    if (processingDays !== undefined) {
      // Keep as string if it's a range (e.g., "4-6"), otherwise parse as integer
      updates.processing_days = processingDays;
    }

    if (fieldConfig) {
      let parsedFieldConfig;
      try {
        parsedFieldConfig = typeof fieldConfig === 'string' ? JSON.parse(fieldConfig) : fieldConfig;
        updates.field_config = parsedFieldConfig;
        incrementVersion = true;
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid field configuration JSON'
        });
      }
    }

    // Handle new template file upload
    if (req.file) {
      updates.template_file_path = req.file.path;
      incrementVersion = true;

      // Delete old file
      try {
        await fs.unlink(existing.template_file_path);
      } catch (error) {
        console.error('Error deleting old template file:', error);
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    if (incrementVersion) {
      updates.version = existing.version + 1;
    }

    const { error: updateError } = await db.supabase
      .from('document_templates')
      .update(updates)
      .eq('id', id);

    if (updateError) {
      console.error('Update template error:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Failed to update template'
      });
    }

    res.json({
      success: true,
      message: 'Template updated successfully'
    });

  } catch (error) {
    console.error('Update template error:', error);
    
    // Clean up uploaded file on error
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError);
      }
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update template'
    });
  }
};

// Toggle template active status
exports.toggleTemplateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (isActive === undefined) {
      return res.status(400).json({
        success: false,
        message: 'isActive field is required'
      });
    }

    const { error } = await db.supabase
      .from('document_templates')
      .update({ is_active: isActive })
      .eq('id', id)
      .eq('is_deleted', false);

    if (error) {
      console.error('Toggle template status error:', error);
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    res.json({
      success: true,
      message: `Template ${isActive ? 'activated' : 'deactivated'} successfully`
    });

  } catch (error) {
    console.error('Toggle template status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update template status'
    });
  }
};

// Soft delete template
exports.deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if template has active requests
    const { count, error: countError } = await db.supabase
      .from('requests')
      .select('*', { count: 'exact', head: true })
      .eq('template_id', id)
      .in('status', ['Pending Payment', 'Payment Submitted', 'Payment Verified', 'Processing', 'For Release']);

    if (countError) {
      console.error('Error checking requests:', countError);
      return res.status(500).json({
        success: false,
        message: 'Failed to check active requests'
      });
    }

    if ((count || 0) > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete template with active requests'
      });
    }

    // Soft delete
    const { error: deleteError } = await db.supabase
      .from('document_templates')
      .update({ is_deleted: true, is_active: false })
      .eq('id', id);

    if (deleteError) {
      console.error('Delete template error:', deleteError);
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    res.json({
      success: true,
      message: 'Template deleted successfully'
    });

  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete template'
    });
  }
};
