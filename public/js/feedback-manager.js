/**
 * Feedback Manager
 * Dashboard feedback management functionality
 */

(function() {
  'use strict';

  // Global state
  let currentReviewId = null;
  let currentSortColumn = null;
  let currentSortDirection = 'asc';

  // ============================================
  // Alert Functions
  // ============================================

  function showAlert(type, title, message) {
    const alertBox = document.getElementById('alertBox');
    const alertIcon = document.getElementById('alertIcon');
    const alertTitle = document.getElementById('alertTitle');
    const alertMessage = document.getElementById('alertMessage');

    alertBox.className = 'alert show ' + type;
    alertIcon.textContent = type === 'success' ? '\u2705' : '\u274C';
    alertTitle.textContent = title;
    alertMessage.textContent = message;

    // Auto-hide after 5 seconds
    setTimeout(hideAlert, 5000);
  }

  function hideAlert() {
    document.getElementById('alertBox').classList.remove('show');
  }

  // ============================================
  // Filter Functions
  // ============================================

  function applyFilters() {
    const rating = document.getElementById('ratingFilter').value;
    const status = document.getElementById('statusFilter').value;
    const dateRange = document.getElementById('dateRangeFilter').value;
    const hasFeedback = document.getElementById('hasFeedbackFilter').value;
    const search = document.getElementById('searchFilter').value;

    const params = new URLSearchParams({
      rating,
      status,
      dateRange,
      hasFeedback,
      search,
      page: 1 // Reset to page 1 when filters change
    });

    window.location.href = '/dashboard/feedback?' + params.toString();
  }

  function handleSearchKeyup(event) {
    if (event.key === 'Enter') {
      applyFilters();
    }
  }

  // ============================================
  // Pagination Functions
  // ============================================

  function changePage(page) {
    const url = new URL(window.location.href);
    url.searchParams.set('page', page);
    window.location.href = url.toString();
  }

  function changeLimit() {
    const limit = document.getElementById('limitSelect').value;
    const url = new URL(window.location.href);
    url.searchParams.set('limit', limit);
    url.searchParams.set('page', 1); // Reset to page 1
    window.location.href = url.toString();
  }

  // ============================================
  // Sorting Functions
  // ============================================

  function sortTable(column) {
    const table = document.getElementById('feedbackTable');
    if (!table) return;

    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));

    // Toggle sort direction
    if (currentSortColumn === column) {
      currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      currentSortColumn = column;
      currentSortDirection = 'asc';
    }

    // Update header styling
    table.querySelectorAll('th').forEach(function(th) {
      th.classList.remove('sorted-asc', 'sorted-desc');
    });
    const header = table.querySelector('th[data-column="' + column + '"]');
    if (header) {
      header.classList.add(currentSortDirection === 'asc' ? 'sorted-asc' : 'sorted-desc');
    }

    // Sort rows
    const columnIndex = {
      date: 1,
      customer: 2,
      phone: 3,
      rating: 4,
      status: 6
    }[column];

    rows.sort(function(a, b) {
      const aValue = a.cells[columnIndex].getAttribute('data-sort') || a.cells[columnIndex].textContent.trim();
      const bValue = b.cells[columnIndex].getAttribute('data-sort') || b.cells[columnIndex].textContent.trim();

      if (column === 'date' || column === 'rating') {
        return currentSortDirection === 'asc'
          ? parseFloat(aValue) - parseFloat(bValue)
          : parseFloat(bValue) - parseFloat(aValue);
      } else {
        return currentSortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
    });

    // Re-append sorted rows
    rows.forEach(function(row) {
      tbody.appendChild(row);
    });
  }

  // ============================================
  // Feedback Text Expansion
  // ============================================

  function toggleFeedback(element, reviewId) {
    if (element.classList.contains('no-feedback')) return;

    const isExpanded = element.classList.contains('expanded');

    if (isExpanded) {
      // Collapse
      const fullText = element.getAttribute('data-full');
      element.textContent = fullText.length > 100 ? fullText.substring(0, 100) + '...' : fullText;
      element.classList.remove('expanded');
      element.classList.add('truncated');
    } else {
      // Expand and mark as viewed
      const fullText = element.getAttribute('data-full');
      element.textContent = fullText;
      element.classList.remove('truncated');
      element.classList.add('expanded');

      // Mark as viewed
      markAsViewed(reviewId);
    }
  }

  // Mark as viewed
  function markAsViewed(reviewId) {
    fetch('/dashboard/feedback/' + reviewId + '/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
    .then(function(response) {
      if (response.ok) {
        return response.json();
      }
      throw new Error('Failed to mark as viewed');
    })
    .then(function(data) {
      // Update status badge in the row
      var row = document.querySelector('tr[data-review-id="' + reviewId + '"]');
      if (row && data.status === 'viewed') {
        var statusBadge = row.querySelector('.status-badge');
        if (statusBadge && statusBadge.textContent.trim() === 'new') {
          statusBadge.textContent = 'viewed';
          statusBadge.className = 'status-badge status-viewed';
        }
      }
    })
    .catch(function(error) {
      console.error('Failed to mark as viewed:', error);
    });
  }

  // ============================================
  // Actions Dropdown
  // ============================================

  function toggleActionsMenu(event, button) {
    event.stopPropagation();

    // Close all other menus
    document.querySelectorAll('.actions-menu').forEach(function(menu) {
      if (menu !== button.nextElementSibling) {
        menu.classList.remove('show');
      }
    });

    // Toggle this menu
    var menu = button.nextElementSibling;
    menu.classList.toggle('show');
  }

  // ============================================
  // Bulk Actions
  // ============================================

  function toggleSelectAll() {
    var selectAll = document.getElementById('selectAll');
    var checkboxes = document.querySelectorAll('.row-checkbox');
    checkboxes.forEach(function(cb) {
      cb.checked = selectAll.checked;
    });
    updateBulkActions();
  }

  function updateBulkActions() {
    var checkboxes = document.querySelectorAll('.row-checkbox:checked');
    var count = checkboxes.length;
    var bulkBar = document.getElementById('bulkActionsBar');
    var selectedCount = document.getElementById('selectedCount');

    if (selectedCount) {
      selectedCount.textContent = count;
    }

    if (bulkBar) {
      if (count > 0) {
        bulkBar.classList.add('show');
      } else {
        bulkBar.classList.remove('show');
      }
    }

    // Update "select all" checkbox
    var allCheckboxes = document.querySelectorAll('.row-checkbox');
    var selectAll = document.getElementById('selectAll');
    if (selectAll) {
      selectAll.checked = count === allCheckboxes.length && count > 0;
    }
  }

  function clearSelection() {
    document.querySelectorAll('.row-checkbox').forEach(function(cb) {
      cb.checked = false;
    });
    var selectAll = document.getElementById('selectAll');
    if (selectAll) {
      selectAll.checked = false;
    }
    updateBulkActions();
  }

  function bulkUpdateStatus(status) {
    var checkboxes = document.querySelectorAll('.row-checkbox:checked');
    var reviewIds = Array.from(checkboxes).map(function(cb) {
      return parseInt(cb.dataset.reviewId);
    });

    if (reviewIds.length === 0) {
      showAlert('error', 'Error', 'No feedback items selected');
      return;
    }

    if (!confirm('Mark ' + reviewIds.length + ' feedback item(s) as ' + status + '?')) {
      return;
    }

    fetch('/dashboard/feedback/bulk-update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewIds: reviewIds, status: status })
    })
    .then(function(response) {
      return response.json().then(function(data) {
        return { ok: response.ok, data: data };
      });
    })
    .then(function(result) {
      if (result.ok) {
        showAlert('success', 'Success', result.data.message);

        // Update status badges in the table
        reviewIds.forEach(function(id) {
          var row = document.querySelector('tr[data-review-id="' + id + '"]');
          if (row) {
            var statusBadge = row.querySelector('.status-badge');
            statusBadge.textContent = status;
            statusBadge.className = 'status-badge status-' + status;
          }
        });

        clearSelection();
      } else {
        showAlert('error', 'Error', result.data.error || 'Failed to update status');
      }
    })
    .catch(function(error) {
      showAlert('error', 'Error', 'Failed to update status');
    });
  }

  // Update single status
  function updateSingleStatus(reviewId, status) {
    fetch('/dashboard/feedback/' + reviewId + '/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: status })
    })
    .then(function(response) {
      return response.json().then(function(data) {
        return { ok: response.ok, data: data };
      });
    })
    .then(function(result) {
      if (result.ok) {
        showAlert('success', 'Success', result.data.message);

        // Update status badge
        var row = document.querySelector('tr[data-review-id="' + reviewId + '"]');
        if (row) {
          var statusBadge = row.querySelector('.status-badge');
          statusBadge.textContent = status;
          statusBadge.className = 'status-badge status-' + status;
        }
      } else {
        showAlert('error', 'Error', result.data.error || 'Failed to update status');
      }
    })
    .catch(function(error) {
      showAlert('error', 'Error', 'Failed to update status');
    });
  }

  // ============================================
  // Respond Modal
  // ============================================

  function openRespondModal(reviewId, customerName, customerPhone, feedbackText) {
    currentReviewId = reviewId;

    document.getElementById('respondCustomerName').textContent = customerName;
    document.getElementById('respondCustomerPhone').textContent = customerPhone;
    document.getElementById('respondOriginalFeedback').textContent = feedbackText || 'No feedback text';
    document.getElementById('respondMessage').value = '';
    updateCharCount();

    document.getElementById('respondModal').classList.add('show');
  }

  function updateCharCount() {
    var textarea = document.getElementById('respondMessage');
    var charCount = document.getElementById('charCount');
    if (!textarea || !charCount) return;

    var length = textarea.value.length;
    var smsCount = Math.ceil(length / 160) || 1;

    charCount.textContent = length + ' / 320 characters (' + smsCount + ' SMS)';

    if (length > 320) {
      charCount.classList.add('error');
      charCount.classList.remove('warning');
    } else if (length > 270) {
      charCount.classList.add('warning');
      charCount.classList.remove('error');
    } else {
      charCount.classList.remove('warning', 'error');
    }
  }

  function useTemplate(text) {
    document.getElementById('respondMessage').value = text;
    updateCharCount();
  }

  function sendResponse() {
    var message = document.getElementById('respondMessage').value.trim();

    if (!message) {
      showAlert('error', 'Error', 'Please enter a message');
      return;
    }

    if (message.length > 320) {
      showAlert('error', 'Error', 'Message is too long (max 320 characters)');
      return;
    }

    var sendBtn = document.getElementById('sendSmsBtn');
    var btnText = document.getElementById('sendBtnText');
    sendBtn.disabled = true;
    btnText.innerHTML = '<span class="loading-spinner"></span> Sending...';

    fetch('/dashboard/feedback/' + currentReviewId + '/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: message })
    })
    .then(function(response) {
      return response.json().then(function(data) {
        return { ok: response.ok, data: data };
      });
    })
    .then(function(result) {
      if (result.ok) {
        showAlert('success', 'Success', 'SMS sent successfully!');
        closeModal('respondModal');

        // Update status badge
        var row = document.querySelector('tr[data-review-id="' + currentReviewId + '"]');
        if (row) {
          var statusBadge = row.querySelector('.status-badge');
          statusBadge.textContent = 'responded';
          statusBadge.className = 'status-badge status-responded';
        }
      } else {
        showAlert('error', 'Error', result.data.error || 'Failed to send SMS');
      }
    })
    .catch(function(error) {
      showAlert('error', 'Error', 'Failed to send SMS');
    })
    .finally(function() {
      sendBtn.disabled = false;
      btnText.textContent = 'Send SMS';
    });
  }

  // ============================================
  // Notes Modal
  // ============================================

  function openNotesModal(reviewId, notesText) {
    currentReviewId = reviewId;

    var notesHistory = document.getElementById('notesHistory');

    if (notesText && notesText.trim()) {
      var notes = notesText.split('\n\n').filter(function(n) { return n.trim(); });
      notesHistory.innerHTML = notes.map(function(note) {
        var match = note.match(/\[(.*?)\] (.*)/s);
        if (match) {
          return '<div class="note-item">' +
            '<div class="note-timestamp">' + new Date(match[1]).toLocaleString() + '</div>' +
            '<div class="note-content">' + match[2] + '</div>' +
            '</div>';
        }
        return '<div class="note-item"><div class="note-content">' + note + '</div></div>';
      }).join('');
    } else {
      notesHistory.innerHTML = '<div style="text-align: center; color: #a0aec0; padding: 20px;">No notes yet</div>';
    }

    document.getElementById('newNoteText').value = '';
    document.getElementById('notesModal').classList.add('show');
  }

  function addNote() {
    var note = document.getElementById('newNoteText').value.trim();

    if (!note) {
      showAlert('error', 'Error', 'Please enter a note');
      return;
    }

    fetch('/dashboard/feedback/' + currentReviewId + '/note', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note: note })
    })
    .then(function(response) {
      return response.json().then(function(data) {
        return { ok: response.ok, data: data };
      });
    })
    .then(function(result) {
      if (result.ok) {
        showAlert('success', 'Success', 'Note added successfully');
        closeModal('notesModal');
      } else {
        showAlert('error', 'Error', result.data.error || 'Failed to add note');
      }
    })
    .catch(function(error) {
      showAlert('error', 'Error', 'Failed to add note');
    });
  }

  // ============================================
  // Modal Controls
  // ============================================

  function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
    currentReviewId = null;
  }

  // ============================================
  // Export CSV
  // ============================================

  function exportFeedback() {
    var url = new URL('/dashboard/feedback/export', window.location.origin);

    // Add current filters to export
    var params = new URL(window.location.href).searchParams;
    ['rating', 'status', 'dateRange', 'search'].forEach(function(param) {
      var value = params.get(param);
      if (value) url.searchParams.set(param, value);
    });

    window.location.href = url.toString();
  }

  // ============================================
  // Event Listeners & Initialization
  // ============================================

  function init() {
    // Close dropdowns when clicking outside
    document.addEventListener('click', function() {
      document.querySelectorAll('.actions-menu').forEach(function(menu) {
        menu.classList.remove('show');
      });
    });

    // Close modals on overlay click
    document.querySelectorAll('.modal-overlay').forEach(function(overlay) {
      overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
          overlay.classList.remove('show');
        }
      });
    });

    // Character count listener
    var respondMessage = document.getElementById('respondMessage');
    if (respondMessage) {
      respondMessage.addEventListener('input', updateCharCount);
    }

    // Initialize bulk actions
    updateBulkActions();
  }

  // Run on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ============================================
  // Expose functions to global scope
  // ============================================

  window.FeedbackManager = {
    showAlert: showAlert,
    hideAlert: hideAlert,
    applyFilters: applyFilters,
    handleSearchKeyup: handleSearchKeyup,
    changePage: changePage,
    changeLimit: changeLimit,
    sortTable: sortTable,
    toggleFeedback: toggleFeedback,
    toggleActionsMenu: toggleActionsMenu,
    toggleSelectAll: toggleSelectAll,
    updateBulkActions: updateBulkActions,
    clearSelection: clearSelection,
    bulkUpdateStatus: bulkUpdateStatus,
    updateSingleStatus: updateSingleStatus,
    openRespondModal: openRespondModal,
    updateCharCount: updateCharCount,
    useTemplate: useTemplate,
    sendResponse: sendResponse,
    openNotesModal: openNotesModal,
    addNote: addNote,
    closeModal: closeModal,
    exportFeedback: exportFeedback
  };

  // Also expose individual functions for inline handlers
  window.showAlert = showAlert;
  window.hideAlert = hideAlert;
  window.applyFilters = applyFilters;
  window.handleSearchKeyup = handleSearchKeyup;
  window.changePage = changePage;
  window.changeLimit = changeLimit;
  window.sortTable = sortTable;
  window.toggleFeedback = toggleFeedback;
  window.toggleActionsMenu = toggleActionsMenu;
  window.toggleSelectAll = toggleSelectAll;
  window.updateBulkActions = updateBulkActions;
  window.clearSelection = clearSelection;
  window.bulkUpdateStatus = bulkUpdateStatus;
  window.updateSingleStatus = updateSingleStatus;
  window.openRespondModal = openRespondModal;
  window.updateCharCount = updateCharCount;
  window.useTemplate = useTemplate;
  window.sendResponse = sendResponse;
  window.openNotesModal = openNotesModal;
  window.addNote = addNote;
  window.closeModal = closeModal;
  window.exportFeedback = exportFeedback;

})();
