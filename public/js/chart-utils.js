/**
 * Chart.js Utilities for MoreStars Dashboard
 * Shared charting functions used across dashboard and analytics pages
 */

// Global chart registry to manage instances
window.MoreStarsCharts = window.MoreStarsCharts || {};

/**
 * Create or update a sparkline chart
 * @param {string} chartId - Canvas element ID
 * @param {number[]} data - Array of numeric values
 * @param {object} options - Optional customization
 */
function createSparkline(chartId, data, options = {}) {
  const canvas = document.getElementById(chartId);
  if (!canvas) {
    console.warn('Sparkline canvas not found:', chartId);
    return null;
  }

  // Destroy existing chart
  if (window.MoreStarsCharts[chartId]) {
    window.MoreStarsCharts[chartId].destroy();
  }

  const ctx = canvas.getContext('2d');

  // Default options with brand colors
  const defaultOptions = {
    borderColor: '#FFBA49',
    backgroundColor: 'rgba(255, 186, 73, 0.1)',
    pointHoverBackgroundColor: '#FFBA49',
    fill: true,
    tension: 0.4
  };

  const chartOptions = { ...defaultOptions, ...options };

  window.MoreStarsCharts[chartId] = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.map((_, i) => i),
      datasets: [{
        data: data,
        borderColor: chartOptions.borderColor,
        backgroundColor: chartOptions.backgroundColor,
        borderWidth: 2,
        fill: chartOptions.fill,
        tension: chartOptions.tension,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBackgroundColor: chartOptions.pointHoverBackgroundColor
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 8,
          displayColors: false,
          callbacks: chartOptions.tooltipCallback ? {
            label: chartOptions.tooltipCallback
          } : undefined
        }
      },
      scales: {
        x: { display: false },
        y: { display: false }
      },
      interaction: {
        mode: 'index',
        intersect: false
      }
    }
  });

  return window.MoreStarsCharts[chartId];
}

/**
 * Create a bar chart
 * @param {string} chartId - Canvas element ID
 * @param {object} chartData - { labels: [], datasets: [] }
 * @param {object} options - Optional customization
 */
function createBarChart(chartId, chartData, options = {}) {
  const canvas = document.getElementById(chartId);
  if (!canvas) {
    console.warn('Bar chart canvas not found:', chartId);
    return null;
  }

  // Destroy existing chart
  if (window.MoreStarsCharts[chartId]) {
    window.MoreStarsCharts[chartId].destroy();
  }

  const ctx = canvas.getContext('2d');

  window.MoreStarsCharts[chartId] = new Chart(ctx, {
    type: 'bar',
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: options.showLegend !== false ? { position: 'top' } : { display: false },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 8
        }
      },
      scales: {
        x: {
          grid: { display: false }
        },
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(0, 0, 0, 0.05)' }
        }
      },
      ...options
    }
  });

  return window.MoreStarsCharts[chartId];
}

/**
 * Create a doughnut/pie chart
 * @param {string} chartId - Canvas element ID
 * @param {object} chartData - { labels: [], data: [], colors: [] }
 * @param {object} options - Optional customization
 */
function createDoughnutChart(chartId, chartData, options = {}) {
  const canvas = document.getElementById(chartId);
  if (!canvas) {
    console.warn('Doughnut chart canvas not found:', chartId);
    return null;
  }

  // Destroy existing chart
  if (window.MoreStarsCharts[chartId]) {
    window.MoreStarsCharts[chartId].destroy();
  }

  const ctx = canvas.getContext('2d');

  // Default colors using brand palette
  const defaultColors = [
    '#FFBA49', // brand-gold
    '#A1438E', // brand-accent
    '#20A39E', // brand-positive
    '#EF5B5B', // brand-negative
    '#500B42', // brand-dark
    '#94a3b8'  // text-muted
  ];

  window.MoreStarsCharts[chartId] = new Chart(ctx, {
    type: options.type || 'doughnut',
    data: {
      labels: chartData.labels,
      datasets: [{
        data: chartData.data,
        backgroundColor: chartData.colors || defaultColors.slice(0, chartData.data.length),
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: options.legendPosition || 'right',
          labels: {
            padding: 16,
            usePointStyle: true
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 8
        }
      },
      cutout: options.type === 'pie' ? 0 : '60%',
      ...options
    }
  });

  return window.MoreStarsCharts[chartId];
}

/**
 * Destroy a chart by ID
 * @param {string} chartId - Canvas element ID
 */
function destroyChart(chartId) {
  if (window.MoreStarsCharts[chartId]) {
    window.MoreStarsCharts[chartId].destroy();
    delete window.MoreStarsCharts[chartId];
  }
}

/**
 * Destroy all charts
 */
function destroyAllCharts() {
  Object.keys(window.MoreStarsCharts).forEach(chartId => {
    window.MoreStarsCharts[chartId].destroy();
  });
  window.MoreStarsCharts = {};
}

/**
 * Update trend badge with arrow and percentage
 * @param {string} elementId - Badge element ID
 * @param {number} trend - Percentage change
 */
function updateTrendBadge(elementId, trend) {
  const badge = document.getElementById(elementId);
  if (!badge) return;

  if (trend === null || trend === undefined || isNaN(trend)) {
    badge.textContent = '--';
    badge.className = 'kpi-trend neutral';
    return;
  }

  const arrow = trend > 0 ? '\u25B2' : trend < 0 ? '\u25BC' : '\u25CF'; // ▲ ▼ ●
  const sign = trend > 0 ? '+' : '';
  badge.textContent = `${arrow} ${sign}${trend.toFixed(1)}%`;
  badge.className = `kpi-trend ${trend > 0 ? 'positive' : trend < 0 ? 'negative' : 'neutral'}`;
}

// Export for module usage (optional)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    createSparkline,
    createBarChart,
    createDoughnutChart,
    destroyChart,
    destroyAllCharts,
    updateTrendBadge
  };
}
