import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as jose from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "dev-secret-change-me"
);

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

export async function proxy(req: NextRequest) {
  const url = req.nextUrl.clone();
  const hostname = req.headers.get('host') || '';

  // 1. Get the specific subdomain (e.g., 'careers', 'employee', 'company')
  const currentHost = hostname.replace(`.${process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'cyberlabsec.tech'}`, '');

  // 2. Perform subdomain rewrites
  if (currentHost.startsWith('careers')) {
    url.pathname = `/careers${url.pathname === '/' ? '' : url.pathname}`;
  } else if (currentHost.startsWith('employee')) {
    url.pathname = `/portal${url.pathname === '/' ? '' : url.pathname}`;
  } else if (currentHost.startsWith('company') || currentHost.startsWith('admin')) {
    url.pathname = `/admin${url.pathname === '/' ? '' : url.pathname}`;
  }

  // 3. Security Headers & Auth Checks (formerly in proxy.ts)
  const response = NextResponse.rewrite(url);
  const { pathname } = url;

  // Admin routes — require admin role
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const token = req.cookies.get("auth_token")?.value;
    if (!token) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
    try {
      const { payload } = await jose.jwtVerify(token, JWT_SECRET);
      if (payload.role !== "admin") {
        return NextResponse.redirect(new URL("/admin/login", req.url));
      }
    } catch {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }

  // Employee portal — require employee or admin role
  if (pathname.startsWith("/portal") && pathname !== "/portal/login") {
    const token = req.cookies.get("auth_token")?.value;
    if (!token) {
      return NextResponse.redirect(new URL("/portal/login", req.url));
    }
    try {
      const { payload } = await jose.jwtVerify(token, JWT_SECRET);
      if (payload.role !== "employee" && payload.role !== "admin") {
        return NextResponse.redirect(new URL("/portal/login", req.url));
      }
    } catch {
      return NextResponse.redirect(new URL("/portal/login", req.url));
    }
  }

  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  if (pathname.startsWith("/portal") || pathname.startsWith("/admin")) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  return response;
}
