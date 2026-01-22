/**
 * Email Templates Service
 * Centralized HTML email templates for all system emails
 */

// Logo URL - uses APP_URL for absolute path (required for email clients)
// White version for dark email headers
const getLogoUrl = () => {
  const baseUrl = process.env.APP_URL || 'https://morestars.io';
  return `${baseUrl}/images/Logo-MoreStars-white.png`;
};

// Logo HTML for email headers - DISABLED due to spam filter issues
// External images trigger aggressive spam filters on some hosts (Hostinger, etc.)
const logoHtml = () => ``;

const baseStyles = `
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.6;
    color: #333;
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
    background-color: #F9F7FA;
  }
  .email-container {
    background: #ffffff;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
  .header {
    /* Uses brand accent and dark colors: A1438E = brand-accent, 500B42 = brand-dark */
    background: linear-gradient(135deg, #A1438E 0%, #500B42 100%);
    color: white;
    padding: 40px 30px;
    text-align: center;
  }
  .header-logo {
    margin-bottom: 16px;
  }
  .header-logo img {
    height: 32px;
    width: auto;
  }
  .header h1 {
    margin: 0;
    font-size: 28px;
    font-weight: 600;
  }
  .content {
    padding: 40px 30px;
  }
  .content p {
    margin: 16px 0;
    font-size: 16px;
    line-height: 1.6;
  }
  .cta-button {
    display: inline-block;
    background: #A1438E; /* Brand accent - fallback for email clients */
    color: white !important;
    padding: 16px 32px;
    text-decoration: none;
    border-radius: 8px;
    font-weight: 600;
    font-size: 16px;
    margin: 24px 0;
    text-align: center;
  }
  .cta-button:hover {
    background: #8B3A7D; /* Brand accent hover - fallback for email clients */
  }
  .info-box {
    background: #f0f9ff;
    border-left: 4px solid #A1438E; /* Brand accent - fallback for email clients */
    padding: 16px;
    margin: 24px 0;
    border-radius: 4px;
  }
  .footer {
    background: #f9fafb;
    padding: 30px;
    text-align: center;
    color: #6b7280;
    font-size: 14px;
  }
  .footer a {
    color: #A1438E; /* Brand accent - fallback for email clients */
    text-decoration: none;
  }
  .divider {
    height: 1px;
    background: #e5e7eb;
    margin: 24px 0;
  }
`;

// Note: Email header gradient uses brand colors (A1438E = brand-accent, 500B42 = brand-dark)
// Kept as hex values for email client compatibility
const emailWrapper = (content, headerGradient = 'linear-gradient(135deg, #A1438E 0%, #500B42 100%)') => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    ${baseStyles}
  </style>
</head>
<body>
  <div class="email-container">
    ${content}
  </div>
