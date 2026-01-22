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
const smsLimitEventService = require('../services/smsLimitEventService');

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

// GET /admin/sms-limits - View SMS limit events and users near limits
router.get('/sms-limits', async (req, res) => {
  try {
    const [stats, usersNearLimit, recentEvents] = await Promise.all([
      smsLimitEventService.getLimitStats({ days: 30 }),
      smsLimitEventService.getUsersNearLimit({ thresholdPercent: 50 }),
      smsLimitEventService.getRecentLimitEvents({ days: 7, limit: 50 })
    ]);

    const baseUrl = process.env.APP_URL || 'https://morestars.io';

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>SMS Limit Monitoring - Admin</title>
        <style>
          * { box-sizing: border-box; }
          body {
            font-family: system-ui, -apple-system, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
          }
          h1 { color: #500B42; margin-bottom: 8px; }
          h2 { color: #333; margin-top: 32px; border-bottom: 2px solid #A1438E; padding-bottom: 8px; }
          .subtitle { color: #666; margin-bottom: 24px; }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
            margin-bottom: 32px;
          }
          .stat-card {
            background: white;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .stat-value {
            font-size: 36px;
            font-weight: bold;
            color: #500B42;
          }
          .stat-label { color: #666; font-size: 14px; }
          table {
            width: 100%;
            border-collapse: collapse;
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          th, td {
            padding: 12px 16px;
            text-align: left;
            border-bottom: 1px solid #eee;
          }
          th { background: #500B42; color: white; font-weight: 500; }
          tr:hover { background: #f9f9f9; }
          .badge {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 500;
          }
          .badge-danger { background: #fee2e2; color: #dc2626; }
          .badge-warning { background: #fef3c7; color: #d97706; }
          .badge-success { background: #d1fae5; color: #059669; }
          .progress-bar {
            height: 8px;
            background: #eee;
            border-radius: 4px;
            overflow: hidden;
          }
          .progress-fill {
            height: 100%;
            border-radius: 4px;
            transition: width 0.3s;
          }
          .progress-critical { background: #dc2626; }
          .progress-warning { background: #d97706; }
          .progress-normal { background: #059669; }
          .back-link { margin-top: 30px; }
          .back-link a { color: #A1438E; text-decoration: none; }
          .back-link a:hover { text-decoration: underline; }
          .empty-state { color: #666; font-style: italic; padding: 20px; text-align: center; }
          .refresh-note { font-size: 12px; color: #999; margin-top: 8px; }
        </style>
      </head>
      <body>
        <h1>SMS Limit Monitoring</h1>
        <p class="subtitle">Track clients approaching or hitting their SMS limits</p>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">${stats.limitReachedEvents}</div>
            <div class="stat-label">Limit Reached Events (30 days)</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${stats.uniqueUsersHitLimit}</div>
            <div class="stat-label">Unique Users Hit Limit</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${stats.limitWarningEvents}</div>
            <div class="stat-label">Warning Events (80%+)</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${usersNearLimit.filter(u => u.atLimit).length}</div>
            <div class="stat-label">Currently At Limit</div>
          </div>
        </div>

        <h2>Users Near/At Limit</h2>
        ${usersNearLimit.length > 0 ? `
        <table>
          <thead>
            <tr>
              <th>Business</th>
              <th>Email</th>
              <th>Usage</th>
              <th>Progress</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${usersNearLimit.map(u => {
              const pct = parseFloat(u.percentUsed);
              const progressClass = pct >= 100 ? 'progress-critical' : pct >= 80 ? 'progress-warning' : 'progress-normal';
              const badgeClass = pct >= 100 ? 'badge-danger' : pct >= 80 ? 'badge-warning' : 'badge-success';
              const statusText = pct >= 100 ? 'AT LIMIT' : pct >= 80 ? 'Warning' : 'OK';
              return `
                <tr>
                  <td><strong>${u.businessName || 'N/A'}</strong></td>
                  <td>${u.email}</td>
                  <td>${u.smsUsageCount} / ${u.smsUsageLimit} (${u.remaining} left)</td>
                  <td>
                    <div class="progress-bar">
                      <div class="progress-fill ${progressClass}" style="width: ${Math.min(pct, 100)}%"></div>
                    </div>
                  </td>
                  <td><span class="badge ${badgeClass}">${statusText}</span></td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        ` : '<div class="empty-state">No users near their limit</div>'}

        <h2>Recent Limit Events (7 days)</h2>
        ${recentEvents.length > 0 ? `
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Business</th>
              <th>Event</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            ${recentEvents.map(e => {
              const eventClass = e.eventType === 'limit_reached' ? 'badge-danger' : 'badge-warning';
              const eventLabel = e.eventType === 'limit_reached' ? 'BLOCKED' : 'WARNING';
              const time = new Date(e.eventTimestamp).toLocaleString('en-US', {
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
              });
              return `
                <tr>
                  <td>${time}</td>
                  <td>${e.user?.businessName || 'Unknown'}<br><small style="color:#666">${e.user?.email || ''}</small></td>
                  <td><span class="badge ${eventClass}">${eventLabel}</span></td>
                  <td><small>${e.errorMessage || '-'}</small></td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        ` : '<div class="empty-state">No limit events in the last 7 days</div>'}

        <p class="refresh-note">Data refreshes on page load. Alerts are sent automatically when limits are reached.</p>

        <div class="back-link">
          <a href="/admin">&larr; Back to Admin Dashboard</a>
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    res.status(500).send(`Error loading SMS limit data: ${error.message}`);
  }
});

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
