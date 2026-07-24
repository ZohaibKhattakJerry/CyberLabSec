import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { sendEmail } from "@/lib/email";
import { checkRateLimit, getIpFromRequest, rateLimitResponse } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const ip = getIpFromRequest(req);
  const { blocked, resetAt } = await checkRateLimit(`forgot-password-ip:${ip}`, 3, 15);
  if (blocked) return rateLimitResponse(resetAt);

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
        <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background-color: #0f1423; padding: 40px; border-radius: 16px; border: 1px solid rgba(168, 85, 247, 0.2); box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5); color: #ffffff;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="font-size: 28px; font-weight: 800; background: linear-gradient(90deg, #A855F7, #3B82F6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 0;">Password Reset</h1>
          </div>
          <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
            We received a request to reset the password for your CyberLabSec employee account.
            Click the button below to securely set a new password. This highly sensitive link will expire in <strong>1 hour</strong>.
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #A855F7 0%, #3B82F6 100%); color: #ffffff !important; text-decoration: none !important; padding: 14px 36px; border-radius: 8px; font-weight: 700; font-size: 15px; box-shadow: 0 4px 15px rgba(168, 85, 247, 0.4); transition: transform 0.2s;">Securely Reset Password</a>
          </div>
          <p style="color: #64748b; font-size: 13px; line-height: 1.5; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 20px;">
            If you did not request this reset, please ignore this email or contact the security team immediately.
          </p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
