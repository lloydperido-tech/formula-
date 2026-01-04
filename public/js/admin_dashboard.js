// Admin Dashboard JavaScript
const API_BASE = 'http://localhost:3000/api';
let currentPage = 1;
let pageSize = 10;
let currentFilters = {
    search: '',
    status: '',
    dateRange: ''
};
let allRequests = [];
let dashboardRequests = [];
let dashboardRequestsLoaded = false;
let currentRequestId = null;
let calendarDate = new Date();
let selectedCalendarDate = null;
let notificationPollInterval = null;
let lastNotificationCount = 0;
let currentNotificationCount = 0;
const calendarEvents = [
    { date: '2025-12-15', title: 'Document Deadline' },
    { date: '2025-12-20', title: 'Office Closed - Holiday' },
    { date: '2025-12-25', title: 'Christmas Day' },
    { date: '2026-01-01', title: 'New Year' }
];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadAdminInfo();
    if (document.getElementById('statPending')) loadStatistics();
    if (document.getElementById('queueTableBody')) loadRequestQueue();
    loadDashboardSummary();
    setupEventListeners();
    initCalendar();
    initNotifications();
});

// Setup Event Listeners
function setupEventListeners() {
    // Search & Filters
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(() => {
            currentPage = 1;
            currentFilters.search = searchInput.value;
            loadRequestQueue();
        }, 500));
    }

    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', () => {
            currentPage = 1;
            currentFilters.status = statusFilter.value;
            loadRequestQueue();
        });
    }

    const dateFilter = document.getElementById('dateFilter');
    if (dateFilter) {
        dateFilter.addEventListener('change', () => {
            currentPage = 1;
            currentFilters.dateRange = dateFilter.value;
            loadRequestQueue();
        });
    }

    const resetBtn = document.getElementById('resetFiltersBtn');
    if (resetBtn && searchInput && statusFilter && dateFilter) {
        resetBtn.addEventListener('click', () => {
            searchInput.value = '';
            statusFilter.value = '';
            dateFilter.value = '';
            currentFilters = { search: '', status: '', dateRange: '' };
            currentPage = 1;
            loadRequestQueue();
        });
    }

    // Pagination
    const prevPageBtn = document.getElementById('prevPageBtn');
    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                loadRequestQueue();
            }
        });
    }

    const nextPageBtn = document.getElementById('nextPageBtn');
    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', () => {
            currentPage++;
            loadRequestQueue();
        });
    }

    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            loadStatistics();
            loadRequestQueue();
            showToast('Data refreshed', 'success');
        });
    }

    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);

    // Modal Close Buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            if (modal) modal.classList.remove('active');
        });
    });

    // Status Modal
    document.getElementById('cancelStatusBtn').addEventListener('click', () => {
        document.getElementById('statusModal').classList.remove('active');
    });
    document.getElementById('confirmStatusBtn').addEventListener('click', confirmStatusUpdate);

    // Receipt Modal
    document.getElementById('rejectReceiptBtn').addEventListener('click', () => rejectReceipt());
    document.getElementById('approveReceiptBtn').addEventListener('click', () => approveReceipt());

    // Details Modal
    document.getElementById('closeDetailsBtn').addEventListener('click', () => {
        document.getElementById('detailsModal').classList.remove('active');
    });

    // Close modal on outside click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
}

