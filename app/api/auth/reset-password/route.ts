import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();
    if (!token || !password) return NextResponse.json({ error: "Missing token or password" }, { status: 400 });

    const employee = await prisma.employee.findUnique({ where: { resetToken: token } });
    if (!employee || !employee.resetTokenExpiry || employee.resetTokenExpiry < new Date()) {
      return NextResponse.json({ error: "Invalid or expired reset token" }, { status: 400 });
    }

    await prisma.employee.update({
      where: { id: employee.id },
      data: { 
        passwordHash: password, // In production, hash this password
        resetToken: null, 
        resetTokenExpiry: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
