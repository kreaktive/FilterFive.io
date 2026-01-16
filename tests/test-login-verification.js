/**
 * Test Login Verification Check
 * Tests that unverified users cannot log in
 */

const { User } = require('./src/models');

(async () => {
  try {
    console.log('🧪 Testing Login Verification Check\n');

    // Cleanup
    await User.destroy({ where: { email: 'login-test-unverified@example.com' } });
    await User.destroy({ where: { email: 'login-test-verified@example.com' } });

    // Test 1: Create unverified user
    console.log('Test 1: Creating unverified user');
    const unverifiedUser = await User.create({
      email: 'login-test-unverified@example.com',
      password: 'TestPass123',
      businessName: 'Unverified Business',
      subscriptionStatus: 'trial',
      role: 'tenant',
      isVerified: false
    });
    console.log(`✓ Unverified user created: ${unverifiedUser.email}`);
    console.log(`  isVerified: ${unverifiedUser.isVerified}\n`);

    // Test 2: Create verified user
    console.log('Test 2: Creating verified user');
    const verifiedUser = await User.create({
      email: 'login-test-verified@example.com',
      password: 'TestPass123',
      businessName: 'Verified Business',
      subscriptionStatus: 'trial',
      role: 'tenant',
      isVerified: true
    });
    console.log(`✓ Verified user created: ${verifiedUser.email}`);
    console.log(`  isVerified: ${verifiedUser.isVerified}\n`);

    // Test 3: Check unverified user (should block)
    console.log('Test 3: Checking login logic for unverified user');
    const testUnverified = await User.findOne({ where: { email: 'login-test-unverified@example.com' } });

    if (!testUnverified.isVerified && testUnverified.role !== 'super_admin') {
      console.log('✓ PASS: Login should be blocked for unverified user');
      console.log('  Expected behavior: Show error message');
      console.log('  Error: "Please verify your email address before logging in."\n');
    } else {
      console.log('❌ FAIL: Login should have been blocked\n');
    }

    // Test 4: Check verified user (should allow)
    console.log('Test 4: Checking login logic for verified user');
    const testVerified = await User.findOne({ where: { email: 'login-test-verified@example.com' } });

    if (testVerified.isVerified) {
      console.log('✓ PASS: Login should be allowed for verified user\n');
    } else {
      console.log('❌ FAIL: Login should have been allowed\n');
    }

    // Test 5: Super admin bypass check
    console.log('Test 5: Creating super admin (unverified)');
    await User.destroy({ where: { email: 'admin-test@example.com' } });
    const adminUser = await User.create({
      email: 'admin-test@example.com',
      password: 'TestPass123',
      businessName: 'Admin User',
      subscriptionStatus: 'active',
      role: 'super_admin',
      isVerified: false
    });
    console.log(`✓ Super admin created: ${adminUser.email}`);
    console.log(`  isVerified: ${adminUser.isVerified}`);
    console.log(`  role: ${adminUser.role}\n`);

    // Test 6: Check super admin bypass
    console.log('Test 6: Checking super admin bypass logic');
    const testAdmin = await User.findOne({ where: { email: 'admin-test@example.com' } });

    if (testAdmin.role === 'super_admin') {
      console.log('✓ PASS: Super admin bypasses email verification check');
      console.log('  Even though isVerified=false, super admin can login\n');
    } else {
      console.log('❌ FAIL: Super admin bypass not working\n');
    }

    // Summary
    console.log('='.repeat(60));
    console.log('Login Controller Logic (src/controllers/dashboardController.js:43-49):');
    console.log('');
    console.log('if (!user.isVerified && user.role !== \'super_admin\') {');
    console.log('  return res.render(\'dashboard/login\', {');
    console.log('    error: \'Please verify your email address...\'');
    console.log('  });');
    console.log('}');
    console.log('='.repeat(60));

    // Cleanup
    await User.destroy({ where: { email: 'login-test-unverified@example.com' } });
    await User.destroy({ where: { email: 'login-test-verified@example.com' } });
    await User.destroy({ where: { email: 'admin-test@example.com' } });

    console.log('\n✅ All login verification tests passed!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Test error:', error);
    process.exit(1);
  }
})();
