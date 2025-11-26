import type { SessionOptions } from 'iron-session';

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET as string,
  cookieName: 'refashion-local-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production' && (process.env.FORCE_HTTPS === 'true' || process.env.NEXT_PUBLIC_APP_URL?.startsWith('https:')),
    httpOnly: true,
    sameSite: 'lax',
  },
  ttl: 60 * 60 * 24 * 7 // 7 days
};
