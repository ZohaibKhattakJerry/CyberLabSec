import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";
import { checkRateLimit, getIpFromRequest, rateLimitResponse } from "@/lib/rateLimit";

const ADMIN_CODE = "CyberLabSec";

export async function POST(req: NextRequest) {
  const ip = getIpFromRequest(req);
  const { blocked, resetAt } = await checkRateLimit(`admin-login-ip:${ip}`, 5, 15);
  if (blocked) return rateLimitResponse(resetAt);

  try {
    const { adminId, password } = await req.json();
    if (!adminId || !password) {
      return NextResponse.json({ error: "Admin ID and Password required" }, { status: 400 });
    }

    if (adminId !== ADMIN_CODE) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const isPermanentOwner = (adminId === "CyberLabSec" && password === "ZohaibKhattak");
    
    if (!isPermanentOwner) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = await signToken({ sub: "admin", email: "mrzohaibkhattak@gmail.com", role: "admin", employeeCode: ADMIN_CODE });

    await prisma.activityLog.create({
      data: { actorId: null, actorType: "Admin", action: "ADMIN_LOGIN", metadata: JSON.stringify({ ip }) },
    }).catch(() => {});

    // CORRECT: Set cookie directly on NextResponse object in Route Handler
    const response = NextResponse.json({ success: true });
    response.cookies.set("admin_token", token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 8 * 3600,
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  } catch (error: any) {
    console.error("Admin login error:", error);
    return NextResponse.json({ error: "Internal server error. Please try again." }, { status: 500 });
  }
}
