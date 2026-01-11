// DOM Elements
const templateSelect = document.getElementById('templateSelect');
const formFieldsContainer = document.getElementById('formFieldsContainer');
const quantityInput = document.getElementById('quantity');
const purposeInput = document.getElementById('purpose');
const submitBtn = document.getElementById('submitBtn');
const costDisplay = document.getElementById('cost');
const totalDisplay = document.getElementById('total');

let activeTemplates = [];
let selectedTemplate = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
  await loadActiveTemplates();
  
  // Event listeners
  templateSelect.addEventListener('change', onTemplateSelected);
  quantityInput.addEventListener('change', calculateCost);
  submitBtn.addEventListener('click', submitRequest);
});

// Fetch active templates from API
async function loadActiveTemplates() {
  try {
    const response = await fetch('/api/templates/active?t=' + new Date().getTime(), {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

    if (!response.ok) throw new Error('Failed to load templates');

    const data = await response.json();
    activeTemplates = data.templates || [];

    // Populate template select
    templateSelect.innerHTML = '<option value="">-- Select Document Type --</option>';
    activeTemplates.forEach(template => {
      const option = document.createElement('option');
      option.value = template.id;
      option.textContent = `${template.document_name} (₱${parseFloat(template.base_price).toFixed(2)})`;
      templateSelect.appendChild(option);
    });

  } catch (error) {
    console.error('Error loading templates:', error);
    showError('Failed to load document templates');
  }
}

// Handle template selection
async function onTemplateSelected() {
  const templateId = templateSelect.value;
  
  if (!templateId) {
    formFieldsContainer.innerHTML = '';
    selectedTemplate = null;
    clearCostDisplay();
    return;
  }

  selectedTemplate = activeTemplates.find(t => t.id === templateId);
  
  if (!selectedTemplate) return;

  // Display template details
  displayTemplateDetails();
  
  // Build dynamic form fields
  if (selectedTemplate.field_config && Array.isArray(selectedTemplate.field_config)) {
    buildDynamicForm(selectedTemplate.field_config);
  }

  calculateCost();
}

// Display template pricing info
function displayTemplateDetails() {
  const detailsDiv = document.getElementById('templateDetails');
  if (detailsDiv) {
    detailsDiv.innerHTML = `
      <p><strong>Document Code:</strong> ${selectedTemplate.document_code}</p>
      <p><strong>Base Price:</strong> ₱${parseFloat(selectedTemplate.base_price).toFixed(2)}</p>
      <p><strong>Price per Copy:</strong> ₱${parseFloat(selectedTemplate.price_per_copy).toFixed(2)}</p>
      <p><strong>Processing Days:</strong> ${selectedTemplate.processing_days}</p>
    `;
  }
}

// Build form fields based on template configuration
function buildDynamicForm(fieldConfig) {
  formFieldsContainer.innerHTML = '';

  fieldConfig.forEach((field, index) => {
    const fieldGroup = document.createElement('div');
    fieldGroup.className = 'form-group';

    let fieldHTML = `<label for="field_${index}">${field.label}${field.required ? ' <span class="required">*</span>' : ''}</label>`;

    switch (field.type) {
      case 'text':
        fieldHTML += `<input type="text" id="field_${index}" name="field_${field.name}" 
          placeholder="${field.placeholder || ''}" ${field.required ? 'required' : ''}>`;
        break;

      case 'email':
        fieldHTML += `<input type="email" id="field_${index}" name="field_${field.name}" 
          placeholder="${field.placeholder || ''}" ${field.required ? 'required' : ''}>`;
        break;

      case 'number':
        fieldHTML += `<input type="number" id="field_${index}" name="field_${field.name}" 
          placeholder="${field.placeholder || ''}" ${field.required ? 'required' : ''}>`;
        break;

      case 'date':
        fieldHTML += `<input type="date" id="field_${index}" name="field_${field.name}" 
          ${field.required ? 'required' : ''}>`;
        break;

      case 'select':
        fieldHTML += `<select id="field_${index}" name="field_${field.name}" ${field.required ? 'required' : ''}>
          <option value="">-- Select ${field.label} --</option>`;
        if (field.options && Array.isArray(field.options)) {
          field.options.forEach(opt => {
            fieldHTML += `<option value="${opt}">${opt}</option>`;
          });
        }
        fieldHTML += `</select>`;
        break;

      case 'textarea':
        fieldHTML += `<textarea id="field_${index}" name="field_${field.name}" 
          placeholder="${field.placeholder || ''}" rows="4" ${field.required ? 'required' : ''}></textarea>`;
        break;

      case 'checkbox':
        fieldHTML += `<label class="checkbox-label">
          <input type="checkbox" name="field_${field.name}" value="true">
          ${field.description || field.label}
        </label>`;
        break;
    }

    fieldGroup.innerHTML = fieldHTML;
    formFieldsContainer.appendChild(fieldGroup);
  });
}

// Calculate total cost
function calculateCost() {
  if (!selectedTemplate) {
    clearCostDisplay();
    return;
  }

  const quantity = parseInt(quantityInput.value) || 1;
  const basePrice = parseFloat(selectedTemplate.base_price);
  const pricePerCopy = parseFloat(selectedTemplate.price_per_copy);

  const costForCopies = pricePerCopy * quantity;
  const total = basePrice + costForCopies;

  costDisplay.textContent = `₱${costForCopies.toFixed(2)}`;
  totalDisplay.textContent = `₱${total.toFixed(2)}`;
}

function clearCostDisplay() {
  costDisplay.textContent = '₱0.00';
  totalDisplay.textContent = '₱0.00';
}

// Submit request
async function submitRequest(e) {
  e.preventDefault();

  if (!selectedTemplate) {
    showError('Please select a document type');
    return;
  }

  if (!quantityInput.value || quantityInput.value < 1) {
    showError('Please enter a valid quantity');
    return;
  }

  // Collect form data
  const formData = {};
  const formElements = formFieldsContainer.querySelectorAll('input, select, textarea');
  
  formElements.forEach(element => {
    if (element.type === 'checkbox') {
      formData[element.name] = element.checked;
    } else {
      formData[element.name] = element.value;
    }
  });

  const requestData = {
    templateId: selectedTemplate.id,
    quantity: parseInt(quantityInput.value),
    purpose: purposeInput.value,
    formData: formData
  };

  try {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Processing...';

    const response = await fetch('/api/requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(requestData)
    });

    const data = await response.json();

    if (!response.ok) {
      showError(data.message || 'Failed to create request');
      return;
    }

    // Redirect to success page
    localStorage.setItem('lastRequestId', data.request.id);
    localStorage.setItem('lastReferenceNumber', data.request.referenceNumber);
    localStorage.setItem('lastTotalAmount', data.request.totalAmount);
    localStorage.setItem('lastProcessingDays', data.request.processingDays);

    window.location.href = 'success.html';

  } catch (error) {
    console.error('Request submission error:', error);
    showError('Failed to submit request');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Request';
  }
}

// Utility functions
function showError(message) {
  const errorDiv = document.getElementById('errorMessage');
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    setTimeout(() => {
      errorDiv.style.display = 'none';
    }, 5000);
  }
}
  minusBtn.onclick = () => {
    let currentVal = parseInt(quantityInput.value);
    if (currentVal > 1) {
      // Prevents going below 1
      quantityInput.value = currentVal - 1;
    }
  };

  container.appendChild(row);
}

