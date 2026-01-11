// Sidebar Menu Toggle for Dashboard Pages
document.addEventListener('DOMContentLoaded', function() {
  // Create mobile menu toggle button if it doesn't exist
  if (!document.querySelector('.mobile-menu-toggle')) {
    const toggleButton = document.createElement('button');
    toggleButton.className = 'mobile-menu-toggle';
    toggleButton.setAttribute('aria-label', 'Toggle menu');
    toggleButton.innerHTML = '<i class="fas fa-bars"></i>';
    document.body.insertBefore(toggleButton, document.body.firstChild);
  }

  // Create overlay for mobile menu
  if (!document.querySelector('.leftnav-overlay')) {
    const overlay = document.createElement('div');
    overlay.className = 'leftnav-overlay';
    document.body.insertBefore(overlay, document.body.firstChild);
  }

  const menuToggle = document.querySelector('.mobile-menu-toggle');
  const sidebar = document.querySelector('.leftnav');
  const overlay = document.querySelector('.leftnav-overlay');

  if (menuToggle && sidebar) {
    // Toggle menu on button click
    menuToggle.addEventListener('click', function(e) {
      e.stopPropagation();
      sidebar.classList.toggle('active');
      overlay.classList.toggle('active');
      
      // Toggle icon
      const icon = menuToggle.querySelector('i');
      if (icon) {
        if (icon.classList.contains('fa-bars')) {
          icon.classList.remove('fa-bars');
          icon.classList.add('fa-times');
        } else {
          icon.classList.remove('fa-times');
          icon.classList.add('fa-bars');
        }
      }
    });

    // Close menu when clicking overlay
    if (overlay) {
      overlay.addEventListener('click', function() {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
        const icon = menuToggle.querySelector('i');
        if (icon && icon.classList.contains('fa-times')) {
          icon.classList.remove('fa-times');
          icon.classList.add('fa-bars');
        }
      });
    }

    // Close menu when clicking on a nav link
    const navLinks = sidebar.querySelectorAll('.nav-link, a[href]');
    navLinks.forEach(link => {
      link.addEventListener('click', function() {
        if (window.innerWidth <= 768) {
          sidebar.classList.remove('active');
          overlay.classList.remove('active');
          const icon = menuToggle.querySelector('i');
          if (icon && icon.classList.contains('fa-times')) {
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
          }
        }
      });
    });

    // Close menu on window resize if screen becomes large
    window.addEventListener('resize', function() {
      if (window.innerWidth > 768) {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
        const icon = menuToggle.querySelector('i');
        if (icon && icon.classList.contains('fa-times')) {
          icon.classList.remove('fa-times');
          icon.classList.add('fa-bars');
        }
      }
    });
  }
});
