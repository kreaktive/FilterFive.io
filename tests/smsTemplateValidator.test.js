/**
 * SMS Template Validator Tests
 */
const {
  validateSmsTemplate,
  estimateMessageLength,
  previewTemplate,
  getAvailableTags,
  calculateSegments
} = require('../src/utils/smsTemplateValidator');

describe('SMS Template Validator', () => {
  describe('validateSmsTemplate', () => {
    test('validates correct template with all tags', () => {
      const template = 'Hi {{CustomerName}}, thanks for visiting {{BusinessName}}! Leave a review: {{ReviewLink}}';
      const result = validateSmsTemplate(template);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('requires ReviewLink tag', () => {
      const template = 'Hi {{CustomerName}}, thanks for visiting {{BusinessName}}!';
      const result = validateSmsTemplate(template);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Template must include {{ReviewLink}}');
    });

    test('rejects empty template', () => {
      const result = validateSmsTemplate('');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Template is required');
    });

    test('rejects null template', () => {
      const result = validateSmsTemplate(null);
      expect(result.valid).toBe(false);
    });

    test('rejects too short template', () => {
      const result = validateSmsTemplate('Hi');
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('at least 10 characters'))).toBe(true);
    });

    test('warns about unknown tags', () => {
      const template = 'Hi {{CustomerName}}! Visit {{UnknownTag}} at {{ReviewLink}}';
      const result = validateSmsTemplate(template);
      expect(result.warnings.some(w => w.includes('Unknown tag'))).toBe(true);
    });

    test('warns about spam trigger words', () => {
      const template = 'FREE offer! Win a prize! {{ReviewLink}}';
      const result = validateSmsTemplate(template);
      expect(result.warnings.some(w => w.includes('spam filters'))).toBe(true);
    });

    test('warns about hardcoded URLs', () => {
      const template = 'Visit https://example.com and {{ReviewLink}}';
      const result = validateSmsTemplate(template);
      expect(result.warnings.some(w => w.includes('hardcoded URLs'))).toBe(true);
    });

    test('warns about missing opt-out language', () => {
      const template = 'Thanks {{CustomerName}}! Review us: {{ReviewLink}}';
      const result = validateSmsTemplate(template);
      expect(result.warnings.some(w => w.includes('opt-out'))).toBe(true);
    });

    test('no opt-out warning when STOP included', () => {
      const template = 'Thanks! Review: {{ReviewLink}} Reply STOP to unsubscribe';
      const result = validateSmsTemplate(template);
      expect(result.warnings.some(w => w.includes('opt-out'))).toBe(false);
    });

    test('is case-insensitive for tags', () => {
      const template = 'Hi {{customername}}, visit {{reviewlink}}';
      const result = validateSmsTemplate(template);
      expect(result.valid).toBe(true);
    });
  });

  describe('estimateMessageLength', () => {
    test('estimates length with sample values', () => {
      const template = '{{CustomerName}} {{BusinessName}} {{ReviewLink}}';
      const length = estimateMessageLength(template);
      // John (5) + space + Local Business (15) + space + URL (~30) = ~52
      expect(length).toBeGreaterThan(40);
      expect(length).toBeLessThan(80);
    });

    test('returns 0 for empty input', () => {
      expect(estimateMessageLength('')).toBe(0);
      expect(estimateMessageLength(null)).toBe(0);
    });
  });

  describe('previewTemplate', () => {
    test('replaces all tags with sample data', () => {
      const template = 'Hi {{CustomerName}}, thanks from {{BusinessName}}! {{ReviewLink}}';
      const preview = previewTemplate(template);
      expect(preview).toContain('John');
      expect(preview).toContain('Your Business');
      expect(preview).toContain('morestars.io');
    });

    test('uses custom sample data', () => {
      const template = 'Hi {{CustomerName}}!';
      const preview = previewTemplate(template, { customerName: 'Alice' });
      expect(preview).toContain('Alice');
    });

    test('returns empty string for null template', () => {
      expect(previewTemplate(null)).toBe('');
    });
  });

  describe('getAvailableTags', () => {
    test('returns array of tag objects', () => {
      const tags = getAvailableTags();
      expect(Array.isArray(tags)).toBe(true);
      expect(tags.length).toBeGreaterThan(0);
    });

    test('each tag has required properties', () => {
      const tags = getAvailableTags();
      tags.forEach(tag => {
        expect(tag).toHaveProperty('tag');
        expect(tag).toHaveProperty('description');
        expect(tag).toHaveProperty('example');
      });
    });

    test('includes ReviewLink as required', () => {
      const tags = getAvailableTags();
      const reviewLinkTag = tags.find(t => t.tag === '{{ReviewLink}}');
      expect(reviewLinkTag).toBeDefined();
      expect(reviewLinkTag.required).toBe(true);
    });
  });

  describe('calculateSegments', () => {
    test('returns 1 for short messages', () => {
      expect(calculateSegments(100)).toBe(1);
      expect(calculateSegments(160)).toBe(1);
    });

    test('calculates multiple segments correctly', () => {
      expect(calculateSegments(161)).toBe(2);
      expect(calculateSegments(306)).toBe(2);
      expect(calculateSegments(307)).toBe(3);
    });

    test('uses 153 chars per segment for concatenated', () => {
      // 153 * 2 = 306 chars for 2 segments
      expect(calculateSegments(306)).toBe(2);
      expect(calculateSegments(459)).toBe(3);
    });
  });
});
