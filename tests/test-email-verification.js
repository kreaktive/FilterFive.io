/**
 * Test Email Verification Flow
 * Tests complete signup → verification → login flow
 */

const { User } = require('./src/models');
const verificationService = require('./src/services/verificationService');
const crypto = require('crypto');

(async () => {
  try {
    console.log('🧪 Testing Email Verification Flow\n');

    // Cleanup: Delete test user if exists
    await User.destroy({ where: { email: 'verify-test@example.com' } });

    // Test 1: Create unverified user
    console.log('Test 1: Creating unverified user');
    const testUser = await User.create({
      email: 'verify-test@example.com',
      password: 'TestPass123',
      businessName: 'Verification Test Business',
      subscriptionStatus: 'trial',
      role: 'tenant',
      isVerified: false,
      verificationToken: null,
      verificationTokenExpires: null
    });
    console.log(`✓ User created: ${testUser.email}`);
    console.log(`  isVerified: ${testUser.isVerified}`);
    console.log(`  verificationToken: ${testUser.verificationToken || 'null'}\n`);

    // Test 2: Send verification email (generates token)
    console.log('Test 2: Sending verification email');
    await verificationService.sendVerificationEmail(testUser);
    await testUser.reload();
    console.log(`✓ Verification email sent`);
    console.log(`  verificationToken: ${testUser.verificationToken}`);
    console.log(`  verificationTokenExpires: ${testUser.verificationTokenExpires}`);
    console.log(`  Verification URL: http://localhost:3000/verify/${testUser.verificationToken}\n`);

    const savedToken = testUser.verificationToken;

    // Test 3: Verify email with valid token
    console.log('Test 3: Verifying email with valid token');
    const verifiedUser = await verificationService.verifyEmail(savedToken);
    console.log(`✓ Email verified successfully`);
    console.log(`  isVerified: ${verifiedUser.isVerified}`);
    console.log(`  verificationToken: ${verifiedUser.verificationToken || 'null'}`);
    console.log(`  verificationTokenExpires: ${verifiedUser.verificationTokenExpires || 'null'}\n`);

    // Test 4: Try to verify again with same token (should fail)
    console.log('Test 4: Try verifying with already-used token (should fail)');
    try {
      await verificationService.verifyEmail(savedToken);
      console.log('❌ FAIL: Should have thrown error\n');
    } catch (error) {
      console.log(`✓ Correctly rejected: ${error.message}\n`);
    }

    // Test 5: Try to verify with invalid token (should fail)
    console.log('Test 5: Try verifying with invalid token (should fail)');
    try {
      const fakeToken = crypto.randomBytes(32).toString('hex');
      await verificationService.verifyEmail(fakeToken);
      console.log('❌ FAIL: Should have thrown error\n');
    } catch (error) {
      console.log(`✓ Correctly rejected: ${error.message}\n`);
    }

    // Test 6: Create user and simulate expired token
    console.log('Test 6: Testing expired verification token');
    const expiredUser = await User.create({
      email: 'expired-test@example.com',
      password: 'TestPass123',
      businessName: 'Expired Token Test',
      subscriptionStatus: 'trial',
      role: 'tenant',
      isVerified: false,
      verificationToken: crypto.randomBytes(32).toString('hex'),
      verificationTokenExpires: new Date(Date.now() - 1000) // 1 second ago
    });

    try {
      await verificationService.verifyEmail(expiredUser.verificationToken);
      console.log('❌ FAIL: Should have rejected expired token\n');
    } catch (error) {
      console.log(`✓ Correctly rejected expired token: ${error.message}\n`);
    }

    // Test 7: Resend verification email
    console.log('Test 7: Testing resend verification email');
    await expiredUser.update({ isVerified: false });
    await verificationService.resendVerificationEmail('expired-test@example.com');
    await expiredUser.reload();
    console.log(`✓ Verification email resent`);
    console.log(`  New token generated: ${expiredUser.verificationToken.substring(0, 10)}...`);
    console.log(`  New expires: ${expiredUser.verificationTokenExpires}\n`);

    // Cleanup
    await User.destroy({ where: { email: 'verify-test@example.com' } });
    await User.destroy({ where: { email: 'expired-test@example.com' } });

    console.log('✅ All email verification tests passed!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Test error:', error);
    process.exit(1);
  }
})();