// Load Admin Info
async function loadAdminInfo() {
    try {
        const token = localStorage.getItem('authToken') || localStorage.getItem('token');
        const nameFallback = localStorage.getItem('adminName') || localStorage.getItem('userName');
        const storedProfile = safeParse(localStorage.getItem('userInfo')) || safeParse(localStorage.getItem('user')) || {};
        if (!token && !nameFallback) {
            window.location.href = 'login.html';
            return;
        }

        if (token) {
            const response = await fetch(`${API_BASE}/auth/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Failed to load admin info');
            
            const data = await response.json();
            const user = data.user || data.data || {};

            const parts = mergeNameParts(user, storedProfile);
            const composite = [parts.first, parts.last].filter(Boolean).join(' ').trim();
            const storedComposite = buildCompositeFromName(nameFallback);
            const apiComposite = buildCompositeFromName(user.name || user.fullName);

            const displayName = composite
                || (apiComposite || '').trim()
                || (user.fullName && user.fullName.trim())
                || (user.name && user.name.trim())
                || storedComposite
                || user.email
                || nameFallback
                || 'Admin';

            document.getElementById('adminName').textContent = displayName;
            // Only persist if we have at least two name tokens to avoid overwriting with a lone last name
            if (displayName.split(' ').filter(Boolean).length >= 2) {
                localStorage.setItem('adminName', displayName);
            }
            return;
        }

        // Fallback if no token but a cached name exists
        if (nameFallback) {
            document.getElementById('adminName').textContent = nameFallback;
            return;
        }
    } catch (error) {
        console.error('Error loading admin info:', error);
        const cached = localStorage.getItem('adminName');
        document.getElementById('adminName').textContent = cached || 'Admin';
    }
}

function mergeNameParts(primary, secondary) {
    const a = extractNameParts(primary);
    const b = extractNameParts(secondary);
    return {
        first: a.first || b.first || '',
        last: a.last || b.last || ''
    };
}

function extractNameParts(obj) {
    if (!obj || typeof obj !== 'object') return { first: '', last: '' };
    const first = obj.firstName || obj.first_name || obj.firstname || obj.fname || obj.given_name || obj.givenName || obj.givenname || obj.first || '';
    const last = obj.lastName || obj.last_name || obj.lastname || obj.lname || obj.surname || obj.family_name || obj.familyName || obj.last || '';
    return { first: (first || '').trim(), last: (last || '').trim() };
}

function buildCompositeFromName(name) {
    if (!name || typeof name !== 'string') return '';
    const tokens = name.trim().split(/\s+/);
    if (tokens.length >= 2) return tokens.join(' ');
    return '';
}

// Dashboard summary (stats, priority, trend, recent)
async function loadDashboardSummary() {
    const requests = await fetchDashboardRequests();
    dashboardRequests = requests;
    dashboardRequestsLoaded = true;
    populateStatsFromRequests(requests);
    populateDashboardData(requests);
    setWelcomeLine();
}

function setWelcomeLine() {
    const nameEl = document.getElementById('welcomeName');
    const dateEl = document.getElementById('welcomeDate');
    if (nameEl) {
        const stored = localStorage.getItem('adminName') || localStorage.getItem('userName') || 'Admin';
        nameEl.textContent = `Welcome, ${stored}!`;
    }
    if (dateEl) {
        const now = new Date();
        dateEl.textContent = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    }
}

async function populateStatsFromRequests(requests) {
    const totalEl = document.getElementById('statTotal');
    const reqEl = document.getElementById('statRequested');
    const procEl = document.getElementById('statProcessing');
    const relEl = document.getElementById('statReleased');
    if (!totalEl || !reqEl || !procEl || !relEl) return;

    if (!requests || requests.length === 0) {
        totalEl.textContent = 0;
        reqEl.textContent = 0;
        procEl.textContent = 0;
        relEl.textContent = 0;
        return;
    }

    let requested = 0;
    let processing = 0;
    let released = 0;

    requests.forEach(r => {
        const status = (r.status || '').toLowerCase();
        if (status.includes('processing')) processing += 1;
        else if (status.includes('for release') || status.includes('completed') || status.includes('released')) released += 1;
        else if (status.includes('requested') || status.includes('pending')) requested += 1;
    });

    const total = requests.length;
    totalEl.textContent = total;
    reqEl.textContent = requested;
    procEl.textContent = processing;
    relEl.textContent = released;
}

async function populateDashboardData(requests) {
    const priorityBody = document.getElementById('priorityTableBody');
    const trendBars = document.getElementById('trendBars');
    const recentBody = document.getElementById('recentRequestsBody');
    if (!priorityBody && !trendBars && !recentBody) return;

    try {
        const data = requests || await fetchDashboardRequests();
        renderPriority(priorityBody, data);
        renderTrend(trendBars, data);
        renderRecent(recentBody, data);
    } catch (err) {
        console.error('Dashboard data load error:', err);
        if (priorityBody) priorityBody.innerHTML = '<tr><td colspan="2">Failed to load</td></tr>';
        if (trendBars) trendBars.innerHTML = '<div class="bar" style="height: 12px"></div>';
        if (recentBody) recentBody.innerHTML = '<tr><td colspan="3">Failed to load</td></tr>';
    }
}

async function fetchDashboardRequests() {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE}/requests/admin/queue?page=1&limit=300`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to load requests');
        const payload = await response.json();
        const requests = normalizeRequests(extractRequestList(payload));
        return requests;
    } catch (err) {
        console.error('Dashboard fetch error:', err);
        return [];
    }
}

function renderPriority(tbody, requests) {
    if (!tbody) return;
    if (!requests || requests.length === 0) {
        tbody.innerHTML = '<tr><td colspan="2">No data</td></tr>';
        return;
    }

    const counts = {};
    requests.forEach(r => {
        const name = r.template_name || r.document_name || r.document_templates?.document_name || 'Unknown';
        counts[name] = (counts[name] || 0) + 1;
    });

    const rows = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => `<tr><td>${name}</td><td>${count} pending</td></tr>`)
        .join('');

    tbody.innerHTML = rows || '<tr><td colspan="2">No data</td></tr>';
}

function renderTrend(container, requests) {
    if (!container) return;
    if (!requests || requests.length === 0) {
        container.innerHTML = '';
        return;
    }

    const today = new Date();
    const days = [];
    for (let i = 7; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        days.push(key);
    }

    const counts = days.reduce((acc, key) => ({ ...acc, [key]: 0 }), {});
    const dailyData = days.reduce((acc, key) => ({ ...acc, [key]: [] }), {});
    
    requests.forEach(r => {
        if (!r.created_at) return;
        const key = new Date(r.created_at).toISOString().slice(0, 10);
        if (counts[key] !== undefined) {
            counts[key] += 1;
            dailyData[key].push(r);
        }
    });

    const max = Math.max(1, ...Object.values(counts));
    container.innerHTML = Object.values(counts)
        .map((c, idx) => {
            const h = Math.max(8, Math.round((c / max) * 120));
            const dayKey = days[idx];
            return `<div class="bar" style="height: ${h}px" data-day="${dayKey}" data-count="${c}" title="${c} requests"></div>`;
        })
        .join('');
    
    // Store daily data globally for click handlers
    window.trendDailyData = dailyData;
    
    // Add click handlers to bars
    container.querySelectorAll('.bar').forEach(bar => {
        bar.addEventListener('click', function() {
            const dayKey = this.getAttribute('data-day');
            showTrendDetails(dayKey, window.trendDailyData[dayKey]);
            
            // Update active state
            container.querySelectorAll('.bar').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Show first day details by default
    const firstDay = days[0];
    showTrendDetails(firstDay, dailyData[firstDay]);
}

function showTrendDetails(dayKey, dayRequests) {
    let detailsContainer = document.getElementById('trendDetails');
    
    if (!detailsContainer) {
        detailsContainer = document.createElement('div');
        detailsContainer.id = 'trendDetails';
        detailsContainer.className = 'trend-details';
        document.getElementById('trendBars').parentElement.appendChild(detailsContainer);
    }
    
    const date = new Date(dayKey);
    const dateStr = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    const total = dayRequests.length;
    
    let mostRequested = 'N/A';
    if (dayRequests.length > 0) {
        const docCounts = {};
        dayRequests.forEach(r => {
            const doc = r.template_name || r.document_name || r.document_templates?.document_name || 'Unknown';
            docCounts[doc] = (docCounts[doc] || 0) + 1;
        });
        const sorted = Object.entries(docCounts).sort((a, b) => b[1] - a[1]);
        if (sorted.length > 0) {
            mostRequested = sorted[0][0];
        }
    }
    
    detailsContainer.innerHTML = `
        <div class="trend-details-content">
            <div class="trend-details-label">Date: ${dateStr}</div>
            <div>Total Requests: ${total}</div>
            <div>Most Requested: ${mostRequested}</div>
        </div>
    `;
}

function renderRecent(tbody, requests) {
    if (!tbody) return;
    if (!requests || requests.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3">No recent requests</td></tr>';
        return;
    }

    const sorted = [...requests].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const recent = sorted.slice(0, 8);
    tbody.innerHTML = recent.map(r => {
        const name = r.student_name || r.student_full_name || r.studentEmail || 'N/A';
        const doc = r.template_name || r.document_name || r.document_templates?.document_name || 'N/A';
        const program = r.program || r.course || r.student_program || r.student_course || 'N/A';
        return `<tr><td>${name}</td><td>${doc}</td><td>${program}</td></tr>`;
    }).join('');
}

function safeParse(value) {
    if (!value) return null;
    try { return JSON.parse(value); } catch (_e) { return null; }
}

function extractRequestList(payload) {
    if (!payload || typeof payload !== 'object') return [];
    const candidates = [
        payload.requests,
        payload.data?.requests,
        payload.data?.data?.requests,
        payload.data,
        payload.queue
    ];
    return candidates.find(Array.isArray) || [];
}

function normalizeRequest(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const user = raw.users || raw.user || {};
    const doc = raw.document_templates || raw.documentTemplate || {};
    const receipt = Array.isArray(raw.payment_receipts) ? raw.payment_receipts[0] : raw.payment_receipts || {};

    const studentName = raw.student_name
        || raw.student_full_name
        || [user.first_name, user.last_name].filter(Boolean).join(' ').trim();

    return {
        ...raw,
        student_name: studentName || raw.studentEmail || 'N/A',
        student_email: raw.student_email || user.email || 'N/A',
        student_id: raw.student_id || user.student_number || user.id || 'N/A',
        template_name: raw.template_name || raw.document_name || doc.document_name || doc.document_code || 'Unknown',
        document_name: raw.document_name || doc.document_name || 'Unknown',
        receipt_status: raw.receipt_status || receipt?.verification_status || 'Pending',
        program: raw.program || raw.course || raw.student_program || raw.student_course || user.program || user.course || 'N/A'
    };
}

function normalizeRequests(list) {
    if (!Array.isArray(list)) return [];
    return list.map(normalizeRequest).filter(Boolean);
}

// Load Statistics
async function loadStatistics() {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE}/requests/stats/overview`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to load statistics');
        
        const data = await response.json();
        const stats = data.data;

        document.getElementById('statPending').textContent = stats['Pending Payment'] || 0;
        document.getElementById('statSubmitted').textContent = stats['Payment Submitted'] || 0;
        document.getElementById('statVerified').textContent = stats['Payment Verified'] || 0;
        document.getElementById('statProcessing').textContent = stats['Processing'] || 0;
        document.getElementById('statReady').textContent = stats['For Release'] || 0;
        document.getElementById('statCompleted').textContent = stats['Completed'] || 0;
    } catch (error) {
        console.error('Error loading statistics:', error);
        showToast('Failed to load statistics', 'error');
    }
}

// Load Request Queue
async function loadRequestQueue() {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(
            `${API_BASE}/requests/admin/queue?page=${currentPage}&limit=${pageSize}`,
            { headers: { 'Authorization': `Bearer ${token}` } }
        );

        if (!response.ok) throw new Error('Failed to load request queue');
        
        const payload = await response.json();
        const rawRequests = extractRequestList(payload);
        allRequests = normalizeRequests(rawRequests);

        const totalItems = payload.pagination?.totalItems
            || payload.data?.total
            || (Array.isArray(rawRequests) ? rawRequests.length : 0);
        const totalPages = Math.max(1, Math.ceil((totalItems || 0) / pageSize));

        document.getElementById('totalCount').textContent = totalItems || 0;
        document.getElementById('pageInfo').textContent = `Page ${currentPage} of ${totalPages}`;
        
        document.getElementById('prevPageBtn').disabled = currentPage === 1;
        document.getElementById('nextPageBtn').disabled = currentPage >= totalPages;

        renderRequestTable();
    } catch (error) {
        console.error('Error loading request queue:', error);
        showToast('Failed to load requests', 'error');
        document.getElementById('queueTableBody').innerHTML = 
            '<tr><td colspan="9" class="loading-message">Error loading requests</td></tr>';
    }
}

// Render Request Table
function renderRequestTable() {
    const tbody = document.getElementById('queueTableBody');
    
    if (allRequests.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="loading-message">No requests found</td></tr>';
        return;
    }

    tbody.innerHTML = allRequests.map(request => `
        <tr>
            <td><strong>${request.reference_number}</strong></td>
            <td>${request.student_name || 'N/A'}</td>
            <td>${request.template_name || 'N/A'}</td>
            <td>${request.quantity}</td>
            <td>₱${(request.total_amount || 0).toFixed(2)}</td>
            <td>
                <span class="status-badge ${formatStatusClass(request.status)}">
                    ${request.status}
                </span>
            </td>
            <td>
                ${request.receipt_status ? 
                    `<span class="receipt-status ${request.receipt_status.toLowerCase()}">
                        ${request.receipt_status}
                    </span>` : 
                    '<span class="receipt-status pending">Pending</span>'
                }
            </td>
            <td>${formatDate(request.created_at)}</td>
            <td>
                <div class="actions-cell">
                    <button class="btn-action btn-details" onclick="openDetailsModal('${request.id}')">Details</button>
                    ${request.receipt_status === 'Pending' ? 
                        `<button class="btn-action btn-verify" onclick="openReceiptModal('${request.id}')">Verify</button>` :
                        ''
                    }
                    ${['Pending Payment', 'Payment Verified'].includes(request.status) ?
                        `<button class="btn-action" onclick="openStatusModal('${request.id}')">Update</button>` :
                        ''
                    }
                </div>
            </td>
        </tr>
    `).join('');
}

// Open Details Modal
async function openDetailsModal(requestId) {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE}/requests/details/${requestId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to load request details');
        
        const payload = await response.json();
        const request = normalizeRequest(
            payload.request
            || payload.data?.request
            || (payload.data && !payload.data.requests ? payload.data : null)
        );

        if (!request) throw new Error('Missing request payload');

        document.getElementById('detailRefNum').textContent = request.reference_number;
        document.getElementById('detailStatus').textContent = request.status;
        document.getElementById('detailStatus').className = `detail-value status-badge ${formatStatusClass(request.status)}`;
        document.getElementById('detailTemplate').textContent = request.template_name || 'N/A';
        document.getElementById('detailQuantity').textContent = request.quantity;
        document.getElementById('detailAmount').textContent = `₱${(request.total_amount || 0).toFixed(2)}`;
        document.getElementById('detailSubmitDate').textContent = formatDate(request.created_at);
        document.getElementById('detailStudentName').textContent = request.student_name || 'N/A';
        document.getElementById('detailStudentEmail').textContent = request.student_email || 'N/A';
        document.getElementById('detailStudentId').textContent = request.student_id || 'N/A';
        document.getElementById('detailPurpose').textContent = request.purpose || 'N/A';

        // Load status history
        loadStatusHistory(requestId);

        document.getElementById('detailsModal').classList.add('active');
    } catch (error) {
        console.error('Error loading request details:', error);
        showToast('Failed to load request details', 'error');
    }
}

// Load Status History
async function loadStatusHistory(requestId) {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE}/requests/details/${requestId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to load status history');
        
        const payload = await response.json();
        const history = payload.status_history
            || payload.data?.status_history
            || payload.request?.status_history
            || [];

        const historyHtml = history.length > 0 ?
            history.map(item => `
                <div class="timeline-item">
                    <div class="timeline-dot"></div>
                    <div class="timeline-content">
                        <div class="timeline-status">${item.new_status}</div>
                        <div class="timeline-time">${formatDate(item.changed_at)}</div>
                        ${item.notes ? `<div class="timeline-notes">${item.notes}</div>` : ''}
                    </div>
                </div>
            `).join('') :
            '<p class="loading-message">No status history</p>';

        document.getElementById('statusHistory').innerHTML = historyHtml;
    } catch (error) {
        console.error('Error loading status history:', error);
        document.getElementById('statusHistory').innerHTML = '<p class="loading-message">Failed to load history</p>';
    }
}

// Open Status Modal
async function openStatusModal(requestId) {
    currentRequestId = requestId;
    const request = allRequests.find(r => r.id === requestId);
    
    if (!request) return;

    document.getElementById('modalRefNum').textContent = request.reference_number;
    document.getElementById('modalCurrentStatus').textContent = request.status;
    document.getElementById('newStatus').value = '';
    document.getElementById('statusNotes').value = '';
    
    document.getElementById('statusModal').classList.add('active');
}

// Confirm Status Update
async function confirmStatusUpdate() {
    try {
        const newStatus = document.getElementById('newStatus').value;
        const notes = document.getElementById('statusNotes').value;

        if (!newStatus) {
            showToast('Please select a new status', 'warning');
            return;
        }

        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE}/requests/${currentRequestId}/status`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus, notes })
        });

        if (!response.ok) throw new Error('Failed to update status');
        
        document.getElementById('statusModal').classList.remove('active');
        showToast('Status updated successfully', 'success');
        loadStatistics();
        loadRequestQueue();
    } catch (error) {
        console.error('Error updating status:', error);
        showToast('Failed to update status', 'error');
    }
}

