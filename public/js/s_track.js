// Student Tracking Page JavaScript

const API_BASE = 'http://localhost:3000/api';
let studentRequests = [];
let currentSelectedRequest = null;
let currentSortColumn = null;
let currentSortOrder = 'asc';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Test API connection first
    testAPIConnection();
    
    setupColumnSorting();
    loadStudentRequests();
    setupEventListeners();
    updateUsername();
});

function setupColumnSorting() {
    const headers = document.querySelectorAll('.requests-table th.sortable');
    headers.forEach(header => {
        header.addEventListener('click', () => {
            const column = header.getAttribute('data-column');

            if (currentSortColumn === column) {
                currentSortOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
            } else {
                currentSortColumn = column;
                currentSortOrder = 'asc';
            }

            document.querySelectorAll('.requests-table th.sortable').forEach(h => {
                h.classList.remove('sort-asc', 'sort-desc');
            });
            header.classList.add(currentSortOrder === 'asc' ? 'sort-asc' : 'sort-desc');

            sortRequests(studentRequests, column, currentSortOrder);
            const searchTerm = document.getElementById('track-input-card')?.value?.trim();
            if (searchTerm) {
                filterRequests();
            } else {
                renderRequestsTable();
            }
        });
    });
}

function sortRequests(list, column, order) {
    const direction = order === 'asc' ? 1 : -1;

    list.sort((a, b) => {
        const aVal = getColumnValue(a, column);
        const bVal = getColumnValue(b, column);

        // Numeric comparison for total amount
        if (column === 'total_amount') {
            return (Number(aVal) - Number(bVal)) * direction;
        }

        const aStr = String(aVal || '').toLowerCase();
        const bStr = String(bVal || '').toLowerCase();
        if (aStr === bStr) return 0;
        return aStr > bStr ? 1 * direction : -1 * direction;
    });
}

function getColumnValue(item, column) {
    switch (column) {
        case 'reference_number':
            return item.reference_number || '';
        case 'document_name':
            return item.document_templates?.document_name || '';
        case 'total_amount':
            return Number(item.total_amount) || 0;
        case 'status':
            return item.status || '';
        default:
            return '';
    }
}

// Test API Connection
async function testAPIConnection() {
    try {
        const response = await fetch(`${API_BASE}/health`);
        const data = await response.json();
    } catch (error) {
        // Silently fail
    }
}

// Setup Event Listeners
function setupEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('track-input-card');
    const searchBtn = document.querySelector('.search-btn');

    if (searchInput) {
        searchInput.addEventListener('input', debounce(filterRequests, 300));
    }
    if (searchBtn) {
        searchBtn.addEventListener('click', (e) => {
            e.preventDefault();
            filterRequests();
        });
    }

    // Details/receipt controls (only if present)
    const closeDetailBtn = document.querySelector('.close-details');
    const closeDetailsFooterBtn = document.getElementById('closeDetailsBtn');
    const receiptFile = document.getElementById('receiptFile');
    const submitReceiptBtn = document.getElementById('submitReceiptBtn');
    const downloadReceiptBtn = document.getElementById('downloadReceiptBtn');

    if (closeDetailBtn) closeDetailBtn.addEventListener('click', closeDetails);
    if (closeDetailsFooterBtn) closeDetailsFooterBtn.addEventListener('click', closeDetails);
    if (receiptFile) receiptFile.addEventListener('change', handleFileSelection);
    if (submitReceiptBtn) submitReceiptBtn.addEventListener('click', submitReceipt);
    if (downloadReceiptBtn) downloadReceiptBtn.addEventListener('click', downloadReceipt);
}

// View Request Summary - Navigate to summary page
function viewRequestSummary(requestId) {
    window.location.href = `s_request_summary.html?id=${requestId}`;
}

