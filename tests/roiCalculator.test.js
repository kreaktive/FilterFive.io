/**
 * ROI Calculator Tests
 * Tests for ROI calculation, formatting, and status messages
 */

// Create a mock ROI Calculator class for testing
class ROICalculator {
  calculateCostPerReview(subscriptionPrice, positiveReviews) {
    if (positiveReviews === 0) return 0;
    return subscriptionPrice / positiveReviews;
  }

  calculateValueGenerated(positiveReviews, reviewValueEstimate) {
    return positiveReviews * reviewValueEstimate;
  }

  calculateROI(valueGenerated, subscriptionCost) {
    if (subscriptionCost === 0) return 0;
    return ((valueGenerated - subscriptionCost) / subscriptionCost) * 100;
  }

  calculateComprehensiveROI({ subscriptionPrice, positiveReviews, reviewValueEstimate, subscriptionPlan }) {
    const monthlyCost = subscriptionPlan === 'annual' ? subscriptionPrice / 12 : subscriptionPrice;
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

  getMonthlyPrice(subscriptionPlan) {
    const prices = {
      monthly: 77,
      annual: 770 / 12
    };
    return prices[subscriptionPlan] || 77;
  }

  formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }

  getROIColor(roi) {
    if (roi < 0) return 'danger';
    if (roi < 100) return 'warning';
    return 'success';
  }

  getROIMessage(roi) {
    if (roi < 0) return 'Subscription costs more than value generated';
    if (roi === 0) return 'Breaking even';
    if (roi < 100) return 'Positive ROI but not yet doubled investment';
    if (roi < 300) return 'Good ROI - more than doubled your investment';
    if (roi < 500) return 'Excellent ROI - strong return on investment';
    return 'Outstanding ROI - exceptional value generated';
  }
}

const roiCalculator = new ROICalculator();

