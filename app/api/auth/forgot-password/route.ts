import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });

    const employee = await prisma.employee.findUnique({ where: { email } });
    if (!employee) {
      // Don't reveal if user exists or not for security
      return NextResponse.json({ success: true });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    await prisma.employee.update({
      where: { id: employee.id },
      data: { resetToken, resetTokenExpiry },
    });

    // Simulate sending email (in a real app, send via SendGrid, Mailgun, etc.)
    const resetLink = `https://cyberlabsec.tech/employee/reset-password?token=${resetToken}`;
    console.log(`[SIMULATED EMAIL] To: ${email} | Subject: Password Reset | Body: Click here to reset: ${resetLink}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
