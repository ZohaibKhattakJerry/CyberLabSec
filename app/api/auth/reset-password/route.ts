import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getAuthFromCookies } from "@/lib/auth";
import { checkRateLimit, getIpFromRequest, rateLimitResponse } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const ip = getIpFromRequest(req);
  const { blocked, resetAt } = await checkRateLimit(`reset-password-ip:${ip}`, 5, 15);
  if (blocked) return rateLimitResponse(resetAt);

  try {
    const { token, password } = await req.json();
    if (!password) return NextResponse.json({ error: "Missing password" }, { status: 400 });

    let employeeId: string | null = null;

    if (token) {
      const employee = await prisma.employee.findUnique({ where: { resetToken: token } });
      if (!employee || !employee.resetTokenExpiry || employee.resetTokenExpiry < new Date()) {
        return NextResponse.json({ error: "Invalid or expired reset token" }, { status: 400 });
      }
      employeeId = employee.id;
    } else {
      const auth = await getAuthFromCookies("employee");
      if (!auth || !auth.sub) {
        return NextResponse.json({ error: "Unauthorized or missing token" }, { status: 401 });
      }
      employeeId = auth.sub;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.employee.update({
      where: { id: employeeId },
      data: { 
        passwordHash: hashedPassword,
        mustResetPassword: false,
        resetToken: null, 
        resetTokenExpiry: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("reset-password Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
