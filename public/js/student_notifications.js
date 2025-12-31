(function() {
  const API_BASE = window.API_BASE || 'http://localhost:3000/api';
  const STATUS_MAP_KEY = 'studentRequestStatusMap';
  const UNREAD_KEY = 'studentUnreadNotifications';

  const state = {
    initialized: false,
    pollingHandle: null,
    statusMap: loadStatusMap(),
    unread: loadUnread(),
  };

  function loadStatusMap() {
    try {
      const raw = localStorage.getItem(STATUS_MAP_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return typeof parsed === 'object' && parsed !== null ? parsed : {};
    } catch (err) {
      console.warn('Unable to load saved status map:', err);
      return {};
    }
  }

  function saveStatusMap(map) {
    try {
      localStorage.setItem(STATUS_MAP_KEY, JSON.stringify(map || {}));
    } catch (err) {
      console.warn('Unable to save status map:', err);
    }
  }

  function loadUnread() {
    try {
      const raw = localStorage.getItem(UNREAD_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      return [];
    }
  }

  function saveUnread(list) {
    try {
      localStorage.setItem(UNREAD_KEY, JSON.stringify(list || []));
    } catch (err) {
      console.warn('Unable to save unread notifications:', err);
    }
  }

  function formatTime(value) {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  function notificationMessage(ref, status, docName) {
    const friendly = status || 'Updated';
    const name = docName || 'document request';
    return `${name} (${ref || 'ref'}) is now ${friendly}`;
  }

  function statusIconClass(status) {
    const s = (status || '').toLowerCase();
    if (s.includes('ready') || s.includes('released') || s.includes('for release') || s.includes('completed')) return 'success';
    if (s.includes('verify') || s.includes('processing')) return 'info';
    if (s.includes('pending') || s.includes('await')) return 'warning';
    if (s.includes('reject') || s.includes('cancel')) return 'danger';
    return 'info';
  }

  async function fetchRequests(isInitial = false) {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE}/requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        console.error('Notifications fetch failed:', response.status, response.statusText);
        return;
      }

      const data = await response.json();
      const requests = data.requests || [];
      const nextStatusMap = {};
      const newlyChanged = [];

      requests.forEach(req => {
        const prev = state.statusMap[req.id];
        const currentStatus = req.status;
        nextStatusMap[req.id] = currentStatus;

        // Only notify on actual status changes after initial baseline
        if (state.initialized && prev && prev !== currentStatus) {
          newlyChanged.push({
            id: req.id,
            reference_number: req.reference_number,
            status: currentStatus,
            document: (req.document_templates && req.document_templates.document_name) || 'Document',
            created_at: req.updated_at || req.created_at
          });
        }
      });

      state.statusMap = nextStatusMap;
      saveStatusMap(nextStatusMap);

      if (!state.initialized) {
        state.initialized = true;
        return;
      }

      if (newlyChanged.length) {
        const formatted = newlyChanged.map(item => ({
          message: notificationMessage(item.reference_number, item.status, item.document),
          time: formatTime(item.created_at),
          reference: item.reference_number,
          status: item.status,
          document: item.document
        }));
        state.unread = [...formatted, ...state.unread].slice(0, 20);
        saveUnread(state.unread);
        renderNotifications();
      }
    } catch (err) {
      console.error('Notifications error:', err);
    }
  }

  function renderNotifications() {
    const badge = document.getElementById('notifBadge');
    const list = document.getElementById('notifList');
    const dashboardList = document.getElementById('dashboardNotifList');
    if (!badge || !list) return;

    const count = state.unread.length;
    badge.style.display = count > 0 ? 'block' : 'none';
    badge.textContent = count > 99 ? '99+' : String(count);

    if (count === 0) {
      list.innerHTML = '<div class="notif-empty">No new notifications</div>';
      if (dashboardList) {
        dashboardList.innerHTML = '<div class="notif-empty">No new notifications</div>';
      }
      return;
    }

    list.innerHTML = state.unread
      .map(n => `
        <div class="notif-item">
          <p>${n.message}</p>
          <span class="notif-time">${n.time || ''}</span>
        </div>
      `)
      .join('');

    if (dashboardList) {
      const top = state.unread.slice(0, 3);
      dashboardList.innerHTML = top.map(n => {
        const iconClass = statusIconClass(n.status);
        const title = n.status || 'Update';
        const desc = n.message || '';
        const time = n.time || '';
        return `
          <div class="dashboard-notif-item">
            <div class="notif-icon ${iconClass}">
              <i class="fa-solid fa-${iconClass === 'success' ? 'check-circle' : iconClass === 'warning' ? 'clock' : iconClass === 'danger' ? 'triangle-exclamation' : 'info-circle'}"></i>
            </div>
            <div class="notif-content">
              <p class="notif-title">${title}</p>
              <p class="notif-desc">${desc}</p>
              <span class="notif-time">${time}</span>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  function toggleNotifications() {
    const dropdown = document.getElementById('notificationsDropdown');
    const profileMenu = document.getElementById('profileMenuDropdown');
    if (profileMenu) profileMenu.style.display = 'none';
    if (!dropdown) return;
    dropdown.style.display = dropdown.style.display === 'none' || dropdown.style.display === '' ? 'block' : 'none';
  }

  function markAllAsRead() {
    const badge = document.getElementById('notifBadge');
    if (badge) badge.style.display = 'none';
    state.unread = [];
    saveUnread([]);
    renderNotifications();
  }

  function closeDropdownOnOutsideClick() {
    document.addEventListener('click', (e) => {
      const dropdown = document.getElementById('notificationsDropdown');
      const notifBtn = document.querySelector('.notifs');
      if (!dropdown || !notifBtn) return;
      const inside = dropdown.contains(e.target) || notifBtn.contains(e.target);
      if (!inside) dropdown.style.display = 'none';
    });
  }

  function startPolling() {
    // Baseline fetch sets initial state without showing notifications
    fetchRequests(true).then(renderNotifications);
    state.pollingHandle = setInterval(() => fetchRequests(false), 6000);
  }

  function init() {
    if (state.initialized && state.pollingHandle) return;
    renderNotifications();
    closeDropdownOnOutsideClick();
    startPolling();
  }

  // Expose controls globally for existing HTML onclick handlers
  window.toggleNotifications = toggleNotifications;
  window.markAllAsRead = markAllAsRead;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
