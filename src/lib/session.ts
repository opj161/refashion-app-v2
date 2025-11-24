import 'server-only';

import type { SessionOptions } from 'iron-session';
import type { SessionData } from '@/lib/types';

import { sessionOptions } from './session-config';

export { sessionOptions };


// Augment the IronSession type definition if you're using TypeScript
// to include the structure of your session data.
declare module 'iron-session' {
  interface IronSessionData {
    user?: SessionData['user'];
  }
}