// Open Receipt Modal
async function openReceiptModal(requestId) {
    try {
        currentRequestId = requestId;
        const request = allRequests.find(r => r.id === requestId);
        
        if (!request) return;

        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE}/receipts/${requestId}/receipt`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to load receipt');
        
        const data = await response.json();
        const receipt = data.data;

        document.getElementById('receiptRefNum').textContent = request.reference_number;
        document.getElementById('receiptAmount').textContent = `₱${(request.total_amount || 0).toFixed(2)}`;
        document.getElementById('receiptUploadDate').textContent = formatDate(receipt.uploaded_at);
        document.getElementById('receiptStatus').textContent = receipt.verification_status || 'Pending';
        document.getElementById('receiptStatus').className = `detail-value receipt-status ${(receipt.verification_status || 'pending').toLowerCase()}`;
        document.getElementById('verificationNotes').value = receipt.verification_notes || '';

        // Load receipt image
        const fileResponse = await fetch(`${API_BASE}/receipts/${requestId}/receipt?download=false`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (fileResponse.ok) {
            const blob = await fileResponse.blob();
            const url = URL.createObjectURL(blob);
            document.getElementById('receiptImage').src = url;
        }

        document.getElementById('receiptModal').classList.add('active');
    } catch (error) {
        console.error('Error loading receipt:', error);
        showToast('Failed to load receipt', 'error');
    }
}

// Approve Receipt
async function approveReceipt() {
    try {
        const notes = document.getElementById('verificationNotes').value;
        const token = localStorage.getItem('authToken');

        const response = await fetch(`${API_BASE}/receipts/${currentRequestId}/receipt/verify`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                verification_status: 'Verified',
                verification_notes: notes 
            })
        });

        if (!response.ok) throw new Error('Failed to verify receipt');
        
        document.getElementById('receiptModal').classList.remove('active');
        showToast('Receipt approved successfully', 'success');
        loadStatistics();
        loadRequestQueue();
    } catch (error) {
        console.error('Error approving receipt:', error);
        showToast('Failed to approve receipt', 'error');
    }
}

// Reject Receipt
async function rejectReceipt() {
    try {
        const notes = document.getElementById('verificationNotes').value;
        
        if (!notes.trim()) {
            showToast('Please provide a reason for rejection', 'warning');
            return;
        }

        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE}/receipts/${currentRequestId}/receipt/verify`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                verification_status: 'Rejected',
                verification_notes: notes 
            })
        });

        if (!response.ok) throw new Error('Failed to reject receipt');
        
        document.getElementById('receiptModal').classList.remove('active');
        showToast('Receipt rejected successfully', 'success');
        loadStatistics();
        loadRequestQueue();
    } catch (error) {
        console.error('Error rejecting receipt:', error);
        showToast('Failed to reject receipt', 'error');
    }
}

