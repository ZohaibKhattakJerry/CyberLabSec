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
  const { pathname } = url;
  const response = NextResponse.next();

  // Admin routes — require admin role
  if (pathname.startsWith("/company") && pathname !== "/company/login") {
    const token = req.cookies.get("auth_token")?.value;
    if (!token) {
      return NextResponse.redirect(new URL("/company/login", req.url));
    }
    try {
      const { payload } = await jose.jwtVerify(token, JWT_SECRET);
      if (payload.role !== "admin") {
        return NextResponse.redirect(new URL("/company/login", req.url));
      }
    } catch {
      return NextResponse.redirect(new URL("/company/login", req.url));
    }
  }

  // Employee portal — require employee or admin role
  if (pathname.startsWith("/employee") && pathname !== "/employee/login") {
    const token = req.cookies.get("auth_token")?.value;
    if (!token) {
      return NextResponse.redirect(new URL("/employee/login", req.url));
    }
    try {
      const { payload } = await jose.jwtVerify(token, JWT_SECRET);
      if (payload.role !== "employee" && payload.role !== "admin") {
        return NextResponse.redirect(new URL("/employee/login", req.url));
      }
    } catch {
      return NextResponse.redirect(new URL("/employee/login", req.url));
    }
  }

  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  if (pathname.startsWith("/employee") || pathname.startsWith("/company")) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  return response;
}