// Load Student Requests
async function loadStudentRequests() {
    try {
        const token = localStorage.getItem('authToken');
        
        if (!token) {
            window.location.href = 'login.html';
            return;
        }

        const url = `${API_BASE}/requests`;
        
        // Create abort controller with 10 second timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(url, {
            method: 'GET',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            signal: controller.signal
        });

        clearTimeout(timeoutId);
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message || 'Failed to fetch requests');
        }
        
        studentRequests = data.requests || [];

        renderRequestsTable();
    } catch (error) {
        if (error.name === 'AbortError') {
            document.getElementById('requestsTableBody').innerHTML = 
                `<tr><td colspan="5" style="text-align: center; padding: 2rem; color: #d32f2f;">Request timeout - Server may not be responding. Please refresh the page.</td></tr>`;
        } else {
            document.getElementById('requestsTableBody').innerHTML = 
                `<tr><td colspan="5" style="text-align: center; padding: 2rem; color: #d32f2f;">Error: ${error.message}</td></tr>`;
        }
    }
}

// Render Requests Table
function renderRequestsTable() {
    const tbody = document.getElementById('requestsTableBody');
    
    if (studentRequests.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem; color: #999;">No requests found. <a href="s_request.html">Create one now</a></td></tr>';
        return;
    }

    tbody.innerHTML = studentRequests.map(request => {
        // Get document name from the nested object
        const documentName = request.document_templates?.document_name || 'Unknown';
        const statusClass = `status-${request.status.toLowerCase().replace(/\s+/g, '-')}`;
        // Add ₱30 documentary stamp tax per quantity
        const totalWithDST = (request.total_amount || 0) + (30 * (request.quantity || 1));
        
        return `
        <tr class="${statusClass}" onclick="showRequestDetails('${request.id}')">
            <td>${request.reference_number}</td>
            <td>${documentName}</td>
            <td>₱${totalWithDST.toFixed(2)}</td>
            <td><span class="${statusClass}">${request.status}</span></td>
            <td>
                <button class="action-btn" aria-label="View details" onclick="event.stopPropagation(); viewRequestSummary('${request.id}');">
                    <i class="fa-solid fa-eye"></i>
                </button>
            </td>
        </tr>
    `;
    }).join('');
}

// Filter Requests
function filterRequests() {
    const searchTerm = document.getElementById('track-input-card').value.toLowerCase();
    const tbody = document.getElementById('requestsTableBody');
    
    const filtered = studentRequests.filter(request =>
        request.reference_number.toLowerCase().includes(searchTerm) ||
        (request.document_templates?.document_name && request.document_templates.document_name.toLowerCase().includes(searchTerm))
    );

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem; color: #999;">No matching requests found.</td></tr>';
        return;
    }

    tbody.innerHTML = filtered.map(request => {
        const documentName = request.document_templates?.document_name || 'Unknown';
        const statusClass = `status-${request.status.toLowerCase().replace(/\s+/g, '-')}`;
        // Add ₱30 documentary stamp tax per quantity
        const totalWithDST = (request.total_amount || 0) + (30 * (request.quantity || 1));
        return `
        <tr class="${statusClass}" onclick="showRequestDetails('${request.id}')">
            <td>${request.reference_number}</td>
            <td>${documentName}</td>
            <td>₱${totalWithDST.toFixed(2)}</td>
            <td><span class="${statusClass}">${request.status}</span></td>
            <td>
                <button class="action-btn" aria-label="View details" onclick="event.stopPropagation(); viewRequestSummary('${request.id}');">
                    <i class="fa-solid fa-eye"></i>
                </button>
            </td>
        </tr>
    `;
    }).join('');
}

