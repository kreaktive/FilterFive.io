/**
 * MoreStars Toast Notification System
 * Lightweight, accessible toast notifications
 */

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    duration: 5000,        // Auto-dismiss after 5 seconds
    maxToasts: 3,          // Maximum visible toasts
    animationDuration: 300 // CSS animation duration in ms
  };

  // SVG icon paths for each type
  const ICON_PATHS = {
    success: 'M5 13l4 4L19 7',
    error: 'M6 18L18 6M6 6l12 12',
    warning: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
    info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
  };

  // Toast types with their styling
  const TYPES = {
    success: {
      bgClass: 'bg-green-50 border-green-200',
      iconClass: 'text-green-500',
      textClass: 'text-green-800'
    },
    error: {
      bgClass: 'bg-red-50 border-red-200',
      iconClass: 'text-red-500',
      textClass: 'text-red-800'
    },
    warning: {
      bgClass: 'bg-yellow-50 border-yellow-200',
      iconClass: 'text-yellow-500',
      textClass: 'text-yellow-800'
    },
    info: {
      bgClass: 'bg-blue-50 border-blue-200',
      iconClass: 'text-blue-500',
      textClass: 'text-blue-800'
    }
  };

  // Create SVG icon element safely
  function createIcon(type) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'w-5 h-5');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('viewBox', '0 0 24 24');

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('d', ICON_PATHS[type] || ICON_PATHS.info);

    svg.appendChild(path);
    return svg;
  }

  // Create close icon element safely
  function createCloseIcon() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'w-4 h-4');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('viewBox', '0 0 24 24');

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('d', 'M6 18L18 6M6 6l12 12');

    svg.appendChild(path);
    return svg;
  }

  // Create container if it doesn't exist
  function getContainer() {
    var container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none';
      container.setAttribute('aria-live', 'polite');
      container.setAttribute('aria-label', 'Notifications');
      document.body.appendChild(container);
    }
    return container;
  }

  // Remove oldest toasts if we exceed max
  function enforceMaxToasts() {
    var container = getContainer();
    var toasts = container.querySelectorAll('.toast-item');
    while (toasts.length >= CONFIG.maxToasts) {
      var oldest = toasts[0];
      if (oldest) removeToast(oldest);
      toasts = container.querySelectorAll('.toast-item');
    }
  }

  // Remove a toast with animation
  function removeToast(toastEl) {
    toastEl.classList.add('toast-exit');
    setTimeout(function() {
      if (toastEl.parentNode) {
        toastEl.parentNode.removeChild(toastEl);
      }
    }, CONFIG.animationDuration);
  }

  // Create and show a toast
  function showToast(message, type, options) {
    type = type || 'info';
    options = options || {};

    var typeConfig = TYPES[type] || TYPES.info;
    var duration = options.duration !== undefined ? options.duration : CONFIG.duration;

    enforceMaxToasts();

    var container = getContainer();

    // Create toast element
    var toast = document.createElement('div');
    toast.className = 'toast-item pointer-events-auto flex items-start gap-3 p-4 rounded-lg border shadow-lg max-w-sm ' + typeConfig.bgClass;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-atomic', 'true');
    toast.style.position = 'relative';
    toast.style.overflow = 'hidden';

    // Icon wrapper
    var iconWrapper = document.createElement('span');
    iconWrapper.className = typeConfig.iconClass + ' flex-shrink-0 mt-0.5';
    iconWrapper.appendChild(createIcon(type));
    toast.appendChild(iconWrapper);

    // Message text (using textContent for safety)
    var messageEl = document.createElement('span');
    messageEl.className = typeConfig.textClass + ' text-sm font-medium flex-1';
    messageEl.textContent = message;
    toast.appendChild(messageEl);

    // Dismiss button
    var dismissBtn = document.createElement('button');
    dismissBtn.type = 'button';
    dismissBtn.className = 'flex-shrink-0 -mr-1 -mt-1 p-1 rounded hover:bg-black/5 transition-colors ' + typeConfig.textClass;
    dismissBtn.setAttribute('aria-label', 'Dismiss');
    dismissBtn.appendChild(createCloseIcon());
    dismissBtn.addEventListener('click', function() {
      removeToast(toast);
    });
    toast.appendChild(dismissBtn);

    // Add progress bar if duration > 0
    if (duration > 0) {
      var progressBar = document.createElement('div');
      progressBar.className = 'absolute bottom-0 left-0 h-1 bg-current opacity-20 rounded-b-lg';
      progressBar.style.width = '100%';
      progressBar.style.transition = 'width ' + duration + 'ms linear';
      toast.appendChild(progressBar);

      // Start progress animation
      requestAnimationFrame(function() {
        progressBar.style.width = '0%';
      });
    }

    // Add animation class
    toast.classList.add('toast-enter');

    // Add to container
    container.appendChild(toast);

    // Trigger entrance animation
    requestAnimationFrame(function() {
      toast.classList.remove('toast-enter');
    });

    // Auto-dismiss
    if (duration > 0) {
      setTimeout(function() {
        removeToast(toast);
      }, duration);
    }

    return toast;
  }

  // Inject CSS for animations
  function injectStyles() {
    if (document.getElementById('toast-styles')) return;

    var style = document.createElement('style');
    style.id = 'toast-styles';
    style.textContent = [
      '.toast-enter {',
      '  opacity: 0;',
      '  transform: translateX(100%);',
      '}',
      '.toast-item {',
      '  opacity: 1;',
      '  transform: translateX(0);',
      '  transition: opacity ' + CONFIG.animationDuration + 'ms ease, transform ' + CONFIG.animationDuration + 'ms ease;',
      '}',
      '.toast-exit {',
      '  opacity: 0;',
      '  transform: translateX(100%);',
      '}'
    ].join('\n');
    document.head.appendChild(style);
  }

  // Initialize
  injectStyles();

  // Public API
  window.Toast = {
    success: function(message, options) { return showToast(message, 'success', options); },
    error: function(message, options) { return showToast(message, 'error', options); },
    warning: function(message, options) { return showToast(message, 'warning', options); },
    info: function(message, options) { return showToast(message, 'info', options); },
    show: showToast
  };

  // Compatibility alias for existing code
  window.showToast = showToast;

  // Auto-show toast from URL params (for redirects)
  document.addEventListener('DOMContentLoaded', function() {
    var params = new URLSearchParams(window.location.search);

    if (params.get('toast_success')) {
      Toast.success(params.get('toast_success'));
      // Clean URL
      params.delete('toast_success');
      var newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
      window.history.replaceState({}, '', newUrl);
    }

    if (params.get('toast_error')) {
      Toast.error(params.get('toast_error'));
      params.delete('toast_error');
      var newUrl2 = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
      window.history.replaceState({}, '', newUrl2);
    }

    // Handle resent parameter specifically
    if (params.get('resent') === 'true') {
      Toast.success('SMS resent successfully');
      params.delete('resent');
      var newUrl3 = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
      window.history.replaceState({}, '', newUrl3);
    }
  });
})();
