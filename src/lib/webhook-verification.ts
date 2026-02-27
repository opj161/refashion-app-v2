// src/lib/webhook-verification.ts
import 'server-only';

import crypto from 'crypto';

// DER prefix for Ed25519 SPKI public keys (12 bytes) — used to wrap raw 32-byte keys
// for Node.js crypto.createPublicKey().
const ED25519_SPKI_PREFIX = Buffer.from('302a300506032b6570032100', 'hex');

const JWKS_URL = 'https://rest.alpha.fal.ai/.well-known/jwks.json';
const JWKS_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
let jwksCache: any[] = [];
let jwksCacheTime = 0;

async function fetchJwks(): Promise<any[]> {
  const currentTime = Date.now();
  if (jwksCache.length === 0 || (currentTime - jwksCacheTime) > JWKS_CACHE_DURATION) {
    // CACHE-STRATEGY: Policy: Dynamic - This fetches cryptographic keys from an external API that change over time.
    const response = await fetch(JWKS_URL, { cache: 'no-store' });
    if (!response.ok) throw new Error(`JWKS fetch failed: ${response.status}`);
    jwksCache = (await response.json()).keys || [];
    jwksCacheTime = currentTime;
  }
  return jwksCache;
}

/**
 * Verify a webhook signature using provided headers and body.
 * 
 * @param requestId - Value of X-Fal-Webhook-Request-Id header.
 * @param userId - Value of X-Fal-Webhook-User-Id header.
 * @param timestamp - Value of X-Fal-Webhook-Timestamp header.
 * @param signatureHex - Value of X-Fal-Webhook-Signature header (hex-encoded).
 * @param body - Raw request body as a Buffer.
 * @returns Promise<boolean> True if the signature is valid, false otherwise.
 */
export async function verifyWebhookSignature(
  requestId: string | null,
  userId: string | null,
  timestamp: string | null,
  signatureHex: string | null,
  body: Buffer
): Promise<boolean> {
  if (!requestId || !userId || !timestamp || !signatureHex) {
    console.error('Missing required headers for webhook verification');
    return false;
  }

  // Validate timestamp (within ±5 minutes)
  try {
    const timestampInt = parseInt(timestamp, 10);
    const currentTime = Math.floor(Date.now() / 1000);
    if (Math.abs(currentTime - timestampInt) > 300) {
      console.error('Timestamp is too old or in the future.');
      return false;
    }
  } catch (e) {
    console.error('Invalid timestamp format:', e);
    return false;
  }

  // Construct the message to verify
  try {
    const messageParts = [
      requestId,
      userId,
      timestamp,
      crypto.createHash('sha256').update(body).digest('hex')
    ];
    const messageToVerify = messageParts.join('\n');
    const messageBytes = Buffer.from(messageToVerify, 'utf-8');

    // Decode signature
    let signatureBytes: Buffer;
    try {
      signatureBytes = Buffer.from(signatureHex, 'hex');
    } catch (e) {
      console.error('Invalid signature format (not hexadecimal).');
      return false;
    }

    // Fetch public keys
    let publicKeysInfo: any[];
    try {
      publicKeysInfo = await fetchJwks();
      if (!publicKeysInfo.length) {
        console.error('No public keys found in JWKS.');
        return false;
      }
    } catch (e) {
      console.error('Error fetching JWKS:', e);
      return false;
    }

    // Verify signature with each public key
    for (const keyInfo of publicKeysInfo) {
      try {
        const publicKeyB64url = keyInfo.x;
        if (!publicKeyB64url) continue;

        // Decode base64url to bytes
        const publicKeyBytes = Buffer.from(publicKeyB64url, 'base64url');
        
        // Verify using Node.js built-in Ed25519 support
        const spkiKey = Buffer.concat([ED25519_SPKI_PREFIX, publicKeyBytes]);
        const publicKey = crypto.createPublicKey({
          key: spkiKey,
          format: 'der',
          type: 'spki',
        });
        const isValid = crypto.verify(null, messageBytes, publicKey, signatureBytes);
        
        if (isValid) {
          console.log('Webhook signature verified successfully');
          return true;
        }
      } catch (e) {
        // Try the next key
        continue;
      }
    }

    console.error('Signature verification failed with all keys.');
    return false;
  } catch (e) {
    console.error('Error during signature verification:', e);
    return false;
  }
}
