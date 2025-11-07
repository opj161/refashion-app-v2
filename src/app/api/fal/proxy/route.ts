import { route } from '@fal-ai/server-proxy/nextjs';

// This securely handles forwarding requests and adding the
// FAL_KEY environment variable on the server.
export const { GET, POST, PUT } = route;
