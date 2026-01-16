#!/usr/bin/env node

require('dotenv').config();
const { sendNegativeFeedbackAlert } = require('../services/emailService');

console.log('\n=== Resend Email Integration Test ===\n');

// Verify environment variables
console.log('Environment Check:');
console.log('  RESEND_API_KEY:', process.env.RESEND_API_KEY ? '✓ Set' : '✗ Missing');
console.log('  RESEND_FROM_EMAIL:', process.env.RESEND_FROM_EMAIL || '✗ Missing');
console.log('  TEST_EMAIL:', process.env.TEST_EMAIL || '✗ Missing');
console.log('');

if (!process.env.TEST_EMAIL) {
  console.error('✗ ERROR: TEST_EMAIL environment variable not set');
  console.error('  Add TEST_EMAIL=your@email.com to your .env file');
  process.exit(1);
}

// Test data
const testData = {
  tenantEmail: process.env.TEST_EMAIL,
  customerName: 'Test Customer',
  rating: 2,
  comment: 'This is a test negative feedback email from the MoreStars test script.',
  phone: '+15551234567'
};

console.log('Test Parameters:');
console.log('  To:', testData.tenantEmail);
console.log('  Customer:', testData.customerName);
console.log('  Rating:', testData.rating, '★');
console.log('  Phone:', testData.phone);
console.log('');

// Send test email
console.log('Sending test email...\n');

sendNegativeFeedbackAlert(
  testData.tenantEmail,
  testData.customerName,
  testData.rating,
  testData.comment,
  testData.phone
)
  .then(result => {
    console.log('✓ SUCCESS!\n');
    console.log('Result Object:');
    console.log(JSON.stringify(result, null, 2));
    console.log('');
    console.log('Email ID:', result.emailId);
    console.log('');
    console.log('Check your inbox at:', testData.tenantEmail);
    process.exit(0);
  })
  .catch(error => {
    console.error('✗ FAILED!\n');
    console.error('Full Error Object:');
    console.error(JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    console.error('');
    console.error('Error Message:', error.message);
    console.error('Error Name:', error.name);
    if (error.statusCode) {
      console.error('Status Code:', error.statusCode);
    }
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response, null, 2));
    }
    process.exit(1);
  });
