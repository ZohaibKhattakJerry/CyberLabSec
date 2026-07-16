import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendEmployeeCredentials } from "@/lib/email";

function generateEmployeeCode(): string {
  const year = new Date().getFullYear();
  const rand = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `CL-${year}-${rand}`;
}

export async function POST(req: NextRequest) {
  const auth = await getAuthFromCookies();
  if (!auth || auth.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name, email, designation, teamId, tier, employmentType, startDate, offerLetterBase64 } = await req.json();

  if (!name || !email || !designation || !startDate) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const existingEmail = await prisma.employee.findUnique({ where: { email } });
  if (existingEmail) return NextResponse.json({ error: "An employee with this email already exists." }, { status: 409 });

  const tempPassword = crypto.randomBytes(6).toString("base64url");
  const passwordHash = await bcrypt.hash(tempPassword, 12);
  let employeeCode = generateEmployeeCode();

  while (await prisma.employee.findUnique({ where: { employeeCode } })) {
    employeeCode = generateEmployeeCode();
  }

  const employee = await prisma.employee.create({
    data: {
      employeeCode,
      name,
      email,
      designation,
      employmentType,
      tier: tier || "Standard",
      startDate: new Date(startDate),
      status: "Active",
      passwordHash,
      mustResetPassword: true,
      teamId: teamId || null,
    },
  });

  let base64Pdf = undefined;
  if (offerLetterBase64 && offerLetterBase64.startsWith("data:application/pdf;base64,")) {
    base64Pdf = offerLetterBase64.split(",")[1];
    await prisma.employeeDocument.create({
      data: {
        employeeId: employee.id,
        title: "Offer Letter",
        type: "Offer Letter",
        fileUrl: offerLetterBase64,
        status: "Approved",
        uploadedBy: auth.sub
      }
    });
  }

  const portalUrl = `https://cyberlabsec.tech/employee/login`;
  await sendEmployeeCredentials(
    email, 
    name, 
    employeeCode, 
    tempPassword, 
    portalUrl,
    base64Pdf
  ).catch(console.error);

  await prisma.activityLog.create({
    data: {
      actorId: auth.sub, actorType: "Admin", action: "DIRECT_HIRE_CREATED",
      metadata: JSON.stringify({ employeeId: employee.id, employeeCode }),
    },
  }).catch(() => {});

  return NextResponse.json({ success: true, employeeCode, employeeId: employee.id });
}