// Format Status Class
function formatStatusClass(status) {
    if (!status) return 'status-unknown';
    return status.toLowerCase().replace(/\s+/g, '-');
}

// Format Date
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Calendar Setup (mirrors student dashboard)
function initCalendar() {
    const prevBtn = document.getElementById('prevMonth');
    const nextBtn = document.getElementById('nextMonth');
    const daysContainer = document.getElementById('calendarDays');
    const header = document.getElementById('currentMonthYear');

    if (!prevBtn || !nextBtn || !daysContainer || !header) return;

    prevBtn.addEventListener('click', () => changeMonth(-1));
    nextBtn.addEventListener('click', () => changeMonth(1));
    generateCalendar();

    document.addEventListener('click', (e) => {
        const infoEl = document.getElementById('calendarInfo');
        const calendarCard = document.querySelector('.calendar-card');
        if (!infoEl || !calendarCard) return;
        const clickedInside = calendarCard.contains(e.target);
        if (!clickedInside) hideCalendarInfo();
    });
}

function generateCalendar() {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();

    const header = document.getElementById('currentMonthYear');
    const daysContainer = document.getElementById('calendarDays');
    if (!header || !daysContainer) return;

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    header.textContent = `${monthNames[month]} ${year}`;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
    const todayDate = today.getDate();

    daysContainer.innerHTML = '';

    for (let i = 0; i < firstDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day empty';
        daysContainer.appendChild(emptyDay);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-day';
        dayCell.textContent = day;

        if (isCurrentMonth && day === todayDate) {
            dayCell.classList.add('today');
        }

        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const event = calendarEvents.find(e => e.date === dateStr);
        if (event) {
            dayCell.classList.add('has-event');
            dayCell.title = event.title;
        }

        if (selectedCalendarDate === dateStr) {
            dayCell.classList.add('selected');
        }

        dayCell.addEventListener('click', () => handleCalendarDayClick(dateStr, dayCell));

        daysContainer.appendChild(dayCell);
    }
}

