/**
 * Test Password Validation
 * Tests Phase 2 password requirements: 8 chars + 1 number
 */

const validation = require('./src/services/validationService');

console.log('🧪 Testing Password Validation (8 chars + 1 number)\n');

const testCases = [
  { password: 'TestPass1', expected: true, reason: 'Valid: 9 chars + 1 number' },
  { password: 'Abcdef12', expected: true, reason: 'Valid: exactly 8 chars + 2 numbers' },
  { password: 'Test123', expected: false, reason: 'Invalid: only 7 chars' },
  { password: 'TestPassword', expected: false, reason: 'Invalid: 12 chars but no number' },
  { password: '12345678', expected: true, reason: 'Valid: 8 numbers' },
  { password: 'a1234567', expected: true, reason: 'Valid: 8 chars with numbers' },
  { password: 'Pass1', expected: false, reason: 'Invalid: only 5 chars' },
  { password: '', expected: false, reason: 'Invalid: empty string' },
  { password: null, expected: false, reason: 'Invalid: null' },
  { password: 'LongPasswordWithoutNumber', expected: false, reason: 'Invalid: no number' }
];

let passed = 0;
let failed = 0;

testCases.forEach((test, index) => {
  const result = validation.isValidPassword(test.password);
  const status = result === test.expected ? '✅ PASS' : '❌ FAIL';

  if (result === test.expected) {
    passed++;
  } else {
    failed++;
  }

  console.log(`Test ${index + 1}: ${status}`);
  console.log(`  Password: "${test.password}"`);
  console.log(`  Expected: ${test.expected}, Got: ${result}`);
  console.log(`  Reason: ${test.reason}\n`);
});

console.log('='.repeat(50));
console.log(`Results: ${passed} passed, ${failed} failed`);

if (failed === 0) {
  console.log('✅ All password validation tests passed!');
  process.exit(0);
} else {
  console.log('❌ Some tests failed!');
  process.exit(1);
}
