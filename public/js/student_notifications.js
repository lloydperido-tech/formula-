(function() {
  // Default to same-origin API unless window.API_BASE overrides it
  const API_BASE = window.API_BASE || '';
  const STATUS_MAP_KEY = 'studentRequestStatusMap';
  const UNREAD_KEY = 'studentUnreadNotifications';
  const LAST_CHECK_KEY = 'studentNotifLastCheckedAt';
  const LAST_READ_KEY = 'studentNotifLastReadAt';
  const COOKIE_DAYS = 30;

  function getUserId() {
    try {
      const user = JSON.parse(localStorage.getItem('user') || localStorage.getItem('userInfo') || '{}');
      return user.id || user.userId || 'student';
    } catch (e) {
      return 'student';
    }
  }

  function cookieKey(base) {
    return `${base}_${getUserId()}`;
  }

  function setCookie(name, value, days) {
    const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value || '')}; expires=${expires}; path=/`;
  }

  function getCookie(name) {
    const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : '';
  }

  const state = {
    initialized: false,
    pollingHandle: null,
    statusMap: loadStatusMap(),
    unread: loadUnread(),
    lastCheckedAt: loadLastChecked(),
    lastReadAt: loadLastRead()
  };

  function loadStatusMap() {
    try {
      const raw = localStorage.getItem(STATUS_MAP_KEY) || getCookie(cookieKey(STATUS_MAP_KEY));
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
      setCookie(cookieKey(STATUS_MAP_KEY), JSON.stringify(map || {}), COOKIE_DAYS);
    } catch (err) {
      console.warn('Unable to save status map:', err);
    }
  }

  function loadUnread() {
    try {
      const raw = localStorage.getItem(UNREAD_KEY) || getCookie(cookieKey(UNREAD_KEY));
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
      setCookie(cookieKey(UNREAD_KEY), JSON.stringify(list || []), COOKIE_DAYS);
    } catch (err) {
      console.warn('Unable to save unread notifications:', err);
    }
  }

  function loadLastRead() {
    return localStorage.getItem(LAST_READ_KEY) || getCookie(cookieKey(LAST_READ_KEY)) || '';
  }

  function saveLastRead(timestamp) {
    try {
      localStorage.setItem(LAST_READ_KEY, timestamp || '');
      setCookie(cookieKey(LAST_READ_KEY), timestamp || '', COOKIE_DAYS);
    } catch (err) {
      console.warn('Unable to save last read timestamp:', err);
    }
  }

  function loadLastChecked() {
    const value = localStorage.getItem(LAST_CHECK_KEY);
    return value || '';
  }

  function saveLastChecked(timestamp) {
    try {
      localStorage.setItem(LAST_CHECK_KEY, timestamp || '');
    } catch (err) {
      console.warn('Unable to save last checked timestamp:', err);
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
    // Accept either authToken or token since login stores the latter
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE}/api/requests`, {
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
      const lastChecked = state.lastCheckedAt ? new Date(state.lastCheckedAt).getTime() : 0;
      const readCutoff = state.lastReadAt ? new Date(state.lastReadAt).getTime() : 0;

      requests.forEach(req => {
        const prev = state.statusMap[req.id];
        const currentStatus = req.status;
        nextStatusMap[req.id] = currentStatus;

        // Allow detection on first fetch if we already have a stored baseline
        const hasPrev = typeof prev !== 'undefined';
        const changed = hasPrev && prev !== currentStatus;

        // Also surface changes that occurred while the user was away using updated_at
        const updatedTime = req.updated_at ? new Date(req.updated_at).getTime() : 0;
        const changedWhileAway = !hasPrev && updatedTime && updatedTime > lastChecked;

        const isNewEnough = !readCutoff || updatedTime > readCutoff;

        if ((state.initialized || isInitial) && (changed || changedWhileAway) && isNewEnough) {
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
      saveLastChecked(new Date().toISOString());

      if (!state.initialized) {
        state.initialized = true;
      }

      if (newlyChanged.length) {
        const formatted = newlyChanged.map(item => ({
          id: item.id,
          message: notificationMessage(item.reference_number, item.status, item.document),
          time: formatTime(item.created_at),
          reference: item.reference_number,
          status: item.status,
          document: item.document,
          createdAt: item.created_at || new Date().toISOString()
        }));
          state.unread = [...formatted, ...state.unread].slice(0, 5);
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

    const readCutoff = state.lastReadAt ? new Date(state.lastReadAt).getTime() : 0;
    const unreadCount = state.unread.filter(n => {
      const ts = n.createdAt ? new Date(n.createdAt).getTime() : 0;
      return !readCutoff || ts > readCutoff;
    }).length;

    const count = unreadCount;
    badge.style.display = count > 0 ? 'block' : 'none';
    badge.textContent = count > 99 ? '99+' : String(count);

    // Always show the recent notifications list, even if marked read
    if (!state.unread.length) {
      list.innerHTML = '<div class="notif-empty">No notifications yet</div>';
      if (dashboardList) {
        dashboardList.innerHTML = '<div class="notif-empty">No notifications yet</div>';
      }
      return;
    }

    const MAX_DISPLAY = 5;
    const displayedNotifs = state.unread.slice(0, MAX_DISPLAY);
    
    list.innerHTML = displayedNotifs
    .map(n => `
      <div class="notif-item" data-request-id="${n.id || ''}" data-reference="${n.reference || ''}">
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
          <div class="dashboard-notif-item" data-request-id="${n.id || ''}" data-reference="${n.reference || ''}">
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
      
      if (dropdown.style.display === 'none' || dropdown.style.display === '') {
        dropdown.style.display = 'block';
        
        // Position dropdown relative to button
        const notifBtn = document.querySelector('.notifs');
        if (notifBtn) {
          const rect = notifBtn.getBoundingClientRect();
          dropdown.style.position = 'fixed';
          dropdown.style.top = (rect.bottom + 10) + 'px';
          dropdown.style.right = (window.innerWidth - rect.right) + 'px';
          dropdown.style.left = 'auto';
        }
      } else {
        dropdown.style.display = 'none';
      }
  }

  function markAllAsRead() {
    const badge = document.getElementById('notifBadge');
    if (badge) badge.style.display = 'none';
    const now = new Date().toISOString();
    state.lastReadAt = now;
    saveLastRead(now);
    renderNotifications();
  }

  async function goToRequestSummary(requestId, reference) {
    if (requestId) {
      window.location.href = `s_request_summary.html?id=${requestId}`;
      return;
    }

    if (reference) {
      try {
        const token = localStorage.getItem('authToken') || localStorage.getItem('token');
        if (!token) {
          window.location.href = 'login.html';
          return;
        }

        const resp = await fetch(`${API_BASE}/api/requests`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (resp.ok) {
          const data = await resp.json();
          const match = (data.requests || []).find(r => r.reference_number === reference);
          if (match && match.id) {
            window.location.href = `s_request_summary.html?id=${match.id}`;
            return;
          }
        }
      } catch (err) {
        console.error('Lookup by reference failed:', err);
      }
    }

    alert('No request ID provided');
  }

  function attachNotificationClicks() {
    document.addEventListener('click', (e) => {
      const notifItem = e.target.closest('.notif-item, .dashboard-notif-item');
      if (!notifItem) return;
      const requestId = notifItem.getAttribute('data-request-id');
      const reference = notifItem.getAttribute('data-reference');
      goToRequestSummary(requestId, reference);
    });
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
      
      // Keep dropdown positioned when scrolling
      document.addEventListener('scroll', function() {
        const dropdown = document.getElementById('notificationsDropdown');
        const notifBtn = document.querySelector('.notifs');
        
        if (dropdown && dropdown.style.display === 'block' && notifBtn) {
          const rect = notifBtn.getBoundingClientRect();
          dropdown.style.top = (rect.bottom + 10) + 'px';
          dropdown.style.right = (window.innerWidth - rect.right) + 'px';
        }
      }, true);
  }

  function init() {
    if (state.initialized && state.pollingHandle) return;
    renderNotifications();
    closeDropdownOnOutsideClick();
    attachNotificationClicks();
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
