// Request Summary Page JavaScript
const API_BASE = 'http://localhost:3000/api';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadRequestSummary();
});

// Load Request Summary
async function loadRequestSummary() {
    try {
        // Get request ID from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const requestId = urlParams.get('id');

        if (!requestId) {
            alert('No request ID provided');
            window.location.href = 's_track.html';
            return;
        }

        const token = localStorage.getItem('authToken');
        if (!token) {
            window.location.href = 'login.html';
            return;
        }

        // Fetch request details
        const response = await fetch(`${API_BASE}/requests/details/${requestId}`, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load request details');
        }

        const data = await response.json();
        const request = data.request;

        // Populate the page with request details
        populateRequestDetails(request);

    } catch (error) {
        console.error('Error loading request summary:', error);
        alert('Failed to load request details: ' + error.message);
        window.location.href = 's_track.html';
    }
}

// Populate Request Details
function populateRequestDetails(request) {
    // Header
    document.getElementById('referenceNumber').textContent = request.reference_number || 'N/A';

    // Request Information
    document.getElementById('refId').textContent = request.reference_number || 'N/A';
    document.getElementById('studentName').textContent = request.student_name || 'N/A';
    document.getElementById('documentType').textContent = request.template_name || 'Unknown';
    document.getElementById('quantity').textContent = request.quantity || '1';
    document.getElementById('purpose').textContent = request.purpose || 'No purpose specified';
    document.getElementById('totalAmount').textContent = `₱${(request.total_amount || 0).toFixed(2)}`;
    document.getElementById('dateRequested').textContent = formatDate(request.created_at);
    
    // Current Status
    const statusBadge = document.getElementById('currentStatus');
    statusBadge.textContent = request.status;
    statusBadge.className = `status-badge status-${request.status.toLowerCase().replace(/\s+/g, '-')}`;

    // Processing Days
    const processingDays = request.processing_days || 'Not specified';
    document.getElementById('processingDays').textContent = 
        typeof processingDays === 'number' ? `${processingDays} business days` : processingDays;

    // Render status timeline
    renderStatusTimeline(request.status);

    // Render payment information
    renderPaymentInfo(request);

    // Render status history
    renderStatusHistory(request.status_history || []);
}

// Render Status Timeline
function renderStatusTimeline(currentStatus) {
    const statuses = [
        { name: 'Requested', icon: '1' },
        { name: 'Verifying', icon: '2' },
        { name: 'Processing', icon: '3' },
        { name: 'For Release', icon: '4' },
        { name: 'Completed', icon: '5' }
    ];

    const currentIndex = statuses.findIndex(s => s.name === currentStatus);

    const progressHtml = statuses.map((status, index) => {
        let statusClass = '';
        if (index < currentIndex) {
            statusClass = 'active';
        } else if (index === currentIndex) {
            statusClass = 'active current';
        }

        return `
            <div class="progress-step ${statusClass}">
                <div class="step-circle">${status.icon}</div>
                <div class="step-label">${status.name}</div>
            </div>
        `;
    }).join('');

    document.getElementById('statusProgress').innerHTML = progressHtml;
}

// Render Payment Information
function renderPaymentInfo(request) {
    const paymentCard = document.getElementById('paymentCard');
    const paymentContent = document.getElementById('paymentContent');

    const needsPayment = ['Requested', 'Verifying'].includes(request.status);

    if (!needsPayment) {
        paymentCard.style.display = 'none';
        return;
    }

    paymentCard.style.display = 'block';

    let html = '';

    if (request.status === 'Requested') {
        html = `
            <div class="payment-status pending">
                <i class="fa-solid fa-clock"></i>
                <strong>Payment Required</strong>
                <p style="margin: 10px 0 0 0; font-size: 14px;">Please proceed to the cashier to make your payment for this document request.</p>
            </div>
            <div class="upload-area">
                <label class="upload-label">
                    <input type="file" id="receiptFile" accept="image/jpg,image/jpeg,image/png,application/pdf" style="display: none;">
                    <span class="upload-btn">
                        <i class="fa-solid fa-upload"></i> Upload Payment Receipt
                    </span>
                </label>
                <p class="upload-hint">JPG, PNG, or PDF • Max 5MB</p>
                <button id="submitReceiptBtn" class="btn-primary" style="margin-top: 15px; display: none;">
                    <i class="fa-solid fa-check"></i> Submit Receipt
                </button>
            </div>
        `;
    } else if (request.status === 'Verifying') {
        html = `
            <div class="payment-status submitted">
                <i class="fa-solid fa-hourglass-half"></i>
                <strong>Payment Being Verified</strong>
                <p style="margin: 10px 0 0 0; font-size: 14px;">Your payment receipt is being verified by the admin.</p>
            </div>
            <div class="receipt-preview" id="receiptPreview">
                <p style="color: #666; margin: 0; font-size: 14px;">Loading receipt...</p>
            </div>
        `;
    }

    paymentContent.innerHTML = html;

    // Add event listeners for file upload
    if (request.status === 'Requested') {
        const fileInput = document.getElementById('receiptFile');
        const submitBtn = document.getElementById('submitReceiptBtn');
        
        fileInput.addEventListener('change', function() {
            if (this.files.length > 0) {
                submitBtn.style.display = 'inline-flex';
            }
        });

        submitBtn.addEventListener('click', () => submitReceipt(request.id));
    } else if (request.status === 'Verifying') {
        // Show uploaded receipt while it is being reviewed
        loadReceiptImage(request.id);
    }
}

