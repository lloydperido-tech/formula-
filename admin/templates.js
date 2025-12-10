const API_URL = 'http://localhost:3000/api';
let currentPage = 1;
let customFieldCounter = 0;

// Check authentication
function checkAuth() {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (!token || user.role !== 'admin') {
    window.location.href = '../login.html';
    return false;
  }
  return token;
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  const token = checkAuth();
  if (token) {
    loadTemplates();
    setupFileUpload();
    setupForm();
  }
});

// Load templates
async function loadTemplates(page = 1) {
  const token = checkAuth();
  const container = document.getElementById('templatesContainer');
  container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading templates...</div>';

  try {
    const activeOnly = document.getElementById('activeOnlyFilter').checked;
    const search = document.getElementById('searchInput').value.trim();

    const params = new URLSearchParams({
      page,
      limit: 9,
      active_only: activeOnly,
      search
    });

    const response = await fetch(`${API_URL}/templates?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (data.success) {
      currentPage = page;
      renderTemplates(data.templates);
      renderPagination(data.pagination);
    } else {
      showAlert(data.message, 'error');
      container.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-circle"></i><p>Failed to load templates</p></div>';
    }
  } catch (error) {
    console.error('Error loading templates:', error);
    showAlert('Failed to load templates', 'error');
    container.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-circle"></i><p>Failed to load templates</p></div>';
  }
}

// Render templates
function renderTemplates(templates) {
  const container = document.getElementById('templatesContainer');

  if (templates.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-file-alt"></i>
        <p>No templates found</p>
        <button class="btn btn-primary" onclick="openCreateModal()">
          <i class="fas fa-plus"></i> Create Your First Template
        </button>
      </div>
    `;
    return;
  }

  const grid = document.createElement('div');
  grid.className = 'templates-grid';

  templates.forEach(template => {
    const card = document.createElement('div');
    card.className = `template-card ${!template.is_active ? 'inactive' : ''}`;
    card.innerHTML = `
      <div class="template-header">
        <div class="template-title">
          <h3>${template.document_name}</h3>
          <div class="template-code">${template.document_code}</div>
        </div>
        <span class="status-badge ${template.is_active ? 'active' : 'inactive'}">
          ${template.is_active ? 'Active' : 'Inactive'}
        </span>
      </div>
      
      <div class="template-details">
        <div class="detail-item">
          <span class="detail-label">Base Price</span>
          <span class="detail-value">₱${parseFloat(template.base_price).toFixed(2)}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Per Copy</span>
          <span class="detail-value">₱${parseFloat(template.price_per_copy).toFixed(2)}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Processing</span>
          <span class="detail-value">${template.processing_days} days</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Version</span>
          <span class="detail-value">v${template.version}</span>
        </div>
      </div>

      <div class="template-actions">
        <button class="btn btn-primary btn-small" onclick="viewTemplate(${template.id})">
          <i class="fas fa-eye"></i> View
        </button>
        <button class="btn btn-secondary btn-small" onclick="editTemplate(${template.id})">
          <i class="fas fa-edit"></i> Edit
        </button>
        <button class="btn ${template.is_active ? 'btn-danger' : 'btn-success'} btn-small" 
                onclick="toggleStatus(${template.id}, ${!template.is_active})">
          <i class="fas fa-${template.is_active ? 'ban' : 'check'}"></i> 
          ${template.is_active ? 'Deactivate' : 'Activate'}
        </button>
        <button class="btn btn-danger btn-small" onclick="deleteTemplate(${template.id})">
          <i class="fas fa-trash"></i> Delete
        </button>
      </div>
    `;
    grid.appendChild(card);
  });

  container.innerHTML = '';
  container.appendChild(grid);
}

// Render pagination
function renderPagination(pagination) {
  const container = document.getElementById('paginationContainer');
  
  if (pagination.totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  let html = '<div class="pagination">';
  
  html += `<button ${pagination.currentPage === 1 ? 'disabled' : ''} 
           onclick="loadTemplates(${pagination.currentPage - 1})">Previous</button>`;

  for (let i = 1; i <= pagination.totalPages; i++) {
    html += `<button class="${i === pagination.currentPage ? 'active' : ''}" 
             onclick="loadTemplates(${i})">${i}</button>`;
  }

  html += `<button ${pagination.currentPage === pagination.totalPages ? 'disabled' : ''} 
           onclick="loadTemplates(${pagination.currentPage + 1})">Next</button>`;
  
  html += '</div>';
  container.innerHTML = html;
}

// Search templates
function searchTemplates() {
  loadTemplates(1);
}

// Setup file upload
function setupFileUpload() {
  const fileInput = document.getElementById('templateFile');
  const uploadArea = document.getElementById('fileUploadArea');
  const fileName = document.getElementById('fileName');

  uploadArea.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      fileName.textContent = `Selected: ${file.name}`;
    }
  });

  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
  });

  uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
  });

  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      fileInput.files = e.dataTransfer.files;
      fileName.textContent = `Selected: ${file.name}`;
    } else {
      showAlert('Please upload a PDF file', 'error');
    }
  });
}

