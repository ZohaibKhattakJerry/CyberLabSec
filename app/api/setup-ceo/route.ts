import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  const ADMIN_CODE = "CyberLabSec";
  const password = "ZohaibSadiq";
  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.employee.upsert({
    where: { employeeCode: ADMIN_CODE },
    update: { passwordHash: passwordHash },
    create: {
      employeeCode: ADMIN_CODE,
      name: "Zohaib Sadiq (CEO)",
      email: "ceo@cyberlabsec.tech",
      designation: "CEO",
      employmentType: "Full-time",
      status: "Active",
      passwordHash: passwordHash,
      mustResetPassword: false,
      startDate: new Date(),
    }
  });

  return NextResponse.json({ success: true, message: "CEO user updated/created successfully", adminId: admin.employeeCode });
}
