import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ applicantId: string }> }
) {
  const auth = await getAuthFromCookies();
  if (!auth || auth.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { applicantId } = await params;

  const applicant = await prisma.applicant.findUnique({
    where: { id: applicantId },
    include: { jobPosting: true }
  });

  if (!applicant) return NextResponse.json({ error: "Applicant not found" }, { status: 404 });
  
  const existingEmployee = await prisma.employee.findUnique({ where: { applicantId: applicant.id } });
  if (existingEmployee) return NextResponse.json({ error: "Employee record already exists" }, { status: 409 });

  // Update applicant status
  await prisma.applicant.update({
    where: { id: applicant.id },
    data: { status: "Hired" }
  });

  const { default: crypto } = await import("crypto");
  const { default: bcrypt } = await import("bcryptjs");

  const year = new Date().getFullYear();
  const code = `CL-${year}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
  const rawPassword = crypto.randomBytes(4).toString("hex");
  const passwordHash = await bcrypt.hash(rawPassword, 10);

  const employee = await prisma.employee.create({
    data: {
      email: applicant.email,
      name: applicant.fullName,
      designation: applicant.jobPosting?.title || "New Hire",
      employeeCode: code,
      status: "Active",
      startDate: new Date(),
      employmentType: "Intern",
      passwordHash,
      mustResetPassword: true,
      applicantId: applicant.id,
    }
  });

  await prisma.activityLog.create({
    data: {
      actorId: auth.sub,
      actorType: "Admin",
      action: "EMPLOYEE_HIRED",
      metadata: JSON.stringify({ employeeId: employee.id, applicantId: applicant.id, employeeCode: code })
    }
  }).catch(() => {});

  const portalUrl = "https://cyberlabsec.tech/employee/login";
  const { sendEmployeeCredentials } = await import("@/lib/email");
  await sendEmployeeCredentials(applicant.email, applicant.fullName, code, rawPassword, portalUrl).catch(console.error);

  return NextResponse.json({ success: true, employeeId: employee.id });
}
