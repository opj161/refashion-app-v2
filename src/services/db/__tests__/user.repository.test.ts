import { hashApiKey } from '../hash.ts';
import crypto from 'crypto';
import assert from 'node:assert';
import { describe, it } from 'node:test';

describe('user.repository', () => {
  describe('hashApiKey', () => {
    it('should correctly hash an API key with SHA-256', () => {
      const apiKey = 'test-api-key';
      const expectedHash = crypto.createHash('sha256').update(apiKey).digest('hex');

      const result = hashApiKey(apiKey);

      assert.strictEqual(result, expectedHash);
      // Hardcoded hash for verification
      assert.strictEqual(result, '4c806362b613f7496abf284146efd31da90e4b16169fe001841ca17290f427c4');
    });

    it('should be deterministic (same input produces same output)', () => {
      const apiKey = 'another-test-key';
      const result1 = hashApiKey(apiKey);
      const result2 = hashApiKey(apiKey);

      assert.strictEqual(result1, result2);
    });

    it('should produce different outputs for different inputs', () => {
      const apiKey1 = 'key-one';
      const apiKey2 = 'key-two';

      const result1 = hashApiKey(apiKey1);
      const result2 = hashApiKey(apiKey2);

      assert.notStrictEqual(result1, result2);
    });

    it('should handle empty string input', () => {
      const apiKey = '';
      const expectedHash = crypto.createHash('sha256').update(apiKey).digest('hex');

      const result = hashApiKey(apiKey);

      assert.strictEqual(result, expectedHash);
    });
  });
});
