import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { email } = await bodyParse(req);
    if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });

    const code = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.emailVerification.upsert({
      where: { email },
      update: { otp: code, expiresAt, verified: false },
      create: { email, otp: code, expiresAt },
    });

    const htmlContent = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#09090b;">
        <h2 style="color:#8b5cf6;margin-bottom:20px;font-size:24px;">CyberLabSec</h2>
        <div style="background-color:#ffffff;border:1px solid #e4e4e7;border-radius:12px;padding:32px;">
          <h3 style="margin-top:0;font-size:18px;color:#09090b;">Your Verification Code</h3>
          <p style="color:#52525b;font-size:15px;line-height:1.6;">Please use the code below to verify your email address and continue with your application.</p>
          <div style="margin:32px 0;text-align:center;">
            <div style="display:inline-block;background:#f5f3ff;border:1px solid #ddd6fe;border-radius:8px;padding:16px 32px;font-size:36px;font-weight:bold;letter-spacing:12px;color:#8b5cf6;font-family:monospace;">${code}</div>
          </div>
          <p style="color:#71717a;font-size:14px;margin-bottom:0;">This code expires in 10 minutes. Do not share this code with anyone.</p>
        </div>
      </div>
    `;

    await sendEmail({
      to: email,
      subject: "CyberLabSec Application - Verification Code",
      html: htmlContent,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to send OTP:", error);
    return NextResponse.json({ error: "Failed to send verification code" }, { status: 500 });
  }
}

async function bodyParse(req: Request) {
  const text = await req.text();
  try { return JSON.parse(text); } catch { return {}; }
}
