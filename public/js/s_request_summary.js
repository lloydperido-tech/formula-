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

        const token = localStorage.getItem('authToken') || localStorage.getItem('token');
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
    // Add ₱30 documentary stamp tax per quantity
    const totalWithDST = (request.total_amount || 0) + (30 * (request.quantity || 1));
    document.getElementById('totalAmount').textContent = `₱${totalWithDST.toFixed(2)}`;
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
    const verificationMessageCard = document.getElementById('verificationMessageCard');

    const needsPayment = ['Requested', 'Verifying'].includes(request.status);

    if (!needsPayment) {
        paymentCard.style.display = 'none';
        verificationMessageCard.style.display = 'none';
        return;
    }

    paymentCard.style.display = 'block';

    // Show verification message if status is Verifying
    if (request.status === 'Verifying') {
        verificationMessageCard.style.display = 'block';
    } else {
        verificationMessageCard.style.display = 'none';
    }

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
                <div id="fileInfoSection" style="display: none; margin-top: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: #f5f5f5; border-radius: 8px; border: 1px solid #ddd; margin-bottom: 15px;">
                        <div style="flex: 1;">
                            <i class="fa-solid fa-file" style="color: #666; margin-right: 8px;"></i>
                            <span id="fileName" style="font-size: 14px; color: #333;"></span>
                        </div>
                        <button id="clearFileBtn" class="btn-secondary" style="padding: 6px 12px; font-size: 13px;">
                            <i class="fa-solid fa-times"></i> Clear
                        </button>
                    </div>
                    <div id="receiptPreviewArea" style="margin-top: 15px; border: 2px solid #e0e0e0; border-radius: 8px; padding: 15px; background: white; text-align: center; max-height: 500px; overflow: auto;">
                        <!-- Preview will be inserted here -->
                    </div>
                </div>
                <div id="actionButtons" style="display: none; margin-top: 15px; gap: 10px;">
                    <button id="submitReceiptBtn" class="btn-primary">
                        <i class="fa-solid fa-check"></i> Submit Receipt
                    </button>
                    <button id="changeFileBtn" class="btn-secondary">
                        <i class="fa-solid fa-rotate"></i> Choose Different File
                    </button>
                </div>
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
        const clearBtn = document.getElementById('clearFileBtn');
        const changeBtn = document.getElementById('changeFileBtn');
        const fileInfoSection = document.getElementById('fileInfoSection');
        const fileName = document.getElementById('fileName');
        const actionButtons = document.getElementById('actionButtons');
        const previewArea = document.getElementById('receiptPreviewArea');
        
        fileInput.addEventListener('change', function() {
            if (this.files.length > 0) {
                const file = this.files[0];
                // Show file info and action buttons
                fileName.textContent = file.name;
                fileInfoSection.style.display = 'block';
                actionButtons.style.display = 'flex';
                
                // Generate preview
                generateReceiptPreview(file, previewArea);
            }
        });

        // Clear file button
        clearBtn.addEventListener('click', () => {
            fileInput.value = '';
            fileInfoSection.style.display = 'none';
            actionButtons.style.display = 'none';
            previewArea.innerHTML = '';
        });

        // Change file button
        changeBtn.addEventListener('click', () => {
            fileInput.click();
        });

        submitBtn.addEventListener('click', () => submitReceipt(request.id));
    } else if (request.status === 'Verifying') {
        // Show uploaded receipt while it is being reviewed
        loadReceiptImage(request.id);
    }
}

// Submit Receipt
async function submitReceipt(requestId) {
    try {
        const fileInput = document.getElementById('receiptFile');
        
        if (!fileInput.files[0]) {
            alert('Please select a receipt file');
            return;
        }

        const formData = new FormData();
        formData.append('receipt', fileInput.files[0]);

        const token = localStorage.getItem('authToken');
        
        const url = `${API_BASE}/receipts/${requestId}/upload`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        const responseData = await response.json();

        if (!response.ok) {
            throw new Error(responseData.message || 'Failed to upload receipt');
        }

        alert('Receipt uploaded successfully!');
        window.location.reload();
    } catch (error) {
        alert('Failed to upload receipt: ' + error.message);
    }
}

// Load Receipt Image
async function loadReceiptImage(requestId) {
    try {
        const token = localStorage.getItem('authToken');
        const url = `${API_BASE}/receipts/${requestId}/receipt/file`;
        
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

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

// Generate Receipt Preview
function generateReceiptPreview(file, previewArea) {
    const fileType = file.type;
    const fileSize = file.size;
    
    // Check file size (5MB limit)
    if (fileSize > 5 * 1024 * 1024) {
        previewArea.innerHTML = `
            <div style="padding: 20px; color: #d32f2f;">
                <i class="fa-solid fa-exclamation-triangle" style="font-size: 24px;"></i>
                <p style="margin-top: 10px;">File size exceeds 5MB limit</p>
            </div>
        `;
        return;
    }
    
    // Show loading state
    previewArea.innerHTML = `
        <div style="padding: 20px; color: #666;">
            <i class="fa-solid fa-spinner fa-spin" style="font-size: 24px;"></i>
            <p style="margin-top: 10px;">Loading preview...</p>
        </div>
    `;
    
    if (fileType.startsWith('image/')) {
        // Image preview
        const reader = new FileReader();
        reader.onload = function(e) {
            previewArea.innerHTML = `
                <img src="${e.target.result}" alt="Receipt Preview" style="max-width: 100%; max-height: 450px; border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            `;
        };
        reader.readAsDataURL(file);
    } else if (fileType === 'application/pdf') {
        // PDF preview
        const reader = new FileReader();
        reader.onload = function(e) {
            const blob = new Blob([e.target.result], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            previewArea.innerHTML = `
                <iframe src="${url}" style="width: 100%; height: 450px; border: none; border-radius: 6px;"></iframe>
                <p style="margin-top: 10px; font-size: 13px; color: #666;">
                    <i class="fa-solid fa-file-pdf"></i> PDF Document Preview
                </p>
            `;
        };
        reader.readAsArrayBuffer(file);
    } else {
        // Unsupported file type
        previewArea.innerHTML = `
            <div style="padding: 20px; color: #666;">
                <i class="fa-solid fa-file" style="font-size: 24px;"></i>
                <p style="margin-top: 10px;">Preview not available for this file type</p>
                <p style="font-size: 13px; color: #999;">${file.name}</p>
            </div>
        `;
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

    const historyHtml = history.map(item => {
        const changeLabel = item.old_status
            ? `${item.old_status} -> ${item.new_status}`
            : item.new_status;

        // Supabase stores timestamps as created_at; keep changed_at as a fallback
        const changeDate = formatDate(item.created_at || item.changed_at, true);

        const isReceiptRemoved = (item.notes || '').toLowerCase().includes('receipt removed');
        const notesHtml = item.notes
            ? `<p class="history-notes${isReceiptRemoved ? ' removal-note' : ''}">${item.notes}</p>`
            : '';

        return `
            <div class="history-item">
                <div class="history-icon">
                    <i class="fa-solid fa-clock"></i>
                </div>
                <div class="history-content">
                    <div class="history-status">${changeLabel}</div>
                    <div class="history-date">Changed: ${changeDate}</div>
                    ${notesHtml}
                </div>
            </div>
        `;
    }).join('');

    historyContainer.innerHTML = historyHtml;
}

// Format Date
function formatDate(dateString, includeTime = false) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const options = includeTime
        ? { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }
        : { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-PH', options);
}