</body>
</html>
`;

/**
 * Email Verification Template
 */
const verificationEmail = (businessName, verificationUrl) => {
  const content = `
    <div class="header">
      ${logoHtml()}
      <h1>Welcome to MoreStars!</h1>
    </div>
    <div class="content">
      <p>Hi <strong>${businessName}</strong>,</p>

      <p>Thank you for signing up for MoreStars! We're excited to help you get more reviews and grow your business.</p>

      <p>To get started, please verify your email address by clicking the button below:</p>

      <div style="text-align: center;">
        <a href="${verificationUrl}" class="cta-button">
          ✅ Verify My Email
        </a>
      </div>

      <p style="color: #6b7280; font-size: 14px;">
        This verification link will expire in 24 hours. If you didn't create an account with MoreStars, you can safely ignore this email.
      </p>

      <div class="divider"></div>

      <p style="font-size: 14px; color: #6b7280;">
        Or copy and paste this link into your browser:<br>
        <a href="${verificationUrl}" style="color: #A1438E; word-break: break-all;">${verificationUrl}</a>
      </p>
    </div>
    <div class="footer">
      <p><strong>MoreStars</strong> - More Stars. More Business.</p>
      <p>Have questions? Reply to this email or visit our <a href="${process.env.APP_URL}/support">help center</a>.</p>
    </div>
  `;

  return emailWrapper(content);
};

/**
 * Welcome Email (Sent after verification)
 */
const welcomeEmail = (businessName, dashboardUrl) => {
  const content = `
    <div class="header">
      ${logoHtml()}
      <h1>You're All Set!</h1>
    </div>
    <div class="content">
      <p>Hi <strong>${businessName}</strong>,</p>

      <p>Your MoreStars account is now active! Your 14-day free trial has officially started.</p>

      <div class="info-box">
        <strong>🎯 Quick Start Guide:</strong>
        <ol style="margin: 12px 0; padding-left: 20px;">
          <li>Add your Google Review & Facebook links in Settings</li>
          <li>Upload your customer list via CSV</li>
          <li>Send your first feedback request</li>
          <li>Watch positive reviews flow to your public pages!</li>
        </ol>
      </div>

      <div style="text-align: center;">
        <a href="${dashboardUrl}" class="cta-button">
          📊 Go to Dashboard
        </a>
      </div>

      <p>Your trial ends on <strong>${new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong>. We'll send you a reminder a few days before.</p>

      <div class="divider"></div>

      <p style="font-size: 14px; color: #6b7280;">
        💡 <strong>Pro tip:</strong> The best time to request feedback is within 24-48 hours after a service. This is when the experience is freshest in your customer's mind!
      </p>
    </div>
    <div class="footer">
      <p><strong>MoreStars</strong> - More Stars. More Business.</p>
      <p>Need help getting started? Reply to this email anytime!</p>
    </div>
  `;

  return emailWrapper(content);
};

/**
 * Password Reset Email
 */
const passwordResetEmail = (businessName, resetUrl) => {
  const content = `
    <div class="header" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);">
      ${logoHtml()}
      <h1>Reset Your Password</h1>
    </div>
    <div class="content">
      <p>Hi <strong>${businessName}</strong>,</p>

      <p>We received a request to reset the password for your MoreStars account.</p>

      <p>Click the button below to create a new password:</p>

      <div style="text-align: center;">
        <a href="${resetUrl}" class="cta-button" style="background: #f59e0b;">
          🔑 Reset Password
        </a>
      </div>

      <div class="info-box" style="background: #fffbeb; border-left-color: #f59e0b;">
        <strong>⚠️ Security Note:</strong> This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
      </div>

      <div class="divider"></div>

      <p style="font-size: 14px; color: #6b7280;">
        Or copy and paste this link into your browser:<br>
        <a href="${resetUrl}" style="color: #f59e0b; word-break: break-all;">${resetUrl}</a>
      </p>
    </div>
    <div class="footer">
      <p><strong>MoreStars</strong> - More Stars. More Business.</p>
      <p>If you didn't request this, please contact support immediately.</p>
    </div>
  `;

  return emailWrapper(content);
};

/**
 * Trial Ending Email (Sent 3 days before trial ends)
 */
const trialEndingEmail = (businessName, dashboardUrl, trialEndsDate) => {
  const content = `
    <div class="header" style="background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);">
      ${logoHtml()}
      <h1>Your Trial Ends Soon</h1>
    </div>
    <div class="content">
      <p>Hi <strong>${businessName}</strong>,</p>

      <p>Your 14-day MoreStars trial ends in <strong>3 days</strong> on ${trialEndsDate}.</p>

      <p>We hope you've enjoyed using MoreStars to collect reviews and grow your business!</p>

      <div class="info-box" style="background: #faf5ff; border-left-color: #8b5cf6;">
        <strong>💼 Ready to continue?</strong> Choose the plan that works best for your business:
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${dashboardUrl}/subscribe?plan=6-month" class="cta-button" style="background: #8b5cf6; margin: 10px;">
          📅 6-Month Plan - Best Value
        </a>
        <a href="${dashboardUrl}/subscribe?plan=12-month" class="cta-button" style="background: #7c3aed; margin: 10px;">
          🎯 12-Month Plan - Maximum Savings
        </a>
      </div>

      <p style="text-align: center; color: #6b7280; font-size: 14px;">
        Questions about pricing? <a href="mailto:${process.env.RESEND_FROM_EMAIL}" style="color: #8b5cf6;">Contact us</a>
      </p>

      <div class="divider"></div>

      <p style="font-size: 14px; color: #6b7280;">
        If you choose not to subscribe, your account will remain accessible but features will be limited. You can reactivate anytime.
      </p>
    </div>
    <div class="footer">
      <p><strong>MoreStars</strong> - More Stars. More Business.</p>
      <p>Thank you for trying MoreStars!</p>
    </div>
  `;

  return emailWrapper(content);
};

/**
 * Trial Ended Email (Sent when trial expires)
 */
const trialExpiredEmail = (businessName, dashboardUrl) => {
  const content = `
    <div class="header" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);">
      ${logoHtml()}
      <h1>Your Trial Has Ended</h1>
    </div>
    <div class="content">
      <p>Hi <strong>${businessName}</strong>,</p>

      <p>Thank you for trying MoreStars! Your 14-day trial has ended.</p>

      <p>We'd love to have you continue using MoreStars to get more reviews and grow your business.</p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${dashboardUrl}/subscribe?plan=6-month" class="cta-button" style="background: #ef4444; margin: 10px;">
          📅 Subscribe to 6-Month Plan
        </a>
        <a href="${dashboardUrl}/subscribe?plan=12-month" class="cta-button" style="background: #dc2626; margin: 10px;">
          🎯 Subscribe to 12-Month Plan
        </a>
      </div>

      <div class="info-box" style="background: #fef2f2; border-left-color: #ef4444;">
        <strong>📊 Your Stats:</strong> Log in to see how MoreStars helped you during your trial period.
      </div>

      <p style="text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px;">
        Have questions or need a custom plan? <a href="mailto:${process.env.RESEND_FROM_EMAIL}" style="color: #ef4444;">Let's talk</a>
      </p>
    </div>
    <div class="footer">
      <p><strong>MoreStars</strong> - More Stars. More Business.</p>
      <p>You can reactivate your account anytime.</p>
    </div>
  `;

  return emailWrapper(content);
};

/**
 * Admin Alert Email (For system errors and cron failures)
 */
const adminAlertEmail = (subject, errorMessage, errorStack, context = {}) => {
  const contextHtml = Object.keys(context).length > 0
    ? `<pre style="background: #1f2937; color: #e5e7eb; padding: 16px; border-radius: 4px; overflow-x: auto; font-size: 12px;">${JSON.stringify(context, null, 2)}</pre>`
    : '';

  const content = `
    <div class="header" style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);">
      ${logoHtml()}
      <h1>System Alert</h1>
    </div>
    <div class="content">
      <p><strong>Subject:</strong> ${subject}</p>

      <p><strong>Time:</strong> ${new Date().toISOString()}</p>

      <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</p>

      <div class="info-box" style="background: #fef2f2; border-left-color: #dc2626;">
        <strong>Error Message:</strong>
        <p style="font-family: monospace; margin: 8px 0 0 0;">${errorMessage}</p>
      </div>

      ${errorStack ? `
      <p><strong>Stack Trace:</strong></p>
      <pre style="background: #1f2937; color: #e5e7eb; padding: 16px; border-radius: 4px; overflow-x: auto; font-size: 12px; white-space: pre-wrap;">${errorStack}</pre>
      ` : ''}

      ${contextHtml ? `
      <p><strong>Additional Context:</strong></p>
      ${contextHtml}
      ` : ''}
    </div>
    <div class="footer">
      <p><strong>MoreStars</strong> - System Alert</p>
      <p>This is an automated message from the MoreStars system.</p>
    </div>
  `;

  return emailWrapper(content);
};

/**
 * Support Request Email (For support form submissions)
 */
const supportRequestEmail = (fromEmail, businessName, userId, subject, message) => {
  const subjectLabels = {
    'feature_request': 'Feature Request',
    'bug_report': 'Bug Report',
    'billing': 'Billing Question',
    'integration': 'Integration Help',
    'general': 'General Question'
  };

  const content = `
    <div class="header" style="background: linear-gradient(135deg, #A1438E 0%, #8B3A7D 100%);">
      ${logoHtml()}
      <h1>Support Request</h1>
    </div>
    <div class="content">
      <div class="info-box">
        <strong>Request Details:</strong>
        <ul style="margin: 12px 0; padding-left: 20px; list-style: none;">
          <li><strong>From:</strong> ${fromEmail}</li>
          <li><strong>Business:</strong> ${businessName}</li>
          <li><strong>User ID:</strong> ${userId}</li>
          <li><strong>Topic:</strong> ${subjectLabels[subject] || subject}</li>
          <li><strong>Time:</strong> ${new Date().toLocaleString()}</li>
        </ul>
      </div>

      <div class="divider"></div>

      <p><strong>Message:</strong></p>
      <div style="background: #f7fafc; padding: 20px; border-radius: 8px; border-left: 4px solid #A1438E;">
        <p style="white-space: pre-wrap; margin: 0;">${message}</p>
      </div>

      <div class="divider"></div>

      <p style="font-size: 14px; color: #6b7280;">
        Reply directly to this email to respond to the customer.
      </p>
    </div>
    <div class="footer">
      <p><strong>MoreStars</strong> - Support Request</p>
    </div>
  `;

  return emailWrapper(content);
};

/**
 * Trial Warning Email - 7 Days Before Expiration
 */
const trialWarning7DaysEmail = (businessName, dashboardUrl, trialEndsDate) => {
  const content = `
    <div class="header" style="background: linear-gradient(135deg, #A1438E 0%, #500B42 100%);">
      ${logoHtml()}
      <h1>7 Days Left in Your Trial</h1>
    </div>
    <div class="content">
      <p>Hi <strong>${businessName}</strong>,</p>

      <p>Just a friendly reminder that your MoreStars trial ends in <strong>7 days</strong> on ${trialEndsDate}.</p>

      <p>You still have time to experience everything MoreStars has to offer! Here's what you can do this week:</p>

      <div class="info-box">
        <strong>📋 This Week's Action Items:</strong>
        <ul style="margin: 12px 0; padding-left: 20px;">
          <li>Send feedback requests to your recent customers</li>
          <li>Check your dashboard for any new reviews</li>
          <li>Set up your Google Review link if you haven't already</li>
        </ul>
      </div>

      <div style="text-align: center;">
        <a href="${dashboardUrl}" class="cta-button">
          📊 Go to Dashboard
        </a>
      </div>

      <div class="divider"></div>

      <p style="font-size: 14px; color: #6b7280;">
        Ready to keep going? You can upgrade anytime from your dashboard. Questions? Just reply to this email!
      </p>
    </div>
    <div class="footer">
      <p><strong>MoreStars</strong> - More Stars. More Business.</p>
      <p>We're here to help you succeed!</p>
    </div>
  `;

  return emailWrapper(content);
};

/**
 * Trial Warning Email - 1 Day Before Expiration (Urgent)
 */
const trialWarning1DayEmail = (businessName, dashboardUrl, trialEndsDate) => {
  const content = `
    <div class="header" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);">
      ${logoHtml()}
      <h1>Last Day of Your Trial!</h1>
    </div>
    <div class="content">
      <p>Hi <strong>${businessName}</strong>,</p>

      <p>Your MoreStars trial ends <strong>tomorrow</strong> on ${trialEndsDate}.</p>

      <p>Don't lose access to your review-boosting tools! Subscribe now to keep collecting 5-star reviews and growing your business.</p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${dashboardUrl}/subscription" class="cta-button" style="background: #f59e0b;">
          🚀 Subscribe Now
        </a>
      </div>

      <div class="info-box" style="background: #fffbeb; border-left-color: #f59e0b;">
        <strong>💡 What happens after your trial?</strong>
        <p style="margin: 8px 0 0 0;">If you don't subscribe, you'll still be able to log in and view your data, but you won't be able to send new feedback requests.</p>
      </div>

      <div class="divider"></div>

      <p style="font-size: 14px; color: #6b7280;">
        Not ready to commit? We get it. Your account will be waiting for you whenever you're ready to come back.
      </p>
    </div>
    <div class="footer">
      <p><strong>MoreStars</strong> - More Stars. More Business.</p>
      <p>Questions? Reply to this email anytime!</p>
    </div>
  `;

  return emailWrapper(content);
};

/**
 * Abandoned Checkout Recovery Email
 */
const abandonedCheckoutEmail = (businessName, dashboardUrl) => {
  const content = `
    <div class="header" style="background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);">
      ${logoHtml()}
      <h1>Forgot Something?</h1>
    </div>
    <div class="content">
      <p>Hi <strong>${businessName}</strong>,</p>

      <p>Looks like you started to subscribe to MoreStars but didn't finish. No worries - it happens!</p>

      <p>Your checkout is still waiting for you. Pick up right where you left off:</p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${dashboardUrl}/subscription" class="cta-button" style="background: #8b5cf6;">
          ✅ Complete My Subscription
        </a>
      </div>

      <div class="info-box" style="background: #faf5ff; border-left-color: #8b5cf6;">
        <strong>🎁 What you'll get:</strong>
        <ul style="margin: 12px 0; padding-left: 20px;">
          <li>1,000 SMS feedback requests per month</li>
          <li>Unlimited QR code scans</li>
          <li>Real-time negative feedback alerts</li>
          <li>Analytics dashboard to track your reviews</li>
        </ul>
      </div>

      <div class="divider"></div>

      <p style="font-size: 14px; color: #6b7280;">
        Having second thoughts? We'd love to hear your concerns. Just reply to this email and we'll help you out.
      </p>
    </div>
    <div class="footer">
      <p><strong>MoreStars</strong> - More Stars. More Business.</p>
      <p>We're here if you have any questions!</p>
    </div>
  `;

  return emailWrapper(content);
};

/**
 * Verification Reminder Email (24h after signup)
 */
const verificationReminderEmail = (businessName, verificationUrl) => {
  const content = `
    <div class="header" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);">
      ${logoHtml()}
      <h1>Don't Forget to Verify!</h1>
    </div>
    <div class="content">
      <p>Hi <strong>${businessName}</strong>,</p>

      <p>We noticed you signed up for MoreStars yesterday but haven't verified your email yet.</p>

      <p>Just one click and you'll be ready to start getting more 5-star reviews for your business!</p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationUrl}" class="cta-button" style="background: #f59e0b;">
          ✅ Verify My Email
        </a>
      </div>

      <div class="info-box" style="background: #fffbeb; border-left-color: #f59e0b;">
        <strong>💡 Check your spam folder</strong>
        <p style="margin: 8px 0 0 0;">If you can't find our emails, check your spam or junk folder. To ensure delivery, add noreply@morestars.io to your contacts.</p>
      </div>

      <div class="divider"></div>

      <p style="font-size: 14px; color: #6b7280;">
        This link expires in 24 hours. If it expires, you can request a new one from the login page.
      </p>
    </div>
    <div class="footer">
      <p><strong>MoreStars</strong> - More Stars. More Business.</p>
      <p>Questions? Reply to this email anytime!</p>
    </div>
  `;

  return emailWrapper(content);
};

/**
 * 30-Minute Abandoned Checkout Email (first touchpoint)
 */
const abandonedCheckout30MinEmail = (businessName, checkoutUrl) => {
  const content = `
    <div class="header" style="background: linear-gradient(135deg, #A1438E 0%, #8B3A7D 100%);">
      ${logoHtml()}
      <h1>Still Thinking It Over?</h1>
    </div>
    <div class="content">
      <p>Hi <strong>${businessName}</strong>,</p>

      <p>We noticed you were checking out our subscription plans. No pressure - just wanted to make sure everything went smoothly!</p>

      <p>If you ran into any issues or have questions, we're here to help.</p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${checkoutUrl}" class="cta-button" style="background: #A1438E;">
          🔄 Continue to Checkout
        </a>
      </div>

      <div class="info-box" style="background: #f0f4ff; border-left-color: #A1438E;">
        <strong>✨ Quick reminder of what you'll get:</strong>
        <ul style="margin: 12px 0; padding-left: 20px;">
          <li>1,000 SMS review requests per month</li>
          <li>Unlimited QR code scans</li>
          <li>Real-time analytics dashboard</li>
          <li>Priority support</li>
        </ul>
      </div>

      <div class="divider"></div>

      <p style="font-size: 14px; color: #6b7280;">
        Not quite ready? That's okay! Your trial will continue and your checkout link will be waiting whenever you're ready.
      </p>
    </div>
    <div class="footer">
      <p><strong>MoreStars</strong> - More Stars. More Business.</p>
      <p>Reply to this email if you have any questions!</p>
    </div>
  `;

  return emailWrapper(content);
};

/**
 * Payment Failed Email
 */
const paymentFailedEmail = (businessName, dashboardUrl, nextRetryDate = null) => {
  const retryInfo = nextRetryDate
    ? `<p>We'll automatically try again on <strong>${new Date(nextRetryDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</strong>.</p>`
    : '';

  const content = `
    <div class="header" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);">
      ${logoHtml()}
      <h1>Payment Failed</h1>
    </div>
    <div class="content">
      <p>Hi <strong>${businessName}</strong>,</p>

      <p>We weren't able to process your payment for your MoreStars subscription. This can happen for a few reasons:</p>

      <ul style="margin: 16px 0; padding-left: 20px; color: #4b5563;">
        <li>Your card may have expired</li>
        <li>Insufficient funds</li>
        <li>Your bank declined the transaction</li>
      </ul>

      ${retryInfo}

      <div style="text-align: center; margin: 30px 0;">
        <a href="${dashboardUrl}/subscription" class="cta-button" style="background: #ef4444;">
          💳 Update Payment Method
        </a>
      </div>

      <div class="info-box" style="background: #fef2f2; border-left-color: #ef4444;">
        <strong>⏰ Important:</strong>
        <p style="margin: 8px 0 0 0;">Your SMS sending is paused until payment is resolved. Update your payment method to continue sending feedback requests.</p>
      </div>

      <div class="divider"></div>

      <p style="font-size: 14px; color: #6b7280;">
        Need help? Reply to this email and we'll assist you right away.
      </p>
    </div>
    <div class="footer">
      <p><strong>MoreStars</strong> - More Stars. More Business.</p>
      <p>We want to keep helping you get more reviews!</p>
    </div>
  `;

  return emailWrapper(content);
};

