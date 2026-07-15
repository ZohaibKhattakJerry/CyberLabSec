import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getAuthFromCookies } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();
    if (!password) return NextResponse.json({ error: "Missing password" }, { status: 400 });

    let employeeId = null;

    if (token) {
      const employee = await prisma.employee.findUnique({ where: { resetToken: token } });
      if (!employee || !employee.resetTokenExpiry || employee.resetTokenExpiry < new Date()) {
        return NextResponse.json({ error: "Invalid or expired reset token" }, { status: 400 });
      }
      employeeId = employee.id;
    } else {
      const auth = await getAuthFromCookies();
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
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
