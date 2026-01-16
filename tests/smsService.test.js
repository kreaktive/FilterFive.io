/**
 * SMS Service Tests
 * Tests for message generation and template replacement (not actual sending)
 */

const { getSmsMessage, replaceTemplateTags } = require('../src/services/smsService');

describe('SMS Service', () => {
  describe('replaceTemplateTags', () => {
    test('replaces all tags correctly', () => {
      const template = 'Hi {{CustomerName}}, thanks for visiting {{BusinessName}}! Review us: {{ReviewLink}}';
      const result = replaceTemplateTags(template, 'John', 'Acme Corp', 'https://example.com/review');

      expect(result).toBe('Hi John, thanks for visiting Acme Corp! Review us: https://example.com/review');
    });

    test('handles missing customer name with fallback', () => {
      const template = 'Hi {{CustomerName}}!';
      const result = replaceTemplateTags(template, null, 'Business', 'link');

      expect(result).toBe('Hi there!');
    });

    test('handles empty customer name with fallback', () => {
      const template = 'Hi {{CustomerName}}!';
      const result = replaceTemplateTags(template, '', 'Business', 'link');

      expect(result).toBe('Hi there!');
    });

    test('is case-insensitive for tags', () => {
      const template = '{{customername}} {{BUSINESSNAME}} {{ReviewLink}}';
      const result = replaceTemplateTags(template, 'Jane', 'Shop', 'http://link');

      expect(result).toBe('Jane Shop http://link');
    });

    test('replaces multiple occurrences of same tag', () => {
      const template = '{{CustomerName}} loves {{CustomerName}}!';
      const result = replaceTemplateTags(template, 'Bob', 'Biz', 'link');

      expect(result).toBe('Bob loves Bob!');
    });
  });

  describe('getSmsMessage', () => {
    const customerName = 'Alice';
    const businessName = 'Test Business';
    const reviewLink = 'https://morestars.io/r/test';

    describe('preset tones', () => {
      test('returns friendly message by default', () => {
        const message = getSmsMessage(customerName, businessName, reviewLink);

        expect(message).toContain('Alice');
        expect(message).toContain('Test Business');
        expect(message).toContain(reviewLink);
        expect(message).toContain('Thanks for visiting');
      });

      test('returns professional message', () => {
        const message = getSmsMessage(customerName, businessName, reviewLink, 'professional');

        expect(message).toContain('Hello Alice');
        expect(message).toContain('thank you for choosing');
        expect(message).toContain(reviewLink);
      });

      test('returns grateful message', () => {
        const message = getSmsMessage(customerName, businessName, reviewLink, 'grateful');

        expect(message).toContain('grateful');
        expect(message).toContain(reviewLink);
      });

      test('falls back to friendly for unknown tone', () => {
        const message = getSmsMessage(customerName, businessName, reviewLink, 'unknown-tone');

        expect(message).toContain('Thanks for visiting');
      });
    });

    describe('custom messages', () => {
      test('processes custom message with tags', () => {
        const customMessage = 'Hey {{CustomerName}}! Visit {{ReviewLink}} please!';
        const message = getSmsMessage(customerName, businessName, reviewLink, 'custom', customMessage);

        expect(message).toBe('Hey Alice! Visit https://morestars.io/r/test please!');
      });

      test('appends review link if missing from custom message', () => {
        const customMessage = 'Thanks {{CustomerName}} for your visit!';
        const message = getSmsMessage(customerName, businessName, reviewLink, 'custom', customMessage);

        expect(message).toContain('Thanks Alice');
        expect(message).toContain(reviewLink);
      });

      test('does not double-append if ReviewLink tag exists', () => {
        const customMessage = 'Review here: {{ReviewLink}}';
        const message = getSmsMessage(customerName, businessName, reviewLink, 'custom', customMessage);

        // Should only have the link once
        const linkCount = (message.match(/morestars\.io/g) || []).length;
        expect(linkCount).toBe(1);
      });

      test('falls back to friendly when custom tone but no message', () => {
        const message = getSmsMessage(customerName, businessName, reviewLink, 'custom', null);

        expect(message).toContain('Thanks for visiting');
      });

      test('falls back to friendly when custom tone with empty message', () => {
        const message = getSmsMessage(customerName, businessName, reviewLink, 'custom', '');

        expect(message).toContain('Thanks for visiting');
      });
    });

    describe('name handling', () => {
      test('uses "there" when customer name is null', () => {
        const message = getSmsMessage(null, businessName, reviewLink);

        expect(message).toContain('Hi there!');
      });

      test('uses "there" when customer name is empty string', () => {
        const message = getSmsMessage('', businessName, reviewLink);

        expect(message).toContain('Hi there!');
      });
    });
  });
});