/**
 * Business Event Alert Email (for admin notifications)
 * Notifies when important business events happen (signups, subscriptions, etc.)
 */
const businessEventAlert = (eventType, eventData) => {
  const eventConfig = {
    'new_signup': {
      title: 'New Account Signup',
      emoji: '🎉',
      color: '#10B981', // green
      description: 'A new user has signed up for MoreStars'
    },
    'email_verified': {
      title: 'Email Verified',
      emoji: '✅',
      color: '#3B82F6', // blue
      description: 'A user has verified their email address'
    },
    'subscription_created': {
      title: 'New Subscription',
      emoji: '💰',
      color: '#8B5CF6', // purple
      description: 'A user has subscribed to a paid plan'
    },
    'subscription_cancelled': {
      title: 'Subscription Cancelled',
      emoji: '⚠️',
      color: '#F59E0B', // amber
      description: 'A user has cancelled their subscription'
    },
    'trial_converted': {
      title: 'Trial Converted',
      emoji: '🚀',
      color: '#10B981', // green
      description: 'A trial user has converted to a paid subscription'
    }
  };

  const config = eventConfig[eventType] || {
    title: 'Business Event',
    emoji: '📊',
    color: '#A1438E',
    description: 'A business event has occurred'
  };

  const detailsHtml = Object.entries(eventData)
    .filter(([key]) => !['_internal'].includes(key))
    .map(([key, value]) => `<li><strong>${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</strong> ${value}</li>`)
    .join('');

  const content = `
    <div class="header" style="background: linear-gradient(135deg, ${config.color} 0%, ${adjustColor(config.color, -20)} 100%);">
      ${logoHtml()}
      <h1>${config.emoji} ${config.title}</h1>
    </div>
    <div class="content">
      <p>${config.description}</p>

      <div class="info-box" style="background: #f0f9ff; border-left-color: ${config.color};">
        <strong>📋 Event Details:</strong>
        <ul style="margin: 12px 0; padding-left: 20px;">
          ${detailsHtml}
          <li><strong>Time:</strong> ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York', dateStyle: 'medium', timeStyle: 'short' })} ET</li>
        </ul>
      </div>

      <div class="divider"></div>

      <p style="font-size: 14px; color: #6b7280;">
        <a href="${process.env.APP_URL}/admin" style="color: ${config.color};">View in Admin Dashboard →</a>
      </p>
    </div>
    <div class="footer">
      <p><strong>MoreStars</strong> - Business Alert</p>
      <p>This is an automated notification from MoreStars.</p>
    </div>
  `;

  return emailWrapper(content);
};

