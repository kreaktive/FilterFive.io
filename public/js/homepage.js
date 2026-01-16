/**
 * MoreStars Homepage JavaScript
 * Handles animations, interactivity, and user interactions
 */

'use strict';

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {

  // Register GSAP ScrollTrigger plugin
  gsap.registerPlugin(ScrollTrigger);

  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // GSAP defaults for GPU-accelerated animations
  gsap.defaults({
    force3D: true // Force GPU acceleration for all GSAP animations
  });

  // =====================
  // Mobile Navigation
  // =====================
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  const menuIcon = document.getElementById('menuIcon');
  const closeIcon = document.getElementById('closeIcon');

  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', function() {
      const isOpen = mobileMenu.classList.contains('hidden');

      if (isOpen) {
        mobileMenu.classList.remove('hidden');
        mobileMenu.classList.add('mobile-menu-enter');
        menuIcon.classList.add('hidden');
        closeIcon.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
      } else {
        mobileMenu.classList.add('hidden');
        mobileMenu.classList.remove('mobile-menu-enter');
        menuIcon.classList.remove('hidden');
        closeIcon.classList.add('hidden');
        document.body.style.overflow = '';
      }
    });

    // Close menu when clicking on links
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.add('hidden');
        menuIcon.classList.remove('hidden');
        closeIcon.classList.add('hidden');
        document.body.style.overflow = '';
      });
    });
  }

  // =====================
  // Hero Section Animations
  // =====================

  // Chart bars animation - animate each bar's height
  document.querySelectorAll('.hero-chart-bar').forEach((bar, index) => {
    const targetHeight = bar.style.height;
    if (prefersReducedMotion) {
      // Skip animation, show final state
      bar.style.height = targetHeight;
    } else {
      bar.style.height = '0%';
      gsap.to(bar, {
        height: targetHeight,
        duration: 0.6,
        ease: "power2.out",
        delay: 0.3 + (index * 0.15)
      });
    }
  });

  // Counter animations
  const reviewsCounter = document.getElementById('reviewsCounter');
  const monthlyCounter = document.getElementById('monthlyCounter');

  if (reviewsCounter) {
    if (prefersReducedMotion) {
      reviewsCounter.innerText = '452';
    } else {
      const counter = { val: 0 };
      gsap.to(counter, {
        val: 452,
        duration: 5,
        ease: "power2.out",
        delay: 0.5,
        onUpdate: () => {
          reviewsCounter.innerText = Math.round(counter.val);
        }
      });
    }
  }

  if (monthlyCounter) {
    if (prefersReducedMotion) {
      monthlyCounter.innerText = '+137 this month';
    } else {
      const counterMonth = { val: 0 };
      gsap.to(counterMonth, {
        val: 137,
        duration: 5,
        ease: "power2.out",
        delay: 0.5,
        onUpdate: () => {
          monthlyCounter.innerText = '+' + Math.round(counterMonth.val) + ' this month';
        }
      });
    }
  }

  // Floating animation for hero visual (skip if reduced motion)
  if (!prefersReducedMotion) {
    gsap.to('.hero-visual', {
      y: 15,
      duration: 3,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });
  }

  // =====================
  // Review Notification Cycling
  // =====================
  const notifications = [
    { name: "Sarah J.", time: "Just now", source: "Google Reviews" },
    { name: "Mike T.", time: "2m ago", source: "Yelp" },
    { name: "Jessica R.", time: "15m ago", source: "Vitals.com" },
    { name: "David L.", time: "4h ago", source: "TripAdvisor" },
    { name: "Emily W.", time: "1h ago", source: "Facebook" }
  ];

  let notificationIndex = 0;
  const notificationContainer = document.getElementById('reviewNotification');
  const notificationSource = document.getElementById('notificationSource');
  const notificationDetails = document.getElementById('notificationDetails');

  if (notificationContainer && notificationSource && notificationDetails) {
    if (prefersReducedMotion) {
      // Simple text swap without animation
      setInterval(() => {
        notificationIndex = (notificationIndex + 1) % notifications.length;
        const data = notifications[notificationIndex];
        notificationSource.innerText = 'New 5-Star in ' + data.source;
        notificationDetails.innerText = data.time + ' from ' + data.name;
      }, 3000);
    } else {
      setInterval(() => {
        // Animate out
        gsap.to(notificationContainer, {
          opacity: 0,
          scale: 0.9,
          y: 10,
          duration: 0.4,
          ease: "power2.in",
          onComplete: () => {
            notificationIndex = (notificationIndex + 1) % notifications.length;
            const data = notifications[notificationIndex];
            notificationSource.innerText = 'New 5-Star in ' + data.source;
            notificationDetails.innerText = data.time + ' from ' + data.name;

            // Animate in
            gsap.fromTo(notificationContainer,
              { opacity: 0, scale: 0.9, y: -10 },
              { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: "back.out(1.7)" }
            );
          }
        });
      }, 3000);
    }
  }

  // =====================
  // Problem Section Animation
  // =====================
  gsap.from('.problem-content > *', {
    y: 40,
    opacity: 0,
    duration: 0.8,
    stagger: 0.2,
    scrollTrigger: {
      trigger: '#problem',
      start: 'top 75%',
    }
  });

  gsap.from('.problem-visual', {
    scale: 0.9,
    opacity: 0,
    duration: 1,
    ease: "back.out(1.7)",
    scrollTrigger: {
      trigger: '.problem-visual',
      start: 'top 80%',
    }
  });

  // =====================
  // How It Works Animation
  // =====================
  gsap.fromTo('.hiw-header',
    { y: 30, opacity: 0 },
    {
      y: 0,
      opacity: 1,
      duration: 0.8,
      scrollTrigger: {
        trigger: '.hiw-header',
        start: 'top 90%',
      }
    }
  );

  gsap.fromTo('.step-card',
    { y: 50, opacity: 0 },
    {
      y: 0,
      opacity: 1,
      duration: 0.8,
      stagger: 0.2,
      ease: "power2.out",
      scrollTrigger: {
        trigger: '.step-cards-container',
        start: 'top 85%',
      }
    }
  );

  // =====================
  // Map Simulator / Competitive Comparison
  // =====================
  const reviewSlider = document.getElementById('reviewSlider');
  const reviewSliderFill = document.getElementById('reviewSliderFill');
  const reviewSliderThumb = document.getElementById('reviewSliderThumb');
  const reviewCount = document.getElementById('reviewCount');
  const rankStatus = document.getElementById('rankStatus');
  const businessList = document.getElementById('businessList');
  const positionLabel = document.getElementById('positionLabel');

  if (reviewSlider && businessList) {
    // Competitor data (static)
    const competitors = [
      { name: "Pro Service Experts", reviews: 145, rating: 4.8, isMe: false },
      { name: "City Best Local", reviews: 88, rating: 4.6, isMe: false },
      { name: "Budget Bros", reviews: 42, rating: 4.2, isMe: false }
    ];

    // Track previous rank for confetti trigger
    let previousRank = 4;

    // Feature card colors for confetti
    const confettiColors = [
      '#3B82F6', // blue
      '#8B5CF6', // purple
      '#22C55E', // green
      '#F97316', // orange
      '#EAB308', // yellow
      '#6366F1', // indigo
      '#14B8A6'  // teal
    ];

    // Global confetti management - max 200 pieces on screen at once
    const MAX_CONFETTI = 200;
    const allConfettiBatches = []; // Track all batches in order (oldest first)

    // Confetti animation function with physics-based gravity and floor accumulation
    function triggerConfetti() {
      // Skip confetti for reduced motion users
      if (prefersReducedMotion) return;

      const mapSimulator = document.getElementById('map-simulator');
      if (!mapSimulator) return;

      const rect = mapSimulator.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height * 0.4;
      const floorY = window.innerHeight - centerY - 10; // Floor is bottom of viewport

      // Reuse existing container or create new one
      let container = document.querySelector('.confetti-container');
      if (!container) {
        container = document.createElement('div');
        container.className = 'confetti-container';
        container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;overflow:hidden;';
        document.body.appendChild(container);
      }

      // Count current active confetti
      let activeCount = allConfettiBatches.reduce((sum, batch) => sum + batch.pieces.length, 0);

      // New batch size
      const newBatchSize = 150;

      // Remove oldest confetti if we'd exceed the limit
      while (activeCount + newBatchSize > MAX_CONFETTI && allConfettiBatches.length > 0) {
        const oldestBatch = allConfettiBatches[0];
        // Remove oldest pieces from the oldest batch until we have room
        while (oldestBatch.pieces.length > 0 && activeCount + newBatchSize > MAX_CONFETTI) {
          const piece = oldestBatch.pieces.shift();
          piece.el.remove();
          activeCount--;
        }
        // Remove empty batches
        if (oldestBatch.pieces.length === 0) {
          allConfettiBatches.shift();
        }
      }

      // Create new batch
      const confettiPieces = [];

      for (let i = 0; i < newBatchSize; i++) {
        const confetti = document.createElement('div');
        const color = confettiColors[Math.floor(Math.random() * confettiColors.length)];
        const size = Math.random() * 12 + 6;
        const isCircle = Math.random() > 0.6;

        confetti.style.cssText = `
          position: absolute;
          width: ${size}px;
          height: ${isCircle ? size : size * 0.4}px;
          background: ${color};
          border-radius: ${isCircle ? '50%' : '2px'};
          left: ${centerX}px;
          top: ${centerY}px;
          opacity: 1;
          will-change: transform, opacity;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          transform: translate3d(0, 0, 0);
        `;

        container.appendChild(confetti);

        // Initial velocity - explosion outward with upward bias
        const angle = (Math.random() * 360) * (Math.PI / 180);
        const velocity = Math.random() * 800 + 400;

        confettiPieces.push({
          el: confetti,
          x: 0,
          y: 0,
          vx: Math.cos(angle) * velocity * 0.015,
          vy: Math.sin(angle) * velocity * 0.015 - Math.random() * 15 - 10, // strong upward bias
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 15,
          gravity: 0.4 + Math.random() * 0.2,
          drag: 0.98 + Math.random() * 0.015,
          opacity: 1,
          onFloor: false,
          bounciness: 0.3 + Math.random() * 0.2
        });
      }

      // Add this batch to tracking
      const batch = { pieces: confettiPieces, startTime: Date.now() };
      allConfettiBatches.push(batch);

      // Physics animation loop
      const duration = 8000; // 8 seconds total to enjoy the accumulation

      function animateConfetti() {
        const elapsed = Date.now() - batch.startTime;
        const progress = elapsed / duration;

        if (progress >= 1) {
          // Clean up this batch
          batch.pieces.forEach(piece => piece.el.remove());
          batch.pieces.length = 0;
          // Remove from tracking
          const idx = allConfettiBatches.indexOf(batch);
          if (idx > -1) allConfettiBatches.splice(idx, 1);
          // Remove container if empty
          if (allConfettiBatches.length === 0 && container.parentNode) {
            container.remove();
          }
          return;
        }

        batch.pieces.forEach(piece => {
          if (!piece.onFloor) {
            // Apply gravity
            piece.vy += piece.gravity;

            // Apply drag
            piece.vx *= piece.drag;
            piece.vy *= piece.drag;

            // Update position
            piece.x += piece.vx;
            piece.y += piece.vy;

            // Check if hit the floor
            if (piece.y >= floorY) {
              piece.y = floorY;

              // Bounce with energy loss
              if (Math.abs(piece.vy) > 2) {
                piece.vy = -piece.vy * piece.bounciness;
                piece.vx *= 0.8;
                piece.rotationSpeed *= 0.5;
              } else {
                // Settle on floor
                piece.onFloor = true;
                piece.vy = 0;
                piece.vx = 0;
                piece.rotationSpeed = 0;
              }
            }

            // Update rotation
            piece.rotation += piece.rotationSpeed;
          }

          // Fade out in last 30% of animation
          if (progress > 0.7) {
            piece.opacity = 1 - ((progress - 0.7) / 0.3);
          }

          // Apply to element - use translate3d for GPU acceleration
          piece.el.style.transform = `translate3d(${piece.x}px, ${piece.y}px, 0) rotate(${piece.rotation}deg)`;
          piece.el.style.opacity = piece.opacity;
        });

        requestAnimationFrame(animateConfetti);
      }

      requestAnimationFrame(animateConfetti);
    }

    function renderBusinessList(userReviews) {
      // Create user business
      const myBusiness = { name: "Your Business", reviews: userReviews, rating: 4.9, isMe: true };

      // Combine and sort by review count
      const all = [...competitors, myBusiness].sort((a, b) => b.reviews - a.reviews);

      // Find user's rank
      const myRank = all.findIndex(b => b.isMe) + 1;

      // Trigger confetti when reaching #1 (from any lower rank)
      if (previousRank > 1 && myRank === 1) {
        triggerConfetti();
      }
      previousRank = myRank;

      // Calculate slider percentage
      const sliderPercent = ((userReviews - 12) / (200 - 12)) * 100;

      // Update slider visuals
      reviewSliderFill.style.width = sliderPercent + '%';
      reviewSliderThumb.style.left = 'calc(' + sliderPercent + '% - 16px)';
      reviewCount.textContent = userReviews;

      // Update rank status and position label
      let statusClass, statusText, labelText, labelClass;
      if (myRank === 1) {
        statusClass = 'bg-green-50 border-green-100 text-green-800';
        statusText = "🥇 You are #1 in the Map Pack!";
        labelText = "🏆 You're the obvious choice";
        labelClass = "bg-green-100 text-green-700";
      } else if (myRank === 2) {
        statusClass = 'bg-green-50 border-green-100 text-green-800';
        statusText = "🥈 You're beating 2 competitors!";
        labelText = "🔥 Almost there...";
        labelClass = "bg-yellow-100 text-yellow-700";
      } else if (myRank === 3) {
        statusClass = 'bg-green-50 border-green-100 text-green-800';
        statusText = "🥉 You made the Top 3!";
        labelText = "👀 They're starting to notice you";
        labelClass = "bg-blue-100 text-blue-700";
      } else {
        statusClass = 'bg-gray-50 border-gray-200 text-gray-500';
        statusText = "You are invisible on page 2.";
        labelText = "They don't even see you";
        labelClass = "bg-gray-100 text-gray-500";
      }

      rankStatus.className = 'p-4 rounded-xl border text-center transition-colors duration-300 ' + statusClass;
      const statusP = rankStatus.querySelector('p') || document.createElement('p');
      statusP.className = 'font-bold text-lg';
      statusP.textContent = statusText;
      if (!rankStatus.contains(statusP)) rankStatus.appendChild(statusP);

      // Update position label using DOM methods
      if (positionLabel) {
        let labelSpan = positionLabel.querySelector('span');
        if (!labelSpan) {
          labelSpan = document.createElement('span');
          positionLabel.appendChild(labelSpan);
        }
        labelSpan.className = 'inline-block px-2 py-1 rounded-full text-xs font-semibold ' + labelClass;
        labelSpan.textContent = labelText;
      }

      // Render business items
      businessList.innerHTML = all.map((biz, i) => {
        const bgClass = biz.isMe ? 'bg-blue-50/80 z-20' : 'bg-white z-10';
        const iconHtml = biz.isMe
          ? '<div class="w-8 h-8 bg-blue-600 text-white rounded flex items-center justify-center font-bold text-xs shadow-md shadow-blue-200">You</div>'
          : '<div class="w-8 h-8 bg-red-500 text-white rounded flex items-center justify-center font-bold text-sm shadow-sm">' + String.fromCharCode(65 + i) + '</div>';
        const nameClass = biz.isMe ? 'text-blue-700' : 'text-gray-900';

        // Create 5 stars
        const starsHtml = Array(5).fill('<svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>').join('');

        return '<div class="absolute w-full p-4 flex items-start gap-4 transition-all duration-500 ease-in-out border-b border-gray-50 ' + bgClass + '" style="transform: translateY(' + (i * 90) + 'px); height: 90px;">' +
          '<div class="mt-1 flex-shrink-0">' + iconHtml + '</div>' +
          '<div class="flex-grow">' +
            '<h4 class="font-bold text-base ' + nameClass + '">' + biz.name + '</h4>' +
            '<div class="flex items-center gap-1.5 text-sm mt-1">' +
              '<span class="font-bold text-orange-500">' + biz.rating + '</span>' +
              '<div class="flex text-yellow-400">' + starsHtml + '</div>' +
              '<span class="text-gray-500">(' + biz.reviews + ')</span>' +
            '</div>' +
            '<div class="text-xs text-gray-400 mt-1 font-medium">Service Business • Open now</div>' +
          '</div>' +
        '</div>';
      }).join('');
    }

    // Initialize with starting value
    renderBusinessList(parseInt(reviewSlider.value));

    // Update on slider change
    reviewSlider.addEventListener('input', function() {
      renderBusinessList(parseInt(this.value));
    });

    // Animate Map Simulator on scroll
    gsap.from('#map-simulator .text-center', {
      y: 30,
      opacity: 0,
      duration: 0.8,
      scrollTrigger: {
        trigger: '#map-simulator',
        start: 'top 60%',
      }
    });

    gsap.from('#map-simulator .lg\\:col-span-5', {
      x: -50,
      opacity: 0,
      duration: 1,
      ease: "power3.out",
      scrollTrigger: {
        trigger: '#map-simulator',
        start: 'top 60%',
      }
    });

    gsap.from('#map-simulator .lg\\:col-span-7', {
      x: 50,
      opacity: 0,
      duration: 1,
      ease: "power3.out",
      scrollTrigger: {
        trigger: '#map-simulator',
        start: 'top 60%',
      }
    });

    // Scroll-driven slider animation
    // As user scrolls through the map simulator section, the slider automatically moves
    ScrollTrigger.create({
      trigger: '#map-simulator',
      start: 'top 55%',
      end: 'bottom 40%',
      scrub: 1,
      onUpdate: (self) => {
        // Map scroll progress (0-1) to review count (12-200)
        const progress = self.progress;
        const minReviews = 12;
        const maxReviews = 200;
        const currentReviews = Math.round(minReviews + (maxReviews - minReviews) * progress);

        // Update the slider input value
        reviewSlider.value = currentReviews;

        // Render the updated business list
        renderBusinessList(currentReviews);
      }
    });
  }

  // =====================
  // Setup Section Animation
  // =====================
  gsap.fromTo('.setup-header',
    { y: 30, opacity: 0 },
    {
      y: 0,
      opacity: 1,
      duration: 0.8,
      scrollTrigger: {
        trigger: '.setup-header',
        start: 'top 80%',
      }
    }
  );

  gsap.fromTo('.setup-step',
    { y: 50, opacity: 0 },
    {
      y: 0,
      opacity: 1,
      duration: 0.8,
      stagger: 0.2,
      ease: "power2.out",
      scrollTrigger: {
        trigger: '.steps-container',
        start: 'top 75%',
      }
    }
  );

  gsap.fromTo('.connecting-line',
    { scaleX: 0 },
    {
      scaleX: 1,
      duration: 1.5,
      ease: "power2.out",
      scrollTrigger: {
        trigger: '.steps-container',
        start: 'top 75%',
      }
    }
  );

  gsap.fromTo('.setup-cta',
    { y: 30, opacity: 0 },
    {
      y: 0,
      opacity: 1,
      duration: 0.8,
      delay: 0.6,
      ease: "power2.out",
      scrollTrigger: {
        trigger: '.steps-container',
        start: 'top 60%',
      }
    }
  );

  // =====================
  // Stats Reveal Animation (Numbers Don't Lie)
  // =====================
  const statRevealElements = document.querySelectorAll('.stat-reveal');
  if (statRevealElements.length > 0) {
    statRevealElements.forEach((stat, index) => {
      gsap.to(stat, {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: stat,
          start: 'top 85%',
          end: 'top 40%',
          toggleActions: 'play none none reverse'
        }
      });
    });
  }

  // =====================
  // Features Section Animation
  // =====================
  gsap.fromTo('.features-header',
    { y: 50, opacity: 0 },
    {
      y: 0,
      opacity: 1,
      duration: 1,
      ease: "power2.out",
      scrollTrigger: {
        trigger: '#features',
        start: 'top 80%',
      }
    }
  );

  // Feature cards - different behavior for mobile vs desktop
  const featureCards = document.querySelectorAll('.feature-card');
  const featureWrappers = document.querySelectorAll('.feature-card-wrapper');
  const isMobileStack = window.innerWidth < 768; // md breakpoint for stack effect

  if (isMobileStack && featureWrappers.length > 0) {
    // =====================
    // MOBILE: Stacked Cards with Scroll Animation
    // =====================
    const stackContainer = document.getElementById('featuresStackContainer');
    const featuresStack = document.getElementById('featuresStack');
    const totalCards = featureWrappers.length;

    // Calculate container height based on number of cards
    const scrollPerCard = 35; // vh per card transition
    const totalScrollHeight = totalCards * scrollPerCard;
    stackContainer.style.height = totalScrollHeight + 'vh';

    // Stack visual parameters - all 9 cards visible in stack
    const stackOffsetY = 6; // Vertical offset between cards (smaller to fit all)
    const stackScaleStep = 0.02; // Scale reduction per card
    const visibleCards = totalCards; // Show ALL cards in the stack

    // Initial setup: stack all cards with offset and scale for deck effect
    featureWrappers.forEach((wrapper, index) => {
      const card = wrapper.querySelector('.feature-card');
      const zIndex = totalCards - index;
      const initialScale = 1 - (index * stackScaleStep);
      const initialY = index * stackOffsetY;

      gsap.set(wrapper, {
        position: 'absolute',
        top: 0,
        left: '50%',
        xPercent: -50,
        x: 0,
        zIndex: zIndex,
        y: initialY,
        scale: initialScale,
        opacity: 1 // All cards visible
      });

      // Show badge on active card
      const badge = card.querySelector('.feature-badge');
      if (badge) {
        gsap.set(badge, { scale: index === 0 ? 1 : 0.8, opacity: index === 0 ? 1 : 0.5 });
      }
    });

    // Create scroll-driven animation
    ScrollTrigger.create({
      trigger: stackContainer,
      start: 'top 15%',
      end: 'bottom 85%',
      scrub: 0.3,
      onUpdate: (self) => {
        const progress = self.progress;
        const cardProgress = progress * (totalCards - 1);
        const activeIndex = Math.min(Math.floor(cardProgress), totalCards - 1);
        const cardLocalProgress = cardProgress - activeIndex;

        featureWrappers.forEach((wrapper, index) => {
          const card = wrapper.querySelector('.feature-card');
          const badge = card.querySelector('.feature-badge');
          const relativeIndex = index - activeIndex;

          if (index < activeIndex) {
            // Cards that have passed: fly off to top-left
            gsap.set(wrapper, {
              y: -350,
              x: -150,
              xPercent: -50,
              scale: 0.7,
              rotation: -20,
              opacity: 0,
              zIndex: 0
            });
          } else if (index === activeIndex) {
            // Active card: animating out based on local progress
            const exitY = -350 * cardLocalProgress;
            const exitX = -150 * cardLocalProgress;
            const exitScale = 1 - (0.3 * cardLocalProgress);
            const exitRotation = -20 * cardLocalProgress;
            const exitOpacity = 1 - cardLocalProgress;

            gsap.set(wrapper, {
              y: exitY,
              x: exitX,
              xPercent: -50,
              scale: exitScale,
              rotation: exitRotation,
              opacity: exitOpacity,
              zIndex: totalCards
            });

            if (badge) {
              gsap.set(badge, { scale: 1 - (0.2 * cardLocalProgress), opacity: 1 - (0.5 * cardLocalProgress) });
            }
          } else {
            // Cards behind: stack with offset, coming into view
            const stackPosition = relativeIndex - 1;
            const comingIntoFocus = index === activeIndex + 1 ? cardLocalProgress : 0;

            // Calculate properties based on stack position
            const baseY = Math.max(0, stackPosition) * stackOffsetY;
            const targetY = baseY - (comingIntoFocus * baseY);
            const baseScale = 1 - (Math.max(0, stackPosition) * stackScaleStep);
            const targetScale = baseScale + (comingIntoFocus * (1 - baseScale));

            // All cards visible in stack
            gsap.set(wrapper, {
              y: targetY,
              x: 0,
              xPercent: -50,
              scale: targetScale,
              rotation: 0,
              opacity: 1,
              zIndex: totalCards - index
            });

            if (badge && index === activeIndex + 1) {
              gsap.set(badge, { scale: 0.8 + (0.2 * comingIntoFocus), opacity: 0.5 + (0.5 * comingIntoFocus) });
            }
          }
        });
      }
    });

  } else {
    // =====================
    // DESKTOP: Original grid animation with 3D effects
    // =====================
    featureCards.forEach((card, index) => {
      // Determine column position (0=left, 1=center, 2=right) for 3-column grid
      const column = index % 3;

      // Set initial state and animation based on column
      let fromX = 0;
      let fromY = 0;
      let fromRotation = 0;

      // Desktop: left column from left, center from bottom, right from right
      if (column === 0) {
        fromX = -150;
        fromRotation = -5;
      } else if (column === 1) {
        fromY = 150;
        fromRotation = 3;
      } else {
        fromX = 150;
        fromRotation = 5;
      }

      // Calculate stagger delay based on row
      const row = Math.floor(index / 3);
      const staggerDelay = row * 0.1;

      // Set initial state immediately (prevents flash)
      gsap.set(card, {
        x: fromX,
        y: fromY,
        rotation: fromRotation,
        scale: 0.95,
        opacity: 0
      });

      // Entrance animation with smooth easing
      gsap.to(card, {
        x: 0,
        y: 0,
        rotation: 0,
        scale: 1,
        opacity: 1,
        duration: 0.8,
        delay: staggerDelay,
        ease: "power3.out",
        scrollTrigger: {
          trigger: card,
          start: 'top 85%',
        }
      });

      // 3D Tilt effect on mouse move (desktop only)
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = (y - centerY) / 15;
        const rotateY = (centerX - x) / 15;

        gsap.to(card, {
          rotateX: rotateX,
          rotateY: rotateY,
          duration: 0.4,
          ease: "power2.out",
          overwrite: 'auto'
        });
      });

      card.addEventListener('mouseleave', () => {
        gsap.to(card, {
          rotateX: 0,
          rotateY: 0,
          duration: 0.6,
          ease: "power2.out",
          overwrite: 'auto'
        });
      });

      // Badge entrance animation
      const badge = card.querySelector('.feature-badge');
      if (badge) {
        gsap.fromTo(badge,
          { scale: 0, opacity: 0 },
          {
            scale: 1,
            opacity: 1,
            duration: 0.4,
            delay: staggerDelay + 0.3,
            ease: "back.out(1.5)",
            scrollTrigger: {
              trigger: card,
              start: 'top 85%',
            }
          }
        );
      }

      // Icon hover animations
      const iconContainer = card.querySelector('.w-12, .w-14');
      if (iconContainer) {
        const icon = iconContainer.querySelector('svg');
        const iconType = card.dataset.color;

        card.addEventListener('mouseenter', () => {
          if (iconType === 'blue') {
            // Phone vibrate
            gsap.to(icon, {
              x: 2,
              duration: 0.05,
              repeat: 5,
              yoyo: true,
              ease: "none"
            });
          } else if (iconType === 'purple') {
            // QR code pulse
            gsap.to(icon, {
              scale: 1.2,
              duration: 0.3,
              repeat: 1,
              yoyo: true,
              ease: "power2.inOut"
            });
          } else if (iconType === 'green') {
            // Chart bars grow
            gsap.fromTo(icon,
              { scaleY: 0.8, transformOrigin: 'bottom' },
              { scaleY: 1, duration: 0.4, ease: "elastic.out(1, 0.5)" }
            );
          } else if (iconType === 'orange') {
            // Location pin bounce
            gsap.to(icon, {
              y: -5,
              duration: 0.2,
              repeat: 2,
              yoyo: true,
              ease: "power2.out"
            });
          } else if (iconType === 'yellow') {
            // Zap flash
            gsap.to(icon, {
              opacity: 0.5,
              duration: 0.1,
              repeat: 3,
              yoyo: true
            });
          } else if (iconType === 'indigo') {
            // Globe spin
            gsap.to(icon, {
              rotation: 360,
              duration: 0.8,
              ease: "power2.inOut"
            });
          } else if (iconType === 'teal') {
            // Clock tick
            gsap.to(icon, {
              rotation: 15,
              duration: 0.15,
              repeat: 3,
              yoyo: true,
              ease: "none"
            });
          }
        });
      }
    });
  }

  // Features marquee auto-scroll
  const featuresScroll = document.getElementById('featuresScroll');
  let featuresIsPaused = false;

  if (featuresScroll) {
    function scrollFeatures() {
      if (!featuresIsPaused && featuresScroll) {
        const setWidth = featuresScroll.scrollWidth / 3;
        if (featuresScroll.scrollLeft >= setWidth) {
          featuresScroll.scrollLeft = 0;
        } else {
          featuresScroll.scrollLeft += 1;
        }
      }
      requestAnimationFrame(scrollFeatures);
    }

    requestAnimationFrame(scrollFeatures);

    featuresScroll.addEventListener('mouseenter', () => { featuresIsPaused = true; });
    featuresScroll.addEventListener('mouseleave', () => { featuresIsPaused = false; });
    featuresScroll.addEventListener('touchstart', () => { featuresIsPaused = true; }, { passive: true });
    featuresScroll.addEventListener('touchend', () => {
      setTimeout(() => { featuresIsPaused = false; }, 1000);
    }, { passive: true });
  }

  // =====================
  // Social Proof Animation
  // =====================
  gsap.from(['.sp-header', '.stat-item'], {
    y: 30,
    opacity: 0,
    duration: 0.8,
    stagger: 0.1,
    scrollTrigger: {
      trigger: '.sp-header',
      start: 'top 85%',
    }
  });

  gsap.from('.calculator-card', {
    y: 50,
    opacity: 0,
    duration: 1,
    ease: "power3.out",
    scrollTrigger: {
      trigger: '.calculator-card',
      start: 'top 85%',
    }
  });

  // =====================
  // ROI Calculator
  // =====================
  const customerSlider = document.getElementById('customerSlider');
  const customerCount = document.getElementById('customerCount');
  const sliderFill = document.getElementById('sliderFill');
  const sliderThumb = document.getElementById('sliderThumb');
  const monthlyReviews = document.getElementById('monthlyReviews');
  const yearlyReviews = document.getElementById('yearlyReviews');

  if (customerSlider) {
    function updateCalculator() {
      const customers = parseInt(customerSlider.value);
      const percentage = (customers / 1000) * 100;
      const conversionRate = 0.80;
      const monthly = Math.round(customers * conversionRate);
      const yearly = monthly * 12;

      customerCount.innerText = customers;
      sliderFill.style.width = percentage + '%';
      sliderThumb.style.left = 'calc(' + percentage + '% - 16px)';
      monthlyReviews.innerText = '+' + monthly;
      yearlyReviews.innerText = '+' + yearly;
    }

    customerSlider.addEventListener('input', updateCalculator);
    updateCalculator(); // Initialize
  }

  // =====================
  // Pricing Toggle
  // =====================
  const monthlyBtn = document.getElementById('monthlyBtn');
  const yearlyBtn = document.getElementById('yearlyBtn');
  const priceDisplay = document.getElementById('priceDisplay');
  const billingText = document.getElementById('billingText');

  if (monthlyBtn && yearlyBtn) {
    monthlyBtn.addEventListener('click', () => {
      monthlyBtn.classList.add('bg-white', 'shadow-md', 'text-[#500B42]');
      monthlyBtn.classList.remove('text-gray-500');
      yearlyBtn.classList.remove('bg-white', 'shadow-md', 'text-[#500B42]');
      yearlyBtn.classList.add('text-gray-500');
      priceDisplay.innerText = '$77';
      billingText.innerText = 'No contracts. Cancel anytime.';
    });

    yearlyBtn.addEventListener('click', () => {
      yearlyBtn.classList.add('bg-white', 'shadow-md', 'text-[#500B42]');
      yearlyBtn.classList.remove('text-gray-500');
      monthlyBtn.classList.remove('bg-white', 'shadow-md', 'text-[#500B42]');
      monthlyBtn.classList.add('text-gray-500');
      priceDisplay.innerText = '$64';
      billingText.innerText = 'Billed $770 yearly';
    });
  }

  // =====================
  // Detailed How It Works Animation
  // =====================
  gsap.from('.dhiw-step', {
    y: 50,
    opacity: 0,
    duration: 0.8,
    stagger: 0.2,
    scrollTrigger: {
      trigger: '.dhiw-container',
      start: 'top 75%',
    }
  });

  // Mouse follow gradient for Final CTA
  const finalCtaCard = document.getElementById('finalCtaCard');
  if (finalCtaCard) {
    finalCtaCard.addEventListener('mousemove', (e) => {
      const rect = finalCtaCard.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      finalCtaCard.style.setProperty('--mouse-x', x + 'px');
      finalCtaCard.style.setProperty('--mouse-y', y + 'px');
    });
  }

  // =====================
  // Step Cards Mouse Follow Gradient
  // =====================
  document.querySelectorAll('.step-card, .feature-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', x + 'px');
      card.style.setProperty('--mouse-y', y + 'px');
    });
  });

  // =====================
  // Smooth Scroll for Anchor Links
  // =====================
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId && targetId !== '#') {
        e.preventDefault();
        const target = document.querySelector(targetId);
        if (target) {
          const navHeight = 100; // Account for fixed navbar
          const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navHeight;
          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
        }
      }
    });
  });

  // =====================
  // Analytics Tracking
  // =====================
  document.querySelectorAll('[data-track]').forEach(element => {
    element.addEventListener('click', function() {
      const action = this.getAttribute('data-track');
      if (window.dataLayer) {
        window.dataLayer.push({
          'event': 'cta_click',
          'action': action
        });
      }
    });
  });

  // =====================
  // Industry Mega Menu
  // =====================
  const megaMenuTrigger = document.getElementById('industriesTrigger');
  const megaMenu = document.getElementById('industriesMegaMenu');
  let megaMenuTimeout;

  if (megaMenuTrigger && megaMenu) {
    // Desktop hover behavior
    megaMenuTrigger.addEventListener('mouseenter', () => {
      clearTimeout(megaMenuTimeout);
      megaMenu.classList.add('open');
      megaMenuTrigger.classList.add('active');
    });

    megaMenuTrigger.addEventListener('mouseleave', () => {
      megaMenuTimeout = setTimeout(() => {
        if (!megaMenu.matches(':hover')) {
          megaMenu.classList.remove('open');
          megaMenuTrigger.classList.remove('active');
        }
      }, 100);
    });

    megaMenu.addEventListener('mouseenter', () => {
      clearTimeout(megaMenuTimeout);
    });

    megaMenu.addEventListener('mouseleave', () => {
      megaMenu.classList.remove('open');
      megaMenuTrigger.classList.remove('active');
    });

    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        megaMenu.classList.remove('open');
        megaMenuTrigger.classList.remove('active');
      }
    });
  }

  // Mobile Industries Accordion
  const mobileIndustriesTrigger = document.getElementById('mobileIndustriesTrigger');
  const mobileIndustriesAccordion = document.getElementById('mobileIndustriesAccordion');
  const mobileIndustriesArrow = document.getElementById('mobileIndustriesArrow');

  if (mobileIndustriesTrigger && mobileIndustriesAccordion) {
    mobileIndustriesTrigger.addEventListener('click', (e) => {
      e.preventDefault();
      mobileIndustriesAccordion.classList.toggle('open');
      mobileIndustriesArrow.classList.toggle('rotate-180');
    });
  }

  // Console branding
  console.log('%c⭐ MoreStars.io', 'font-size: 24px; font-weight: bold; color: #FFBA49;');
  console.log('%cGet more Google reviews for your business', 'font-size: 14px; color: #500B42;');

});
