process.env.ENCRYPTION_SECRET = '12345678901234567890123456789012';

import { encrypt, decrypt } from '../encryption.service';

describe('Encryption Service', () => {
  describe('encrypt', () => {
    it('should correctly encrypt a given text', () => {
      const originalText = 'Hello World';
      const encrypted = encrypt(originalText);
      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe('string');
      expect(encrypted).not.toBe(originalText);

      // Ensure the length makes sense.
      // IV is 16 bytes, Auth Tag is 16 bytes, original is 11 bytes. Total = 43 bytes.
      // Base64 of 43 bytes = ceil(43/3)*4 = 15*4 = 60 chars.
      expect(encrypted.length).toBeGreaterThan(0);
    });

    it('should generate different outputs for same input due to random IV', () => {
      const originalText = 'Same text';
      const encrypted1 = encrypt(originalText);
      const encrypted2 = encrypt(originalText);
      expect(encrypted1).not.toBe(encrypted2);
    });
  });

  describe('decrypt', () => {
    it('should decrypt a valid encrypted string', () => {
      const originalText = 'Hello World';
      const encrypted = encrypt(originalText);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(originalText);
    });

    it('should handle special characters', () => {
      const originalText = 'Hello 🌍! @#$%^&*()_+';
      const encrypted = encrypt(originalText);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(originalText);
    });

    it('should return empty string for null input', () => {
      expect(decrypt(null)).toBe('');
    });

    it('should return empty string for undefined input', () => {
      expect(decrypt(undefined)).toBe('');
    });

    it('should return empty string for empty string input', () => {
      expect(decrypt('')).toBe('');
    });

    it('should return empty string for invalid base64 input', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      expect(decrypt('invalid-base64-string!@#')).toBe('');
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should return empty string when decryption fails (wrong key/tampered data)', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const originalText = 'Secret Data';
      const encrypted = encrypt(originalText);

      // Tamper with the encrypted string
      const tampered = encrypted.substring(0, encrypted.length - 2) + 'ab';

      expect(decrypt(tampered)).toBe('');
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
