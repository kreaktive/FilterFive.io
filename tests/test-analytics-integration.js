/**
 * Comprehensive Analytics Integration Test
 * Tests the full flow: Controller → Service → Database → View
 */

const { User, AnalyticsSnapshot } = require('./src/models');
const analyticsController = require('./src/controllers/analyticsController');
const analyticsService = require('./src/services/analyticsService');

// Mock Express request/response objects
function createMockReq(userId, query = {}) {
  return {
    session: { userId },
    query,
    params: {}
  };
}

function createMockRes() {
  const res = {
    statusCode: 200,
    data: null,
    rendered: null,
    json: function(data) {
      this.data = data;
      return this;
    },
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    render: function(view, data) {
      this.rendered = { view, data };
      return this;
    }
  };
  return res;
}

async function runIntegrationTests() {
  console.log('='.repeat(70));
  console.log('ANALYTICS DASHBOARD INTEGRATION TEST');
  console.log('='.repeat(70));

  const userId = 1;
  let passed = 0;
  let failed = 0;

  try {
    // TEST 1: Verify User Setup
    console.log('\n📋 TEST 1: User Configuration');
    console.log('-'.repeat(70));

    const user = await User.findByPk(userId);
    if (!user) {
      console.error('❌ FAIL: User not found');
      failed++;
      return;
    }

    console.log('✓ User found:', user.email);
    console.log('✓ Business:', user.businessName);
    console.log('✓ Analytics enabled:', user.analyticsEnabled);
    console.log('✓ Subscription status:', user.subscriptionStatus);
    console.log('✓ Review value estimate:', `$${user.reviewValueEstimate}`);

    if (!user.analyticsEnabled) {
      console.error('❌ FAIL: Analytics not enabled for user');
      failed++;
      return;
    }
    passed++;

    // TEST 2: Verify Snapshots Exist
    console.log('\n📊 TEST 2: Analytics Snapshots');
    console.log('-'.repeat(70));

    const snapshotCount = await AnalyticsSnapshot.count({ where: { userId } });
    console.log('✓ Total snapshots:', snapshotCount);

    if (snapshotCount === 0) {
      console.error('❌ FAIL: No snapshots found');
      failed++;
      return;
    }

    const latestSnapshot = await AnalyticsSnapshot.findOne({
      where: { userId },
      order: [['snapshotDate', 'DESC']]
    });

    console.log('✓ Latest snapshot date:', latestSnapshot.snapshotDate);
    console.log('✓ Requests sent:', latestSnapshot.requestsSent);
    console.log('✓ Reviews positive:', latestSnapshot.reviewsPositive);
    console.log('✓ Average rating:', latestSnapshot.averageRating);
    passed++;

    // TEST 3: Analytics Service - getDashboardMetrics
    console.log('\n🔧 TEST 3: Analytics Service - getDashboardMetrics()');
    console.log('-'.repeat(70));

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const metrics = await analyticsService.getDashboardMetrics(userId, {
      startDate,
      endDate
    });

    console.log('✓ Period:', JSON.stringify(metrics.period));
    console.log('✓ Requests:');
    console.log('  - Sent:', metrics.requests.sent);
    console.log('  - Clicked:', metrics.requests.clicked);
    console.log('  - Rated:', metrics.requests.rated);
    console.log('  - Click rate:', metrics.requests.clickRate + '%');
    console.log('  - Conversion rate:', metrics.requests.conversionRate + '%');
    console.log('✓ Reviews:');
    console.log('  - Total:', metrics.reviews.total);
    console.log('  - Positive:', metrics.reviews.positive);
    console.log('  - Negative:', metrics.reviews.negative);
    console.log('  - Average rating:', metrics.reviews.averageRating);
    console.log('✓ ROI:');
    console.log('  - Monthly cost:', `$${metrics.roi.monthlyCost}`);
    console.log('  - Cost per review:', `$${metrics.roi.costPerReview.toFixed(2)}`);
    console.log('  - Value generated:', `$${metrics.roi.valueGenerated}`);
    console.log('  - Net value:', `$${metrics.roi.netValue}`);
    console.log('  - ROI:', metrics.roi.roiFormatted);

    if (!metrics.period || !metrics.requests || !metrics.reviews || !metrics.roi) {
      console.error('❌ FAIL: Metrics missing required fields');
      failed++;
      return;
    }
    passed++;

    // TEST 4: Analytics Service - getTrendData
    console.log('\n📈 TEST 4: Analytics Service - getTrendData()');
    console.log('-'.repeat(70));

    const trends = await analyticsService.getTrendData(userId);

    console.log('✓ Data points:', trends.dates.length);
    console.log('✓ Date range:', trends.dates[0], 'to', trends.dates[trends.dates.length - 1]);
    console.log('✓ Arrays present:');
    console.log('  - dates:', trends.dates.length);
    console.log('  - requestsSent:', trends.requestsSent.length);
    console.log('  - reviewsPositive:', trends.reviewsPositive.length);
    console.log('  - averageRating:', trends.averageRating.length);
    console.log('  - clickRate:', trends.clickRate.length);

    if (trends.dates.length !== 30) {
      console.warn('⚠ WARNING: Expected 30 data points, got', trends.dates.length);
    }

    // Show sample data
    console.log('✓ Sample data (last 3 days):');
    for (let i = Math.max(0, trends.dates.length - 3); i < trends.dates.length; i++) {
      console.log(`  ${trends.dates[i]}: ${trends.requestsSent[i]} requests, ${trends.reviewsPositive[i]} reviews`);
    }
    passed++;

    // TEST 5: Analytics Service - getUserLocations
    console.log('\n📍 TEST 5: Analytics Service - getUserLocations()');
    console.log('-'.repeat(70));

    const locations = await analyticsService.getUserLocations(userId);
    console.log('✓ User locations:', locations.length > 0 ? locations : 'No locations set (single location)');
    passed++;

    // TEST 6: Controller - getAnalyticsDashboard
    console.log('\n🎮 TEST 6: Controller - getAnalyticsDashboard()');
    console.log('-'.repeat(70));

    const req = createMockReq(userId);
    const res = createMockRes();

    await analyticsController.getAnalyticsDashboard(req, res);

    if (res.rendered) {
      console.log('✓ View rendered:', res.rendered.view);
      console.log('✓ Data passed to view:');
      console.log('  - businessName:', res.rendered.data.businessName);
      console.log('  - locations:', res.rendered.data.locations);
      console.log('  - title:', res.rendered.data.title);

      if (res.rendered.view !== 'dashboard/analytics') {
        console.error('❌ FAIL: Wrong view rendered:', res.rendered.view);
        failed++;
        return;
      }
      passed++;
    } else {
      console.error('❌ FAIL: No view rendered');
      console.error('Response:', res);
      failed++;
      return;
    }

    // TEST 7: Controller - getMetrics
    console.log('\n🎮 TEST 7: Controller - getMetrics()');
    console.log('-'.repeat(70));

    const metricsReq = createMockReq(userId, {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    });
    const metricsRes = createMockRes();

    await analyticsController.getMetrics(metricsReq, metricsRes);

    if (metricsRes.data) {
      console.log('✓ Metrics returned successfully');
      console.log('✓ Response includes:');
      console.log('  - period:', !!metricsRes.data.period);
      console.log('  - requests:', !!metricsRes.data.requests);
      console.log('  - reviews:', !!metricsRes.data.reviews);
      console.log('  - roi:', !!metricsRes.data.roi);

      if (!metricsRes.data.period || !metricsRes.data.requests || !metricsRes.data.reviews || !metricsRes.data.roi) {
        console.error('❌ FAIL: Metrics response missing required fields');
        failed++;
        return;
      }
      passed++;
    } else {
      console.error('❌ FAIL: No data returned');
      console.error('Status:', metricsRes.statusCode);
      failed++;
      return;
    }

    // TEST 8: Controller - getTrends
    console.log('\n🎮 TEST 8: Controller - getTrends()');
    console.log('-'.repeat(70));

    const trendsReq = createMockReq(userId);
    const trendsRes = createMockRes();

    await analyticsController.getTrends(trendsReq, trendsRes);

    if (trendsRes.data) {
      console.log('✓ Trends returned successfully');
      console.log('✓ Response includes:');
      console.log('  - dates:', trendsRes.data.dates?.length || 0, 'points');
      console.log('  - requestsSent:', trendsRes.data.requestsSent?.length || 0, 'points');
      console.log('  - reviewsPositive:', trendsRes.data.reviewsPositive?.length || 0, 'points');
      console.log('  - averageRating:', trendsRes.data.averageRating?.length || 0, 'points');
      console.log('  - clickRate:', trendsRes.data.clickRate?.length || 0, 'points');

      if (!trendsRes.data.dates || trendsRes.data.dates.length === 0) {
        console.error('❌ FAIL: Trends response has no data points');
        failed++;
        return;
      }
      passed++;
    } else {
      console.error('❌ FAIL: No data returned');
      console.error('Status:', trendsRes.statusCode);
      failed++;
      return;
    }

    // TEST 9: Verify View Files Exist
    console.log('\n📄 TEST 9: View Files');
    console.log('-'.repeat(70));

    const fs = require('fs');
    const path = require('path');

    const analyticsView = path.join(__dirname, 'src/views/dashboard/analytics.ejs');
    const comingSoonView = path.join(__dirname, 'src/views/dashboard/analytics-coming-soon.ejs');

    if (fs.existsSync(analyticsView)) {
      const stats = fs.statSync(analyticsView);
      console.log('✓ analytics.ejs exists:', stats.size, 'bytes');
    } else {
      console.error('❌ FAIL: analytics.ejs not found');
      failed++;
      return;
    }

    if (fs.existsSync(comingSoonView)) {
      const stats = fs.statSync(comingSoonView);
      console.log('✓ analytics-coming-soon.ejs exists:', stats.size, 'bytes');
    } else {
      console.error('❌ FAIL: analytics-coming-soon.ejs not found');
      failed++;
      return;
    }
    passed++;

    // TEST 10: Test Coming Soon Page (disabled user)
    console.log('\n🎮 TEST 10: Coming Soon Page (analytics_enabled = false)');
    console.log('-'.repeat(70));

    // Temporarily disable analytics
    await User.update({ analyticsEnabled: false }, { where: { id: userId } });

    const disabledReq = createMockReq(userId);
    const disabledRes = createMockRes();

    await analyticsController.getAnalyticsDashboard(disabledReq, disabledRes);

    if (disabledRes.rendered && disabledRes.rendered.view === 'dashboard/analytics-coming-soon') {
      console.log('✓ Coming soon page rendered correctly');
      console.log('✓ Data passed:', Object.keys(disabledRes.rendered.data).join(', '));
      passed++;
    } else {
      console.error('❌ FAIL: Coming soon page not rendered');
      console.error('Rendered view:', disabledRes.rendered?.view);
      failed++;
    }

    // Re-enable analytics
    await User.update({ analyticsEnabled: true }, { where: { id: userId } });

    // FINAL RESULTS
    console.log('\n' + '='.repeat(70));
    console.log('TEST RESULTS');
    console.log('='.repeat(70));
    console.log(`✅ Passed: ${passed}/10`);
    console.log(`❌ Failed: ${failed}/10`);
    console.log('='.repeat(70));

    if (failed === 0) {
      console.log('\n🎉 SUCCESS! All integration tests passed!');
      console.log('\n✅ Everything is properly connected:');
      console.log('  • User configuration ✓');
      console.log('  • Database snapshots ✓');
      console.log('  • Analytics service ✓');
      console.log('  • API controllers ✓');
      console.log('  • View rendering ✓');
      console.log('  • Feature flag (coming soon page) ✓');
      console.log('\n🌐 Dashboard is ready to use at:');
      console.log('   http://localhost:3000/dashboard/analytics');
      return true;
    } else {
      console.log('\n❌ FAILURE! Some tests failed. See details above.');
      return false;
    }

  } catch (error) {
    console.error('\n💥 CRITICAL ERROR:', error.message);
    console.error('Stack:', error.stack);
    return false;
  }
}

// Run tests
runIntegrationTests()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