function changeMonth(direction) {
    calendarDate.setMonth(calendarDate.getMonth() + direction);
    selectedCalendarDate = null;
    highlightSelectedDay(null);
    hideCalendarInfo();
    generateCalendar();
}

async function handleCalendarDayClick(dateStr, dayCell) {
    highlightSelectedDay(dayCell);
    selectedCalendarDate = dateStr;

    if (!dashboardRequestsLoaded) {
        renderCalendarInfo(dateStr, null, 'loading');
        try {
            dashboardRequests = await fetchDashboardRequests();
            dashboardRequestsLoaded = true;
        } catch (_e) {
            renderCalendarInfo(dateStr, { count: 0, topDoc: null }, 'error');
            return;
        }
    }

    const summary = summarizeRequestsForDate(dateStr, dashboardRequests);
    renderCalendarInfo(dateStr, summary, 'ready');
}

function highlightSelectedDay(dayCell) {
    const container = document.getElementById('calendarDays');
    if (!container) return;
    container.querySelectorAll('.calendar-day.selected').forEach(el => el.classList.remove('selected'));
    if (dayCell) dayCell.classList.add('selected');
}

function summarizeRequestsForDate(dateStr, requests) {
    if (!Array.isArray(requests) || requests.length === 0) {
        return { count: 0, topDoc: null };
    }

    const matches = requests.filter(r => getDateKey(r.created_at) === dateStr);
    if (matches.length === 0) return { count: 0, topDoc: null };

    const docCounts = matches.reduce((acc, r) => {
        const name = r.template_name || r.document_name || 'Unknown';
        acc[name] = (acc[name] || 0) + 1;
        return acc;
    }, {});

    const topEntry = Object.entries(docCounts).sort((a, b) => b[1] - a[1])[0];
    return {
        count: matches.length,
        topDoc: topEntry ? { name: topEntry[0], count: topEntry[1] } : null
    };
}

