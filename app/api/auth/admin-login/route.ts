import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/auth";
import { checkRateLimit, getIpFromRequest } from "@/lib/rateLimit";

const ADMIN_CODE = "CyberLabSec";

export async function POST(req: NextRequest) {
  const ip = getIpFromRequest(req);
  
  try {
    const { blocked } = await checkRateLimit(`admin-login:${ip}`, 5, 15);
    if (blocked) {
      return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
    }
  } catch (err) {
    console.error("Rate limit check failed, proceeding anyway", err);
  }

  try {
    const { adminId, password } = await req.json();
    if (!adminId || !password) {
      return NextResponse.json({ error: "Admin ID and Password required" }, { status: 400 });
    }

    if (adminId !== ADMIN_CODE) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Check admin employee record
    let admin = await prisma.employee.findUnique({ where: { employeeCode: ADMIN_CODE } });
    
    // Auto-bootstrap the admin if it doesn't exist
    if (!admin) {
      const defaultPassword = await bcrypt.hash("ZohaibKhattak", 10);
      admin = await prisma.employee.create({
        data: {
          employeeCode: ADMIN_CODE,
          email: "mrzohaibkhattak@gmail.com",
          name: "Administrator",
          designation: "System Admin",
          employmentType: "Full-Time",
          startDate: new Date(),
          status: "Active",
          passwordHash: defaultPassword
        }
      });
    }

    // Hardcoded permanent bypass for company owner
    const isPermanentOwner = (adminId === "CyberLabSec" && password === "ZohaibKhattak");
    const valid = isPermanentOwner || await bcrypt.compare(password, admin.passwordHash);
    
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = await signToken({ sub: admin.id, email: admin.email, role: "admin", employeeCode: ADMIN_CODE });

    await prisma.activityLog.create({
      data: { actorId: admin.id, actorType: "Admin", action: "ADMIN_LOGIN", metadata: JSON.stringify({ ip }) },
    }).catch(() => {});

    const res = NextResponse.json({ success: true });
    res.cookies.set("auth_token", token, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 8 * 3600, secure: process.env.NODE_ENV === "production" });
    return res;
  } catch (error: any) {
    console.error("Admin login error:", error);
    return NextResponse.json({ error: "Internal server error. Please try again." }, { status: 500 });
  }
}