// Show Request Details
async function showRequestDetails(requestId) {
    try {
        const token = localStorage.getItem('authToken');
        
        const response = await fetch(`${API_BASE}/requests/details/${requestId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
            throw new Error(errorData.message || `Server error: ${response.status}`);
        }
        
        const data = await response.json();
        currentSelectedRequest = data.request;

        // Populate basic details
        const templateName = currentSelectedRequest.document_templates?.document_name || 
                            currentSelectedRequest.template_name || 'Unknown';
        const studentName = currentSelectedRequest.users ? 
                           `${currentSelectedRequest.users.first_name} ${currentSelectedRequest.users.last_name}` :
                           currentSelectedRequest.student_name || 'N/A';

        document.querySelector('.detail-ref').textContent = currentSelectedRequest.reference_number;
        document.querySelector('.detail-student').textContent = studentName;
        document.querySelector('.detail-type').textContent = templateName;
        // Add ₱30 documentary stamp tax per quantity
        const totalWithDST = (currentSelectedRequest.total_amount || 0) + (30 * (currentSelectedRequest.quantity || 1));
        document.querySelector('.detail-amount').textContent = `₱${totalWithDST.toFixed(2)}`;
        document.querySelector('.detail-date').textContent = formatDate(currentSelectedRequest.created_at);
        document.querySelector('.detail-notes').textContent = currentSelectedRequest.purpose || 'No notes';

        // Render status progress
        renderStatusProgress(currentSelectedRequest.status);

        // Render status history
        renderStatusHistory(currentSelectedRequest.status_history || []);

        // Handle payment section
        handlePaymentSection(currentSelectedRequest, requestId);

        // Show details card
        document.querySelector('.details-card').removeAttribute('aria-hidden');
    } catch (error) {
        alert(`Failed to load request details: ${error.message}`);
    }
}

// Render Status Progress
function renderStatusProgress(currentStatus) {
    const statuses = [
        'Requested',
        'Verifying',
        'Processing',
        'For Release',
        'Completed'
    ];

    const currentIndex = statuses.indexOf(currentStatus);
    const progressHtml = statuses.map((status, index) => `
        <div class="progress-step ${index <= currentIndex ? 'active' : ''} ${status === currentStatus ? 'current' : ''}">
            <div class="step-circle">${index + 1}</div>
            <div class="step-label">${status}</div>
        </div>
    `).join('');

    document.getElementById('statusProgress').innerHTML = 
        `<div class="progress-container">${progressHtml}</div>`;
}

// Render Status History
function renderStatusHistory(history) {
    const historyHtml = history && history.length > 0 ?
        history.map(item => `
            <li class="history-item">
                <strong>${item.new_status}</strong>
                <span class="history-date">${formatDate(item.changed_at)}</span>
                ${item.notes ? `<p class="history-notes">${item.notes}</p>` : ''}
            </li>
        `).join('') :
        '<li class="history-item">No status history yet</li>';

    document.getElementById('statusHistory').innerHTML = historyHtml;
}

// Handle Payment Section
function handlePaymentSection(request, requestId) {
    const paymentSection = document.getElementById('paymentSection');
    const receiptStatusText = document.getElementById('receiptStatus');
    const receiptPreview = document.getElementById('receiptPreview');
    const uploadWidget = document.getElementById('uploadWidget');
    const submitBtn = document.getElementById('submitReceiptBtn');
    const downloadBtn = document.getElementById('downloadReceiptBtn');

    const needsPayment = ['Requested', 'Verifying'].includes(request.status);

    if (!needsPayment) {
        paymentSection.style.display = 'none';
        downloadBtn.style.display = 'none';
        return;
    }

    paymentSection.style.display = 'block';

    if (request.status === 'Requested') {
        receiptStatusText.textContent = 'Waiting for payment submission...';
        receiptStatusText.className = 'receipt-status-text pending';
        receiptPreview.style.display = 'none';
        uploadWidget.style.display = 'block';
        submitBtn.style.display = 'block';
        downloadBtn.style.display = 'none';
    } else if (request.status === 'Verifying') {
        receiptStatusText.textContent = 'Receipt submitted - pending admin verification...';
        receiptStatusText.className = 'receipt-status-text submitted';
        uploadWidget.style.display = 'none';
        submitBtn.style.display = 'none';
        downloadBtn.style.display = 'inline-block';

        // Try to load receipt image
        loadReceiptImage(requestId);
    }
}

// Load Receipt Image
async function loadReceiptImage(requestId) {
    try {
        const token = localStorage.getItem('authToken');
        
        // First get receipt metadata
        const response = await fetch(`${API_BASE}/receipts/${requestId}/receipt`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            return;
        }

        const data = await response.json();
        const receipt = data.receipt;

        if (receipt && receipt.file_path) {
            // Now get the actual image file with authentication
            const imageUrl = `${API_BASE}/receipts/${requestId}/receipt/file`;
            
            // Fetch the image with authorization and convert to blob
            const imageResponse = await fetch(imageUrl, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (imageResponse.ok) {
                const blob = await imageResponse.blob();
                const objectUrl = URL.createObjectURL(blob);
                
                const imgElement = document.getElementById('receiptImage');
                imgElement.src = objectUrl;
                imgElement.onload = () => {
                    document.getElementById('receiptPreview').style.display = 'block';
                };
                imgElement.onerror = () => {
                    // Silently fail
                };
            }

            const statusElement = document.getElementById('receiptVerificationStatus');
            if (receipt.verification_status === 'Verified') {
                statusElement.textContent = '✓ Receipt verified by admin';
                statusElement.className = 'verification-status verified';
            } else if (receipt.verification_status === 'Rejected') {
                statusElement.textContent = `✗ Rejected: ${receipt.verification_notes || 'Invalid receipt'}`;
                statusElement.className = 'verification-status rejected';
            } else {
                statusElement.textContent = '⏳ Awaiting verification';
                statusElement.className = 'verification-status pending';
            }
        }
    } catch (error) {
        // Silently fail
    }
}

// Handle File Selection
function handleFileSelection(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        e.target.value = '';
        return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
        alert('Please upload a JPG, PNG, or PDF file');
        e.target.value = '';
        return;
    }
}

// Submit Receipt
async function submitReceipt() {
    try {
        const fileInput = document.getElementById('receiptFile');
        const file = fileInput.files[0];

        if (!file) {
            alert('Please select a receipt image to upload');
            return;
        }

        if (!currentSelectedRequest) {
            alert('No request selected');
            return;
        }

        const formData = new FormData();
        formData.append('receipt', file);

        const token = localStorage.getItem('authToken');
        const url = `${API_BASE}/receipts/${currentSelectedRequest.id}/receipt`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });

        const contentType = response.headers.get('Content-Type');
        let result;
        
        if (contentType && contentType.includes('application/json')) {
            result = await response.json();
        } else {
            const text = await response.text();
            result = { message: text || 'Unknown error' };
        }

        if (!response.ok) {
            throw new Error(result.message || `Server error: ${response.status}`);
        }

        alert('Receipt uploaded successfully! Waiting for admin verification...');
        fileInput.value = '';

        // Reload request details
        loadStudentRequests();
        await showRequestDetails(currentSelectedRequest.id);
    } catch (error) {
        alert(`Failed to upload receipt: ${error.message}`);
    }
}

// Download Receipt
async function downloadReceipt() {
    try {
        if (!currentSelectedRequest) return;

        const token = localStorage.getItem('authToken');
        const response = await fetch(
            `${API_BASE}/receipts/${currentSelectedRequest.id}/receipt?download=true`,
            { headers: { 'Authorization': `Bearer ${token}` } }
        );

        if (!response.ok) throw new Error('Failed to download receipt');

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `receipt-${currentSelectedRequest.reference_number}.pdf`;
        link.click();
        URL.revokeObjectURL(url);
    } catch (error) {
        alert('Failed to download receipt');
    }
}

// Close Details
function closeDetails() {
    document.querySelector('.details-card').setAttribute('aria-hidden', 'true');
    document.getElementById('track-input-card').value = '';
    currentSelectedRequest = null;
}

// Update Username
function updateUsername() {
    const token = localStorage.getItem('authToken');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    // User info can be loaded from token if needed in the future
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


// Add status badge styling
const style = document.createElement('style');
style.textContent = `
    .status-pending-payment { background-color: #fff3cd; color: #856404; padding: 0.35rem 0.75rem; border-radius: 4px; }
    .status-payment-submitted { background-color: #cfe2ff; color: #084298; padding: 0.35rem 0.75rem; border-radius: 4px; }
    .status-payment-verified { background-color: #d1e7dd; color: #0f5132; padding: 0.35rem 0.75rem; border-radius: 4px; }
    .status-processing { background-color: #e2e3e5; color: #383d41; padding: 0.35rem 0.75rem; border-radius: 4px; }
    .status-for-release { background-color: #ffeaa7; color: #8b4513; padding: 0.35rem 0.75rem; border-radius: 4px; }
    .status-completed { background-color: #d1e7dd; color: #0f5132; padding: 0.35rem 0.75rem; border-radius: 4px; }
    .status-cancelled { background-color: #f8d7da; color: #842029; padding: 0.35rem 0.75rem; border-radius: 4px; }

    .progress-container {
        display: flex;
        justify-content: space-between;
        margin: 1.5rem 0;
        position: relative;
    }

    .progress-container::before {
        content: '';
        position: absolute;
        top: 20px;
        left: 0;
        right: 0;
        height: 2px;
        background-color: #ddd;
        z-index: -1;
    }

    .progress-step {
        display: flex;
        flex-direction: column;
        align-items: center;
        flex: 1;
    }

    .step-circle {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background-color: #ddd;
        color: #999;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        margin-bottom: 0.5rem;
        z-index: 1;
    }

    .progress-step.active .step-circle {
        background-color: #4CAF50;
        color: white;
    }

    .progress-step.current .step-circle {
        background-color: #2196F3;
        color: white;
        box-shadow: 0 0 0 4px rgba(33, 150, 243, 0.1);
    }

    .step-label {
        font-size: 0.85rem;
        text-align: center;
        color: #666;
        max-width: 100%;
    }

    .progress-step.active .step-label {
        color: #333;
        font-weight: 500;
    }

    .receipt-status-text {
        padding: 0.75rem;
        border-radius: 4px;
        margin-bottom: 1rem;
        font-weight: 500;
    }

    .receipt-status-text.pending {
        background-color: #fff3cd;
        color: #856404;
    }

    .receipt-status-text.submitted {
        background-color: #cfe2ff;
        color: #084298;
    }

    .receipt-preview-img {
        max-width: 100%;
        max-height: 400px;
        border: 1px solid #ddd;
        border-radius: 4px;
    }

    .verification-status {
        font-weight: 600;
        padding: 0.5rem;
        border-radius: 4px;
        display: inline-block;
        margin-top: 0.5rem;
    }

    .verification-status.verified {
        background-color: #d1e7dd;
        color: #0f5132;
    }

    .verification-status.rejected {
        background-color: #f8d7da;
        color: #842029;
    }

    .verification-status.pending {
        background-color: #fff3cd;
        color: #856404;
    }

    .upload-label {
        display: inline-block;
        padding: 0.75rem 1.5rem;
        background-color: #2196F3;
        color: white;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 600;
        transition: background-color 0.3s;
    }

    .upload-label:hover {
        background-color: #1976D2;
    }

    .upload-hint {
        font-size: 0.85rem;
        color: #999;
        margin-top: 0.5rem;
    }

    .history-item {
        margin-bottom: 1rem;
        padding: 0.75rem;
        background-color: #f5f5f5;
        border-left: 3px solid #2196F3;
        border-radius: 4px;
    }

    .history-date {
        display: block;
        font-size: 0.85rem;
        color: #999;
        margin-top: 0.25rem;
    }

    .history-notes {
        font-size: 0.9rem;
        color: #666;
        margin-top: 0.5rem;
        font-style: italic;
    }
`;
document.head.appendChild(style);
