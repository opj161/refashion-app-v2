import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions } from '@/lib/session';
import type { SessionData } from '@/lib/types';

export async function middleware(request: NextRequest) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  const { user } = session;

  const { pathname } = request.nextUrl;

  // Allow access to login page and public assets/API routes
  if (pathname.startsWith('/login') || 
      pathname.startsWith('/_next/') || 
      pathname.startsWith('/api/') || // All API routes allowed
      pathname.startsWith('/uploads/') || // Allow access to uploaded files
      pathname.includes('.')) { // Allows requests for static files like .png, .css
    return NextResponse.next();
  }

  if (!user?.isLoggedIn) {
    // Redirect to login page, preserving the intended destination
    const loginUrl = new URL('/login', request.url);
    // loginUrl.searchParams.set('redirect_to', pathname); // Optional: redirect back after login
    return NextResponse.redirect(loginUrl);
  }
  // Check admin-only routes
  if (pathname.startsWith('/admin/')) {
    if (user.role !== 'admin') {
      // Redirect non-admin users to home page or show 403
      return NextResponse.redirect(new URL('/', request.url));
    }
    // Allow admin users to access admin routes only if they explicitly navigate to them
    // This prevents automatic redirects to admin areas
  }

  return NextResponse.next();
}

// Define which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - login page itself
     *
     * Or files with extensions (e.g. .png)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|login|.*\\.).*)',
  ],
};
