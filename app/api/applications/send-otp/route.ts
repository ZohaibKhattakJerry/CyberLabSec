import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendApplicantOTPEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { email } = await bodyParse(req);
    if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });

    const existingApplicant = await prisma.applicant.findFirst({ where: { email: { equals: email, mode: "insensitive" } } });
    const existingEmployee = await prisma.employee.findFirst({ where: { email: { equals: email, mode: "insensitive" } } });
    if (existingApplicant || existingEmployee) {
      return NextResponse.json({ error: "This email is already registered." }, { status: 400 });
    }

    const code = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.emailVerification.upsert({
      where: { email },
      update: { otp: code, expiresAt, verified: false },
      create: { email, otp: code, expiresAt },
    });

    await sendApplicantOTPEmail(email, code);

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
