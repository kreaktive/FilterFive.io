/**
 * Test Analytics System
 * Tests snapshot generation and API endpoints
 */

const snapshotService = require('./src/services/snapshotService');
const analyticsService = require('./src/services/analyticsService');

async function testAnalytics() {
  console.log('='.repeat(60));
  console.log('Testing Analytics System');
  console.log('='.repeat(60));

  const userId = 1; // Mike's Mechanics

  try {
    // Step 1: Generate snapshots for the last 30 days
    console.log('\n1. Generating snapshots for user', userId);
    console.log('-'.repeat(60));

    const backfillResult = await snapshotService.backfillSnapshots(userId, 30);
    console.log('✓ Backfill complete:', backfillResult);

    // Step 2: Get dashboard metrics
    console.log('\n2. Fetching dashboard metrics');
    console.log('-'.repeat(60));

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const metrics = await analyticsService.getDashboardMetrics(userId, {
      startDate,
      endDate
    });

    console.log('✓ Dashboard Metrics:');
    console.log('  Period:', metrics.period);
    console.log('  Requests:', metrics.requests);
    console.log('  Reviews:', metrics.reviews);
    console.log('  ROI:', metrics.roi);

    // Step 3: Get trend data
    console.log('\n3. Fetching trend data');
    console.log('-'.repeat(60));

    const trends = await analyticsService.getTrendData(userId);
    console.log('✓ Trend Data:');
    console.log('  Data points:', trends.dates.length);
    console.log('  Latest requests:', trends.requestsSent[trends.requestsSent.length - 1]);
    console.log('  Latest reviews:', trends.reviewsPositive[trends.reviewsPositive.length - 1]);

    // Step 4: Generate timing performance
    console.log('\n4. Generating timing performance');
    console.log('-'.repeat(60));

    const timingResult = await snapshotService.generateTimingPerformance();
    console.log('✓ Timing performance:', timingResult);

    // Step 5: Get timing heatmap
    console.log('\n5. Fetching timing heatmap');
    console.log('-'.repeat(60));

    const heatmap = await analyticsService.getTimingHeatmap(userId);
    console.log('✓ Heatmap records:', heatmap.length);
    if (heatmap.length > 0) {
      console.log('  Sample:', heatmap[0]);
    }

    // Step 6: Test ROI calculation
    console.log('\n6. Testing ROI Calculator');
    console.log('-'.repeat(60));

    const roiCalculator = require('./src/utils/roiCalculator');
    const testROI = roiCalculator.calculateComprehensiveROI({
      subscriptionPrice: 77,
      positiveReviews: metrics.reviews.positive,
      reviewValueEstimate: 80,
      subscriptionPlan: 'monthly'
    });

    console.log('✓ ROI Calculation:');
    console.log('  Cost per review:', roiCalculator.formatCurrency(testROI.costPerReview));
    console.log('  Value generated:', roiCalculator.formatCurrency(testROI.valueGenerated));
    console.log('  Net value:', roiCalculator.formatCurrency(testROI.netValue));
    console.log('  ROI:', testROI.roiFormatted);
    console.log('  Status:', roiCalculator.getROIMessage(testROI.roi));

    console.log('\n' + '='.repeat(60));
    console.log('✅ All tests passed!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    throw error;
  }
}

// Run tests
testAnalytics()
  .then(() => {
    console.log('\n✓ Analytics system is working correctly');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Analytics system test failed:', error);
    process.exit(1);
  });
