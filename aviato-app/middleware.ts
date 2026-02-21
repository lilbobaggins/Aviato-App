import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirect homepage to /desktop which handles both desktop and mobile layouts responsively
  if (pathname === '/') {
    const url = request.nextUrl.clone();
    url.pathname = '/desktop';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Only run middleware on page routes, skip static files and API
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
