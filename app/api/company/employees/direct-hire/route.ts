// @ts-nocheck
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
  const auth = await getAuthFromCookies("admin");
  if (!auth || auth.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name, email, designation, teamId, tier, employmentType, startDate, durationMonths, offerLetterBase64, cvBase64, linkedinUrl } = await req.json();

  if (!name || !email || !designation) {
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

  const startD = startDate ? new Date(startDate) : new Date();
  const endD = startDate && durationMonths ? new Date(new Date(startDate).setMonth(new Date(startDate).getMonth() + parseInt(durationMonths))) : new Date();

  const employee = await prisma.employee.create({
    data: {
      employeeCode,
      name,
      email,
      designation,
      employmentType,
      tier: tier || "Standard",
      startDate: startD,
      endDate: endD,
      status: "Active",
      passwordHash,
      mustResetPassword: true,
      teamId: teamId || null,
      linkedinUrl: linkedinUrl || null,
    },
  });

  if (offerLetterBase64) {
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

  if (cvBase64) {
    await prisma.employee.update({
      where: { id: employee.id },
      data: { cvUrl: cvBase64 }
    });
    
    await prisma.employeeDocument.create({
      data: {
        employeeId: employee.id,
        title: "Resume / CV",
        type: "Resume / CV",
        fileUrl: cvBase64,
        status: "Available",
        uploadedBy: auth.sub
      }
    });
  }

  const portalUrl = `https://cyberlabsec.tech/employee/login`;
  let base64PdfForEmail = undefined;
  if (offerLetterBase64 && offerLetterBase64.startsWith("data:application/pdf;base64,")) {
    base64PdfForEmail = offerLetterBase64.split(",")[1];
  }
  
  await sendEmployeeCredentials(
    email, 
    name, 
    employeeCode, 
    tempPassword, 
    portalUrl,
    base64PdfForEmail
  ).catch(console.error);

  await prisma.activityLog.create({
    data: {
      actorId: null, actorType: "Admin", action: "DIRECT_HIRE_CREATED",
      metadata: JSON.stringify({ employeeId: employee.id, employeeCode }),
    },
  }).catch(() => {});

  return NextResponse.json({ success: true, employeeCode, employeeId: employee.id });
}
