// src/lib/fal-client.ts
import { fal } from '@fal-ai/client';

// Only configure the proxy on the client side
if (typeof window !== 'undefined') {
  fal.config({
    proxyUrl: '/api/fal/proxy',
  });
}

export { fal };
