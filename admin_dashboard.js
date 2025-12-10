// Admin Dashboard JavaScript
const API_BASE = 'http://localhost:3001/api';
let currentPage = 1;
let pageSize = 10;
let currentFilters = {
    search: '',
    status: '',
    dateRange: ''
};
let allRequests = [];
let currentRequestId = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadAdminInfo();
    loadStatistics();
    loadRequestQueue();
    setupEventListeners();
});

// Setup Event Listeners
function setupEventListeners() {
    // Search & Filters
    document.getElementById('searchInput').addEventListener('input', debounce(() => {
        currentPage = 1;
        currentFilters.search = document.getElementById('searchInput').value;
        loadRequestQueue();
    }, 500));

    document.getElementById('statusFilter').addEventListener('change', () => {
        currentPage = 1;
        currentFilters.status = document.getElementById('statusFilter').value;
        loadRequestQueue();
    });

    document.getElementById('dateFilter').addEventListener('change', () => {
        currentPage = 1;
        currentFilters.dateRange = document.getElementById('dateFilter').value;
        loadRequestQueue();
    });

    document.getElementById('resetFiltersBtn').addEventListener('click', () => {
        document.getElementById('searchInput').value = '';
        document.getElementById('statusFilter').value = '';
        document.getElementById('dateFilter').value = '';
        currentFilters = { search: '', status: '', dateRange: '' };
        currentPage = 1;
        loadRequestQueue();
    });

    // Pagination
    document.getElementById('prevPageBtn').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            loadRequestQueue();
        }
    });

    document.getElementById('nextPageBtn').addEventListener('click', () => {
        currentPage++;
        loadRequestQueue();
    });

    document.getElementById('refreshBtn').addEventListener('click', () => {
        loadStatistics();
        loadRequestQueue();
        showToast('Data refreshed', 'success');
    });

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', logout);

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
        if (!token) {
            window.location.href = 'login.html';
            return;
        }

        const response = await fetch(`${API_BASE}/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to load admin info');
        
        const data = await response.json();
        const user = data.user || data.data;
        document.getElementById('adminName').textContent = (user && user.name) || 'Admin';
    } catch (error) {
        console.error('Error loading admin info:', error);
        document.getElementById('adminName').textContent = 'Admin';
    }
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
        
        const data = await response.json();
        allRequests = data.data.requests || [];
        const totalPages = Math.ceil((data.data.total || 0) / pageSize);

        document.getElementById('totalCount').textContent = data.data.total || 0;
        document.getElementById('pageInfo').textContent = `Page ${currentPage} of ${totalPages || 1}`;
        
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
        
        const data = await response.json();
        const request = data.data;

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
        
        const data = await response.json();
        const history = data.data.status_history || [];

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
