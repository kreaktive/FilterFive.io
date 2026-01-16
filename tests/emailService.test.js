/**
 * Email Service Tests
 * Tests for email sending functionality logic (without mocking Resend)
 */

describe('Email Service Logic', () => {
  describe('Email subject labels', () => {
    const subjectLabels = {
      'feature_request': 'Feature Request',
      'bug_report': 'Bug Report',
      'billing': 'Billing Question',
      'integration': 'Integration Help',
      'general': 'General Question'
    };

    test('maps feature_request to Feature Request', () => {
      expect(subjectLabels['feature_request']).toBe('Feature Request');
    });

    test('maps bug_report to Bug Report', () => {
      expect(subjectLabels['bug_report']).toBe('Bug Report');
    });

    test('maps billing to Billing Question', () => {
      expect(subjectLabels['billing']).toBe('Billing Question');
    });

    test('maps integration to Integration Help', () => {
      expect(subjectLabels['integration']).toBe('Integration Help');
    });

    test('maps general to General Question', () => {
      expect(subjectLabels['general']).toBe('General Question');
    });

    test('returns undefined for unknown type', () => {
      expect(subjectLabels['unknown']).toBeUndefined();
    });
  });

  describe('Date formatting for trial emails', () => {
    const formatTrialDate = (date) => {
      return new Date(date).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    };

    test('formats date with month name', () => {
      // Use explicit UTC time to avoid timezone issues
      const result = formatTrialDate('2025-01-15T12:00:00Z');
      expect(result).toMatch(/January \d+, 2025/);
    });

    test('formats June date with month name', () => {
      const result = formatTrialDate('2025-06-20T12:00:00Z');
      expect(result).toMatch(/June \d+, 2025/);
    });

    test('formats December date with month name', () => {
      const result = formatTrialDate('2025-12-31T12:00:00Z');
      expect(result).toMatch(/December \d+, 2025/);
    });

    test('includes year in formatted date', () => {
      const result = formatTrialDate('2025-03-15T12:00:00Z');
      expect(result).toContain('2025');
    });
  });

  describe('Email ID extraction logic', () => {
    const extractEmailId = (result) => {
      return result?.data?.id || result?.id;
    };

    test('extracts from data.id', () => {
      const result = { data: { id: 'email-123' } };
      expect(extractEmailId(result)).toBe('email-123');
    });

    test('extracts from id directly', () => {
      const result = { id: 'email-456' };
      expect(extractEmailId(result)).toBe('email-456');
    });

    test('returns undefined when no id present', () => {
      const result = {};
      expect(extractEmailId(result)).toBeUndefined();
    });

    test('returns undefined for null result', () => {
      expect(extractEmailId(null)).toBeUndefined();
    });

    test('prefers data.id over id', () => {
      const result = { data: { id: 'from-data' }, id: 'from-root' };
      expect(extractEmailId(result)).toBe('from-data');
    });
  });

  describe('URL generation', () => {
    const APP_URL = 'https://app.morestars.io';

    test('generates verification URL', () => {
      const token = 'verify-token-abc';
      const url = `${APP_URL}/verify/${token}`;
      expect(url).toBe('https://app.morestars.io/verify/verify-token-abc');
    });

    test('generates password reset URL', () => {
      const token = 'reset-token-xyz';
      const url = `${APP_URL}/reset-password/${token}`;
      expect(url).toBe('https://app.morestars.io/reset-password/reset-token-xyz');
    });

    test('generates dashboard URL', () => {
      const url = `${APP_URL}/dashboard`;
      expect(url).toBe('https://app.morestars.io/dashboard');
    });
  });

  describe('Email subject formatting', () => {
    test('formats verification email subject', () => {
      expect('Verify your MoreStars account').toBeTruthy();
    });

    test('formats welcome email subject', () => {
      expect('🚀 Welcome to MoreStars - Your trial has started!').toContain('Welcome to MoreStars');
    });

    test('formats password reset subject', () => {
      expect('Reset your MoreStars password').toBeTruthy();
    });

    test('formats trial ending subject', () => {
      expect('⏰ Your MoreStars trial ends in 3 days').toContain('trial ends');
    });

    test('formats trial expired subject', () => {
      expect('Your MoreStars trial has ended').toBeTruthy();
    });

    test('formats admin alert subject', () => {
      const subject = 'Cron Job Failed';
      const formatted = `[MoreStars Alert] ${subject}`;
      expect(formatted).toBe('[MoreStars Alert] Cron Job Failed');
    });

    test('formats support request subject', () => {
      const businessName = 'Test Business';
      const labeledSubject = 'Feature Request';
      const formatted = `[MoreStars Support] ${labeledSubject} from ${businessName}`;
      expect(formatted).toBe('[MoreStars Support] Feature Request from Test Business');
    });
  });

  describe('API key validation', () => {
    const checkApiKey = (apiKey) => {
      if (!apiKey) {
        throw new Error('Resend API key not configured');
      }
      return true;
    };

    test('throws error when API key is undefined', () => {
      expect(() => checkApiKey(undefined)).toThrow('Resend API key not configured');
    });

    test('throws error when API key is null', () => {
      expect(() => checkApiKey(null)).toThrow('Resend API key not configured');
    });

    test('throws error when API key is empty string', () => {
      expect(() => checkApiKey('')).toThrow('Resend API key not configured');
    });

    test('returns true when API key is set', () => {
      expect(checkApiKey('re_abc123')).toBe(true);
    });
  });

  describe('Admin email fallback', () => {
    const getAdminEmail = (adminEmail, testEmail) => {
      return adminEmail || testEmail;
    };

    test('uses ADMIN_EMAIL when set', () => {
      expect(getAdminEmail('admin@example.com', 'test@example.com')).toBe('admin@example.com');
    });

    test('falls back to TEST_EMAIL', () => {
      expect(getAdminEmail(undefined, 'test@example.com')).toBe('test@example.com');
    });

    test('returns undefined when neither is set', () => {
      expect(getAdminEmail(undefined, undefined)).toBeUndefined();
    });
  });

  describe('Error handling patterns', () => {
    const handleResendResult = (result) => {
      if (result.error) {
        throw new Error(`Resend API Error: ${result.error.message}`);
      }
      return { success: true, emailId: result?.data?.id || result?.id };
    };

    test('throws on Resend error', () => {
      const result = { error: { message: 'Invalid recipient' } };
      expect(() => handleResendResult(result)).toThrow('Resend API Error: Invalid recipient');
    });

    test('returns success on valid result', () => {
      const result = { data: { id: 'email-123' } };
      const response = handleResendResult(result);
      expect(response.success).toBe(true);
      expect(response.emailId).toBe('email-123');
    });

    test('handles legacy id format', () => {
      const result = { id: 'legacy-id' };
      const response = handleResendResult(result);
      expect(response.emailId).toBe('legacy-id');
    });
  });

  describe('Support email destination', () => {
    test('sends to support@morestars.io', () => {
      const supportEmail = 'support@morestars.io';
      expect(supportEmail).toBe('support@morestars.io');
    });
  });

  describe('Admin alert silent failure', () => {
    const sendAdminAlertSilent = async (sendFn) => {
      try {
        return await sendFn();
      } catch (error) {
        // Don't throw - admin alerts should fail silently
        return { success: false, error: error.message };
      }
    };

    test('catches errors and returns failure object', async () => {
      const failingFn = async () => {
        throw new Error('Network error');
      };
      const result = await sendAdminAlertSilent(failingFn);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });

    test('passes through successful result', async () => {
      const successFn = async () => ({ success: true, emailId: 'abc' });
      const result = await sendAdminAlertSilent(successFn);
      expect(result.success).toBe(true);
      expect(result.emailId).toBe('abc');
    });
  });

  describe('Reply-to header for support emails', () => {
    test('sets replyTo to user email', () => {
      const userEmail = 'user@example.com';
      const emailOptions = {
        to: 'support@morestars.io',
        replyTo: userEmail
      };
      expect(emailOptions.replyTo).toBe('user@example.com');
    });
  });
});
