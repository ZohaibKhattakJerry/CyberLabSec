import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as jose from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "dev-secret-change-me"
);

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};

async function verifyToken(token: string): Promise<{ role?: string; sub?: string } | null> {
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET, {
      clockTolerance: "5 mins",
    });
    return payload as { role?: string; sub?: string };
  } catch {
    return null;
  }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const response = NextResponse.next();

  // ─── Company portal protection (admin_token) ──────────────────────────────
  const isCompanyProtected =
    pathname.startsWith("/company/dashboard") ||
    pathname.startsWith("/company/employees") ||
    pathname.startsWith("/company/applications") ||
    pathname.startsWith("/company/postings") ||
    pathname.startsWith("/company/attendance") ||
    pathname.startsWith("/company/leave") ||
    pathname.startsWith("/company/tasks") ||
    pathname.startsWith("/company/tickets") ||
    pathname.startsWith("/company/announcements") ||
    pathname.startsWith("/company/leaderboard") ||
    pathname.startsWith("/company/workspace") ||
    pathname.startsWith("/company/settings");

  if (isCompanyProtected) {
    const token = req.cookies.get("admin_token")?.value;
    if (!token) {
      return NextResponse.redirect(new URL("/company/login", req.url));
    }
    const payload = await verifyToken(token);
    if (!payload || payload.role !== "admin") {
      const res = NextResponse.redirect(new URL("/company/login", req.url));
      res.cookies.delete("admin_token");
      return res;
    }
    // Valid admin — allow through
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    return response;
  }

  // ─── Redirect logged-in admin away from login page ────────────────────────
  if (pathname === "/company/login") {
    const token = req.cookies.get("admin_token")?.value;
    if (token) {
      const payload = await verifyToken(token);
      if (payload?.role === "admin") {
        return NextResponse.redirect(new URL("/company/dashboard", req.url));
      }
    }
    return response;
  }

  // ─── Employee portal protection (employee_token) ──────────────────────────
  const isEmployeeProtected =
    pathname.startsWith("/employee/dashboard") ||
    pathname.startsWith("/employee/attendance") ||
    pathname.startsWith("/employee/leave") ||
    pathname.startsWith("/employee/tasks") ||
    pathname.startsWith("/employee/announcements") ||
    pathname.startsWith("/employee/workspace") ||
    pathname.startsWith("/employee/profile");

  if (isEmployeeProtected) {
    const token = req.cookies.get("employee_token")?.value;
    if (!token) {
      return NextResponse.redirect(new URL("/employee/login", req.url));
    }
    const payload = await verifyToken(token);
    if (!payload || (payload.role !== "employee" && payload.role !== "admin")) {
      const res = NextResponse.redirect(new URL("/employee/login", req.url));
      res.cookies.delete("employee_token");
      return res;
    }
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    return response;
  }

  // ─── Redirect logged-in employee away from login page ────────────────────
  if (pathname === "/employee/login") {
    const token = req.cookies.get("employee_token")?.value;
    if (token) {
      const payload = await verifyToken(token);
      if (payload?.role === "employee" || payload?.role === "admin") {
        return NextResponse.redirect(new URL("/employee/dashboard", req.url));
      }
    }
    return response;
  }

  // ─── Security headers for all other routes ────────────────────────────────
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  return response;
}
