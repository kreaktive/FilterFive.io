/**
 * ROI Calculator Utility
 *
 * Calculates Return on Investment (ROI) for customer reviews
 * based on subscription cost and user-configurable review value estimate.
 *
 * Formula:
 * - Cost per review = Monthly subscription price / Number of positive reviews
 * - Value generated = Number of positive reviews × Estimated value per review
 * - ROI = ((Value generated - Subscription cost) / Subscription cost) × 100
 *
 * @module utils/roiCalculator
 */

class ROICalculator {
  /**
   * Calculate the cost per positive review
   *
   * @param {number} subscriptionPrice - Monthly subscription price (e.g., 77 for $77/month)
   * @param {number} positiveReviews - Number of positive reviews (4-5 stars)
   * @returns {number} Cost per review in dollars (returns 0 if no reviews)
   */
  calculateCostPerReview(subscriptionPrice, positiveReviews) {
    if (positiveReviews === 0) return 0;
    return subscriptionPrice / positiveReviews;
  }

  /**
   * Calculate total value generated from positive reviews
   *
   * @param {number} positiveReviews - Number of positive reviews (4-5 stars)
   * @param {number} reviewValueEstimate - User's estimated value per review (default $80)
   * @returns {number} Total value generated in dollars
   */
  calculateValueGenerated(positiveReviews, reviewValueEstimate) {
    return positiveReviews * reviewValueEstimate;
  }

  /**
   * Calculate ROI percentage
   *
   * @param {number} valueGenerated - Total value generated from reviews
   * @param {number} subscriptionCost - Monthly subscription cost
   * @returns {number} ROI as a percentage (e.g., 436 for 436% ROI)
   */
  calculateROI(valueGenerated, subscriptionCost) {
    if (subscriptionCost === 0) return 0;
    return ((valueGenerated - subscriptionCost) / subscriptionCost) * 100;
  }

  /**
   * Calculate comprehensive ROI metrics for a user
   *
   * @param {Object} params - Parameters
   * @param {number} params.subscriptionPrice - Monthly subscription price
   * @param {number} params.positiveReviews - Number of positive reviews
   * @param {number} params.reviewValueEstimate - Estimated value per review
   * @param {string} params.subscriptionPlan - 'monthly' or 'annual'
   * @returns {Object} Comprehensive ROI metrics
   */
  calculateComprehensiveROI({ subscriptionPrice, positiveReviews, reviewValueEstimate, subscriptionPlan }) {
    // Calculate monthly cost (annual is divided by 12)
    const monthlyCost = subscriptionPlan === 'annual' ? subscriptionPrice / 12 : subscriptionPrice;

    // Calculate metrics
    const costPerReview = this.calculateCostPerReview(monthlyCost, positiveReviews);
    const valueGenerated = this.calculateValueGenerated(positiveReviews, reviewValueEstimate);
    const roi = this.calculateROI(valueGenerated, monthlyCost);
    const netValue = valueGenerated - monthlyCost;

    return {
      monthlyCost: parseFloat(monthlyCost.toFixed(2)),
      positiveReviews,
      reviewValueEstimate: parseFloat(reviewValueEstimate),
      costPerReview: parseFloat(costPerReview.toFixed(2)),
      valueGenerated: parseFloat(valueGenerated.toFixed(2)),
      netValue: parseFloat(netValue.toFixed(2)),
      roi: parseFloat(roi.toFixed(2)),
      roiFormatted: `${roi > 0 ? '+' : ''}${roi.toFixed(0)}%`
    };
  }

  /**
   * Get subscription price based on plan
   *
   * @param {string} subscriptionPlan - 'monthly' or 'annual'
   * @returns {number} Monthly price
   */
  getMonthlyPrice(subscriptionPlan) {
    const prices = {
      monthly: 77,
      annual: 770 / 12 // $770/year = $64.17/month
    };
    return prices[subscriptionPlan] || 77;
  }

  /**
   * Format currency value
   *
   * @param {number} value - Dollar amount
   * @returns {string} Formatted currency (e.g., "$1,234.56")
   */
  formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }

  /**
   * Determine ROI color for UI display
   *
   * @param {number} roi - ROI percentage
   * @returns {string} Color name ('danger', 'warning', 'success')
   */
  getROIColor(roi) {
    if (roi < 0) return 'danger';      // Negative ROI (red)
    if (roi < 100) return 'warning';   // Positive but < 100% (yellow)
    return 'success';                  // >= 100% ROI (green)
  }

  /**
   * Get ROI status message
   *
   * @param {number} roi - ROI percentage
   * @returns {string} Status message
   */
  getROIMessage(roi) {
    if (roi < 0) return 'Subscription costs more than value generated';
    if (roi === 0) return 'Breaking even';
    if (roi < 100) return 'Positive ROI but not yet doubled investment';
    if (roi < 300) return 'Good ROI - more than doubled your investment';
    if (roi < 500) return 'Excellent ROI - strong return on investment';
    return 'Outstanding ROI - exceptional value generated';
  }
}

// Export singleton instance
module.exports = new ROICalculator();