// Initialize the Add Document button to create a new row
addBtn.onclick = createDocRow;

// Logic for the Confirm button (shows the modal)
confirmBtn.onclick = (e) => {
  // Prevent default form submission if this were a form element
  e.preventDefault();
  modal.style.display = "flex";
};

// Logic for the Go Back button (hides the modal)
goBack.onclick = () => (modal.style.display = "none");

// Logic for the I Understand button (redirects to success page)
understandBtn.onclick = () => {
  // NOTE: In a real application, you would submit the form data to the backend here
  // using fetch() or an AJAX request BEFORE redirecting.
  window.location.href = "success.html"; // Redirect to the success page
};

// Apply the quantity logic to the initial row(s) too
document.querySelectorAll("#documentsContainer .doc-row").forEach((row) => {
  const minusBtn = row.querySelector(".minus-btn");
  const plusBtn = row.querySelector(".plus-btn");
  const quantityInput = row.querySelector('input[type="number"]');
  const removeBtn = row.querySelector(".remove-btn");

  removeBtn.onclick = () => row.remove();

  plusBtn.onclick = () => {
    quantityInput.value = parseInt(quantityInput.value) + 1;
  };
  minusBtn.onclick = () => {
    let currentVal = parseInt(quantityInput.value);
    if (currentVal > 1) {
      quantityInput.value = currentVal - 1;
    }
  };
});