// Submit Receipt
async function submitReceipt(requestId) {
    console.log('🔵 submitReceipt called with requestId:', requestId);
    try {
        const fileInput = document.getElementById('receiptFile');
        console.log('🔵 File input element:', fileInput);
        console.log('🔵 Files selected:', fileInput?.files);
        
        if (!fileInput.files[0]) {
            alert('Please select a receipt file');
            return;
        }

        const formData = new FormData();
        formData.append('receipt', fileInput.files[0]);
        console.log('🔵 FormData created, file:', fileInput.files[0].name);

        const token = localStorage.getItem('authToken');
        console.log('🔵 Token exists:', !!token);
        
        const url = `${API_BASE}/receipts/${requestId}/upload`;
        console.log('🔵 Upload URL:', url);
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        console.log('🔵 Response status:', response.status);
        console.log('🔵 Response ok:', response.ok);
        
        const responseData = await response.json();
        console.log('🔵 Response data:', responseData);

        if (!response.ok) {
            throw new Error(responseData.message || 'Failed to upload receipt');
        }

        alert('Receipt uploaded successfully!');
        window.location.reload();
    } catch (error) {
        console.error('🔴 Error uploading receipt:', error);
        alert('Failed to upload receipt: ' + error.message);
    }
}

// Load Receipt Image
async function loadReceiptImage(requestId) {
    try {
        const token = localStorage.getItem('authToken');
        const url = `${API_BASE}/receipts/${requestId}/receipt/file`;
        console.log('Loading receipt from:', url);
        
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log('Receipt fetch response status:', response.status);

        if (response.ok) {
            const blob = await response.blob();
            const imageUrl = URL.createObjectURL(blob);
            const contentType = response.headers.get('Content-Type') || '';
            
            const receiptPreview = document.getElementById('receiptPreview');
            if (receiptPreview) {
                if (contentType.includes('pdf')) {
                    receiptPreview.innerHTML = `
                        <iframe src="${imageUrl}" title="Payment Receipt PDF" style="width: 100%; height: 420px; border: none; border-radius: 6px;"></iframe>
                        <div style="margin-top: 8px; font-size: 13px;"><a href="${imageUrl}" download="receipt.pdf" style="color: #27512b; font-weight: 600;">Download receipt</a></div>
                    `;
                } else {
                    receiptPreview.innerHTML = `
                        <img src="${imageUrl}" alt="Payment Receipt" style="max-width: 100%; height: auto;">
                    `;
                }
            }
        } else {
            const errorData = await response.json().catch(() => ({}));
            console.error('Receipt fetch error:', response.status, errorData);
            
            const receiptPreview = document.getElementById('receiptPreview');
            if (receiptPreview) {
                receiptPreview.innerHTML = `
                    <p style="color: #999;">Receipt image not available (${response.status})</p>
                `;
            }
        }
    } catch (error) {
        console.error('Error loading receipt:', error);
    }
}

// Render Status History
function renderStatusHistory(history) {
    const historyContainer = document.getElementById('statusHistory');

    if (!history || history.length === 0) {
        historyContainer.innerHTML = `
            <div class="history-empty">
                <i class="fa-solid fa-info-circle"></i>
                <p>No status history available yet</p>
            </div>
        `;
        return;
    }

    const historyHtml = history.map(item => `
        <div class="history-item">
            <div class="history-icon">
                <i class="fa-solid fa-clock"></i>
            </div>
            <div class="history-content">
                <div class="history-status">${item.new_status}</div>
                <div class="history-date">${formatDate(item.changed_at)}</div>
                ${item.notes ? `<p class="history-notes">${item.notes}</p>` : ''}
            </div>
        </div>
    `).join('');

    historyContainer.innerHTML = historyHtml;
}

// Format Date
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    
    return date.toLocaleDateString('en-US', options);
}
