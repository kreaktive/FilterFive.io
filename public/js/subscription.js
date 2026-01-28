/**
 * Subscription page checkout and management
 * Uses custom modal component instead of browser confirm/alert dialogs
 */
(function() {
  'use strict';

  // Get Stripe key from data attribute
  var stripeKeyEl = document.getElementById('stripe-key');
  var stripeKey = stripeKeyEl ? stripeKeyEl.value : null;

  if (!stripeKey) {
    console.warn('Stripe key not found');
    return;
  }

  var stripe = Stripe(stripeKey);

  // ===========================================
  // Phase 2: Helper Functions
  // ===========================================

  /**
   * Get CSRF token from hidden input
   */
  function getCsrfToken() {
    var csrfTokenEl = document.getElementById('csrf-token');
    return csrfTokenEl ? csrfTokenEl.value : '';
  }

  /**
   * Show loading indicator
   */
  function showLoading() {
    var loadingEl = document.getElementById('loading');
    if (loadingEl) loadingEl.style.display = 'block';
  }

  /**
   * Hide loading indicator
   */
  function hideLoading() {
    var loadingEl = document.getElementById('loading');
    if (loadingEl) loadingEl.style.display = 'none';
  }

  /**
   * T004: Show cancel subscription confirmation modal
   * @param {Function} onConfirm - Called when user confirms cancellation
   */
  function cancelSubscriptionModal(onConfirm) {
    var btnCancel = document.getElementById('btn-cancel');
    var periodEnd = btnCancel ? btnCancel.getAttribute('data-period-end') : '';

    openModal('cancel-subscription', {
      title: 'Cancel Subscription',
      content: '<p>Are you sure you want to cancel your subscription?</p>' +
        '<p>You will continue to have full access until <strong>' + (periodEnd || 'the end of your billing period') + '</strong>. ' +
        'After that date, your account will revert to the free tier.</p>' +
        '<p style="margin-top: 16px; padding: 12px; background: #FEF3C7; border-radius: 8px; font-size: 14px;">' +
        '<strong>Note:</strong> You can reactivate your subscription anytime before ' + (periodEnd || 'the end date') + '.</p>',
      actions: [
        { text: 'Keep Subscription', variant: 'secondary', onClick: function() { closeModal(); } },
        { text: 'Cancel Subscription', variant: 'danger', onClick: onConfirm }
      ],
      size: 'sm'
    });
  }

  /**
   * T005: Show success modal
   * @param {string} title - Modal title
   * @param {string} message - Success message
   * @param {Function} onClose - Called when modal is closed
   */
  function showSuccessModal(title, message, onClose) {
    openModal('success', {
      title: title,
      content: '<div style="text-align: center;">' +
        '<div style="width: 64px; height: 64px; margin: 0 auto 16px; background: #D1FAE5; border-radius: 50%; display: flex; align-items: center; justify-content: center;">' +
        '<svg width="32" height="32" fill="none" stroke="#10B981" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>' +
        '</div>' +
        '<p>' + message + '</p>' +
        '</div>',
      actions: [
        { text: 'Got it', variant: 'primary', onClick: function() { closeModal(); if (onClose) onClose(); } }
      ],
      size: 'sm'
    });
  }

  /**
   * T006: Show error modal with retry option
   * @param {string} title - Modal title
   * @param {string} message - Error message
   * @param {Function} onRetry - Called when user clicks retry
   */
  function showErrorModal(title, message, onRetry) {
    openModal('error', {
      title: title,
      content: '<div style="text-align: center;">' +
        '<div style="width: 64px; height: 64px; margin: 0 auto 16px; background: #FEE2E2; border-radius: 50%; display: flex; align-items: center; justify-content: center;">' +
        '<svg width="32" height="32" fill="none" stroke="#EF4444" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>' +
        '</div>' +
        '<p>' + message + '</p>' +
        '</div>',
      actions: [
        { text: 'Close', variant: 'secondary', onClick: function() { closeModal(); } },
        { text: 'Try Again', variant: 'primary', onClick: function() { closeModal(); if (onRetry) onRetry(); } }
      ],
      size: 'sm'
    });
  }

  /**
   * T007: Update UI state without page reload
   * Toggles between Cancel and Reactivate buttons
   * @param {string} newState - 'cancelled' or 'active'
   * @param {string} periodEndDate - Date string for display
   */
  function updateUIState(newState, periodEndDate) {
    var statusCard = document.querySelector('.status-card:last-of-type');
    if (!statusCard) return;

    var btnCancel = document.getElementById('btn-cancel');
    var btnReactivate = document.getElementById('btn-reactivate');
    var helpText = statusCard.querySelector('p:last-of-type');

    if (newState === 'cancelled') {
      // Hide cancel button, show reactivate button
      if (btnCancel) {
        btnCancel.style.display = 'none';
      }

      // Create reactivate button if it doesn't exist
      if (!btnReactivate) {
        btnReactivate = document.createElement('button');
        btnReactivate.className = 'btn-reactivate';
        btnReactivate.id = 'btn-reactivate';
        btnReactivate.textContent = 'Reactivate Subscription';
        btnReactivate.addEventListener('click', handleReactivate);

        var portalLink = statusCard.querySelector('.btn-portal');
        if (portalLink) {
          portalLink.parentNode.insertBefore(btnReactivate, portalLink.nextSibling);
        }
      } else {
        btnReactivate.style.display = 'block';
      }

      // Update help text
      if (helpText) {
        helpText.textContent = 'Your subscription is scheduled to cancel on ' + periodEndDate + '. Click above to keep your subscription active.';
      }

    } else if (newState === 'active') {
      // Hide reactivate button, show cancel button
      if (btnReactivate) {
        btnReactivate.style.display = 'none';
      }

      // Create cancel button if it doesn't exist
      if (!btnCancel) {
        btnCancel = document.createElement('button');
        btnCancel.className = 'btn-cancel';
        btnCancel.id = 'btn-cancel';
        btnCancel.textContent = 'Cancel Subscription';
        btnCancel.setAttribute('data-period-end', periodEndDate);
        btnCancel.addEventListener('click', handleCancel);

        var portalLink = statusCard.querySelector('.btn-portal');
        if (portalLink) {
          portalLink.parentNode.insertBefore(btnCancel, portalLink.nextSibling);
        }
      } else {
        btnCancel.style.display = 'block';
        btnCancel.setAttribute('data-period-end', periodEndDate);
      }

      // Update help text
      if (helpText) {
        helpText.textContent = 'Cancelling will disable your subscription at the end of the current billing period.';
      }
    }
  }

  /**
   * T016: Show reactivate subscription confirmation modal
   * @param {Function} onConfirm - Called when user confirms reactivation
   */
  function reactivateSubscriptionModal(onConfirm) {
    openModal('reactivate-subscription', {
      title: 'Reactivate Subscription',
      content: '<p>Would you like to reactivate your subscription?</p>' +
        '<p>Your subscription will continue as normal and you won\'t lose any access.</p>',
      actions: [
        { text: 'Cancel', variant: 'secondary', onClick: function() { closeModal(); } },
        { text: 'Reactivate', variant: 'primary', onClick: onConfirm }
      ],
      size: 'sm'
    });
  }

  // ===========================================
  // Phase 3: Cancel Subscription Flow (US1)
  // ===========================================

  /**
   * T008-T013: Handle cancel subscription click
   */
  function handleCancel() {
    var btnCancel = document.getElementById('btn-cancel');
    var periodEnd = btnCancel ? btnCancel.getAttribute('data-period-end') : '';

    cancelSubscriptionModal(function() {
      closeModal();
      showLoading();

      fetch('/dashboard/subscription/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': getCsrfToken()
        },
        body: JSON.stringify({ immediately: false })
      })
      .then(function(response) { return response.json(); })
      .then(function(data) {
        hideLoading();
        if (data.success) {
          showSuccessModal(
            'Subscription Cancelled',
            'Your subscription has been cancelled. You\'ll continue to have full access until <strong>' + periodEnd + '</strong>.',
            function() {
              updateUIState('cancelled', periodEnd);
            }
          );
        } else {
          showErrorModal(
            'Cancellation Failed',
            data.error || 'Something went wrong. Please try again.',
            handleCancel
          );
        }
      })
      .catch(function(error) {
        hideLoading();
        console.error('Error:', error);
        showErrorModal(
          'Cancellation Failed',
          'A network error occurred. Please check your connection and try again.',
          handleCancel
        );
      });
    });
  }

  // ===========================================
  // Phase 4: Reactivate Subscription Flow (US2)
  // ===========================================

  /**
   * T017-T020: Handle reactivate subscription click
   */
  function handleReactivate() {
    var btnCancel = document.getElementById('btn-cancel');
    var periodEnd = btnCancel ? btnCancel.getAttribute('data-period-end') : '';

    reactivateSubscriptionModal(function() {
      closeModal();
      showLoading();

      fetch('/dashboard/subscription/reactivate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': getCsrfToken()
        },
        body: JSON.stringify({})
      })
      .then(function(response) { return response.json(); })
      .then(function(data) {
        hideLoading();
        if (data.success) {
          showSuccessModal(
            'Subscription Reactivated',
            'Great news! Your subscription is now active again. You\'ll continue to be billed normally.',
            function() {
              updateUIState('active', periodEnd);
            }
          );
        } else {
          showErrorModal(
            'Reactivation Failed',
            data.error || 'Something went wrong. Please try again.',
            handleReactivate
          );
        }
      })
      .catch(function(error) {
        hideLoading();
        console.error('Error:', error);
        showErrorModal(
          'Reactivation Failed',
          'A network error occurred. Please check your connection and try again.',
          handleReactivate
        );
      });
    });
  }

  // ===========================================
  // Checkout Flow (existing)
  // ===========================================

  function checkout(plan, button) {
    button.disabled = true;
    button.innerHTML = 'Processing...';
    showLoading();

    fetch('/dashboard/subscription/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': getCsrfToken()
      },
      body: JSON.stringify({ plan: plan })
    })
    .then(function(response) { return response.json(); })
    .then(function(data) {
      if (data.success) {
        window.location.href = data.url;
      } else {
        showErrorModal(
          'Checkout Error',
          data.error || 'Failed to start checkout. Please try again.',
          function() { checkout(plan, button); }
        );
        resetButton(button, plan);
        hideLoading();
      }
    })
    .catch(function(error) {
      console.error('Error:', error);
      showErrorModal(
        'Checkout Error',
        'A network error occurred. Please try again.',
        function() { checkout(plan, button); }
      );
      resetButton(button, plan);
      hideLoading();
    });
  }

  function resetButton(button, plan) {
    button.disabled = false;
    var svgIcon = '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:20px;height:20px;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>';
    button.innerHTML = (plan === 'monthly' ? 'Subscribe Monthly ' : 'Subscribe Annually ') + svgIcon;
  }

  // ===========================================
  // Initialize
  // ===========================================

  document.addEventListener('DOMContentLoaded', function() {
    // Subscribe buttons
    var btnMonthly = document.getElementById('btn-monthly');
    var btnAnnual = document.getElementById('btn-annual');
    var btnCancel = document.getElementById('btn-cancel');
    var btnReactivate = document.getElementById('btn-reactivate');

    if (btnMonthly) {
      btnMonthly.addEventListener('click', function() {
        checkout('monthly', this);
      });
    }

    if (btnAnnual) {
      btnAnnual.addEventListener('click', function() {
        checkout('annual', this);
      });
    }

    if (btnCancel) {
      btnCancel.addEventListener('click', handleCancel);
    }

    if (btnReactivate) {
      btnReactivate.addEventListener('click', handleReactivate);
    }
  });
})();