describe('ROI Calculator', () => {
  describe('calculateCostPerReview', () => {
    test('calculates cost per review correctly', () => {
      expect(roiCalculator.calculateCostPerReview(77, 10)).toBe(7.7);
      expect(roiCalculator.calculateCostPerReview(77, 1)).toBe(77);
      expect(roiCalculator.calculateCostPerReview(77, 77)).toBe(1);
    });

    test('returns 0 when no reviews', () => {
      expect(roiCalculator.calculateCostPerReview(77, 0)).toBe(0);
    });

    test('handles fractional results', () => {
      expect(roiCalculator.calculateCostPerReview(77, 3)).toBeCloseTo(25.67, 2);
    });
  });

  describe('calculateValueGenerated', () => {
    test('calculates total value correctly', () => {
      expect(roiCalculator.calculateValueGenerated(10, 80)).toBe(800);
      expect(roiCalculator.calculateValueGenerated(5, 100)).toBe(500);
      expect(roiCalculator.calculateValueGenerated(0, 80)).toBe(0);
    });

    test('handles decimal review values', () => {
      expect(roiCalculator.calculateValueGenerated(10, 75.50)).toBe(755);
    });
  });

  describe('calculateROI', () => {
    test('calculates positive ROI', () => {
      // Value: $800, Cost: $77 = ((800-77)/77)*100 = 938.96%
      const roi = roiCalculator.calculateROI(800, 77);
      expect(roi).toBeCloseTo(938.96, 2);
    });

    test('calculates negative ROI', () => {
      // Value: $50, Cost: $77 = ((50-77)/77)*100 = -35.06%
      const roi = roiCalculator.calculateROI(50, 77);
      expect(roi).toBeCloseTo(-35.06, 2);
    });

    test('returns 0 when breaking even', () => {
      expect(roiCalculator.calculateROI(77, 77)).toBe(0);
    });

    test('returns 0 when subscription cost is 0', () => {
      expect(roiCalculator.calculateROI(100, 0)).toBe(0);
    });

    test('handles 100% ROI (doubled investment)', () => {
      expect(roiCalculator.calculateROI(154, 77)).toBe(100);
    });
  });

  describe('calculateComprehensiveROI', () => {
    test('calculates all metrics for monthly subscription', () => {
      const result = roiCalculator.calculateComprehensiveROI({
        subscriptionPrice: 77,
        positiveReviews: 10,
        reviewValueEstimate: 80,
        subscriptionPlan: 'monthly'
      });

      expect(result.monthlyCost).toBe(77);
      expect(result.positiveReviews).toBe(10);
      expect(result.reviewValueEstimate).toBe(80);
      expect(result.costPerReview).toBe(7.7);
      expect(result.valueGenerated).toBe(800);
      expect(result.netValue).toBe(723); // 800 - 77
      expect(result.roi).toBeCloseTo(938.96, 2);
      expect(result.roiFormatted).toBe('+939%');
    });

    test('calculates metrics for annual subscription', () => {
      const result = roiCalculator.calculateComprehensiveROI({
        subscriptionPrice: 770, // Annual price
        positiveReviews: 10,
        reviewValueEstimate: 80,
        subscriptionPlan: 'annual'
      });

      // Monthly cost should be 770/12 = 64.17
      expect(result.monthlyCost).toBeCloseTo(64.17, 2);
      expect(result.costPerReview).toBeCloseTo(6.42, 2);
    });

    test('handles zero reviews', () => {
      const result = roiCalculator.calculateComprehensiveROI({
        subscriptionPrice: 77,
        positiveReviews: 0,
        reviewValueEstimate: 80,
        subscriptionPlan: 'monthly'
      });

      expect(result.positiveReviews).toBe(0);
      expect(result.costPerReview).toBe(0);
      expect(result.valueGenerated).toBe(0);
      expect(result.netValue).toBe(-77);
      expect(result.roi).toBe(-100);
      expect(result.roiFormatted).toBe('-100%');
    });

    test('formats ROI with plus sign for positive values', () => {
      const result = roiCalculator.calculateComprehensiveROI({
        subscriptionPrice: 77,
        positiveReviews: 5,
        reviewValueEstimate: 80,
        subscriptionPlan: 'monthly'
      });

      expect(result.roiFormatted).toMatch(/^\+/);
    });

    test('formats ROI without plus sign for negative values', () => {
      const result = roiCalculator.calculateComprehensiveROI({
        subscriptionPrice: 77,
        positiveReviews: 0,
        reviewValueEstimate: 80,
        subscriptionPlan: 'monthly'
      });

      expect(result.roiFormatted).toBe('-100%');
    });
  });

  describe('getMonthlyPrice', () => {
    test('returns correct monthly price', () => {
      expect(roiCalculator.getMonthlyPrice('monthly')).toBe(77);
    });

    test('returns correct annual price divided by 12', () => {
      const monthlyFromAnnual = roiCalculator.getMonthlyPrice('annual');
      expect(monthlyFromAnnual).toBeCloseTo(64.17, 2);
    });

    test('defaults to monthly price for unknown plans', () => {
      expect(roiCalculator.getMonthlyPrice('unknown')).toBe(77);
      expect(roiCalculator.getMonthlyPrice(null)).toBe(77);
      expect(roiCalculator.getMonthlyPrice(undefined)).toBe(77);
    });
  });

  describe('formatCurrency', () => {
    test('formats positive values', () => {
      expect(roiCalculator.formatCurrency(1234.56)).toBe('$1,234.56');
      expect(roiCalculator.formatCurrency(77)).toBe('$77.00');
      expect(roiCalculator.formatCurrency(0.99)).toBe('$0.99');
    });

    test('formats negative values', () => {
      expect(roiCalculator.formatCurrency(-50)).toBe('-$50.00');
    });

    test('formats zero', () => {
      expect(roiCalculator.formatCurrency(0)).toBe('$0.00');
    });

    test('adds thousands separators', () => {
      expect(roiCalculator.formatCurrency(1000000)).toBe('$1,000,000.00');
    });

    test('rounds to 2 decimal places', () => {
      expect(roiCalculator.formatCurrency(77.777)).toBe('$77.78');
    });
  });

  describe('getROIColor', () => {
    test('returns danger for negative ROI', () => {
      expect(roiCalculator.getROIColor(-50)).toBe('danger');
      expect(roiCalculator.getROIColor(-1)).toBe('danger');
      expect(roiCalculator.getROIColor(-100)).toBe('danger');
    });

    test('returns warning for low positive ROI', () => {
      expect(roiCalculator.getROIColor(0)).toBe('warning');
      expect(roiCalculator.getROIColor(50)).toBe('warning');
      expect(roiCalculator.getROIColor(99)).toBe('warning');
    });

    test('returns success for high ROI', () => {
      expect(roiCalculator.getROIColor(100)).toBe('success');
      expect(roiCalculator.getROIColor(500)).toBe('success');
      expect(roiCalculator.getROIColor(1000)).toBe('success');
    });
  });

  describe('getROIMessage', () => {
    test('returns message for negative ROI', () => {
      expect(roiCalculator.getROIMessage(-50)).toBe('Subscription costs more than value generated');
    });

    test('returns message for breaking even', () => {
      expect(roiCalculator.getROIMessage(0)).toBe('Breaking even');
    });

    test('returns message for positive but under 100%', () => {
      expect(roiCalculator.getROIMessage(50)).toBe('Positive ROI but not yet doubled investment');
      expect(roiCalculator.getROIMessage(99)).toBe('Positive ROI but not yet doubled investment');
    });

    test('returns message for good ROI (100-300%)', () => {
      expect(roiCalculator.getROIMessage(100)).toBe('Good ROI - more than doubled your investment');
      expect(roiCalculator.getROIMessage(200)).toBe('Good ROI - more than doubled your investment');
      expect(roiCalculator.getROIMessage(299)).toBe('Good ROI - more than doubled your investment');
    });

    test('returns message for excellent ROI (300-500%)', () => {
      expect(roiCalculator.getROIMessage(300)).toBe('Excellent ROI - strong return on investment');
      expect(roiCalculator.getROIMessage(400)).toBe('Excellent ROI - strong return on investment');
      expect(roiCalculator.getROIMessage(499)).toBe('Excellent ROI - strong return on investment');
    });

    test('returns message for outstanding ROI (500%+)', () => {
      expect(roiCalculator.getROIMessage(500)).toBe('Outstanding ROI - exceptional value generated');
      expect(roiCalculator.getROIMessage(1000)).toBe('Outstanding ROI - exceptional value generated');
    });
  });

  describe('Real-world scenarios', () => {
    test('typical small business scenario', () => {
      // A restaurant getting 15 reviews/month at $80 value each
      const result = roiCalculator.calculateComprehensiveROI({
        subscriptionPrice: 77,
        positiveReviews: 15,
        reviewValueEstimate: 80,
        subscriptionPlan: 'monthly'
      });

      expect(result.valueGenerated).toBe(1200);
      expect(result.netValue).toBe(1123);
      expect(result.roi).toBeGreaterThan(1400); // Over 1400% ROI
      expect(roiCalculator.getROIMessage(result.roi)).toBe('Outstanding ROI - exceptional value generated');
    });

    test('struggling business scenario', () => {
      // A business only getting 1 review/month
      const result = roiCalculator.calculateComprehensiveROI({
        subscriptionPrice: 77,
        positiveReviews: 1,
        reviewValueEstimate: 80,
        subscriptionPlan: 'monthly'
      });

      expect(result.valueGenerated).toBe(80);
      expect(result.netValue).toBe(3);
      expect(result.roi).toBeCloseTo(3.9, 1);
      expect(roiCalculator.getROIMessage(result.roi)).toBe('Positive ROI but not yet doubled investment');
    });

    test('break-even calculation', () => {
      // How many reviews needed to break even?
      // At $77/month and $80/review, need ~1 review to break even
      const subscriptionPrice = 77;
      const reviewValue = 80;
      const breakEvenReviews = Math.ceil(subscriptionPrice / reviewValue);

      expect(breakEvenReviews).toBe(1);
    });

    test('annual plan savings', () => {
      const monthlyResult = roiCalculator.calculateComprehensiveROI({
        subscriptionPrice: 77,
        positiveReviews: 10,
        reviewValueEstimate: 80,
        subscriptionPlan: 'monthly'
      });

      const annualResult = roiCalculator.calculateComprehensiveROI({
        subscriptionPrice: 770,
        positiveReviews: 10,
        reviewValueEstimate: 80,
        subscriptionPlan: 'annual'
      });

      // Annual plan should have lower monthly cost
      expect(annualResult.monthlyCost).toBeLessThan(monthlyResult.monthlyCost);
      // And therefore higher ROI
      expect(annualResult.roi).toBeGreaterThan(monthlyResult.roi);
    });
  });
});
