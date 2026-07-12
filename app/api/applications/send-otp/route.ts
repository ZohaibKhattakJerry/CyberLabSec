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

    await prisma.emailVerification.create({
      data: { email, code, expiresAt },
    });

    await sendEmail({
      to: email,
      subject: "CyberLabSec Application - Verification Code",
      text: `Your verification code is: ${code}\nThis code will expire in 10 minutes.`,
      html: `<div style="font-family:sans-serif;color:#333;"><h2>CyberLabSec Application</h2><p>Your verification code is: <strong>${code}</strong></p><p>This code will expire in 10 minutes.</p></div>`,
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
