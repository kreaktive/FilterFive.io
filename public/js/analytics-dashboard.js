/**
 * Analytics Dashboard
 * Dashboard analytics functionality with ROI tracking and heatmap
 */

(function() {
  'use strict';

  // Configuration
  var API_BASE = '/api/analytics';
  var currentRange = 30;
  var currentLocation = null;

  // ============================================
  // Initialization
  // ============================================

  function init() {
    initializeFilters();
    loadAnalyticsData();
    loadTimingHeatmap();
  }

  // Initialize on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ============================================
  // Filter Event Listeners
  // ============================================

  function initializeFilters() {
    // Date range buttons
    document.querySelectorAll('.filter-btn').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        document.querySelectorAll('.filter-btn').forEach(function(b) {
          b.classList.remove('active');
        });
        e.target.classList.add('active');
        currentRange = parseInt(e.target.dataset.range);
        loadAnalyticsData();
      });
    });

    // Location filter
    var locationFilter = document.getElementById('location-filter');
    if (locationFilter) {
      locationFilter.addEventListener('change', function(e) {
        currentLocation = e.target.value || null;
        loadAnalyticsData();
        loadTimingHeatmap();
      });
    }
  }

  // ============================================
  // Load Analytics Data
  // ============================================

  function loadAnalyticsData() {
    var endDate = new Date();
    var startDate = new Date();
    startDate.setDate(startDate.getDate() - currentRange);

    var params = new URLSearchParams({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    });

    if (currentLocation) {
      params.append('location', currentLocation);
    }

    // Fetch metrics and trends in parallel
    Promise.all([
      fetch(API_BASE + '/metrics?' + params),
      fetch(API_BASE + '/trends?' + params)
    ])
    .then(function(responses) {
      return Promise.all(responses.map(function(r) { return r.json(); }));
    })
    .then(function(results) {
      var metrics = results[0];
      var trends = results[1];

      updateROICard(metrics.roi);
      updateKPICards(metrics, trends);
    })
    .catch(function(error) {
      console.error('Failed to load analytics:', error);
      showError('Failed to load analytics data. Please try again.');
    });
  }

  // ============================================
  // Update ROI Card
  // ============================================

  function updateROICard(roi) {
    var roiDisplay = document.getElementById('roi-display');
    var costPerReview = document.getElementById('cost-per-review');
    var valueGenerated = document.getElementById('value-generated');
    var netValue = document.getElementById('net-value');

    if (roiDisplay) roiDisplay.textContent = roi.roiFormatted || '+0%';
    if (costPerReview) costPerReview.textContent = formatCurrency(roi.costPerReview);
    if (valueGenerated) valueGenerated.textContent = formatCurrency(roi.valueGenerated);
    if (netValue) netValue.textContent = formatCurrency(roi.netValue);
  }

  // ============================================
  // Update KPI Cards
  // ============================================

  function updateKPICards(metrics, trends) {
    // Average Rating
    var avgRating = metrics.reviews.averageRating || 0;
    var avgRatingEl = document.getElementById('avg-rating');
    var ratingSubtext = document.getElementById('rating-subtext');
    if (avgRatingEl) avgRatingEl.textContent = avgRating.toFixed(1);
    if (ratingSubtext) ratingSubtext.textContent = metrics.reviews.positive + ' positive reviews';
    updateTrendBadge('rating-trend', metrics.reviews.trend);
    updateSparkline('rating-chart', trends.averageRating || []);

    // Total Reviews
    var totalReviews = metrics.reviews.total || 0;
    var totalReviewsEl = document.getElementById('total-reviews');
    var reviewsSubtext = document.getElementById('reviews-subtext');
    if (totalReviewsEl) totalReviewsEl.textContent = totalReviews;
    if (reviewsSubtext) reviewsSubtext.textContent = metrics.reviews.positive + ' positive, ' + metrics.reviews.negative + ' negative';
    updateTrendBadge('reviews-trend', metrics.reviews.trend);
    updateSparkline('reviews-chart', trends.reviewsPositive || []);

    // Click Rate
    var clickRate = metrics.requests.clickRate || 0;
    var clickRateEl = document.getElementById('click-rate');
    var clickSubtext = document.getElementById('click-subtext');
    if (clickRateEl) clickRateEl.textContent = clickRate.toFixed(1) + '%';
    if (clickSubtext) clickSubtext.textContent = metrics.requests.clicked + ' of ' + metrics.requests.sent + ' clicked';
    updateTrendBadge('click-trend', metrics.requests.clickTrend);
    updateSparkline('click-chart', trends.clickRate || []);

    // Conversion Rate
    var conversionRate = metrics.requests.conversionRate || 0;
    var conversionRateEl = document.getElementById('conversion-rate');
    var conversionSubtext = document.getElementById('conversion-subtext');
    if (conversionRateEl) conversionRateEl.textContent = conversionRate.toFixed(1) + '%';
    if (conversionSubtext) conversionSubtext.textContent = metrics.requests.rated + ' of ' + metrics.requests.sent + ' completed';
    updateTrendBadge('conversion-trend', metrics.requests.conversionTrend);
    updateSparkline('conversion-chart', trends.conversionRate || []);
  }

  // ============================================
  // Update Trend Badge
  // ============================================

  function updateTrendBadge(elementId, trend) {
    var badge = document.getElementById(elementId);
    if (!badge) return;

    if (!trend) {
      badge.textContent = '--';
      badge.className = 'kpi-trend neutral';
      return;
    }

    var arrow = trend > 0 ? '\u25B2' : trend < 0 ? '\u25BC' : '\u25CF';
    var sign = trend > 0 ? '+' : '';
    badge.textContent = arrow + ' ' + sign + trend.toFixed(1) + '%';
    badge.className = 'kpi-trend ' + (trend > 0 ? 'positive' : trend < 0 ? 'negative' : 'neutral');
  }

  // ============================================
  // Update Sparkline Chart
  // ============================================

  function updateSparkline(chartId, data) {
    // Uses shared chart-utils.js (window.createSparkline)
    if (typeof createSparkline === 'function') {
      createSparkline(chartId, data);
    }
  }

  // ============================================
  // Load Timing Heatmap
  // ============================================

  function loadTimingHeatmap() {
    var params = new URLSearchParams();
    if (currentLocation) {
      params.append('location', currentLocation);
    }

    fetch(API_BASE + '/timing-heatmap?' + params)
      .then(function(response) {
        return response.json();
      })
      .then(function(data) {
        renderHeatmap(data);
      })
      .catch(function(error) {
        console.error('Failed to load timing heatmap:', error);
        var container = document.getElementById('heatmap-container');
        if (container) {
          container.innerHTML = '<div class="heatmap-loading">Failed to load timing data. Please try again.</div>';
        }
      });
  }

  // ============================================
  // Render Heatmap Grid
  // ============================================

  function renderHeatmap(data) {
    var container = document.getElementById('heatmap-container');
    if (!container) return;

    if (!data || data.length === 0) {
      container.innerHTML = '<div class="heatmap-loading">No timing data available yet. Send more SMS requests to see performance patterns.</div>';
      return;
    }

    // Days of week
    var days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    var hours = [];
    for (var i = 0; i < 24; i++) {
      hours.push(i);
    }

    // Create performance map
    var performanceMap = {};
    data.forEach(function(item) {
      var key = item.dayOfWeek + '-' + item.hourOfDay;
      performanceMap[key] = {
        score: item.performanceScore || 0,
        sent: item.requestsSent || 0,
        clicked: item.requestsClicked || 0,
        rated: item.requestsRated || 0,
        clickRate: item.clickRate || 0
      };
    });

    // Build HTML
    var html = '<div class="heatmap-grid">';

    // Header row
    html += '<div class="heatmap-header"></div>'; // Empty corner
    days.forEach(function(day) {
      html += '<div class="heatmap-header">' + day + '</div>';
    });

    // Hour rows
    hours.forEach(function(hour) {
      // Hour label
      var hourLabel = hour === 0 ? '12am' :
                      hour < 12 ? hour + 'am' :
                      hour === 12 ? '12pm' : (hour - 12) + 'pm';
      html += '<div class="heatmap-hour-label">' + hourLabel + '</div>';

      // Cells for each day
      days.forEach(function(day, dayIndex) {
        var key = (dayIndex + 1) + '-' + hour;
        var perf = performanceMap[key];

        if (!perf || perf.sent === 0) {
          html += '<div class="heatmap-cell empty" title="No data">\u2014</div>';
        } else {
          var score = perf.score;
          var cssClass = 'empty';

          if (score >= 80) cssClass = 'excellent';
          else if (score >= 60) cssClass = 'good';
          else if (score >= 40) cssClass = 'medium';
          else if (score >= 20) cssClass = 'low';
          else cssClass = 'very-low';

          var tooltip = day + ' ' + hourLabel + '\n' +
                        'Sent: ' + perf.sent + '\n' +
                        'Clicked: ' + perf.clicked + ' (' + perf.clickRate.toFixed(0) + '%)\n' +
                        'Score: ' + score.toFixed(0);

          html += '<div class="heatmap-cell ' + cssClass + '" title="' + tooltip + '">' + score.toFixed(0) + '</div>';
        }
      });
    });

    html += '</div>';
    container.innerHTML = html;
  }

  // ============================================
  // Utility Functions
  // ============================================

  function formatCurrency(value) {
    if (value === null || value === undefined) return '--';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  }

  function showError(message) {
    alert(message); // Replace with better error UI
  }

  // ============================================
  // Expose functions to global scope
  // ============================================

  window.AnalyticsDashboard = {
    loadAnalyticsData: loadAnalyticsData,
    loadTimingHeatmap: loadTimingHeatmap,
    formatCurrency: formatCurrency
  };

})();
