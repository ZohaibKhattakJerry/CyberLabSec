import { NextResponse } from "next/server";
import { getAuthFromCookies } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
  const auth = await getAuthFromCookies("admin");
  if (!auth || auth.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json().catch(() => ({}));
    const newEmail = body.email;
    const action = body.action || "settings"; // "backup", "restore", "settings"

    let config = await prisma.adminConfig.findUnique({ where: { id: "singleton" } });
    let configData = config ? JSON.parse(config.data) : {};

    if (newEmail && newEmail !== configData.companyEmail) {
      const existingApplicant = await prisma.applicant.findFirst({ where: { email: { equals: newEmail, mode: "insensitive" } } });
      const existingEmployee = await prisma.employee.findFirst({ where: { email: { equals: newEmail, mode: "insensitive" } } });
      if (existingApplicant || existingEmployee) {
        return NextResponse.json({ error: "This email is already registered." }, { status: 400 });
      }
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set OTP and expiry (10 minutes)
    configData.currentOtp = otp;
    configData.otpExpiry = Date.now() + 10 * 60 * 1000;
    
    await prisma.adminConfig.upsert({
      where: { id: "singleton" },
      create: { id: "singleton", data: JSON.stringify(configData) },
      update: { data: JSON.stringify(configData) }
    });

    let actionText = "change the company profile or security settings";
    let subjectText = "Verify Your Action";
    
    if (action === "backup") {
      actionText = "download an encrypted backup of the entire platform";
      subjectText = "Verify Backup Download";
    } else if (action === "restore") {
      actionText = "restore the database from an existing backup file (this overwrites current data)";
      subjectText = "Verify Backup Restore";
    } else if (action === "clear_data") {
      actionText = "PERMANENTLY DELETE ALL DATABASE RECORDS (Danger Zone)";
      subjectText = "CRITICAL: Verify Database Wipe";
    }

    // Send OTP email
    await sendEmail({
      to: "mrzohaibkhattak@gmail.com",
      subject: `Security Alert: ${subjectText} - CyberLabSec`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: #2563eb;">CyberLabSec Security Verification</h2>
          <p>An attempt was made to ${actionText}.</p>
          <p>Please use the following OTP to verify this action:</p>
          <div style="font-size: 24px; font-weight: bold; background: #f3f4f6; padding: 10px 20px; display: inline-block; border-radius: 6px; letter-spacing: 2px;">
            ${otp}
          </div>
          <p>This code will expire in 10 minutes. If you did not request this change, please secure your account immediately.</p>
        </div>
      `
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Failed to request OTP:", err);
    return NextResponse.json({ error: "Failed to request OTP" }, { status: 500 });
  }
}
