import crypto from 'crypto';

/** Hash an API key with SHA-256 for secure storage and comparison. */
export function hashApiKey(apiKey: string): string {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
}
