import { hashApiKey } from '../hash';
import crypto from 'crypto';
import { describe, it, expect } from '@jest/globals';

describe('user.repository', () => {
  describe('hashApiKey', () => {
    it('should correctly hash an API key with SHA-256', () => {
      const apiKey = 'test-api-key';
      const expectedHash = crypto.createHash('sha256').update(apiKey).digest('hex');

      const result = hashApiKey(apiKey);

      expect(result).toStrictEqual(expectedHash);
      // Hardcoded hash for verification
      expect(result).toStrictEqual('4c806362b613f7496abf284146efd31da90e4b16169fe001841ca17290f427c4');
    });

    it('should be deterministic (same input produces same output)', () => {
      const apiKey = 'another-test-key';
      const result1 = hashApiKey(apiKey);
      const result2 = hashApiKey(apiKey);

      expect(result1).toStrictEqual(result2);
    });

    it('should produce different outputs for different inputs', () => {
      const apiKey1 = 'key-one';
      const apiKey2 = 'key-two';

      const result1 = hashApiKey(apiKey1);
      const result2 = hashApiKey(apiKey2);

      expect(result1).not.toStrictEqual(result2);
    });

    it('should handle empty string input', () => {
      const apiKey = '';
      const expectedHash = crypto.createHash('sha256').update(apiKey).digest('hex');

      const result = hashApiKey(apiKey);

      expect(result).toStrictEqual(expectedHash);
    });
  });
});
