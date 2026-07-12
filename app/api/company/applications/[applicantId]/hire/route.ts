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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ applicantId: string }> }
) {
  const auth = await getAuthFromCookies();
  if (!auth || auth.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { customMessage, offerLetterFileBase64 } = await req.json();
  const { applicantId } = await params;

  const applicant = await prisma.applicant.findUnique({
    where: { id: applicantId },
    include: { jobPosting: true },
  });

  if (!applicant) return NextResponse.json({ error: "Applicant not found" }, { status: 404 });
  
  const existingEmployee = await prisma.employee.findUnique({ where: { applicantId: applicant.id } });
  if (existingEmployee) return NextResponse.json({ error: "Employee record already exists" }, { status: 409 });

  // Prevent 500 error if email is already in use by another manual employee
  const existingEmail = await prisma.employee.findUnique({ where: { email: applicant.email } });
  if (existingEmail) return NextResponse.json({ error: "An employee with this email already exists." }, { status: 409 });

  const tempPassword = crypto.randomBytes(6).toString("base64url");
  const passwordHash = await bcrypt.hash(tempPassword, 12);
  let employeeCode = generateEmployeeCode();

  // Ensure unique code
  while (await prisma.employee.findUnique({ where: { employeeCode } })) {
    employeeCode = generateEmployeeCode();
  }

  const employee = await prisma.employee.create({
    data: {
      employeeCode,
      name: applicant.fullName,
      email: applicant.email,
      photoUrl: applicant.photoUrl,
      designation: applicant.jobPosting.title,
      employmentType: applicant.jobPosting.type === "Internship" ? "Intern" : "Employee",
      startDate: new Date(),
      status: "Active",
      passwordHash,
      mustResetPassword: true,
      applicantId: applicant.id,
    },
  });

  await prisma.applicant.update({
    where: { id: applicantId },
    data: { status: "Hired" },
  });

  const portalUrl = `https://cyberlabsec.tech/employee/login`;
  await sendEmployeeCredentials(
    applicant.email, 
    applicant.fullName, 
    employeeCode, 
    tempPassword, 
    portalUrl, 
    offerLetterFileBase64, 
    customMessage
  ).catch(console.error);

  await prisma.activityLog.create({
    data: {
      actorId: auth.sub, actorType: "Admin", action: "EMPLOYEE_CREATED",
      metadata: JSON.stringify({ employeeId: employee.id, employeeCode, applicantId }),
    },
  }).catch(() => {});

  return NextResponse.json({ success: true, employeeCode, employeeId: employee.id });
}
