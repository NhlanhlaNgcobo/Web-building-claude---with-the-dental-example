import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ADMIN_COOKIE, isValidSessionValue } from '@/lib/admin/session';

/**
 * Request proxy.
 *
 * In Next.js 16 this file replaces the deprecated middleware convention; the
 * behaviour is identical and only the file and export names changed.
 *
 * Its single job is to keep unauthenticated requests out of the staff area
 * before any page or route handler runs. It is a first line rather than the
 * only one: every admin route handler and page re-checks the session itself,
 * because the proxy is, by design, separable from the render path and should
 * not be the sole thing standing between a request and patient data.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // The login page and the sign-in endpoint have to stay reachable.
  if (pathname === '/admin/login' || pathname === '/api/admin/session') {
    return NextResponse.next();
  }

  const authenticated = await isValidSessionValue(
    request.cookies.get(ADMIN_COOKIE)?.value,
  );

  if (authenticated) return NextResponse.next();

  // An API request gets a status it can act on. A page request gets a
  // redirect, carrying where it was going so sign-in can return there.
  if (pathname.startsWith('/api/')) {
    return NextResponse.json(
      {
        error: {
          code: 'UNAUTHORIZED',
          message: 'Please sign in to the staff area.',
        },
      },
      { status: 401, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const loginUrl = new URL('/admin/login', request.url);
  loginUrl.searchParams.set('next', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
