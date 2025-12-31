// Profile Page JavaScript

// Load user data on page load
document.addEventListener('DOMContentLoaded', async () => {
  // First render whatever is in localStorage
  loadUserProfile();
  // Then try to refresh from backend quickly
  await fetchLatestUserProfile();
});

function loadUserProfile() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');

  // Handle both user formats (name vs firstName/lastName)
  const firstName = userInfo.firstName || user.name?.split(' ')[0] || '';
  const lastName = userInfo.lastName || user.name?.split(' ').slice(1).join(' ') || '';
  const displayName = user.name || `${firstName} ${lastName}`.trim() || 'User';

  // Update header
  document.getElementById('userName').textContent = displayName;
  document.getElementById('profileName').textContent = displayName;
  document.getElementById('profileEmail').textContent = user.email || userInfo.email || 'email@cvsu.edu.ph';
  // Set dynamic role badge if available
  const badgeEl = document.querySelector('.profile-badge');
  if (badgeEl) badgeEl.textContent = (user.role || userInfo.role || 'Student');

  // Update avatar with initials
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const avatarCircle = document.getElementById('avatarCircle');
  avatarCircle.innerHTML = initials || '<i class="fa-solid fa-user"></i>';

  // Populate form fields
  document.getElementById('firstName').value = firstName;
  document.getElementById('middleName').value = userInfo.middleName || '';
  document.getElementById('lastName').value = lastName;
  document.getElementById('studentNumber').value = userInfo.studentNumber || user.studentNumber || '';
  document.getElementById('program').value = userInfo.program || user.program || '';
  document.getElementById('yearLevel').value = userInfo.yearLevel || '';
  document.getElementById('cvsuEmail').value = user.email || userInfo.email || '';
  document.getElementById('personalEmail').value = userInfo.personalEmail || '';
  document.getElementById('contactNumber').value = userInfo.contactNumber || '';
  // Prefer completeAddress (from DB), fallback to legacy 'address'
  document.getElementById('address').value = userInfo.completeAddress || userInfo.address || '';
}

// Try to fetch latest profile from backend and update localStorage
async function fetchLatestUserProfile() {
  try {
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    if (!token) return; // no auth, skip

    const endpoints = ['/api/user/profile', '/api/user/me', '/api/user'];
    let resp;
    for (const url of endpoints) {
      try {
        resp = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (resp && resp.ok) break;
      } catch (_) {
        // try next
      }
    }
    if (!resp || !resp.ok) return;

    const data = await resp.json();
    // Support various response shapes: {user: {...}} or direct {...}
    const u = data.user || data;

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    let userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');

    // Update core user object
    const updatedUser = {
      ...user,
      id: u.id ?? user.id,
      email: u.email ?? user.email,
      name: u.name ?? user.name,
      firstName: u.firstName ?? user.firstName,
      lastName: u.lastName ?? user.lastName,
      role: u.role ?? user.role,
      studentNumber: u.studentNumber ?? user.studentNumber,
      program: u.program ?? user.program,
    };

    // Build updated userInfo snapshot
    const updatedInfo = {
      ...userInfo,
      firstName: u.firstName ?? userInfo.firstName,
      middleName: u.middleName ?? userInfo.middleName,
      lastName: u.lastName ?? userInfo.lastName,
      email: u.email ?? userInfo.email,
      personalEmail: u.personalEmail ?? userInfo.personalEmail,
      studentNumber: u.studentNumber ?? userInfo.studentNumber,
      program: u.program ?? userInfo.program,
      yearLevel: u.yearLevel ?? userInfo.yearLevel,
      contactNumber: u.contactNumber ?? userInfo.contactNumber,
      address: u.address ?? userInfo.address,
      completeAddress: u.completeAddress ?? u.address ?? userInfo.completeAddress ?? userInfo.address,
      role: u.role ?? userInfo.role,
    };

    localStorage.setItem('user', JSON.stringify(updatedUser));
    localStorage.setItem('userInfo', JSON.stringify(updatedInfo));

    // Refresh UI
    loadUserProfile();
  } catch (err) {
    // Silently ignore to keep UX smooth
    console.warn('Profile fetch failed:', err);
  }
}