function renderCalendarInfo(dateStr, summary, state = 'ready') {
    const infoEl = document.getElementById('calendarInfo');
    if (!infoEl) return;

    infoEl.classList.add('active');

    const parsed = new Date(`${dateStr}T00:00:00`);
    const friendlyDate = isNaN(parsed)
        ? dateStr
        : parsed.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    if (state === 'loading') {
        infoEl.innerHTML = `
            <div class="calendar-info__header">
                <span class="calendar-info__label">Selected Day</span>
                <span class="calendar-info__date">${friendlyDate}</span>
            </div>
            <div class="calendar-info__body">
                <div class="calendar-info__pill">Loading requests...</div>
            </div>
        `;
        return;
    }

    if (state === 'error') {
        infoEl.innerHTML = `
            <div class="calendar-info__header">
                <span class="calendar-info__label">Selected Day</span>
                <span class="calendar-info__date">${friendlyDate}</span>
            </div>
            <div class="calendar-info__body empty">
                <div class="calendar-info__pill muted">Unable to load data</div>
                <p class="calendar-info__note">Try again or refresh the page.</p>
            </div>
        `;
        return;
    }

    if (!summary || summary.count === 0) {
        infoEl.innerHTML = `
            <div class="calendar-info__header">
                <span class="calendar-info__label">Selected Day</span>
                <span class="calendar-info__date">${friendlyDate}</span>
            </div>
            <div class="calendar-info__body empty">
                <div class="calendar-info__pill muted">No requests</div>
                <p class="calendar-info__note">No requests recorded for this day.</p>
            </div>
        `;
        return;
    }

    const { count, topDoc } = summary;
    const topDocMarkup = topDoc
        ? `<div class="calendar-info__pill accent">Top: ${topDoc.name} (${topDoc.count})</div>`
        : '';

    infoEl.innerHTML = `
        <div class="calendar-info__header">
            <span class="calendar-info__label">Selected Day</span>
            <span class="calendar-info__date">${friendlyDate}</span>
        </div>
        <div class="calendar-info__body">
            <div class="calendar-info__pill">${count} request${count === 1 ? '' : 's'}</div>
            ${topDocMarkup}
        </div>
    `;
}