/**
 * Helper: Darken/lighten a hex color
 */
function adjustColor(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
}

/**
 * Subscription Confirmation Email (sent to customer after successful purchase)
 */
const subscriptionConfirmationEmail = (businessName, plan, dashboardUrl) => {
  const planDisplay = plan === 'annual' ? 'Annual ($770/year)' : 'Monthly ($77/month)';
  const billingCycle = plan === 'annual' ? 'yearly' : 'monthly';

  const content = `
    <div class="header" style="background: linear-gradient(135deg, #10B981 0%, #059669 100%);">
      ${logoHtml()}
      <h1>You're All Set!</h1>
    </div>
    <div class="content">
      <p>Hi <strong>${businessName}</strong>,</p>

      <p>Thank you for subscribing to MoreStars! Your subscription is now <strong>active</strong> and you're ready to start collecting more 5-star reviews.</p>

      <div class="info-box" style="background: #ecfdf5; border-left-color: #10B981;">
        <strong>📋 Subscription Details:</strong>
        <ul style="margin: 12px 0; padding-left: 20px;">
          <li><strong>Plan:</strong> ${planDisplay}</li>
          <li><strong>SMS Limit:</strong> 1,000 messages per month</li>
          <li><strong>Billing:</strong> Charged ${billingCycle}</li>
          <li><strong>Status:</strong> Active</li>
        </ul>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${dashboardUrl}" class="cta-button" style="background: #10B981;">
          📊 Go to Dashboard
        </a>
      </div>

      <div class="divider"></div>

      <p style="font-size: 14px; color: #6b7280;">
        <strong>What's next?</strong>
        <ul style="margin: 12px 0; padding-left: 20px; color: #6b7280;">
          <li>Upload your customer list via CSV to start sending feedback requests</li>
          <li>Make sure your Google Review link is set up in Settings</li>
          <li>Download your QR code for in-store feedback collection</li>
        </ul>
      </p>

      <p style="font-size: 14px; color: #6b7280;">
        Need to manage your subscription or update payment details? Visit your <a href="${dashboardUrl}/subscription" style="color: #10B981;">subscription settings</a> or access the <a href="${dashboardUrl}/subscription/portal" style="color: #10B981;">billing portal</a>.
      </p>
    </div>
    <div class="footer">
      <p><strong>MoreStars</strong> - More Stars. More Business.</p>
      <p>Questions? Reply to this email anytime!</p>
    </div>
  `;

  return emailWrapper(content);
};

