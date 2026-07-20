import { NextRequest, NextResponse } from "next/server";
import { clearAuthCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const role = req.nextUrl.searchParams.get("role") || "employee";
  const res = NextResponse.json({ success: true });
  clearAuthCookie(res, role);
  return res;
}