// Setup form
function setupForm() {
  const form = document.getElementById('templateForm');
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveTemplate();
  });
}

// Open create modal
function openCreateModal() {
  document.getElementById('modalTitle').textContent = 'Create New Template';
  document.getElementById('templateForm').reset();
  document.getElementById('templateId').value = '';
  document.getElementById('fileName').textContent = '';
  document.getElementById('customFieldsList').innerHTML = '';
  customFieldCounter = 0;
  document.getElementById('templateModal').classList.add('active');
}

// Close modal
function closeModal() {
  document.getElementById('templateModal').classList.remove('active');
}

// Add custom field
function addCustomField() {
  const container = document.getElementById('customFieldsList');
  const fieldId = `custom_${customFieldCounter++}`;
  
  const fieldItem = document.createElement('div');
  fieldItem.className = 'custom-field-item';
  fieldItem.innerHTML = `
    <input type="text" placeholder="Field name (e.g., semester, year_level)" 
           data-custom-field="${fieldId}">
    <button type="button" class="btn btn-danger btn-small" onclick="this.parentElement.remove()">
      <i class="fas fa-times"></i>
    </button>
  `;
  
  container.appendChild(fieldItem);
}

// Get field configuration
function getFieldConfig() {
  const config = {
    predefined: [],
    custom: []
  };

  // Get predefined fields
  document.querySelectorAll('#predefinedFields input:checked').forEach(checkbox => {
    config.predefined.push(checkbox.value);
  });

  // Get custom fields
  document.querySelectorAll('[data-custom-field]').forEach(input => {
    const value = input.value.trim();
    if (value) {
      config.custom.push(value);
    }
  });

  return config;
}

// Save template
async function saveTemplate() {
  const token = checkAuth();
  const templateId = document.getElementById('templateId').value;
  const isEdit = !!templateId;

  try {
    const formData = new FormData();
    formData.append('documentName', document.getElementById('documentName').value);
    formData.append('documentCode', document.getElementById('documentCode').value);
    formData.append('basePrice', document.getElementById('basePrice').value);
    formData.append('pricePerCopy', document.getElementById('pricePerCopy').value);
    formData.append('processingDays', document.getElementById('processingDays').value);
    formData.append('fieldConfig', JSON.stringify(getFieldConfig()));

    const fileInput = document.getElementById('templateFile');
    if (fileInput.files[0]) {
      formData.append('templateFile', fileInput.files[0]);
    } else if (!isEdit) {
      showAlert('Please select a PDF template file', 'error');
      return;
    }

    const url = isEdit ? `${API_URL}/templates/${templateId}` : `${API_URL}/templates`;
    const method = isEdit ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    const data = await response.json();

    if (data.success) {
      showAlert(data.message, 'success');
      closeModal();
      loadTemplates(currentPage);
    } else {
      showAlert(data.message, 'error');
    }
  } catch (error) {
    console.error('Error saving template:', error);
    showAlert('Failed to save template', 'error');
  }
}

