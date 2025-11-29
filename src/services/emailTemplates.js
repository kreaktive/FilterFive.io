/**
 * Email Templates Service
 * Centralized HTML email templates for all system emails
 */

const baseStyles = `
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.6;
    color: #333;
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
    background-color: #f9fafb;
  }
  .email-container {
    background: white;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
  .header {
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    color: white;
    padding: 40px 30px;
    text-align: center;
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
    background: #3b82f6;
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
    background: #2563eb;
  }
  .info-box {
    background: #f0f9ff;
    border-left: 4px solid #3b82f6;
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
    color: #3b82f6;
    text-decoration: none;
  }
  .divider {
    height: 1px;
    background: #e5e7eb;
    margin: 24px 0;
  }
`;

const emailWrapper = (content, headerGradient = 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)') => `
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
      <h1>🎉 Welcome to FilterFive!</h1>
    </div>
    <div class="content">
      <p>Hi <strong>${businessName}</strong>,</p>

      <p>Thank you for signing up for FilterFive! We're excited to help you manage your reputation and grow your business.</p>

      <p>To get started, please verify your email address by clicking the button below:</p>

      <div style="text-align: center;">
        <a href="${verificationUrl}" class="cta-button">
          ✅ Verify My Email
        </a>
      </div>

      <div class="info-box">
        <strong>🎁 What's included in your 14-day free trial:</strong>
        <ul style="margin: 12px 0; padding-left: 20px;">
          <li>Unlimited SMS feedback requests</li>
          <li>Real-time negative feedback alerts</li>
          <li>Direct Google & Facebook review funneling</li>
          <li>CSV bulk customer uploads</li>
        </ul>
      </div>

      <p style="color: #6b7280; font-size: 14px;">
        This verification link will expire in 24 hours. If you didn't create an account with FilterFive, you can safely ignore this email.
      </p>

      <div class="divider"></div>

      <p style="font-size: 14px; color: #6b7280;">
        Or copy and paste this link into your browser:<br>
        <a href="${verificationUrl}" style="color: #3b82f6; word-break: break-all;">${verificationUrl}</a>
      </p>
    </div>
    <div class="footer">
      <p><strong>FilterFive</strong> - Reputation Management Made Simple</p>
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
      <h1>🚀 You're All Set!</h1>
    </div>
    <div class="content">
      <p>Hi <strong>${businessName}</strong>,</p>

      <p>Your FilterFive account is now active! Your 14-day free trial has officially started.</p>

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
      <p><strong>FilterFive</strong> - Reputation Management Made Simple</p>
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
      <h1>🔐 Reset Your Password</h1>
    </div>
    <div class="content">
      <p>Hi <strong>${businessName}</strong>,</p>

      <p>We received a request to reset the password for your FilterFive account.</p>

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
      <p><strong>FilterFive</strong> - Reputation Management Made Simple</p>
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
      <h1>⏰ Your Trial Ends Soon</h1>
    </div>
    <div class="content">
      <p>Hi <strong>${businessName}</strong>,</p>

      <p>Your 14-day FilterFive trial ends in <strong>3 days</strong> on ${trialEndsDate}.</p>

      <p>We hope you've enjoyed using FilterFive to manage your reputation and collect positive reviews!</p>

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
      <p><strong>FilterFive</strong> - Reputation Management Made Simple</p>
      <p>Thank you for trying FilterFive!</p>
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
      <h1>😢 Your Trial Has Ended</h1>
    </div>
    <div class="content">
      <p>Hi <strong>${businessName}</strong>,</p>

      <p>Thank you for trying FilterFive! Your 14-day trial has ended.</p>

      <p>We'd love to have you continue using FilterFive to grow your reputation and business.</p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${dashboardUrl}/subscribe?plan=6-month" class="cta-button" style="background: #ef4444; margin: 10px;">
          📅 Subscribe to 6-Month Plan
        </a>
        <a href="${dashboardUrl}/subscribe?plan=12-month" class="cta-button" style="background: #dc2626; margin: 10px;">
          🎯 Subscribe to 12-Month Plan
        </a>
      </div>

      <div class="info-box" style="background: #fef2f2; border-left-color: #ef4444;">
        <strong>📊 Your Stats:</strong> Log in to see how FilterFive helped you during your trial period.
      </div>

      <p style="text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px;">
        Have questions or need a custom plan? <a href="mailto:${process.env.RESEND_FROM_EMAIL}" style="color: #ef4444;">Let's talk</a>
      </p>
    </div>
    <div class="footer">
      <p><strong>FilterFive</strong> - Reputation Management Made Simple</p>
      <p>You can reactivate your account anytime.</p>
    </div>
  `;

  return emailWrapper(content);
};

module.exports = {
  verificationEmail,
  welcomeEmail,
  passwordResetEmail,
  trialEndingEmail,
  trialExpiredEmail
};
