// Webhook verification utility for FAL.ai webhooks
import crypto from 'crypto';

const JWKS_URL = 'https://rest.alpha.fal.ai/.well-known/jwks.json';
const JWKS_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

interface JWKSKey {
  x: string; // base64url-encoded ED25519 public key
}

interface JWKSResponse {
  keys: JWKSKey[];
}

let jwksCache: JWKSKey[] | null = null;
let jwksCacheTime = 0;

/**
 * Fetch the JSON Web Key Set (JWKS) from FAL.ai
 */
async function fetchJwks(): Promise<JWKSKey[]> {
  const currentTime = Date.now();
  if (!jwksCache || (currentTime - jwksCacheTime) > JWKS_CACHE_DURATION) {
    console.log('Fetching fresh JWKS from FAL.ai...');
    
    const response = await fetch(JWKS_URL, { 
      headers: { 'User-Agent': 'RefashionAI-Webhook-Client/1.0' },
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });
    
    if (!response.ok) {
      throw new Error(`JWKS fetch failed: ${response.status} ${response.statusText}`);
    }
    
    const jwksData: JWKSResponse = await response.json();
    jwksCache = jwksData.keys || [];
    jwksCacheTime = currentTime;
    
    console.log(`JWKS fetched successfully. Found ${jwksCache.length} keys.`);
  }
  
  return jwksCache;
}

/**
 * Verify a webhook signature using Node.js crypto for ED25519
 */
async function verifySignatureWithKey(publicKeyB64Url: string, messageBytes: Buffer, signatureBytes: Buffer): Promise<boolean> {
  try {
    // Decode the public key from base64url
    const publicKeyBytes = Buffer.from(publicKeyB64Url, 'base64url');
    
    // ED25519 raw key is 32 bytes, we need to wrap it in proper key format for Node.js
    if (publicKeyBytes.length !== 32) {
      console.warn('Invalid ED25519 public key length:', publicKeyBytes.length);
      return false;
    }

    // Create a DER-encoded SubjectPublicKeyInfo structure for ED25519
    // This is the format Node.js crypto expects
    const derHeader = Buffer.from([
      0x30, 0x2a, // SEQUENCE, length 42
      0x30, 0x05, // SEQUENCE, length 5
      0x06, 0x03, 0x2b, 0x65, 0x70, // OID for Ed25519: 1.3.101.112
      0x03, 0x21, 0x00 // BIT STRING, length 33, no padding
    ]);
    
    const derPublicKey = Buffer.concat([derHeader, publicKeyBytes]);
    
    // Create the public key object
    const publicKey = crypto.createPublicKey({
      key: derPublicKey,
      format: 'der',
      type: 'spki'
    });
    
    // Verify the signature (Ed25519 uses null for the algorithm parameter)
    const isValid = crypto.verify(null, messageBytes, publicKey, signatureBytes);
    return isValid;
    
  } catch (error) {
    console.warn('ED25519 verification failed for a key:', error);
    return false;
  }
}

/**
 * Verify a FAL.ai webhook signature
 */
export async function verifyWebhookSignature(
  requestId: string,
  userId: string,
  timestamp: string,
  signatureHex: string,
  body: Buffer
): Promise<boolean> {
  try {
    // 1. Validate timestamp (within ±5 minutes)
    const timestampInt = parseInt(timestamp, 10);
    if (isNaN(timestampInt)) {
      console.error('Invalid timestamp format:', timestamp);
      return false;
    }
    
    const currentTime = Math.floor(Date.now() / 1000);
    const timeDiff = Math.abs(currentTime - timestampInt);
    
    if (timeDiff > 300) { // 5 minutes
      console.error(`Timestamp too old or in future. Diff: ${timeDiff}s`);
      return false;
    }

    // 2. Construct the message to verify
    const bodyHash = crypto.createHash('sha256').update(body).digest('hex');
    const messageParts = [requestId, userId, timestamp, bodyHash];
    
    // Check for missing parts
    if (messageParts.some(part => !part)) {
      console.error('Missing required header values for webhook verification');
      return false;
    }
    
    const messageToVerify = messageParts.join('\n');
    const messageBytes = Buffer.from(messageToVerify, 'utf-8');

    // 3. Decode signature from hex
    let signatureBytes: Buffer;
    try {
      signatureBytes = Buffer.from(signatureHex, 'hex');
    } catch (error) {
      console.error('Invalid signature format (not hexadecimal):', error);
      return false;
    }

    // 4. Fetch public keys and verify
    try {
      const publicKeysInfo = await fetchJwks();
      
      if (!publicKeysInfo.length) {
        console.error('No public keys found in JWKS');
        return false;
      }

      // Try verification with each public key
      for (const keyInfo of publicKeysInfo) {
        const publicKeyB64Url = keyInfo.x;
        if (typeof publicKeyB64Url !== 'string') continue;

        if (await verifySignatureWithKey(publicKeyB64Url, messageBytes, signatureBytes)) {
          console.log('Webhook signature verified successfully');
          return true;
        }
      }

      console.error('Signature verification failed with all keys');
      return false;
      
    } catch (error) {
      console.error('Error during signature verification:', error);
      return false;
    }

  } catch (error) {
    console.error('Error in webhook signature verification:', error);
    return false;
  }
}

/**
 * Extract webhook headers from a Next.js request
 */
export function extractWebhookHeaders(request: Request) {
  const headers = {
    requestId: request.headers.get('x-fal-webhook-request-id'),
    userId: request.headers.get('x-fal-webhook-user-id'),
    timestamp: request.headers.get('x-fal-webhook-timestamp'),
    signature: request.headers.get('x-fal-webhook-signature')
  };

  const missing = Object.entries(headers)
    .filter(([_, value]) => !value)
    .map(([key, _]) => key);

  if (missing.length > 0) {
    console.error('Missing webhook headers:', missing);
    return null;
  }

  return headers as {
    requestId: string;
    userId: string;
    timestamp: string;
    signature: string;
  };
}