function hideCalendarInfo() {
    const infoEl = document.getElementById('calendarInfo');
    if (!infoEl) return;
    infoEl.classList.remove('active');
    infoEl.innerHTML = '';
}

function getDateKey(dateValue) {
    if (!dateValue) return null;
    const parsed = new Date(dateValue);
    if (isNaN(parsed)) return null;
    return parsed.toISOString().slice(0, 10);
}

// Debounce Function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Show Toast
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Logout
function logout() {
    localStorage.removeItem('authToken');
    window.location.href = 'login.html';
}

// ===== NOTIFICATIONS SYSTEM =====

// Initialize notifications polling
function initNotifications() {

    
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
                    // Only show toast if this isn't the initial load
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
    const badge = document.getElementById('notifBadge');
    const notifList = document.getElementById('notifList');
    
    if (!badge || !notifList) return;

    const count = notifications.length;
    currentNotificationCount = count; // Store current count
    
    // Get the count of notifications that were marked as read
    const readNotificationCount = parseInt(localStorage.getItem('readNotificationCount') || '0');
    
    // Only show badge if there are MORE notifications than when marked as read
    const hasNewNotifications = count > readNotificationCount;
    
    // Show/hide badge
    if (hasNewNotifications) {
        badge.style.display = 'block';
        const newCount = count - readNotificationCount;
        badge.textContent = newCount > 99 ? '99+' : newCount;
    } else {
        badge.style.display = 'none';
    }

    // Update notification list - limit to 8 notifications
    const MAX_NOTIFICATIONS = 8;
    const displayedNotifications = notifications.slice(0, MAX_NOTIFICATIONS);
    
    if (count === 0) {
        notifList.innerHTML = '<div class="notif-empty">No new requests</div>';
    } else {
        notifList.innerHTML = displayedNotifications.map(notif => {
            const studentName = notif.users
                ? `${notif.users.first_name || ''} ${notif.users.last_name || ''}`.trim()
                : 'Unknown Student';
            const docName = notif.document_templates?.document_name || 'Unknown Document';
            const createdAt = new Date(notif.created_at).toLocaleTimeString();
            
            return `
                <div class="notif-item" onclick="viewRequestDetails('${notif.id}'); toggleNotifications();" style="cursor: pointer;">
                    <div class="notif-content">
                        <strong>${studentName}</strong>
                        <p>${docName}</p>
                        <small>Ref: ${notif.reference_number}</small>
                        <small style="display: block; color: #999;">${createdAt}</small>
                    </div>
                </div>
            `;
        }).join('');
        
        // Show message if there are more notifications
        if (count > MAX_NOTIFICATIONS) {
            notifList.innerHTML += `<div class="notif-more"><small>... and ${count - MAX_NOTIFICATIONS} more</small></div>`;
        }
    }
}