/**
 * Contact Form Notification Email (for support team)
 */
const contactFormNotification = (formData) => {
  const topicLabels = {
    sales: 'Sales Inquiry',
    support: 'Support Request',
    billing: 'Billing Question',
    partnership: 'Partnership Opportunity',
    general: 'General Inquiry'
  };

  const formattedDate = new Date(formData.submittedAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });

  const content = `
    <div class="header" style="background: linear-gradient(135deg, #FFBA49 0%, #FFD700 100%);">
      ${logoHtml()}
      <h1>${topicLabels[formData.topic] || 'New Contact Submission'}</h1>
    </div>
    <div class="content">
      <p><strong>New contact form submission from your website</strong></p>

      <div class="info-box" style="background: #FFFBEB; border-left-color: #FFBA49;">
        <strong>📋 Contact Information:</strong>
        <ul style="margin: 12px 0; padding-left: 20px;">
          <li><strong>Name:</strong> ${formData.name}</li>
          <li><strong>Email:</strong> <a href="mailto:${formData.email}">${formData.email}</a></li>
          <li><strong>Phone:</strong> <a href="tel:${formData.phone}">${formData.phone}</a></li>
          <li><strong>Business:</strong> ${formData.businessName}</li>
          <li><strong>Topic:</strong> ${topicLabels[formData.topic]}</li>
          <li><strong>Submitted:</strong> ${formattedDate}</li>
        </ul>
      </div>

      <div style="background: #F5F5F5; padding: 16px; border-radius: 4px; margin: 20px 0;">
        <strong>📝 Message:</strong>
        <p style="white-space: pre-wrap; margin: 12px 0 0 0; color: #374151;">${formData.message}</p>
      </div>

      <div class="divider"></div>

      <p style="font-size: 14px; color: #6b7280;">
        <strong>Next steps:</strong> Reply directly to this email to respond to the customer. Their email address is set as the reply-to address above.
      </p>

      <div class="info-box" style="background: #F9F7FA; border-left-color: #A1438E;">
        <strong>💡 Pro Tip:</strong>
        <p style="margin: 8px 0 0 0;">You can reply to this email, and the customer will receive your response directly. Make sure to be helpful and professional!</p>
      </div>
    </div>
    <div class="footer">
      <p><strong>MoreStars</strong> - Contact Submission</p>
      <p>Manage your contact submissions in the admin dashboard</p>
    </div>
  `;

  return emailWrapper(content);
};

module.exports = {
  verificationEmail,
  verificationReminderEmail,
  welcomeEmail,
  passwordResetEmail,
  trialEndingEmail,
  trialExpiredEmail,
  adminAlertEmail,
  supportRequestEmail,
  trialWarning7DaysEmail,
  trialWarning1DayEmail,
  abandonedCheckoutEmail,
  abandonedCheckout30MinEmail,
  paymentFailedEmail,
  contactFormNotification,
  businessEventAlert,
  subscriptionConfirmationEmail
};
