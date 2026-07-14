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

    await sendEmail({
      to: email,
      subject: "CyberLabSec Application - Verification Code",
      html: `<div style="font-family:sans-serif;padding:24px;color:#333;"><h2 style="color:#7c3aed;">CyberLabSec</h2><p>Your application verification code:</p><div style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#7c3aed;padding:16px 24px;background:#f5f3ff;border-radius:8px;display:inline-block;">${code}</div><p style="color:#666;font-size:14px;">Expires in 10 minutes. Do not share this code.</p></div>`,
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
