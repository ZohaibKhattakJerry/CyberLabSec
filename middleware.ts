import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const hostname = req.headers.get('host') || '';

  // Get the specific subdomain (e.g., 'careers', 'employee', 'company')
  // In production, hostname might be 'careers.cyberlabsec.tech'
  // In development, it might be 'careers.localhost:3000'
  const currentHost = hostname.replace(`.${process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'cyberlabsec.tech'}`, '');

  // Subdomain routing logic
  if (currentHost.startsWith('careers')) {
    // Rewrite careers.cyberlabsec.tech to /careers route
    url.pathname = `/careers${url.pathname === '/' ? '' : url.pathname}`;
    return NextResponse.rewrite(url);
  }

  if (currentHost.startsWith('employee')) {
    // Rewrite employee.cyberlabsec.tech to /portal route
    url.pathname = `/portal${url.pathname === '/' ? '' : url.pathname}`;
    return NextResponse.rewrite(url);
  }

  if (currentHost.startsWith('company') || currentHost.startsWith('admin')) {
    // Rewrite company.cyberlabsec.tech to /admin route
    url.pathname = `/admin${url.pathname === '/' ? '' : url.pathname}`;
    return NextResponse.rewrite(url);
  }

  // If no subdomain is matched or it's the root domain (cyberlabsec.tech), allow the request to proceed as normal to the root layout (Landing page)
  return NextResponse.next();
}
