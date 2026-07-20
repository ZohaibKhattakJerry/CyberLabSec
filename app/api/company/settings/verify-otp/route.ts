import { NextResponse } from "next/server";
import { getAuthFromCookies } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const auth = await getAuthFromCookies("admin");
  if (!auth || auth.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { otp, companyData, newPassword } = await req.json();
    
    let config = await prisma.adminConfig.findUnique({ where: { id: "singleton" } });
    if (!config) return NextResponse.json({ error: "No OTP found" }, { status: 400 });
    
    let configData = JSON.parse(config.data);
    
    if (!configData.currentOtp || configData.currentOtp !== otp) {
      return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
    }
    
    if (!configData.otpExpiry || Date.now() > configData.otpExpiry) {
      return NextResponse.json({ error: "OTP has expired" }, { status: 400 });
    }
    
    // OTP verified successfully, clear it
    delete configData.currentOtp;
    delete configData.otpExpiry;
    
    // Update company data in config if provided
    if (companyData) {
      configData = { ...configData, ...companyData };
      await prisma.adminConfig.update({
        where: { id: "singleton" },
        data: { data: JSON.stringify(configData) }
      });
    }

    // Update admin password if provided
    if (newPassword) {
      const passwordHash = await bcrypt.hash(newPassword, 10);
      await prisma.employee.update({
        where: { employeeCode: "CyberLabSec" },
        data: { passwordHash }
      });
    }

    // Also update config to clear OTP just in case companyData wasn't provided
    if (!companyData) {
      await prisma.adminConfig.update({
        where: { id: "singleton" },
        data: { data: JSON.stringify(configData) }
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to verify OTP:", err);
    return NextResponse.json({ error: "Failed to verify OTP" }, { status: 500 });
  }
}
