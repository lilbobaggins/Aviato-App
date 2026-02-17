import { NextRequest, NextResponse } from 'next/server';

// Detect mobile devices from User-Agent
function isMobile(ua: string): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile/i.test(ua);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ua = request.headers.get('user-agent') || '';

  // Only redirect the homepage — don't touch /desktop, /api, or static assets
  if (pathname === '/') {
    if (!isMobile(ua)) {
      // Desktop browser → redirect to /desktop
      const url = request.nextUrl.clone();
      url.pathname = '/desktop';
      return NextResponse.redirect(url);
    }
    // Mobile browser (or Capacitor app) → stay on / (mobile UI)
  }

  return NextResponse.next();
}

export const config = {
  // Only run middleware on page routes, skip static files and API
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