// Toggle edit mode for sections
function toggleEdit(section) {
  const form = document.getElementById(`${section}InfoForm`);
  const inputs = form.querySelectorAll('input, select, textarea');
  const actions = document.getElementById(`${section}Actions`);
  const editBtn = document.getElementById(`edit${section.charAt(0).toUpperCase() + section.slice(1)}Btn`);

  const isEditing = actions.style.display === 'flex';

  if (isEditing) {
    // Cancel edit
    inputs.forEach(input => input.disabled = true);
    actions.style.display = 'none';
    editBtn.innerHTML = '<i class="fa-solid fa-pen"></i> Edit';
    loadUserProfile(); // Reset form
  } else {
    // Enable edit
    inputs.forEach(input => {
      // Don't enable student number and CvSU email (system fields)
      if (input.id !== 'studentNumber' && input.id !== 'cvsuEmail') {
        input.disabled = false;
      }
    });
    actions.style.display = 'flex';
    editBtn.innerHTML = '<i class="fa-solid fa-times"></i> Cancel';
  }
}

// Cancel edit mode
function cancelEdit(section) {
  toggleEdit(section);
}

// Handle personal info form submission
document.getElementById('personalInfoForm').addEventListener('submit', (e) => {
  e.preventDefault();
  savePersonalInfo();
});

function savePersonalInfo() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  let userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');

  // Get form values
  const firstName = document.getElementById('firstName').value.trim();
  const middleName = document.getElementById('middleName').value.trim();
  const lastName = document.getElementById('lastName').value.trim();
  const program = document.getElementById('program').value.trim();
  const yearLevel = document.getElementById('yearLevel').value;

  // Update userInfo object
  userInfo = {
    ...userInfo,
    firstName,
    middleName,
    lastName,
    program,
    yearLevel,
    email: user.email,
    studentNumber: document.getElementById('studentNumber').value
  };

  // Update user object name
  user.name = `${firstName} ${lastName}`;

  // Save to localStorage
  localStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('userInfo', JSON.stringify(userInfo));

  // In production, send to API:
  // await fetch('/api/user/profile', { method: 'PUT', body: JSON.stringify(userInfo) });

  showToast('Personal information updated successfully!');
  toggleEdit('personal');
  loadUserProfile();
}

// Handle contact info form submission
document.getElementById('contactInfoForm').addEventListener('submit', (e) => {
  e.preventDefault();
  saveContactInfo();
});

function saveContactInfo() {
  let userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');

  // Get form values
  const personalEmail = document.getElementById('personalEmail').value.trim();
  const contactNumber = document.getElementById('contactNumber').value.trim();
  const address = document.getElementById('address').value.trim();

  // Update userInfo object
  userInfo = {
    ...userInfo,
    personalEmail,
    contactNumber,
    // Save to both keys for compatibility across pages
    address,
    completeAddress: address
  };

  // Save to localStorage
  localStorage.setItem('userInfo', JSON.stringify(userInfo));

  // In production, send to API:
  // await fetch('/api/user/profile', { method: 'PUT', body: JSON.stringify(userInfo) });

  showToast('Contact information updated successfully!');
  toggleEdit('contact');
}

// Change photo function
function changePhoto() {
  showToast('Photo upload feature coming soon!');
}

// Change password modal
function changePassword() {
  document.getElementById('passwordModal').style.display = 'flex';
}

function closePasswordModal() {
  document.getElementById('passwordModal').style.display = 'none';
  document.getElementById('passwordForm').reset();
}

// Handle password form submission
document.getElementById('passwordForm').addEventListener('submit', (e) => {
  e.preventDefault();
  
  const currentPassword = document.getElementById('currentPassword').value;
  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  if (newPassword !== confirmPassword) {
    showToast('New passwords do not match!', 'error');
    return;
  }

  if (newPassword.length < 8) {
    showToast('Password must be at least 8 characters!', 'error');
    return;
  }

  // In production, send to API:
  // await fetch('/api/user/change-password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) });

  showToast('Password changed successfully!');
  closePasswordModal();
});

// Toast notification
function showToast(message, type = 'success') {
  const toast = document.getElementById('successToast');
  const toastMessage = document.getElementById('toastMessage');
  
  toastMessage.textContent = message;
  
  if (type === 'error') {
    toast.style.background = '#c0392b';
  } else {
    toast.style.background = '#0f5d27';
  }
  
  toast.style.display = 'flex';
  
  setTimeout(() => {
    toast.style.display = 'none';
  }, 3000);
}

// Logout function
function logout() {
  localStorage.clear();
  window.location.href = 'login.html';
}

// Close modal when clicking outside
document.getElementById('passwordModal')?.addEventListener('click', (e) => {
  if (e.target.id === 'passwordModal') {
    closePasswordModal();
  }
});