// View template
async function viewTemplate(id) {
  const token = checkAuth();

  try {
    const response = await fetch(`${API_URL}/templates/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (data.success) {
      alert(`Template Details:\n\n${JSON.stringify(data.template, null, 2)}`);
    } else {
      showAlert(data.message, 'error');
    }
  } catch (error) {
    console.error('Error viewing template:', error);
    showAlert('Failed to load template details', 'error');
  }
}

// Edit template
async function editTemplate(id) {
  const token = checkAuth();

  try {
    const response = await fetch(`${API_URL}/templates/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (data.success) {
      const template = data.template;
      
      document.getElementById('modalTitle').textContent = 'Edit Template';
      document.getElementById('templateId').value = template.id;
      document.getElementById('documentName').value = template.document_name;
      document.getElementById('documentCode').value = template.document_code;
      document.getElementById('basePrice').value = template.base_price;
      document.getElementById('pricePerCopy').value = template.price_per_copy;
      document.getElementById('processingDays').value = template.processing_days;
      document.getElementById('fileName').textContent = 'Current file uploaded (upload new to replace)';

      // Set field configuration
      const fieldConfig = template.field_config;
      
      // Reset predefined checkboxes
      document.querySelectorAll('#predefinedFields input').forEach(cb => cb.checked = false);
      
      // Check predefined fields
      if (fieldConfig.predefined) {
        fieldConfig.predefined.forEach(field => {
          const checkbox = document.querySelector(`#predefinedFields input[value="${field}"]`);
          if (checkbox) checkbox.checked = true;
        });
      }

      // Add custom fields
      const customList = document.getElementById('customFieldsList');
      customList.innerHTML = '';
      if (fieldConfig.custom) {
        fieldConfig.custom.forEach(field => {
          const fieldItem = document.createElement('div');
          fieldItem.className = 'custom-field-item';
          fieldItem.innerHTML = `
            <input type="text" value="${field}" data-custom-field="custom_${customFieldCounter++}">
            <button type="button" class="btn btn-danger btn-small" onclick="this.parentElement.remove()">
              <i class="fas fa-times"></i>
            </button>
          `;
          customList.appendChild(fieldItem);
        });
      }

      document.getElementById('templateModal').classList.add('active');
    } else {
      showAlert(data.message, 'error');
    }
  } catch (error) {
    console.error('Error loading template:', error);
    showAlert('Failed to load template', 'error');
  }
}

// Toggle template status
async function toggleStatus(id, newStatus) {
  const token = checkAuth();

  if (!confirm(`Are you sure you want to ${newStatus ? 'activate' : 'deactivate'} this template?`)) {
    return;
  }

  try {
    const response = await fetch(`${API_URL}/templates/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ isActive: newStatus })
    });

    const data = await response.json();

    if (data.success) {
      showAlert(data.message, 'success');
      loadTemplates(currentPage);
    } else {
      showAlert(data.message, 'error');
    }
  } catch (error) {
    console.error('Error toggling status:', error);
    showAlert('Failed to update template status', 'error');
  }
}

// Delete template
async function deleteTemplate(id) {
  const token = checkAuth();

  if (!confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
    return;
  }

  try {
    const response = await fetch(`${API_URL}/templates/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (data.success) {
      showAlert(data.message, 'success');
      loadTemplates(currentPage);
    } else {
      showAlert(data.message, 'error');
    }
  } catch (error) {
    console.error('Error deleting template:', error);
    showAlert('Failed to delete template', 'error');
  }
}

// Show alert
function showAlert(message, type) {
  const container = document.getElementById('alertContainer');
  const alert = document.createElement('div');
  alert.className = `alert alert-${type}`;
  alert.innerHTML = `
    <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
    ${message}
  `;
  
  container.innerHTML = '';
  container.appendChild(alert);

  setTimeout(() => {
    alert.remove();
  }, 5000);
}
