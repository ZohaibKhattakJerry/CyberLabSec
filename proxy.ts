import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import * as jose from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "dev-secret-change-me"
);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin routes — require admin role
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const token = request.cookies.get("auth_token")?.value;
    if (!token) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    try {
      const { payload } = await jose.jwtVerify(token, JWT_SECRET);
      if (payload.role !== "admin") {
        return NextResponse.redirect(new URL("/admin/login", request.url));
      }
    } catch {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  // Employee portal — require employee or admin role
  if (pathname.startsWith("/portal") && pathname !== "/portal/login") {
    const token = request.cookies.get("auth_token")?.value;
    if (!token) {
      return NextResponse.redirect(new URL("/portal/login", request.url));
    }
    try {
      const { payload } = await jose.jwtVerify(token, JWT_SECRET);
      if (payload.role !== "employee" && payload.role !== "admin") {
        return NextResponse.redirect(new URL("/portal/login", request.url));
      }
    } catch {
      return NextResponse.redirect(new URL("/portal/login", request.url));
    }
  }

  // Add security headers to all responses
  const response = NextResponse.next();
  
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Noindex for portal and admin pages
  if (pathname.startsWith("/portal") || pathname.startsWith("/admin")) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  return response;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/portal/:path*",
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
