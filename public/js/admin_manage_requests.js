const API_BASE = 'http://localhost:3000/api';
let allRequests = [];
let currentRequestId = null;
let receiptObjectUrl = null;
let lastReceiptStatus = null;
let lastRequestStatus = null;
let notificationPollInterval = null;
let lastNotificationCount = 0;

document.addEventListener('DOMContentLoaded', () => {
  hydrateAdminName();
  setupSearch();
  loadRequests();
  setupModalListeners();
  initNotifications();
});

async function loadRequests(searchTerm = '') {
  const tbody = document.getElementById('requestsBody');
  if (tbody) tbody.innerHTML = '<tr><td colspan="8" class="loading-row">Loading requests...</td></tr>';

  try {
    const token = localStorage.getItem('authToken');
    const url = new URL(`${API_BASE}/admin/queue`);
    url.searchParams.set('limit', '300');
    if (searchTerm) url.searchParams.set('search', searchTerm);

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    const payload = await response.json();
    if (!response.ok) throw new Error(payload.message || 'Failed to load requests');

    const rawList = extractRequestList(payload);
    allRequests = normalizeRequests(rawList);
    renderRequests(allRequests);
    updateSummary(allRequests.length, payload.pagination?.totalItems || allRequests.length);
  } catch (err) {
    console.error('Manage requests load error:', err);
    if (tbody) tbody.innerHTML = '<tr><td colspan="8" class="loading-row">Unable to load requests</td></tr>';
    updateSummary(0, 0);
  }
}

function renderRequests(list) {
  const tbody = document.getElementById('requestsBody');
  if (!tbody) return;

  if (!list.length) {
    tbody.innerHTML = '<tr><td colspan="8" class="loading-row">No requests found</td></tr>';
    return;
  }

  tbody.innerHTML = list
    .map(
      (item) => `
    <tr>
      <td><strong>${item.reference_number}</strong></td>
      <td>${item.student_name || 'N/A'}</td>
      <td>${item.student_number || 'N/A'}</td>
      <td>${item.program || 'N/A'}</td>
      <td>${item.document_name || 'N/A'}</td>
      <td>${formatDate(item.created_at) || 'N/A'}</td>
      <td><span class="status-pill ${statusToClass(item.status)}">${item.status || 'Unknown'}</span></td>
      <td><a class="action-link" href="#" onclick="openDetailsModal('${item.id}', event); return false;">View</a></td>
    </tr>
  `
    )
    .join('');
}

function updateSummary(showing, total) {
  const summary = document.getElementById('summaryText');
  if (summary) summary.textContent = `Showing ${showing} of ${total} requests`;
}

function setupSearch() {
  const searchInput = document.getElementById('searchRef');
  const clearBtn = document.getElementById('clearSearch');
  if (!searchInput || !clearBtn) return;

  const runSearch = debounce(() => {
    const term = searchInput.value.trim();
    loadRequests(term);
  }, 300);

  searchInput.addEventListener('input', runSearch);
  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    loadRequests('');
    searchInput.focus();
  });
}

function extractRequestList(payload) {
  if (!payload || typeof payload !== 'object') return [];
  const candidates = [payload.requests, payload.data?.requests, payload.data];
  return candidates.find(Array.isArray) || [];
}

function normalizeRequest(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const user = raw.users || raw.user || {};
  const doc = raw.document_templates || raw.documentTemplate || {};

  const studentName =
    raw.student_name ||
    raw.student_full_name ||
    [user.first_name, user.last_name].filter(Boolean).join(' ').trim();

  return {
    ...raw,
    reference_number: raw.reference_number || raw.referenceNumber || 'N/A',
    student_name: studentName || user.email || 'N/A',
    student_number: raw.student_number || user.student_number || raw.student_id || 'N/A',
    program: raw.program || raw.course || user.program || user.course || 'N/A',
    document_name: raw.document_name || doc.document_name || doc.document_code || 'Unknown',
    status: raw.status || 'Unknown',
  };
}

function normalizeRequests(list) {
  if (!Array.isArray(list)) return [];
  return list.map(normalizeRequest).filter(Boolean);
}

function statusToClass(status) {
  if (!status) return '';
  return status.toLowerCase().replace(/\s+/g, '-');
}

function formatDate(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' });
}

function debounce(fn, wait = 300) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

function hydrateAdminName() {
  const el = document.getElementById('adminName');
  if (!el) return;

  const cached = localStorage.getItem('adminName');
  if (cached) {
    el.textContent = cached;
    return;
  }

  el.textContent = 'Admin';
}

// Notification helpers (match other admin pages)
function toggleNotifications() {
  const dropdown = document.getElementById('notificationsDropdown');
  if (!dropdown) return;
  dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
}

function markAllAsRead() {
  const badge = document.getElementById('notifBadge');
  if (badge) badge.style.display = 'none';
}

function logout() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('token');
  window.location.href = 'login.html';
}

