// Student Tracking Page JavaScript
const API_BASE = 'http://localhost:3000/api';
let studentRequests = [];
let currentSelectedRequest = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadStudentRequests();
    setupEventListeners();
    updateUsername();
});

// Setup Event Listeners
function setupEventListeners() {
    // Search functionality
    document.getElementById('track-input-card').addEventListener('input', debounce(filterRequests, 300));

    // Close details
    document.querySelector('.close-details').addEventListener('click', closeDetails);
    document.getElementById('closeDetailsBtn').addEventListener('click', closeDetails);

    // Receipt file input
    document.getElementById('receiptFile').addEventListener('change', handleFileSelection);
    document.getElementById('submitReceiptBtn').addEventListener('click', submitReceipt);
    document.getElementById('downloadReceiptBtn').addEventListener('click', downloadReceipt);
}

// Load Student Requests
async function loadStudentRequests() {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) {
            window.location.href = 'login.html';
            return;
        }

        const response = await fetch(`${API_BASE}/requests`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to load requests');
        
        const data = await response.json();
        studentRequests = data.data || [];

        renderRequestsTable();
    } catch (error) {
        console.error('Error loading requests:', error);
        document.getElementById('requestsTableBody').innerHTML = 
            '<tr><td colspan="5" style="text-align: center; padding: 2rem; color: #d32f2f;">Failed to load requests. Please refresh the page.</td></tr>';
    }
}

// Render Requests Table
function renderRequestsTable() {
    const tbody = document.getElementById('requestsTableBody');
    
    if (studentRequests.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem; color: #999;">No requests found. <a href="s_request.html">Create one now</a></td></tr>';
        return;
    }

    tbody.innerHTML = studentRequests.map(request => `
        <tr onclick="showRequestDetails('${request.id}')">
            <td>${request.reference_number}</td>
            <td>${request.template_name || 'Unknown'}</td>
            <td>₱${(request.total_amount || 0).toFixed(2)}</td>
            <td><span class="status-${request.status.toLowerCase().replace(/\s+/g, '-')}">${request.status}</span></td>
            <td>
                <button class="action-btn" aria-label="View details" onclick="event.stopPropagation();">
                    <i class="fa-solid fa-eye"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Filter Requests
function filterRequests() {
    const searchTerm = document.getElementById('track-input-card').value.toLowerCase();
    const tbody = document.getElementById('requestsTableBody');
    
    const filtered = studentRequests.filter(request =>
        request.reference_number.toLowerCase().includes(searchTerm) ||
        (request.template_name && request.template_name.toLowerCase().includes(searchTerm))
    );

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem; color: #999;">No matching requests found.</td></tr>';
        return;
    }

    tbody.innerHTML = filtered.map(request => `
        <tr onclick="showRequestDetails('${request.id}')">
            <td>${request.reference_number}</td>
            <td>${request.template_name || 'Unknown'}</td>
            <td>₱${(request.total_amount || 0).toFixed(2)}</td>
            <td><span class="status-${request.status.toLowerCase().replace(/\s+/g, '-')}">${request.status}</span></td>
            <td>
                <button class="action-btn" aria-label="View details" onclick="event.stopPropagation();">
                    <i class="fa-solid fa-eye"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Show Request Details
async function showRequestDetails(requestId) {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE}/requests/details/${requestId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to load request details');
        
        const data = await response.json();
        currentSelectedRequest = data.data;

        // Populate basic details
        document.querySelector('.detail-ref').textContent = currentSelectedRequest.reference_number;
        document.querySelector('.detail-student').textContent = currentSelectedRequest.student_name || 'N/A';
        document.querySelector('.detail-type').textContent = currentSelectedRequest.template_name || 'Unknown';
        document.querySelector('.detail-amount').textContent = `₱${(currentSelectedRequest.total_amount || 0).toFixed(2)}`;
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
        console.error('Error loading request details:', error);
        alert('Failed to load request details');
    }
}

// Render Status Progress
function renderStatusProgress(currentStatus) {
    const statuses = [
        'Pending Payment',
        'Payment Submitted',
        'Payment Verified',
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

    const needsPayment = ['Pending Payment', 'Payment Submitted'].includes(request.status);

    if (!needsPayment) {
        paymentSection.style.display = 'none';
        downloadBtn.style.display = 'none';
        return;
    }

    paymentSection.style.display = 'block';

    if (request.status === 'Pending Payment') {
        receiptStatusText.textContent = 'Waiting for payment submission...';
        receiptStatusText.className = 'receipt-status-text pending';
        receiptPreview.style.display = 'none';
        uploadWidget.style.display = 'block';
        submitBtn.style.display = 'block';
        downloadBtn.style.display = 'none';
    } else if (request.status === 'Payment Submitted') {
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
        const response = await fetch(`${API_BASE}/receipts/${requestId}/receipt`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) return;

        const data = await response.json();
        const receipt = data.data;

        if (receipt && receipt.file_path) {
            const fileResponse = await fetch(`${API_BASE}/receipts/${requestId}/receipt?download=false`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (fileResponse.ok) {
                const blob = await fileResponse.blob();
                const url = URL.createObjectURL(blob);
                document.getElementById('receiptImage').src = url;
                document.getElementById('receiptPreview').style.display = 'block';

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
        }
    } catch (error) {
        console.error('Error loading receipt image:', error);
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
        const response = await fetch(
            `${API_BASE}/receipts/${currentSelectedRequest.id}/receipt`,
            {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            }
        );

        if (!response.ok) throw new Error('Failed to upload receipt');

        alert('Receipt uploaded successfully! Waiting for admin verification...');
        fileInput.value = '';

        // Reload request details
        loadStudentRequests();
        await showRequestDetails(currentSelectedRequest.id);
    } catch (error) {
        console.error('Error submitting receipt:', error);
        alert('Failed to upload receipt. Please try again.');
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
        console.error('Error downloading receipt:', error);
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

    fetch(`${API_BASE}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
        if (data.data && data.data.name) {
            document.querySelector('.username').textContent = data.data.name;
        }
    })
    .catch(err => console.error('Error loading user info:', err));
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

// Status badge styling
document.addEventListener('DOMContentLoaded', () => {
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
});


  // search by reference (exact or partial)
  function performSearch() {
    const q = (searchInput.value || '').trim().toLowerCase();
    if (!q) return;
    const rows = Array.from(table.querySelectorAll('tr'));
    const found = rows.find(r => (r.dataset.ref || '').toLowerCase().includes(q));
    if (found) {
      // optionally highlight
      rows.forEach(r => r.classList.remove('highlight'));
      found.classList.add('highlight');
      // scroll into view
      found.scrollIntoView({ behavior: 'smooth', block: 'center' });
      showDetailsFromRow(found);
    } else {
      // no results - optionally show a message
      alert('No request found for: ' + searchInput.value);
    }
  }

  searchBtn.addEventListener('click', function (e) {
    e.preventDefault();
    performSearch();
  });

  searchInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      performSearch();
    }
  });

  // close details
  closeBtn.addEventListener('click', function () {
    detailsCard.setAttribute('aria-hidden', 'true');
    detailsCard.classList.remove('visible');
    const rows = Array.from(table.querySelectorAll('tr'));
    rows.forEach(r => r.classList.remove('highlight'));
  });
});
