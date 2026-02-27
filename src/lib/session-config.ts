import type { SessionOptions } from 'iron-session';

const SESSION_SECRET_MIN_LENGTH = 32;

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  throw new Error(
    'SESSION_SECRET environment variable is not defined. Please set it in your .env file.'
  );
}
if (sessionSecret.length < SESSION_SECRET_MIN_LENGTH) {
  throw new Error(
    `SESSION_SECRET must be at least ${SESSION_SECRET_MIN_LENGTH} characters long (got ${sessionSecret.length}). iron-session requires a sufficiently long password for secure encryption.`
  );
}

export const sessionOptions: SessionOptions = {
  password: sessionSecret,
  cookieName: 'refashion-local-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production' && (process.env.FORCE_HTTPS === 'true' || process.env.NEXT_PUBLIC_APP_URL?.startsWith('https:')),
    httpOnly: true,
    sameSite: 'lax',
  },
  ttl: 60 * 60 * 24 * 7 // 7 days
};
