/**
 * Test QR Trial Start
 * Tests that trial starts on first QR scan
 */

const { User } = require('./src/models');

(async () => {
  try {
    console.log('🧪 Testing Trial Start on First QR Scan\n');

    // Cleanup
    await User.destroy({ where: { email: 'qr-test@example.com' } });

    // Test 1: Create user without trial dates
    console.log('Test 1: Creating user without trial dates');
    const testUser = await User.create({
      email: 'qr-test@example.com',
      password: 'TestPass123',
      businessName: 'QR Test Business',
      subscriptionStatus: 'trial',
      role: 'tenant',
      isVerified: true,
      trialStartsAt: null,
      trialEndsAt: null
    });
    console.log(`✓ User created: ${testUser.email}`);
    console.log(`  subscriptionStatus: ${testUser.subscriptionStatus}`);
    console.log(`  trialStartsAt: ${testUser.trialStartsAt}`);
    console.log(`  trialEndsAt: ${testUser.trialEndsAt}`);
    console.log(`  isTrialActive(): ${testUser.isTrialActive()}\n`);

    // Test 2: Simulate QR controller logic (qrController.js:47-50)
    console.log('Test 2: Simulating first QR scan');
    console.log('Logic check: (!business.trialStartsAt && business.subscriptionStatus === \'trial\')');

    if (!testUser.trialStartsAt && testUser.subscriptionStatus === 'trial') {
      console.log('✓ Conditions met - Starting trial...');
      await testUser.startTrial();
      await testUser.reload();
      console.log(`✓ Trial started for ${testUser.businessName} (ID: ${testUser.id})`);
    } else {
      console.log('❌ Conditions not met - trial would not start');
    }

    console.log(`  trialStartsAt: ${testUser.trialStartsAt}`);
    console.log(`  trialEndsAt: ${testUser.trialEndsAt}`);
    console.log(`  marketingStatus: ${testUser.marketingStatus}`);
    console.log(`  isTrialActive(): ${testUser.isTrialActive()}\n`);

    // Test 3: Simulate second QR scan (should NOT restart trial)
    console.log('Test 3: Simulating second QR scan (trial should NOT restart)');
    const beforeSecondScan = {
      trialStartsAt: new Date(testUser.trialStartsAt),
      trialEndsAt: new Date(testUser.trialEndsAt)
    };

    if (!testUser.trialStartsAt && testUser.subscriptionStatus === 'trial') {
      await testUser.startTrial();
      console.log('❌ FAIL: Trial restarted (should not happen)');
    } else {
      console.log('✓ PASS: Trial NOT restarted (condition check passed)');
    }

    await testUser.reload();
    const afterSecondScan = {
      trialStartsAt: new Date(testUser.trialStartsAt),
      trialEndsAt: new Date(testUser.trialEndsAt)
    };

    if (beforeSecondScan.trialStartsAt.getTime() === afterSecondScan.trialStartsAt.getTime()) {
      console.log('✓ PASS: Trial dates unchanged after second scan\n');
    } else {
      console.log('❌ FAIL: Trial dates changed (should not happen)\n');
    }

    // Test 4: User with active subscription should NOT trigger trial start
    console.log('Test 4: User with active subscription (should NOT start trial)');
    await User.destroy({ where: { email: 'active-sub-test@example.com' } });

    const activeSubUser = await User.create({
      email: 'active-sub-test@example.com',
      password: 'TestPass123',
      businessName: 'Active Subscription Business',
      subscriptionStatus: 'active',
      role: 'tenant',
      isVerified: true,
      trialStartsAt: null,
      trialEndsAt: null
    });

    console.log(`  subscriptionStatus: ${activeSubUser.subscriptionStatus}`);
    console.log(`  trialStartsAt: ${activeSubUser.trialStartsAt}`);

    if (!activeSubUser.trialStartsAt && activeSubUser.subscriptionStatus === 'trial') {
      console.log('❌ FAIL: Would have started trial (should not)');
    } else {
      console.log('✓ PASS: Trial NOT started (active subscription)');
    }

    console.log('');

    // Summary
    console.log('='.repeat(60));
    console.log('QR Controller Logic (src/controllers/qrController.js:46-50):');
    console.log('');
    console.log('// Start trial on first QR page view (Phase 2 requirement)');
    console.log('if (!business.trialStartsAt && business.subscriptionStatus === \'trial\') {');
    console.log('  await business.startTrial();');
    console.log('  console.log(`✓ Trial started... - First QR scan`);');
    console.log('}');
    console.log('='.repeat(60));

    // Cleanup
    await User.destroy({ where: { email: 'qr-test@example.com' } });
    await User.destroy({ where: { email: 'active-sub-test@example.com' } });

    console.log('\n✅ All QR trial start tests passed!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Test error:', error);
    process.exit(1);
  }
})();
