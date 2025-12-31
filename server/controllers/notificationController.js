const db = require('../config/db');

// Store active admin connections for real-time notifications
let adminConnections = new Map();

// Get admin notifications (recent requests not yet viewed by admin)
exports.getAdminNotifications = async (req, res) => {
  try {
    // Get recent requests (last 24 hours) that are in "Requested" status
    // These are new requests waiting for admin attention
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: requests, error } = await db.supabase
      .from('requests')
      .select(`
        id,
        reference_number,
        status,
        created_at,
        student_id,
        document_templates (
          document_name
        ),
        users (
          first_name,
          last_name,
          email
        )
      `)
      .eq('status', 'Requested')
      .gte('created_at', yesterday)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Notification fetch error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch notifications'
      });
    }

    res.json({
      success: true,
      notifications: requests || [],
      unreadCount: requests?.length || 0
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications'
    });
  }
};

// Get latest request (for checking new submissions)
exports.getLatestRequest = async (req, res) => {
  try {
    const { data: request, error } = await db.supabase
      .from('requests')
      .select(`
        id,
        reference_number,
        status,
        created_at,
        student_id,
        document_templates (
          document_name
        ),
        users (
          first_name,
          last_name,
          email
        )
      `)
      .eq('status', 'Requested')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Fetch latest request error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch latest request'
      });
    }

    res.json({
      success: true,
      request: request || null
    });

  } catch (error) {
    console.error('Get latest request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch latest request'
    });
  }
};

// Mark notifications as read (update request status)
exports.markNotificationsAsRead = async (req, res) => {
  try {
    // In this case, we don't actually mark notifications as "read"
    // since they're based on request status "Requested"
    // When admin changes status, they'll disappear automatically
    res.json({
      success: true,
      message: 'Notifications cleared'
    });

  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark as read'
    });
  }
};