// Modal and Details Functionality
function setupModalListeners() {
  const updateStatusBtn = document.getElementById('updateStatusBtn');
  if (updateStatusBtn) {
    updateStatusBtn.addEventListener('click', updateRequestStatus);
  }

  const reloadReceiptBtn = document.getElementById('reloadReceiptBtn');
  if (reloadReceiptBtn) {
    reloadReceiptBtn.addEventListener('click', () => {
      if (currentRequestId) {
        loadReceiptPreview(currentRequestId, { preserveStatus: true, requestStatus: lastRequestStatus });
      }
    });
  }
}

async function openDetailsModal(requestId, event) {
  if (event) event.preventDefault();

  if (!requestId) {
    console.error('No request ID provided');
    alert('Invalid request');
    return;
  }

  currentRequestId = requestId;
  resetReceiptSection();
  const modal = document.getElementById('requestDetailsModal');
  if (!modal) return;

  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE}/requests/details/${requestId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error('Failed to load request details');

    const payload = await response.json();
    const request = payload.request || payload.data;
    if (!request) throw new Error('Invalid request data');

    populateDetailsModal(request);
    lastRequestStatus = request.status || null;
    await loadReceiptPreview(request.id || requestId, { requestStatus: lastRequestStatus });
    modal.style.display = 'block';
  } catch (err) {
    console.error('Open details error:', err);
    alert('Unable to load request details: ' + err.message);
  }
}

function populateDetailsModal(request) {
  const user = request.users || request.user || {};
  const doc = request.document_templates || request.documentTemplate || {};

  document.getElementById('detailRefNum').textContent = request.reference_number || '-';
  document.getElementById('detailStatus').textContent = request.status || '-';
  document.getElementById('detailStatus').className = `detail-value status-badge ${statusToClass(request.status)}`;
  document.getElementById('detailDocument').textContent = request.document_name || doc.document_name || '-';
  document.getElementById('detailQuantity').textContent = request.quantity || '-';
  document.getElementById('detailAmount').textContent = `${(request.total_amount || 0).toFixed(2)}`;
  document.getElementById('detailSubmitDate').textContent = formatDate(request.created_at) || '-';

  document.getElementById('detailStudentName').textContent =
    request.student_name || [user.first_name, user.last_name].filter(Boolean).join(' ') || '-';
  document.getElementById('detailStudentEmail').textContent = request.student_email || user.email || '-';
  document.getElementById('detailStudentId').textContent = request.student_number || user.student_number || '-';
  document.getElementById('detailProgram').textContent = request.program || user.program || '-';

  document.getElementById('newStatus').value = '';
  document.getElementById('statusNotes').value = '';
}

function resetReceiptSection(message = 'No receipt uploaded yet.') {
  const placeholder = document.getElementById('receiptPlaceholder');
  const image = document.getElementById('receiptImage');
  const statusEl = document.getElementById('receiptStatusText');
  const uploadedEl = document.getElementById('receiptUploadedAt');
  const notesEl = document.getElementById('receiptNotes');
  const viewLink = document.getElementById('viewReceiptLink');

  lastReceiptStatus = null;
  lastRequestStatus = null;

  if (receiptObjectUrl) {
    URL.revokeObjectURL(receiptObjectUrl);
    receiptObjectUrl = null;
  }

  if (placeholder) {
    placeholder.textContent = message;
    placeholder.style.display = 'block';
  }

  if (image) {
    image.src = '';
    image.style.display = 'none';
  }

  if (statusEl) {
    statusEl.textContent = 'No receipt';
    statusEl.className = 'detail-value status-pill receipt-status-pill neutral';
  }

  if (uploadedEl) uploadedEl.textContent = '';
  if (notesEl) notesEl.textContent = '';

  if (viewLink) {
    viewLink.href = '#';
    viewLink.style.display = 'none';
  }
}

function setReceiptStatusLabel(statusText) {
  const statusEl = document.getElementById('receiptStatusText');
  if (!statusEl) return;

  const cleanStatus = (statusText || 'Pending').toString();
  const normalized = statusToClass(cleanStatus) || 'pending';
  const lowered = cleanStatus.toLowerCase();
  let knownClass = 'pending';

  if (lowered.includes('no receipt')) {
    knownClass = 'neutral';
  } else if (['verified'].includes(normalized)) {
    knownClass = 'verified';
  } else if (['rejected', 'cancelled'].includes(normalized)) {
    knownClass = 'rejected';
  } else if (['for-release', 'completed'].includes(normalized)) {
    knownClass = 'verified';
  } else {
    knownClass = 'pending';
  }
  statusEl.textContent = cleanStatus;
  statusEl.className = `detail-value status-pill receipt-status-pill ${knownClass}`;
}

function resolveReceiptStatus(metaStatus, requestStatus) {
  const metaNorm = statusToClass(metaStatus || '');

  if (['verified', 'rejected'].includes(metaNorm)) return metaStatus;
  if (requestStatus) return requestStatus;
  if (metaStatus) return metaStatus;
  return 'Pending';
}

