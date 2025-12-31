const API_BASE = 'http://localhost:3000/api';
const feesTableBody = document.getElementById('feesTableBody');
const notifDropdown = document.getElementById('notificationsDropdown');
const notifList = document.getElementById('notifList');
const notifBadge = document.getElementById('notifBadge');
const adminNameEl = document.getElementById('adminName');
let notificationPollInterval = null;
let lastNotificationCount = 0;

// Init
window.addEventListener('DOMContentLoaded', () => {
  setAdminName();
  loadDocumentFees();
  initNotifications();

  document.addEventListener('click', (e) => {
    const notifBtn = document.querySelector('.notifs');
    if (!notifDropdown || !notifBtn) return;
    const clickedInside = notifDropdown.contains(e.target) || notifBtn.contains(e.target);
    if (!clickedInside) notifDropdown.style.display = 'none';
  });
});

function setAdminName() {
  const stored = localStorage.getItem('adminName') || localStorage.getItem('userName') || 'Admin';
  if (adminNameEl) adminNameEl.textContent = stored;
}

async function loadDocumentFees() {
  if (!feesTableBody) return;
  try {
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    const resp = await fetch(`${API_BASE}/templates/active`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });
    if (!resp.ok) throw new Error('Failed to load document fees');
    const data = await resp.json();
    const templates = data.templates || data.data || [];

    if (!Array.isArray(templates) || templates.length === 0) {
      feesTableBody.innerHTML = '<tr><td colspan="4" class="loading-row">No documents available</td></tr>';
      return;
    }

    templates.sort((a, b) => (a.document_name || '').localeCompare(b.document_name || ''));

    feesTableBody.innerHTML = templates.map(t => {
      const base = formatMoney(t.base_price);
      const extra = formatMoney(t.price_per_copy);
      const leadTime = formatProcessingDays(t.processing_days);
      return `
        <tr>
          <td>${t.document_name || 'Document'}</td>
          <td>₱${base}</td>
          <td>₱${extra} each</td>
          <td>${leadTime}</td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.error('Error loading document fees:', err);
    feesTableBody.innerHTML = '<tr><td colspan="4" class="loading-row" style="color:#d32f2f;">Failed to load document fees. Please refresh.</td></tr>';
  }
}

function formatProcessingDays(days) {
  if (!days) return 'N/A';
  if (typeof days === 'string' && days.includes('-')) return days;
  const num = parseInt(days, 10);
  if (Number.isNaN(num)) return 'N/A';
  const min = Math.max(1, num - 1);
  const max = num + 1;
  return `${min}-${max} days`;
}

function formatMoney(value) {
  const num = Number(value) || 0;
  return num.toFixed(2);
}

function toggleNotifications() {
  if (!notifDropdown) return;
  notifDropdown.style.display = notifDropdown.style.display === 'none' || notifDropdown.style.display === '' ? 'block' : 'none';
}

function markAllAsRead() {
  if (notifBadge) notifBadge.style.display = 'none';
  document.querySelectorAll('.notif-item').forEach(item => item.classList.add('read'));
}

// ===== NOTIFICATIONS SYSTEM =====

// Initialize notifications polling
function initNotifications() {
  console.log('Initializing notifications system...');
  loadNotifications();
  
  // Poll for new notifications every 5 seconds
  notificationPollInterval = setInterval(() => {
    loadNotifications();
  }, 5000);
}

// Load notifications from API
async function loadNotifications() {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    const response = await fetch(`${API_BASE}/admin/notifications`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('Failed to load notifications:', response.status);
      return;
    }

    const data = await response.json();
    if (data.success && Array.isArray(data.notifications)) {
      updateNotificationBadge(data.notifications);
      
      // Check if there are new notifications since last time
      if (data.notifications.length > lastNotificationCount) {
        const newCount = data.notifications.length - lastNotificationCount;
        if (newCount > 0 && lastNotificationCount > 0) {
          showNewRequestNotification(data.notifications[0]);
        }
        lastNotificationCount = data.notifications.length;
      }
    }
  } catch (error) {
    console.error('Error loading notifications:', error);
  }
}

// Update the notification badge
function updateNotificationBadge(notifications) {
  if (!notifBadge || !notifList) return;

  const count = notifications.length;
  
  // Show/hide badge
  if (count > 0) {
    notifBadge.style.display = 'block';
    notifBadge.textContent = count > 99 ? '99+' : count;
  } else {
    notifBadge.style.display = 'none';
  }

  // Update notification list
  if (count === 0) {
    notifList.innerHTML = '<div class="notif-empty">No new requests</div>';
  } else {
    notifList.innerHTML = notifications.map(notif => {
      const studentName = notif.users
        ? `${notif.users.first_name || ''} ${notif.users.last_name || ''}`.trim()
        : 'Unknown Student';
      const docName = notif.document_templates?.document_name || 'Unknown Document';
      const createdAt = new Date(notif.created_at).toLocaleTimeString();
      
      return `
        <div class="notif-item">
          <div class="notif-content">
            <strong>${studentName}</strong>
            <p>${docName}</p>
            <small>Ref: ${notif.reference_number}</small>
            <small style="display: block; color: #999;">${createdAt}</small>
          </div>
        </div>
      `;
    }).join('');
  }
}

// Show toast notification for new request
function showNewRequestNotification(notification) {
  const studentName = notification.users
    ? `${notification.users.first_name || ''} ${notification.users.last_name || ''}`.trim()
    : 'A student';
  const docName = notification.document_templates?.document_name || 'a document';
  
  const message = `📨 New request: ${studentName} requested ${docName}`;
  
  // Show alert
  alert(message);
  
  console.log('New request notification:', notification.reference_number);
}

function logout() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('token');
  window.location.href = 'login.html';
}
