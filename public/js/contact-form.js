/**
 * Contact Form Validation & Submission Handler
 */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contact-form');
  const nameInput = document.getElementById('name');
  const emailInput = document.getElementById('email');
  const phoneInput = document.getElementById('phone');
  const businessInput = document.getElementById('businessName');
  const topicSelect = document.getElementById('topic');
  const messageInput = document.getElementById('message');
  const submitBtn = document.getElementById('submit-btn');
  const messageCounter = document.getElementById('message-count');

  // Validation functions
  const validators = {
    name: (value) => {
      if (!value || value.trim().length === 0) return 'Name is required';
      if (value.trim().length < 2) return 'Name must be at least 2 characters';
      if (value.trim().length > 255) return 'Name must be less than 255 characters';
      return null;
    },

    email: (value) => {
      if (!value || value.trim().length === 0) return 'Email is required';
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value.trim())) return 'Please enter a valid email address';
      return null;
    },

    phone: (value) => {
      if (!value || value.trim().length === 0) return 'Phone number is required';
      const phoneRegex = /^[\d\s\-\(\)\+\.]+$/;
      if (!phoneRegex.test(value.trim())) return 'Please enter a valid phone number';
      if (value.trim().replace(/\D/g, '').length < 10) return 'Please enter a valid phone number';
      return null;
    },

    businessName: (value) => {
      if (!value || value.trim().length === 0) return 'Business name is required';
      if (value.trim().length < 2) return 'Business name must be at least 2 characters';
      if (value.trim().length > 255) return 'Business name must be less than 255 characters';
      return null;
    },

    topic: (value) => {
      const validTopics = ['sales', 'support', 'billing', 'partnership', 'general'];
      if (!value || !validTopics.includes(value)) return 'Please select a valid topic';
      return null;
    },

    message: (value) => {
      if (!value || value.trim().length === 0) return 'Message is required';
      if (value.trim().length < 10) return 'Message must be at least 10 characters';
      if (value.trim().length > 2000) return 'Message must be less than 2000 characters';
      return null;
    }
  };

  /**
   * Display validation error
   */
  const showError = (fieldId, error) => {
    const errorEl = document.getElementById(`${fieldId}-error`);
    const input = document.getElementById(fieldId);

    if (error) {
      input.classList.add('border-red-500', 'bg-red-50');
      input.classList.remove('border-gray-300');
      errorEl.textContent = error;
      errorEl.classList.remove('hidden');
    } else {
      input.classList.remove('border-red-500', 'bg-red-50');
      input.classList.add('border-gray-300');
      errorEl.textContent = '';
      errorEl.classList.add('hidden');
    }
  };

  /**
   * Validate single field
   */
  const validateField = (fieldId) => {
    const input = document.getElementById(fieldId);
    const validator = validators[fieldId];

    if (!validator) return true;

    const error = validator(input.value);
    showError(fieldId, error);
    return !error;
  };

  /**
   * Format phone number while typing
   */
  const formatPhone = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 10);

    if (digits.length === 0) return '';
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  };

  /**
   * Update message character counter
   */
  messageInput.addEventListener('input', () => {
    const count = messageInput.value.length;
    messageCounter.textContent = `${count} / 2000`;

    if (count > 2000) {
      messageInput.value = messageInput.value.slice(0, 2000);
      messageCounter.textContent = '2000 / 2000';
    }
  });

  /**
   * Phone formatting on input
   */
  phoneInput.addEventListener('input', () => {
    phoneInput.value = formatPhone(phoneInput.value);
  });

  /**
   * Validate fields on blur
   */
  [nameInput, emailInput, phoneInput, businessInput, topicSelect, messageInput].forEach((input) => {
    input.addEventListener('blur', () => {
      validateField(input.id);
    });
  });

  /**
   * Form submission
   */
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Validate all fields
    const isNameValid = validateField('name');
    const isEmailValid = validateField('email');
    const isPhoneValid = validateField('phone');
    const isBusinessValid = validateField('businessName');
    const isTopicValid = validateField('topic');
    const isMessageValid = validateField('message');

    if (!isNameValid || !isEmailValid || !isPhoneValid || !isBusinessValid || !isTopicValid || !isMessageValid) {
      // Focus on first invalid field
      [nameInput, emailInput, phoneInput, businessInput, topicSelect, messageInput].forEach((input) => {
        if (input.classList.contains('border-red-500')) {
          input.focus();
          input.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
      return;
    }

    // Disable submit button and show spinner
    submitBtn.disabled = true;
    document.getElementById('submit-text').classList.add('hidden');
    document.getElementById('submit-spinner').classList.remove('hidden');

    try {
      const formData = new FormData(form);
      const response = await fetch('/contact', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Show success message
        form.style.display = 'none';
        document.getElementById('success-message').classList.remove('hidden');

        // Scroll to success message
        document.getElementById('success-message').scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Announce success to screen readers
        const announcement = document.createElement('div');
        announcement.setAttribute('role', 'status');
        announcement.setAttribute('aria-live', 'polite');
        announcement.className = 'sr-only';
        announcement.textContent = 'Thank you! Your message was sent successfully. We will respond within 24 hours.';
        document.body.appendChild(announcement);
      } else {
        // Handle validation errors from server
        if (data.errors) {
          Object.entries(data.errors).forEach(([fieldId, error]) => {
            showError(fieldId, error);
          });

          // Focus on first error
          [nameInput, emailInput, phoneInput, businessInput, topicSelect, messageInput].forEach((input) => {
            if (input.classList.contains('border-red-500')) {
              input.focus();
              input.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          });
        } else {
          // Generic error
          alert(data.error || 'An error occurred. Please try again.');
        }

        // Re-enable submit button
        submitBtn.disabled = false;
        document.getElementById('submit-text').classList.remove('hidden');
        document.getElementById('submit-spinner').classList.add('hidden');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      alert('An error occurred while sending your message. Please try again.');

      // Re-enable submit button
      submitBtn.disabled = false;
      document.getElementById('submit-text').classList.remove('hidden');
      document.getElementById('submit-spinner').classList.add('hidden');
    }
  });

  // Clear errors when user starts typing
  [nameInput, emailInput, phoneInput, businessInput, topicSelect, messageInput].forEach((input) => {
    input.addEventListener('input', () => {
      if (input.classList.contains('border-red-500')) {
        showError(input.id, null);
      }
    });
  });
});
