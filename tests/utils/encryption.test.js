/**
 * Encryption Utility Tests
 *
 * Tests for AES-256-CBC encryption used for POS OAuth token storage:
 * - encrypt: Encrypts plain text to iv:ciphertext format
 * - decrypt: Decrypts iv:ciphertext format back to plain text
 * - generateEncryptionKey: Generates secure random encryption keys
 */

describe('Encryption Utility', () => {
  const originalEnv = process.env.POS_TOKEN_ENCRYPTION_KEY;
  let encrypt, decrypt, generateEncryptionKey;

  beforeEach(() => {
    // Set a test encryption key
    process.env.POS_TOKEN_ENCRYPTION_KEY = 'test-encryption-key-for-unit-tests';

    // Clear the module cache to ensure fresh imports with new env
    jest.resetModules();

    // Import the module fresh
    const encryption = require('../../src/utils/encryption');
    encrypt = encryption.encrypt;
    decrypt = encryption.decrypt;
    generateEncryptionKey = encryption.generateEncryptionKey;
  });

  afterEach(() => {
    // Restore original env
    if (originalEnv) {
      process.env.POS_TOKEN_ENCRYPTION_KEY = originalEnv;
    } else {
      delete process.env.POS_TOKEN_ENCRYPTION_KEY;
    }
  });

  describe('encrypt', () => {
    it('should return null for null input', () => {
      const result = encrypt(null);
      expect(result).toBeNull();
    });

    it('should return null for empty string', () => {
      const result = encrypt('');
      expect(result).toBeNull();
    });

    it('should return null for undefined input', () => {
      const result = encrypt(undefined);
      expect(result).toBeNull();
    });

    it('should encrypt a simple string', () => {
      const plainText = 'hello world';
      const encrypted = encrypt(plainText);

      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe('string');
      expect(encrypted).not.toBe(plainText);
    });

    it('should return iv:ciphertext format', () => {
      const plainText = 'test-token-value';
      const encrypted = encrypt(plainText);

      expect(encrypted).toContain(':');
      const parts = encrypted.split(':');
      expect(parts.length).toBe(2);
    });

    it('should produce different output for same input (random IV)', () => {
      const plainText = 'same-input-text';

      const encrypted1 = encrypt(plainText);
      const encrypted2 = encrypt(plainText);

      // Different IVs mean different outputs
      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should encrypt OAuth token format strings', () => {
      const oauthToken = 'sq0atp-AbCdEfGhIjKlMnOpQrStUvWx';
      const encrypted = encrypt(oauthToken);

      expect(encrypted).toBeDefined();
      expect(encrypted).toContain(':');
    });

    it('should encrypt JSON strings', () => {
      const jsonData = JSON.stringify({ accessToken: 'token123', refreshToken: 'refresh456' });
      const encrypted = encrypt(jsonData);

      expect(encrypted).toBeDefined();
      expect(encrypted).toContain(':');
    });

    it('should handle special characters', () => {
      const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`';
      const encrypted = encrypt(specialChars);

      expect(encrypted).toBeDefined();
      expect(encrypted).toContain(':');
    });

    it('should handle unicode characters', () => {
      const unicode = '日本語テスト 🔐 émojis';
      const encrypted = encrypt(unicode);

      expect(encrypted).toBeDefined();
      expect(encrypted).toContain(':');
    });

    it('should throw when encryption key is missing', () => {
      delete process.env.POS_TOKEN_ENCRYPTION_KEY;
      jest.resetModules();
      const { encrypt: encryptNoKey } = require('../../src/utils/encryption');

      expect(() => encryptNoKey('test')).toThrow('POS_TOKEN_ENCRYPTION_KEY environment variable is not set');
    });
  });

  describe('decrypt', () => {
    it('should return null for null input', () => {
      const result = decrypt(null);
      expect(result).toBeNull();
    });

    it('should return null for empty string', () => {
      const result = decrypt('');
      expect(result).toBeNull();
    });

    it('should return null for undefined input', () => {
      const result = decrypt(undefined);
      expect(result).toBeNull();
    });

    it('should decrypt an encrypted string', () => {
      const plainText = 'hello world';
      const encrypted = encrypt(plainText);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plainText);
    });

    it('should throw for invalid format (no colon)', () => {
      expect(() => decrypt('invalidformat')).toThrow('Invalid encrypted text format');
    });

    it('should throw for invalid format (empty parts)', () => {
      expect(() => decrypt(':')).toThrow('Invalid encrypted text format');
    });

    it('should throw for invalid format (missing ciphertext)', () => {
      expect(() => decrypt('abc123:')).toThrow('Invalid encrypted text format');
    });

    it('should throw for invalid format (missing IV)', () => {
      expect(() => decrypt(':abc123')).toThrow('Invalid encrypted text format');
    });

    it('should throw when encryption key is missing', () => {
      const encrypted = encrypt('test');

      delete process.env.POS_TOKEN_ENCRYPTION_KEY;
      jest.resetModules();
      const { decrypt: decryptNoKey } = require('../../src/utils/encryption');

      expect(() => decryptNoKey(encrypted)).toThrow('POS_TOKEN_ENCRYPTION_KEY environment variable is not set');
    });
  });

  describe('encrypt/decrypt roundtrip', () => {
    it('should roundtrip simple text', () => {
      const original = 'simple text';
      const encrypted = encrypt(original);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(original);
    });

    it('should roundtrip OAuth tokens', () => {
      const original = 'sq0atp-AbCdEfGhIjKlMnOpQrStUvWxYz';
      const encrypted = encrypt(original);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(original);
    });

    it('should roundtrip long strings', () => {
      const original = 'a'.repeat(1000);
      const encrypted = encrypt(original);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(original);
    });

    it('should roundtrip JSON data', () => {
      const original = JSON.stringify({
        accessToken: 'sq0atp-token123',
        refreshToken: 'sq0rft-refresh456',
        expiresAt: '2024-12-31T23:59:59Z',
        merchantId: 'MERCHANT123'
      });
      const encrypted = encrypt(original);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(original);
      expect(JSON.parse(decrypted)).toEqual(JSON.parse(original));
    });

    it('should roundtrip special characters', () => {
      const original = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/\\~`';
      const encrypted = encrypt(original);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(original);
    });

    it('should roundtrip unicode characters', () => {
      const original = '日本語テスト 🔐 émojis Ñ ü ß';
      const encrypted = encrypt(original);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(original);
    });

    it('should roundtrip newlines and whitespace', () => {
      const original = 'line1\nline2\r\nline3\ttabbed';
      const encrypted = encrypt(original);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(original);
    });
  });

  describe('generateEncryptionKey', () => {
    it('should generate a string', () => {
      const key = generateEncryptionKey();
      expect(typeof key).toBe('string');
    });

    it('should generate a 64-character hex string', () => {
      const key = generateEncryptionKey();
      expect(key.length).toBe(64);
    });

    it('should generate valid hexadecimal characters only', () => {
      const key = generateEncryptionKey();
      expect(key).toMatch(/^[0-9a-f]+$/);
    });

    it('should generate unique keys on each call', () => {
      const keys = new Set();
      for (let i = 0; i < 100; i++) {
        keys.add(generateEncryptionKey());
      }
      // All 100 keys should be unique
      expect(keys.size).toBe(100);
    });

    it('should generate keys usable for encryption', () => {
      const newKey = generateEncryptionKey();

      // Use the generated key
      process.env.POS_TOKEN_ENCRYPTION_KEY = newKey;
      jest.resetModules();
      const { encrypt: encryptWithNewKey, decrypt: decryptWithNewKey } = require('../../src/utils/encryption');

      const plainText = 'test with generated key';
      const encrypted = encryptWithNewKey(plainText);
      const decrypted = decryptWithNewKey(encrypted);

      expect(decrypted).toBe(plainText);
    });
  });

  describe('Security properties', () => {
    it('should not expose plaintext in encrypted output', () => {
      const sensitiveData = 'super-secret-token-12345';
      const encrypted = encrypt(sensitiveData);

      expect(encrypted).not.toContain(sensitiveData);
      expect(encrypted).not.toContain('super');
      expect(encrypted).not.toContain('secret');
      expect(encrypted).not.toContain('token');
    });

    it('should produce different ciphertext with different keys', () => {
      const plainText = 'same input';

      // Encrypt with first key
      const encrypted1 = encrypt(plainText);

      // Change key and encrypt again
      process.env.POS_TOKEN_ENCRYPTION_KEY = 'different-encryption-key-here';
      jest.resetModules();
      const { encrypt: encryptNewKey } = require('../../src/utils/encryption');
      const encrypted2 = encryptNewKey(plainText);

      // Extract ciphertext parts (after the IV)
      const cipher1 = encrypted1.split(':')[1];
      const cipher2 = encrypted2.split(':')[1];

      expect(cipher1).not.toBe(cipher2);
    });

    it('should not decrypt with wrong key', () => {
      const plainText = 'secret message';
      const encrypted = encrypt(plainText);

      // Change to wrong key
      process.env.POS_TOKEN_ENCRYPTION_KEY = 'wrong-key-will-fail';
      jest.resetModules();
      const { decrypt: decryptWrongKey } = require('../../src/utils/encryption');

      // Should throw due to decryption failure
      expect(() => decryptWrongKey(encrypted)).toThrow();
    });
  });
});
