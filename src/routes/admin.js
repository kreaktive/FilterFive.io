const express = require('express');
const router = express.Router();
const { requireSuperAdmin } = require('../middleware/superAuth');
const {
  showAdminDashboard,
  showCreateTenant,
  createTenant,
  generateQrCode
} = require('../controllers/adminController');
const emailTemplates = require('../services/emailTemplates');

// All routes require super admin authentication
router.use(requireSuperAdmin);

// GET /admin - Tenant list
router.get('/', showAdminDashboard);

// GET /admin/create - Create tenant form
router.get('/create', showCreateTenant);

// POST /admin/create - Create tenant
router.post('/create', createTenant);

// GET /admin/qr/:userId - Generate QR code for business
router.get('/qr/:userId', generateQrCode);

// GET /admin/email-preview - List all email templates
router.get('/email-preview', (req, res) => {
  const templates = [
    { name: 'verification', label: 'Email Verification' },
    { name: 'verificationReminder', label: 'Verification Reminder (24h)' },
    { name: 'welcome', label: 'Welcome (Post-Verification)' },
    { name: 'passwordReset', label: 'Password Reset' },
    { name: 'trialWarning7Days', label: 'Trial Warning (7 Days)' },
    { name: 'trialWarning1Day', label: 'Trial Warning (1 Day)' },
    { name: 'trialEnding', label: 'Trial Ending (3 Days)' },
    { name: 'trialExpired', label: 'Trial Expired' },
    { name: 'abandonedCheckout30Min', label: 'Abandoned Checkout (30 Min)' },
    { name: 'abandonedCheckout', label: 'Abandoned Checkout' },
    { name: 'paymentFailed', label: 'Payment Failed' },
    { name: 'supportRequest', label: 'Support Request (Internal)' },
    { name: 'adminAlert', label: 'Admin Alert (Internal)' },
    { name: 'contactForm', label: 'Contact Form (Internal)' },
    { name: 'businessEvent', label: 'Business Event Alert (Internal)' }
  ];

  const baseUrl = process.env.APP_URL || 'https://morestars.io';

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Email Template Preview</title>
      <style>
        body { font-family: system-ui, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
        h1 { color: #500B42; }
        .template-list { list-style: none; padding: 0; }
        .template-list li { margin: 12px 0; }
        .template-list a {
          display: inline-block;
          padding: 12px 20px;
          background: #A1438E;
          color: white;
          text-decoration: none;
          border-radius: 8px;
          transition: background 0.2s;
        }
        .template-list a:hover { background: #500B42; }
        .back-link { margin-top: 30px; }
        .back-link a { color: #A1438E; }
      </style>
    </head>
    <body>
      <h1>Email Template Preview</h1>
      <p>Click on any template to preview it:</p>
      <ul class="template-list">
        ${templates.map(t => `<li><a href="${baseUrl}/admin/email-preview/${t.name}">${t.label}</a></li>`).join('')}
      </ul>
      <div class="back-link">
        <a href="/admin">&larr; Back to Admin Dashboard</a>
      </div>
    </body>
    </html>
  `);
});

// GET /admin/email-preview/:template - Preview specific email template
router.get('/email-preview/:template', (req, res) => {
  const { template } = req.params;
  const baseUrl = process.env.APP_URL || 'https://morestars.io';
  const dashboardUrl = `${baseUrl}/dashboard`;
  const sampleDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric'
  });

  let html;

  try {
    switch (template) {
      case 'verification':
        html = emailTemplates.verificationEmail('Acme Coffee Shop', `${baseUrl}/verify/sample-token-123`);
        break;
      case 'verificationReminder':
        html = emailTemplates.verificationReminderEmail('Acme Coffee Shop', `${baseUrl}/verify/sample-token-123`);
        break;
      case 'welcome':
        html = emailTemplates.welcomeEmail('Acme Coffee Shop', dashboardUrl);
        break;
      case 'passwordReset':
        html = emailTemplates.passwordResetEmail('Acme Coffee Shop', `${baseUrl}/reset-password/sample-token-123`);
        break;
      case 'trialWarning7Days':
        html = emailTemplates.trialWarning7DaysEmail('Acme Coffee Shop', dashboardUrl, sampleDate);
        break;
      case 'trialWarning1Day':
        html = emailTemplates.trialWarning1DayEmail('Acme Coffee Shop', dashboardUrl, sampleDate);
        break;
      case 'trialEnding':
        html = emailTemplates.trialEndingEmail('Acme Coffee Shop', dashboardUrl, sampleDate);
        break;
      case 'trialExpired':
        html = emailTemplates.trialExpiredEmail('Acme Coffee Shop', dashboardUrl);
        break;
      case 'abandonedCheckout30Min':
        html = emailTemplates.abandonedCheckout30MinEmail('Acme Coffee Shop', `${dashboardUrl}/subscription`);
        break;
      case 'abandonedCheckout':
        html = emailTemplates.abandonedCheckoutEmail('Acme Coffee Shop', dashboardUrl);
        break;
      case 'paymentFailed':
        html = emailTemplates.paymentFailedEmail('Acme Coffee Shop', dashboardUrl, new Date(Date.now() + 3 * 24 * 60 * 60 * 1000));
        break;
      case 'supportRequest':
        html = emailTemplates.supportRequestEmail(
          'customer@example.com',
          'Acme Coffee Shop',
          '12345',
          'billing',
          'Hi, I have a question about my subscription. Can you help me understand how the billing cycle works?'
        );
        break;
      case 'adminAlert':
        html = emailTemplates.adminAlertEmail(
          'Database Connection Failed',
          'ECONNREFUSED: Connection refused to PostgreSQL',
          'Error: ECONNREFUSED\n    at TCPConnectWrap.afterConnect\n    at reconnect (db.js:45)',
          { host: 'localhost', port: 5432, database: 'morestars' }
        );
        break;
      case 'contactForm':
        html = emailTemplates.contactFormNotification({
          name: 'John Smith',
          email: 'john@example.com',
          phone: '+1 (555) 123-4567',
          businessName: 'Smith Auto Repair',
          topic: 'sales',
          message: 'Hi, I run an auto repair shop and I\'m interested in learning more about how MoreStars can help us get more Google reviews. We currently have about 50 reviews and want to grow. What would be the best plan for us?',
          submittedAt: new Date()
        });
        break;
      case 'businessEvent':
        html = emailTemplates.businessEventAlert('new_signup', {
          businessName: 'Acme Coffee Shop',
          email: 'owner@acmecoffee.com',
          plan: 'Trial (14 days)',
          source: 'Organic Search'
        });
        break;
      default:
        return res.status(404).send('Template not found');
    }

    res.send(html);
  } catch (error) {
    res.status(500).send(`Error rendering template: ${error.message}`);
  }
});

module.exports = router;
