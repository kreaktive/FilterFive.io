/**
 * MoreStars Dashboard Mobile Menu
 * Shared JS for mobile navigation toggle
 */
(function() {
  'use strict';

  // Mobile menu toggle
  document.addEventListener('DOMContentLoaded', function() {
    var hamburgerBtn = document.getElementById('hamburgerBtn');
    var headerNav = document.getElementById('headerNav');

    if (hamburgerBtn && headerNav) {
      hamburgerBtn.addEventListener('click', function() {
        headerNav.classList.toggle('active');
      });

      // Close menu when clicking outside
      document.addEventListener('click', function(e) {
        if (!headerNav.contains(e.target) && !hamburgerBtn.contains(e.target)) {
          headerNav.classList.remove('active');
        }
      });

      // Close menu on resize to desktop
      window.addEventListener('resize', function() {
        if (window.innerWidth > 900) {
          headerNav.classList.remove('active');
        }
      });

      // Close menu on Escape key
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && headerNav.classList.contains('active')) {
          headerNav.classList.remove('active');
          hamburgerBtn.focus();
        }
      });
    }
  });
})();
