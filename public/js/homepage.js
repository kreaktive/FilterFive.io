// FilterFive Homepage - Interactive JavaScript
// Mobile-first, progressive enhancement

(function() {
  'use strict';

  // ===================================
  // Mobile Navigation Toggle
  // ===================================
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', function() {
      hamburger.classList.toggle('active');
      navLinks.classList.toggle('active');

      // Prevent body scroll when menu is open
      document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
    });

    // Close mobile menu when clicking a link
    const navLinkItems = navLinks.querySelectorAll('a');
    navLinkItems.forEach(link => {
      link.addEventListener('click', function() {
        if (window.innerWidth < 1024) {
          hamburger.classList.remove('active');
          navLinks.classList.remove('active');
          document.body.style.overflow = '';
        }
      });
    });

    // Close mobile menu on window resize
    window.addEventListener('resize', function() {
      if (window.innerWidth >= 1024) {
        hamburger.classList.remove('active');
        navLinks.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  }

  // ===================================
  // FAQ Accordion
  // ===================================
  const faqQuestions = document.querySelectorAll('.faq-question');

  faqQuestions.forEach(question => {
    question.addEventListener('click', function() {
      const faqItem = this.parentElement;
      const isActive = faqItem.classList.contains('active');

      // Close all FAQ items
      document.querySelectorAll('.faq-item').forEach(item => {
        item.classList.remove('active');
      });

      // Open clicked item if it wasn't already open
      if (!isActive) {
        faqItem.classList.add('active');
      }
    });
  });

  // ===================================
  // Sticky CTA (Mobile Only)
  // ===================================
  const stickyCta = document.getElementById('stickyCta');

  if (stickyCta && window.innerWidth < 768) {
    let lastScrollTop = 0;
    const heroSection = document.querySelector('.hero');
    const heroHeight = heroSection ? heroSection.offsetHeight : 500;

    window.addEventListener('scroll', function() {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

      // Show sticky CTA after scrolling past hero section and when scrolling down
      if (scrollTop > heroHeight && scrollTop > lastScrollTop) {
        stickyCta.classList.add('visible');
      } else {
        stickyCta.classList.remove('visible');
      }

      lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
    }, { passive: true });
  }

  // ===================================
  // Smooth Scroll for Anchor Links
  // ===================================
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');

      // Skip if href is just "#"
      if (href === '#') {
        e.preventDefault();
        return;
      }

      const targetId = href.substring(1);
      const targetElement = document.getElementById(targetId);

      if (targetElement) {
        e.preventDefault();

        // Get navbar height for offset
        const navbar = document.querySelector('.navbar');
        const navbarHeight = navbar ? navbar.offsetHeight : 0;
        const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - navbarHeight - 20;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });

  // ===================================
  // Fade-in Animation on Scroll
  // ===================================
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const fadeInObserver = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('fade-in');
        fadeInObserver.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observe elements for fade-in animation
  const elementsToAnimate = document.querySelectorAll('.problem-card, .method-card, .benefit-card, .pricing-card, .faq-item');
  elementsToAnimate.forEach(el => {
    fadeInObserver.observe(el);
  });

  // ===================================
  // Form Validation Helper (if needed for future forms)
  // ===================================
  function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  // ===================================
  // Track CTA Clicks (Analytics Ready)
  // ===================================
  const ctaButtons = document.querySelectorAll('.btn-primary, .btn-secondary');

  ctaButtons.forEach(button => {
    button.addEventListener('click', function() {
      const buttonText = this.textContent.trim();
      const buttonLocation = this.closest('section')?.className || 'unknown';

      // Analytics tracking (Google Analytics, Plausible, etc.)
      if (typeof gtag !== 'undefined') {
        gtag('event', 'cta_click', {
          'button_text': buttonText,
          'location': buttonLocation
        });
      }

      // Console log for development
      console.log('CTA clicked:', buttonText, 'in', buttonLocation);
    });
  });

  // ===================================
  // Pricing Toggle (Annual/Monthly) - Future Enhancement
  // ===================================
  // Placeholder for future pricing toggle functionality
  // Uncomment and implement when needed:
  /*
  const pricingToggle = document.querySelector('.pricing-toggle');
  if (pricingToggle) {
    pricingToggle.addEventListener('change', function() {
      const isAnnual = this.checked;
      document.querySelectorAll('.pricing-card').forEach(card => {
        card.classList.toggle('annual-pricing', isAnnual);
      });
    });
  }
  */

  // ===================================
  // Performance: Lazy Load Images (Future Enhancement)
  // ===================================
  if ('IntersectionObserver' in window) {
    const lazyImages = document.querySelectorAll('img[data-src]');

    const imageObserver = new IntersectionObserver(function(entries) {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          imageObserver.unobserve(img);
        }
      });
    });

    lazyImages.forEach(img => imageObserver.observe(img));
  }

  // ===================================
  // Console Message (Branding)
  // ===================================
  console.log('%cFilterFive', 'font-size: 24px; font-weight: bold; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;');
  console.log('%cTurn every customer into a 5-star review 🌟', 'font-size: 14px; color: #667eea;');
  console.log('%cInterested in joining our team? Email: careers@filterfive.io', 'font-size: 12px; color: #718096;');

})();
