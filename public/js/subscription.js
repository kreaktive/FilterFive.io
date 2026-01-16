/**
 * Subscription page checkout and management
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

  document.addEventListener('DOMContentLoaded', function() {
    // Subscribe buttons
    var btnMonthly = document.getElementById('btn-monthly');
    var btnAnnual = document.getElementById('btn-annual');
    var btnCancel = document.getElementById('btn-cancel');

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
      btnCancel.addEventListener('click', function() {
        cancelSubscription();
      });
    }
  });

  function checkout(plan, button) {
    button.disabled = true;
    button.innerHTML = 'Processing...';
    var loadingEl = document.getElementById('loading');
    if (loadingEl) loadingEl.style.display = 'block';

    var csrfTokenEl = document.getElementById('csrf-token');
    var csrfToken = csrfTokenEl ? csrfTokenEl.value : '';

    fetch('/dashboard/subscription/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': csrfToken
      },
      body: JSON.stringify({ plan: plan })
    })
    .then(function(response) { return response.json(); })
    .then(function(data) {
      if (data.success) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        alert('Error: ' + data.error);
        resetButton(button, plan);
        if (loadingEl) loadingEl.style.display = 'none';
      }
    })
    .catch(function(error) {
      console.error('Error:', error);
      alert('An error occurred. Please try again.');
      resetButton(button, plan);
      if (loadingEl) loadingEl.style.display = 'none';
    });
  }

  function resetButton(button, plan) {
    button.disabled = false;
    var svgIcon = '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:20px;height:20px;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>';
    button.innerHTML = (plan === 'monthly' ? 'Subscribe Monthly ' : 'Subscribe Annually ') + svgIcon;
  }

  function cancelSubscription() {
    if (!confirm('Are you sure you want to cancel your subscription? You will retain access until the end of your billing period.')) {
      return;
    }

    var loadingEl = document.getElementById('loading');
    if (loadingEl) loadingEl.style.display = 'block';

    var csrfTokenEl = document.getElementById('csrf-token');
    var csrfToken = csrfTokenEl ? csrfTokenEl.value : '';

    fetch('/dashboard/subscription/cancel-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': csrfToken
      },
      body: JSON.stringify({ immediately: false })
    })
    .then(function(response) { return response.json(); })
    .then(function(data) {
      if (data.success) {
        alert(data.message);
        window.location.reload();
      } else {
        alert('Error: ' + data.error);
      }
    })
    .catch(function(error) {
      console.error('Error:', error);
      alert('An error occurred. Please try again.');
    })
    .finally(function() {
      if (loadingEl) loadingEl.style.display = 'none';
    });
  }
})();
