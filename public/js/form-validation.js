/**
 * Form Validation Utilities for MoreStars
 * Client-side validation that mirrors server-side validationService.js
 */

(function(window) {
  'use strict';

  const FormValidation = {
    /**
     * Validate email format
     * @param {string} email
     * @returns {boolean}
     */
    isValidEmail: function(email) {
      if (!email || typeof email !== 'string') return false;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email.trim());
    },

    /**
     * Validate password strength
     * Requirements: 8+ chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
     * @param {string} password
     * @returns {boolean}
     */
    isValidPassword: function(password) {
      if (!password || typeof password !== 'string') return false;
      if (password.length < 8) return false;
      if (!/\d/.test(password)) return false;
      if (!/[A-Z]/.test(password)) return false;
      if (!/[a-z]/.test(password)) return false;
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return false;
      return true;
    },

    /**
     * Get password strength score (0-4)
     * @param {string} password
     * @returns {number}
     */
    getPasswordStrength: function(password) {
      if (!password) return 0;
      var strength = 0;
      if (password.length >= 8) strength++;
      if (password.length >= 12) strength++;
      if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
      if (/\d/.test(password)) strength++;
      if (/[^a-zA-Z0-9]/.test(password)) strength++;
      return Math.min(strength, 4);
    },

    /**
     * Get password strength label
     * @param {number} strength
     * @returns {object} { label, color }
     */
    getPasswordStrengthLabel: function(strength) {
      var labels = [
        { label: 'Very Weak', color: '#EF5B5B' },
        { label: 'Weak', color: '#EF5B5B' },
        { label: 'Fair', color: '#FFBA49' },
        { label: 'Good', color: '#20A39E' },
        { label: 'Strong', color: '#20A39E' }
      ];
      return labels[Math.min(strength, 4)];
    },

    /**
     * Validate business name
     * @param {string} name
     * @returns {boolean}
     */
    isValidBusinessName: function(name) {
      if (!name || typeof name !== 'string') return false;
      var trimmed = name.trim();
      return trimmed.length >= 2 && trimmed.length <= 100;
    },

    /**
     * Validate phone number (basic US format)
     * @param {string} phone
     * @returns {boolean}
     */
    isValidPhone: function(phone) {
      if (!phone || typeof phone !== 'string') return false;
      // Remove formatting characters
      var digits = phone.replace(/[\s\-\(\)\.]/g, '');
      // US phone: 10 digits, optionally starting with 1
      return /^1?\d{10}$/.test(digits);
    },

    /**
     * Validate URL format
     * @param {string} url
     * @returns {boolean}
     */
    isValidUrl: function(url) {
      if (!url || typeof url !== 'string') return false;
      try {
        var parsed = new URL(url.trim());
        return ['http:', 'https:'].includes(parsed.protocol);
      } catch (e) {
        return false;
      }
    },

    /**
     * Show validation error on an input
     * @param {HTMLInputElement} input
     * @param {string} message
     */
    showError: function(input, message) {
      var errorId = input.id + '-error';
      var existingError = document.getElementById(errorId);

      // Add error classes
      input.classList.add('validation-error');
      input.setAttribute('aria-invalid', 'true');
      input.setAttribute('aria-describedby', errorId);

      if (existingError) {
        existingError.textContent = message;
        existingError.style.display = 'block';
      } else {
        var errorEl = document.createElement('p');
        errorEl.id = errorId;
        errorEl.className = 'form-error-message';
        errorEl.textContent = message;
        errorEl.setAttribute('role', 'alert');
        input.parentNode.appendChild(errorEl);
      }
    },

    /**
     * Clear validation error from an input
     * @param {HTMLInputElement} input
     */
    clearError: function(input) {
      var errorId = input.id + '-error';
      var errorEl = document.getElementById(errorId);

      input.classList.remove('validation-error');
      input.removeAttribute('aria-invalid');
      input.removeAttribute('aria-describedby');

      if (errorEl) {
        errorEl.style.display = 'none';
      }
    },

    /**
     * Validate a form field
     * @param {HTMLInputElement} input
     * @returns {boolean}
     */
    validateField: function(input) {
      var value = input.value;
      var type = input.type;
      var name = input.name;
      var required = input.required;

      // Clear previous error
      this.clearError(input);

      // Required check
      if (required && !value.trim()) {
        this.showError(input, 'This field is required');
        return false;
      }

      // Skip further validation if empty and not required
      if (!value.trim()) return true;

      // Type-specific validation
      switch (type) {
        case 'email':
          if (!this.isValidEmail(value)) {
            this.showError(input, 'Please enter a valid email address');
            return false;
          }
          break;

        case 'tel':
          if (!this.isValidPhone(value)) {
            this.showError(input, 'Please enter a valid phone number');
            return false;
          }
          break;

        case 'url':
          if (!this.isValidUrl(value)) {
            this.showError(input, 'Please enter a valid URL starting with http:// or https://');
            return false;
          }
          break;

        case 'password':
          if (name === 'password' || name === 'newPassword') {
            if (!this.isValidPassword(value)) {
              this.showError(input, 'Password must be at least 8 characters with 1 uppercase, 1 lowercase, 1 number, and 1 special character');
              return false;
            }
          }
          break;
      }

      // Name-specific validation
      if (name === 'businessName' && !this.isValidBusinessName(value)) {
        this.showError(input, 'Business name must be between 2 and 100 characters');
        return false;
      }

      // Minlength/Maxlength
      if (input.minLength > 0 && value.length < input.minLength) {
        this.showError(input, 'Must be at least ' + input.minLength + ' characters');
        return false;
      }

      if (input.maxLength > 0 && input.maxLength < 10000 && value.length > input.maxLength) {
        this.showError(input, 'Must be no more than ' + input.maxLength + ' characters');
        return false;
      }

      // Pattern validation
      if (input.pattern) {
        var regex = new RegExp(input.pattern);
        if (!regex.test(value)) {
          this.showError(input, input.title || 'Please match the requested format');
          return false;
        }
      }

      return true;
    },

    /**
     * Validate an entire form
     * @param {HTMLFormElement} form
     * @returns {boolean}
     */
    validateForm: function(form) {
      var inputs = form.querySelectorAll('input, select, textarea');
      var isValid = true;
      var firstInvalid = null;

      for (var i = 0; i < inputs.length; i++) {
        var input = inputs[i];
        // Skip hidden, disabled, and non-validation inputs
        if (input.type === 'hidden' || input.disabled || input.type === 'submit') continue;

        if (!this.validateField(input)) {
          isValid = false;
          if (!firstInvalid) firstInvalid = input;
        }
      }

      // Focus first invalid field
      if (firstInvalid) {
        firstInvalid.focus();
      }

      return isValid;
    },

    /**
     * Initialize real-time validation on a form
     * @param {HTMLFormElement|string} formOrSelector
     * @param {object} options
     */
    initForm: function(formOrSelector, options) {
      var form = typeof formOrSelector === 'string'
        ? document.querySelector(formOrSelector)
        : formOrSelector;

      if (!form) return;

      options = options || {};
      var self = this;

      // Validate on blur
      form.addEventListener('blur', function(e) {
        if (e.target.matches('input, select, textarea')) {
          self.validateField(e.target);
        }
      }, true);

      // Clear error on input
      form.addEventListener('input', function(e) {
        if (e.target.matches('input, select, textarea')) {
          self.clearError(e.target);
        }
      });

      // Validate on submit
      form.addEventListener('submit', function(e) {
        if (!self.validateForm(form)) {
          e.preventDefault();
          e.stopPropagation();

          if (options.onError) {
            options.onError();
          }
          return false;
        }

        if (options.onSuccess) {
          options.onSuccess(e);
        }
      });

      // Password strength indicator
      var passwordFields = form.querySelectorAll('input[type="password"][data-show-strength="true"]');
      passwordFields.forEach(function(input) {
        var strengthId = input.id + '-strength';
        var strengthBar = document.getElementById(strengthId + '-bar');
        var strengthText = document.getElementById(strengthId + '-text');

        if (strengthBar && strengthText) {
          input.addEventListener('input', function() {
            var strength = self.getPasswordStrength(input.value);
            var info = self.getPasswordStrengthLabel(strength);
            var percentage = (strength / 4) * 100;

            strengthBar.style.width = percentage + '%';
            strengthBar.style.backgroundColor = info.color;
            strengthText.textContent = input.value ? info.label : '';
            strengthText.style.color = info.color;
          });
        }
      });
    }
  };

  // CSS for validation errors (injected once)
  if (!document.getElementById('form-validation-styles')) {
    var style = document.createElement('style');
    style.id = 'form-validation-styles';
    style.textContent = [
      '.validation-error { border-color: #EF5B5B !important; }',
      '.validation-error:focus { border-color: #EF5B5B !important; box-shadow: 0 0 0 3px rgba(239, 91, 91, 0.15) !important; }',
      '.form-error-message { color: #EF5B5B; font-size: 13px; margin-top: 6px; display: block; }'
    ].join('\n');
    document.head.appendChild(style);
  }

  // Export
  window.FormValidation = FormValidation;

})(window);
