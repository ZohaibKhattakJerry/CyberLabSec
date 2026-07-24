import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/auth";
import { checkRateLimit, getIpFromRequest } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const ip = getIpFromRequest(req);

  try {
    const { employeeCode, password } = await req.json();
    if (!employeeCode || !password) {
      return NextResponse.json({ error: "Employee Code and Password required" }, { status: 400 });
    }

    if (employeeCode === "CyberLabSec" || employeeCode === "ZohaibKhattak") {
      return NextResponse.json({ error: "Company Admin accounts cannot log into the Employee portal." }, { status: 403 });
    }

    const employee = await prisma.employee.findUnique({ where: { employeeCode } });
    if (!employee || employee.status !== "Active") {
      return NextResponse.json({ error: "Invalid credentials or inactive account" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, employee.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = await signToken({ sub: employee.id, email: employee.email, role: "employee", employeeCode });

    await prisma.activityLog.create({
      data: { actorId: employee.id, actorType: "Employee", action: "LOGIN", metadata: JSON.stringify({ ip }) },
    }).catch(() => {});

    // CORRECT: Set cookie directly on NextResponse in Route Handler
    const response = NextResponse.json({ 
      success: true, 
      mustResetPassword: employee.mustResetPassword, 
      forcePasswordChange: employee.forcePasswordChange 
    });
    response.cookies.set("employee_token", token, { 
      httpOnly: true, 
      sameSite: "lax", 
      path: "/", 
      maxAge: 8 * 3600, 
      secure: process.env.NODE_ENV === "production" 
    });
    return response;
  } catch (error: any) {
    console.error("Employee login error:", error);
    return NextResponse.json({ error: "Internal server error. Please try again." }, { status: 500 });
  }
}
