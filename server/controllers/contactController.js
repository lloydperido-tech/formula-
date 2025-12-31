const db = require('../config/db');

// Submit a contact message
exports.submitContactMessage = async (req, res) => {
  try {
    const { fullname, email, message } = req.body;

    // Validation
    if (!fullname || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: fullname, email, and message'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // Insert into Supabase
    const { data, error } = await db.supabase
      .from('contact_messages')
      .insert([
        {
          full_name: fullname,
          email,
          message,
          status: 'new'
        }
      ])
      .select();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to submit contact message'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Thank you for your message! We will get back to you soon.',
      data: data[0]
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while submitting your message'
    });
  }
};

// Get all contact messages (admin only)
exports.getAllContactMessages = async (req, res) => {
  try {
    const { data, error } = await db.supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve contact messages'
      });
    }

    res.json({
      success: true,
      data,
      count: data.length
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while retrieving messages'
    });
  }
};

// Get a specific contact message
exports.getContactMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await db.supabase
      .from('contact_messages')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(404).json({
        success: false,
        message: 'Contact message not found'
      });
    }

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while retrieving the message'
    });
  }
};

// Update contact message status (admin only)
exports.updateContactMessageStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['new', 'read', 'responded'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be: new, read, or responded'
      });
    }

    const { data, error } = await db.supabase
      .from('contact_messages')
      .update({ status, updated_at: new Date() })
      .eq('id', id)
      .select();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update contact message'
      });
    }

    if (data.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Contact message not found'
      });
    }

    res.json({
      success: true,
      message: 'Contact message status updated successfully'
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while updating the message'
    });
  }
};

// Delete a contact message (admin only)
exports.deleteContactMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await db.supabase
      .from('contact_messages')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete contact message'
      });
    }

    res.json({
      success: true,
      message: 'Contact message deleted successfully'
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while deleting the message'
    });
  }
};
