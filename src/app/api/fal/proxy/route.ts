import { type NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { route } from '@fal-ai/server-proxy/nextjs';
import { sessionOptions } from '@/lib/session-config';
import type { SessionData } from '@/lib/types';

// This securely handles forwarding requests and adding the
// FAL_KEY environment variable on the server.
// Each handler is wrapped with session authentication to prevent
// unauthenticated abuse of FAL API credits.

async function requireAuth(): Promise<NextResponse | null> {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.user?.isLoggedIn) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

export async function GET(request: NextRequest) {
  const denied = await requireAuth();
  if (denied) return denied;
  return route.GET(request);
}

export async function POST(request: NextRequest) {
  const denied = await requireAuth();
  if (denied) return denied;
  return route.POST(request);
}

export async function PUT(request: NextRequest) {
  const denied = await requireAuth();
  if (denied) return denied;
  return route.PUT(request);
}
