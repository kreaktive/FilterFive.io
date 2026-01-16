/**
 * Encryption Utility for POS OAuth Tokens
 * Uses AES-256-CBC encryption for secure token storage
 */

const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

/**
 * Get encryption key from environment
 * @returns {Buffer} 32-byte encryption key
 */
const getEncryptionKey = () => {
  const key = process.env.POS_TOKEN_ENCRYPTION_KEY;
  if (!key) {
    throw new Error('POS_TOKEN_ENCRYPTION_KEY environment variable is not set');
  }
  // Ensure key is exactly 32 bytes (256 bits)
  return crypto.createHash('sha256').update(key).digest();
};

/**
 * Encrypt a string
 * @param {string} text - Plain text to encrypt
 * @returns {string} Encrypted string (iv:ciphertext in hex)
 */
const encrypt = (text) => {
  if (!text) return null;

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  // Return iv:encrypted format for storage
  return `${iv.toString('hex')}:${encrypted}`;
};

/**
 * Decrypt a string
 * @param {string} encryptedText - Encrypted string (iv:ciphertext in hex)
 * @returns {string} Decrypted plain text
 */
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

/**
 * Generate a secure random encryption key
 * @returns {string} 32-character hex string suitable for POS_TOKEN_ENCRYPTION_KEY
 */
const generateEncryptionKey = () => {
  return crypto.randomBytes(32).toString('hex');
};

module.exports = {
  encrypt,
  decrypt,
  generateEncryptionKey
};
