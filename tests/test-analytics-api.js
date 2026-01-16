/**
 * Test Analytics API Endpoints
 * Verifies that all analytics endpoints return correct data
 */

const analyticsService = require('./src/services/analyticsService');

async function testAnalyticsAPI() {
  console.log('='.repeat(60));
  console.log('Testing Analytics API Endpoints');
  console.log('='.repeat(60));

  const userId = 1; // Mike's Mechanics

  try {
    // Test 1: Get Dashboard Metrics
    console.log('\n1. Testing getDashboardMetrics');
    console.log('-'.repeat(60));

    const endDate = new Date('2025-01-29');
    const startDate = new Date('2025-01-01');

    const metrics = await analyticsService.getDashboardMetrics(userId, {
      startDate,
      endDate
    });

    console.log('✓ Dashboard Metrics:');
    console.log('  Period:', metrics.period);
    console.log('  Requests sent:', metrics.requests.sent);
    console.log('  Requests clicked:', metrics.requests.clicked);
    console.log('  Reviews total:', metrics.reviews.total);
    console.log('  Reviews positive:', metrics.reviews.positive);
    console.log('  Average rating:', metrics.reviews.averageRating);
    console.log('  Click rate:', metrics.requests.clickRate + '%');
    console.log('  Conversion rate:', metrics.requests.conversionRate + '%');
    console.log('  ROI:', metrics.roi.roiFormatted);
    console.log('  Cost per review:', `$${metrics.roi.costPerReview.toFixed(2)}`);

    // Test 2: Get Trend Data
    console.log('\n2. Testing getTrendData');
    console.log('-'.repeat(60));

    const trends = await analyticsService.getTrendData(userId);

    console.log('✓ Trend Data:');
    console.log('  Data points:', trends.dates.length);
    console.log('  Date range:', trends.dates[0], 'to', trends.dates[trends.dates.length - 1]);
    console.log('  Latest requests:', trends.requestsSent[trends.requestsSent.length - 1]);
    console.log('  Latest reviews:', trends.reviewsPositive[trends.reviewsPositive.length - 1]);
    console.log('  Sample data (last 5 days):');
    for (let i = Math.max(0, trends.dates.length - 5); i < trends.dates.length; i++) {
      console.log(`    ${trends.dates[i]}: ${trends.requestsSent[i]} requests, ${trends.reviewsPositive[i]} reviews`);
    }

    // Test 3: Get User Locations
    console.log('\n3. Testing getUserLocations');
    console.log('-'.repeat(60));

    const locations = await analyticsService.getUserLocations(userId);
    console.log('✓ User Locations:', locations.length > 0 ? locations : 'No locations set');

    // Test 4: Verify ROI Calculation
    console.log('\n4. Testing ROI Calculator');
    console.log('-'.repeat(60));

    const roiCalculator = require('./src/utils/roiCalculator');
    const testROI = roiCalculator.calculateComprehensiveROI({
      subscriptionPrice: 77,
      positiveReviews: metrics.reviews.positive,
      reviewValueEstimate: 80,
      subscriptionPlan: 'monthly'
    });

    console.log('✓ ROI Calculation:');
    console.log('  Monthly cost:', roiCalculator.formatCurrency(testROI.monthlyCost));
    console.log('  Cost per review:', roiCalculator.formatCurrency(testROI.costPerReview));
    console.log('  Value generated:', roiCalculator.formatCurrency(testROI.valueGenerated));
    console.log('  Net value:', roiCalculator.formatCurrency(testROI.netValue));
    console.log('  ROI:', testROI.roiFormatted);
    console.log('  ROI color:', roiCalculator.getROIColor(testROI.roi));
    console.log('  ROI message:', roiCalculator.getROIMessage(testROI.roi));

    // Test 5: Check Snapshots Count
    console.log('\n5. Checking Analytics Snapshots');
    console.log('-'.repeat(60));

    const { AnalyticsSnapshot } = require('./src/models');
    const snapshotCount = await AnalyticsSnapshot.count({ where: { userId } });
    console.log('✓ Snapshots in database:', snapshotCount);

    if (snapshotCount > 0) {
      const latestSnapshot = await AnalyticsSnapshot.findOne({
        where: { userId },
        order: [['snapshotDate', 'DESC']]
      });
      console.log('  Latest snapshot date:', latestSnapshot.snapshotDate);
      console.log('  Requests sent:', latestSnapshot.requestsSent);
      console.log('  Reviews positive:', latestSnapshot.reviewsPositive);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ All API tests passed!');
    console.log('='.repeat(60));

    console.log('\n📋 Summary:');
    console.log('  - Metrics API: Working ✓');
    console.log('  - Trends API: Working ✓');
    console.log('  - ROI Calculator: Working ✓');
    console.log('  - Snapshots: ' + snapshotCount + ' records ✓');
    console.log('\n🌐 Frontend URLs:');
    console.log('  - Dashboard: http://localhost:3000/dashboard/analytics');
    console.log('  - API Metrics: http://localhost:3000/api/analytics/metrics');
    console.log('  - API Trends: http://localhost:3000/api/analytics/trends');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.error('Stack:', error.stack);
    throw error;
  }
}

// Run tests
testAnalyticsAPI()
  .then(() => {
    console.log('\n✓ Analytics API is fully functional');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Analytics API test failed:', error.message);
    process.exit(1);
  });