async function loadReceiptPreview(requestId, options = {}) {
  const { preserveStatus = false, requestStatus = null } = options;
  lastRequestStatus = requestStatus || lastRequestStatus;

  if (!preserveStatus) {
    resetReceiptSection('No receipt uploaded yet.');
  } else {
    const placeholder = document.getElementById('receiptPlaceholder');
    if (placeholder) placeholder.textContent = 'Reloading receipt...';
  }

  // Initialize the status pill after reset so it reflects the latest request status
  setReceiptStatusLabel(lastRequestStatus || 'Pending');

  if (!requestId) return;

  try {
    const token = localStorage.getItem('authToken');
    const metaResponse = await fetch(`${API_BASE}/receipts/${requestId}/receipt`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!metaResponse.ok) {
      if (!preserveStatus) setReceiptStatusLabel(lastReceiptStatus || lastRequestStatus || 'Pending');
      return;
    }

    const metaPayload = await metaResponse.json();
    const receipt = metaPayload.receipt || metaPayload.data || metaPayload;

    if (!receipt) {
      if (!preserveStatus) setReceiptStatusLabel(lastReceiptStatus || lastRequestStatus || 'Pending');
      return;
    }

    const uploaded = formatDate(receipt.uploaded_at || receipt.created_at || receipt.updated_at);
    const notes = receipt.verification_notes || '';

    const uploadedEl = document.getElementById('receiptUploadedAt');
    const notesEl = document.getElementById('receiptNotes');
    if (uploadedEl) uploadedEl.textContent = uploaded || '';
    if (notesEl) notesEl.textContent = notes;

    lastReceiptStatus = resolveReceiptStatus(receipt.verification_status, lastRequestStatus);
    setReceiptStatusLabel(lastReceiptStatus);

    const fileResponse = await fetch(`${API_BASE}/receipts/${requestId}/receipt/file`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!fileResponse.ok) {
      const placeholder = document.getElementById('receiptPlaceholder');
      if (placeholder) placeholder.textContent = 'Receipt metadata found but file could not be loaded.';
      return;
    }

    const blob = await fileResponse.blob();
    receiptObjectUrl = URL.createObjectURL(blob);

    const viewLink = document.getElementById('viewReceiptLink');
    if (viewLink) {
      viewLink.href = receiptObjectUrl;
      viewLink.style.display = 'inline-block';
      viewLink.textContent = blob.type && blob.type.includes('pdf') ? 'Download receipt' : 'Open receipt';
    }

    const image = document.getElementById('receiptImage');
    const placeholder = document.getElementById('receiptPlaceholder');

    if (blob.type && blob.type.startsWith('image/') && image) {
      image.src = receiptObjectUrl;
      image.style.display = 'block';
      if (placeholder) placeholder.style.display = 'none';
    } else if (placeholder) {
      placeholder.textContent = 'Receipt uploaded. Use the link to view or download.';
      placeholder.style.display = 'block';
    }
  } catch (err) {
    console.error('Load receipt preview error:', err);
    const placeholder = document.getElementById('receiptPlaceholder');
    if (placeholder) placeholder.textContent = 'Unable to load receipt.';
  }
}

function closeDetailsModal() {
  const modal = document.getElementById('requestDetailsModal');
  if (modal) modal.style.display = 'none';
  resetReceiptSection();
  currentRequestId = null;
}

async function updateRequestStatus() {
  if (!currentRequestId) {
    alert('No request selected');
    return;
  }

  const newStatus = document.getElementById('newStatus').value.trim();
  const notes = document.getElementById('statusNotes').value.trim();

  if (!newStatus) {
    alert('Please select a new status');
    return;
  }

  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      alert('Authentication required');
      return;
    }

    const payload = {
      newStatus,
      notes: notes || undefined,
    };

    const response = await fetch(`${API_BASE}/admin/requests/${currentRequestId}/status`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || data.error || `Server error: ${response.statusText}`);
    }

    alert('Status updated successfully');
    closeDetailsModal();
    loadRequests();
  } catch (err) {
    console.error('Update status error:', err);
    alert('Unable to update status: ' + err.message);
  }
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
          // Auto-reload the requests table to show new request
          loadRequests();
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
  const badge = document.getElementById('notifBadge');
  const notifList = document.getElementById('notifList');
  
  if (!badge || !notifList) return;

  const count = notifications.length;
  
  // Show/hide badge
  if (count > 0) {
    badge.style.display = 'block';
    badge.textContent = count > 99 ? '99+' : count;
  } else {
    badge.style.display = 'none';
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

// Toggle notifications dropdown
function toggleNotifications() {
  const dropdown = document.getElementById('notificationsDropdown');
  if (dropdown) {
    dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
  }
}

// Mark all notifications as read (clear badge)
function markAllAsRead() {
  const badge = document.getElementById('notifBadge');
  if (badge) {
    badge.style.display = 'none';
  }
}

