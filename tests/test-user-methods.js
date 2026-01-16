/**
 * Test User Model Helper Methods
 * Tests Phase 2 trial management methods
 */

const { User } = require('./src/models');

(async () => {
  try {
    console.log('🧪 Testing User Model Helper Methods\n');

    // Find a test user (or use existing one)
    let testUser = await User.findOne({ where: { email: 'mike@test.com' } });

    if (!testUser) {
      console.log('Creating test user...');
      testUser = await User.create({
        email: 'test-trial@morestars.io',
        password: 'TestPass123',
        businessName: 'Test Trial Business',
        subscriptionStatus: 'trial',
        role: 'tenant',
        isVerified: true
      });
      console.log('✓ Test user created\n');
    } else {
      console.log(`Using existing user: ${testUser.email}\n`);
    }

    // Test 1: isTrialActive() - without trial dates
    console.log('Test 1: isTrialActive() without trial dates');
    console.log(`trialStartsAt: ${testUser.trialStartsAt}`);
    console.log(`trialEndsAt: ${testUser.trialEndsAt}`);
    console.log(`Result: ${testUser.isTrialActive()}`);
    console.log(`Expected: false (no trial dates set)\n`);

    // Test 2: startTrial()
    console.log('Test 2: startTrial()');
    await testUser.startTrial();
    await testUser.reload();
    console.log(`trialStartsAt: ${testUser.trialStartsAt}`);
    console.log(`trialEndsAt: ${testUser.trialEndsAt}`);
    console.log(`marketingStatus: ${testUser.marketingStatus}`);
    console.log(`Expected: trial_active, dates 14 days apart\n`);

    // Test 3: isTrialActive() - with active trial
    console.log('Test 3: isTrialActive() with active trial');
    console.log(`Result: ${testUser.isTrialActive()}`);
    console.log(`Expected: true (trial just started)\n`);

    // Test 4: isInGracePeriod() - should be false during active trial
    console.log('Test 4: isInGracePeriod() during active trial');
    console.log(`Result: ${testUser.isInGracePeriod()}`);
    console.log(`Expected: false (trial is active)\n`);

    // Test 5: isHardLocked() - should be false during active trial
    console.log('Test 5: isHardLocked() during active trial');
    console.log(`Result: ${testUser.isHardLocked()}`);
    console.log(`Expected: false (trial is active)\n`);

    // Test 6: canSendSms() - trial user with limit
    console.log('Test 6: canSendSms() for trial user');
    console.log(`smsUsageCount: ${testUser.smsUsageCount}`);
    console.log(`smsUsageLimit: ${testUser.smsUsageLimit}`);
    console.log(`Result: ${testUser.canSendSms()}`);
    console.log(`Expected: true (0 < 10)\n`);

    // Test 7: Simulate expired trial (set trialEndsAt to past)
    console.log('Test 7: Simulating expired trial (6 days ago)');
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 6);
    testUser.trialEndsAt = pastDate;
    await testUser.save();
    console.log(`trialEndsAt: ${testUser.trialEndsAt}`);
    console.log(`isTrialActive(): ${testUser.isTrialActive()}`);
    console.log(`isInGracePeriod(): ${testUser.isInGracePeriod()}`);
    console.log(`isHardLocked(): ${testUser.isHardLocked()}`);
    console.log(`Expected: active=false, grace=false, hard=true (6 days > 5 day grace)\n`);

    // Test 8: Simulate grace period (2 days ago)
    console.log('Test 8: Simulating grace period (2 days after expiry)');
    const gracePeriodDate = new Date();
    gracePeriodDate.setDate(gracePeriodDate.getDate() - 2);
    testUser.trialEndsAt = gracePeriodDate;
    await testUser.save();
    console.log(`trialEndsAt: ${testUser.trialEndsAt}`);
    console.log(`isTrialActive(): ${testUser.isTrialActive()}`);
    console.log(`isInGracePeriod(): ${testUser.isInGracePeriod()}`);
    console.log(`isHardLocked(): ${testUser.isHardLocked()}`);
    console.log(`Expected: active=false, grace=true, hard=false (within 5 days)\n`);

    // Test 9: Active subscription bypasses all locks
    console.log('Test 9: Active subscription');
    testUser.subscriptionStatus = 'active';
    await testUser.save();
    console.log(`subscriptionStatus: ${testUser.subscriptionStatus}`);
    console.log(`canSendSms(): ${testUser.canSendSms()}`);
    console.log(`Expected: true (active subscription bypasses SMS limit)\n`);

    console.log('✅ All User model tests completed!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Test error:', error);
    process.exit(1);
  }
})();
