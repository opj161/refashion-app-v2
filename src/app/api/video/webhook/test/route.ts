import { NextRequest, NextResponse } from 'next/server';

// Simple test endpoint to verify webhook URL construction
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const historyItemId = url.searchParams.get('historyItemId');
  const username = url.searchParams.get('username');

  return NextResponse.json({
    message: 'Webhook endpoint is reachable',
    received_params: {
      historyItemId,
      username
    },
    timestamp: new Date().toISOString(),
    environment: {
      app_url: process.env.NEXT_PUBLIC_APP_URL,
      node_env: process.env.NODE_ENV
    }
  });
}

export async function POST() {
  return NextResponse.json({
    message: 'Webhook test endpoint - POST method working',
    timestamp: new Date().toISOString()
  });
}