// Show toast notification for new request
function showNewRequestNotification(notification) {
    const studentName = notification.users
        ? `${notification.users.first_name || ''} ${notification.users.last_name || ''}`.trim()
        : 'A student';
    const docName = notification.document_templates?.document_name || 'a document';
    
    const message = `📨 New request: ${studentName} requested ${docName}`;
    showToast(message, 'success');
    
    console.log('New request notification:', notification.reference_number);
}

// Toggle notifications dropdown
function toggleNotifications() {
    const dropdown = document.getElementById('notificationsDropdown');
    const notifBtn = document.querySelector('.notifs');
    
    if (!dropdown) return;
    
    if (dropdown.style.display === 'none' || !dropdown.style.display) {
        dropdown.style.display = 'block';
        
        // Position dropdown relative to button
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

// Mark all notifications as read (clear badge)
function markAllAsRead() {
    const badge = document.getElementById('notifBadge');
    if (badge) {
        badge.textContent = '0';
        badge.style.display = 'none';
    }
    
    // Store the ACTUAL current notification count so we only show badge for NEW notifications
    localStorage.setItem('readNotificationCount', currentNotificationCount.toString());
}

// View request details from notification
function viewRequestDetails(requestId) {
    window.location.href = `admin_manage_requests.html?id=${requestId}`;
}

