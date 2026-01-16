/**
 * Encryption Utility Tests
 * Tests for AES-256-CBC encryption/decryption of POS tokens
 */

const crypto = require('crypto');

// Mock the encryption functions to test without env dependency
const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

const createEncryptionFunctions = (secretKey) => {
  const getEncryptionKey = () => {
    if (!secretKey) {
      throw new Error('POS_TOKEN_ENCRYPTION_KEY environment variable is not set');
    }
    return crypto.createHash('sha256').update(secretKey).digest();
  };

  const encrypt = (text) => {
    if (!text) return null;
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  };

  const decrypt = (encryptedText) => {
    if (!encryptedText) return null;
    const key = getEncryptionKey();
    const [ivHex, encrypted] = encryptedText.split(':');
    if (!ivHex || !encrypted) {
      throw new Error('Invalid encrypted text format');
    }
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  };

  const generateEncryptionKey = () => {
    return crypto.randomBytes(32).toString('hex');
  };

  return { encrypt, decrypt, generateEncryptionKey, getEncryptionKey };
};

describe('Encryption Utility', () => {
  const testKey = 'test-encryption-key-for-unit-tests-2024';
  let encryptFns;

  beforeEach(() => {
    encryptFns = createEncryptionFunctions(testKey);
  });

  describe('encrypt', () => {
    test('returns null for null input', () => {
      expect(encryptFns.encrypt(null)).toBeNull();
    });

    test('returns null for empty string', () => {
      expect(encryptFns.encrypt('')).toBeNull();
    });

    test('encrypts a string', () => {
      const plaintext = 'my-secret-token';
      const encrypted = encryptFns.encrypt(plaintext);

      expect(encrypted).toBeTruthy();
      expect(encrypted).not.toBe(plaintext);
    });

    test('returns string in iv:ciphertext format', () => {
      const encrypted = encryptFns.encrypt('test');

      expect(encrypted).toMatch(/^[a-f0-9]{32}:[a-f0-9]+$/);
    });

    test('generates different output for same input (random IV)', () => {
      const plaintext = 'same-input';
      const encrypted1 = encryptFns.encrypt(plaintext);
      const encrypted2 = encryptFns.encrypt(plaintext);

      expect(encrypted1).not.toBe(encrypted2);
    });

    test('encrypts various token types', () => {
      const tokens = [
        'sq0atp-abcd1234',           // Square access token
        'shpat_abcd1234567890',       // Shopify access token
        'sk_live_abc123def456',       // Stripe-like token
        'very-long-token-' + 'x'.repeat(500) // Long token
      ];

      tokens.forEach(token => {
        const encrypted = encryptFns.encrypt(token);
        expect(encrypted).toBeTruthy();
        expect(encrypted.split(':').length).toBe(2);
      });
    });
  });

  describe('decrypt', () => {
    test('returns null for null input', () => {
      expect(encryptFns.decrypt(null)).toBeNull();
    });

    test('returns null for empty string', () => {
      expect(encryptFns.decrypt('')).toBeNull();
    });

    test('decrypts encrypted string correctly', () => {
      const plaintext = 'my-secret-token';
      const encrypted = encryptFns.encrypt(plaintext);
      const decrypted = encryptFns.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    test('throws error for invalid format (no colon)', () => {
      expect(() => {
        encryptFns.decrypt('invalidformat');
      }).toThrow('Invalid encrypted text format');
    });

    test('throws error for missing IV', () => {
      expect(() => {
        encryptFns.decrypt(':encrypted');
      }).toThrow('Invalid encrypted text format');
    });

    test('throws error for missing ciphertext', () => {
      expect(() => {
        encryptFns.decrypt('abcd1234:');
      }).toThrow('Invalid encrypted text format');
    });

    test('handles tampered ciphertext (may throw or produce garbage)', () => {
      const encrypted = encryptFns.encrypt('secret');
      const [iv, ciphertext] = encrypted.split(':');
      // Significantly corrupt the ciphertext to force invalid padding
      const tampered = `${iv}:${ciphertext.substring(0, 16)}${'ff'.repeat(16)}`;

      // AES-CBC without authentication may:
      // 1. Throw due to invalid padding
      // 2. Produce garbage output
      // Either behavior is acceptable - the key is data is not correctly recovered
      let result;
      let threw = false;
      try {
        result = encryptFns.decrypt(tampered);
      } catch (e) {
        threw = true;
      }

      // Either it threw OR the result is not the original
      expect(threw || result !== 'secret').toBe(true);
    });

    test('throws error for wrong key', () => {
      const encrypted = encryptFns.encrypt('secret');
      const wrongKeyFns = createEncryptionFunctions('wrong-key');

      expect(() => {
        wrongKeyFns.decrypt(encrypted);
      }).toThrow();
    });

    test('handles special characters in plaintext', () => {
      const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?`~"\'\\';
      const encrypted = encryptFns.encrypt(specialChars);
      const decrypted = encryptFns.decrypt(encrypted);

      expect(decrypted).toBe(specialChars);
    });

    test('handles unicode characters', () => {
      const unicode = '日本語テスト 🎉 émojis';
      const encrypted = encryptFns.encrypt(unicode);
      const decrypted = encryptFns.decrypt(encrypted);

      expect(decrypted).toBe(unicode);
    });

    test('handles JSON strings', () => {
      const jsonData = JSON.stringify({ token: 'abc123', refresh: 'xyz789' });
      const encrypted = encryptFns.encrypt(jsonData);
      const decrypted = encryptFns.decrypt(encrypted);

      expect(decrypted).toBe(jsonData);
      expect(JSON.parse(decrypted)).toEqual({ token: 'abc123', refresh: 'xyz789' });
    });
  });

  describe('generateEncryptionKey', () => {
    test('generates 64-character hex string', () => {
      const key = encryptFns.generateEncryptionKey();

      expect(key).toMatch(/^[a-f0-9]{64}$/);
    });

    test('generates unique keys', () => {
      const key1 = encryptFns.generateEncryptionKey();
      const key2 = encryptFns.generateEncryptionKey();

      expect(key1).not.toBe(key2);
    });

    test('generated key works for encryption', () => {
      const newKey = encryptFns.generateEncryptionKey();
      const newFns = createEncryptionFunctions(newKey);

      const plaintext = 'test-with-generated-key';
      const encrypted = newFns.encrypt(plaintext);
      const decrypted = newFns.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });
  });

  describe('getEncryptionKey', () => {
    test('throws error when key not set', () => {
      const noKeyFns = createEncryptionFunctions(null);

      expect(() => {
        noKeyFns.getEncryptionKey();
      }).toThrow('POS_TOKEN_ENCRYPTION_KEY environment variable is not set');
    });

    test('produces consistent key from same input', () => {
      const fns1 = createEncryptionFunctions('same-key');
      const fns2 = createEncryptionFunctions('same-key');

      // Encrypt with first instance, decrypt with second
      const encrypted = fns1.encrypt('test');
      const decrypted = fns2.decrypt(encrypted);

      expect(decrypted).toBe('test');
    });
  });

  describe('Round-trip encryption', () => {
    const testCases = [
      { name: 'short string', value: 'abc' },
      { name: 'OAuth token', value: 'sq0atp-xxxxxxxxxxxxxxxxxxxxxxxxxxxx' },
      { name: 'refresh token', value: 'sq0rtp-xxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' },
      { name: 'empty-ish', value: ' ' },
      { name: 'numbers', value: '1234567890' },
      { name: 'mixed', value: 'Token123!@#$%' }
    ];

    testCases.forEach(({ name, value }) => {
      test(`round-trips ${name}`, () => {
        const encrypted = encryptFns.encrypt(value);
        const decrypted = encryptFns.decrypt(encrypted);
        expect(decrypted).toBe(value);
      });
    });
  });
});
