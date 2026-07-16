import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { sendEmail } from "@/lib/email";

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

    // Send actual password reset email
    const resetLink = `https://cyberlabsec.tech/employee/reset-password?token=${resetToken}`;
    await sendEmail({
      to: email,
      subject: "Reset Your CyberLabSec Password",
      html: `
        <h1 style="font-size:22px;font-weight:800;color:#000000;margin:0 0 12px 0;">Password Reset Request</h1>
        <p style="color:#555555;font-size:15px;line-height:1.7;margin:0 0 24px 0;">
          We received a request to reset the password for your CyberLabSec employee account.
          Click the button below to set a new password. This link expires in <strong>1 hour</strong>.
        </p>
        <div style="text-align:center;margin:0 0 28px 0;">
          <a href="${resetLink}" style="display:inline-block;background-color:#7e22ce;color:#ffffff !important;text-decoration:none !important;padding:12px 32px;border-radius:6px;font-weight:600;font-size:14px;">Reset My Password &rarr;</a>
        </div>
        <p style="color:#888888;font-size:13px;line-height:1.6;">
          If you did not request a password reset, you can safely ignore this email. Your password will not change.
        </p>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
