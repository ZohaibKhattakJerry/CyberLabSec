import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/auth";
import { checkRateLimit, getIpFromRequest } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const ip = getIpFromRequest(req);
  const { blocked, resetAt } = await checkRateLimit(`login:${ip}`, 5, 15);
  if (blocked) {
    return NextResponse.json({ error: `Too many login attempts. Try again after ${resetAt.toLocaleTimeString()}.` }, { status: 429 });
  }

  const { employeeCode, password } = await req.json();
  if (!employeeCode || !password) {
    return NextResponse.json({ error: "Employee ID and password are required" }, { status: 400 });
  }

  const employee = await prisma.employee.findUnique({ where: { employeeCode } });
  if (!employee || employee.status !== "Active") {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, employee.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = await signToken({ sub: employee.id, email: employee.email, role: "employee", employeeCode: employee.employeeCode });

  // Log activity
  await prisma.activityLog.create({
    data: { actorId: employee.id, actorType: "Employee", action: "LOGIN", metadata: JSON.stringify({ ip }) },
  }).catch(() => {});

  const res = NextResponse.json({
    success: true,
    mustResetPassword: employee.mustResetPassword,
    employeeCode: employee.employeeCode,
  });
  res.cookies.set("auth_token", token, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 8 * 3600, secure: process.env.NODE_ENV === "production" });
  return res;
}
