import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ applicantId: string }> }
) {
  const auth = await getAuthFromCookies();
  if (!auth || auth.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const resolvedParams = await params;
  const applicantId = resolvedParams.applicantId;

  let body: any = {};
  try {
    body = await req.json();
  } catch(e) {}
  const { offerLetterBase64, customMessage, startingSalary, expectedJoinDate } = body;

  if (!offerLetterBase64) {
    return NextResponse.json({ error: "Offer letter attachment is required to complete the hiring process." }, { status: 400 });
  }

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

  // Upload to Vercel Blob
  let finalOfferLetterUrl = "";
  if (offerLetterBase64) {
    const { put } = await import("@vercel/blob");
    const buffer = Buffer.from(offerLetterBase64, "base64");
    const blob = await put(`offer-letter-${code}.pdf`, buffer, {
      access: "private",
      contentType: "application/pdf"
    });
    finalOfferLetterUrl = `/api/blob?url=${encodeURIComponent(blob.url)}`;
  }

  await prisma.employeeDocument.create({
    data: {
      employeeId: employee.id,
      title: "Initial Offer Letter",
      type: "Offer Letter",
      fileUrl: finalOfferLetterUrl,
      status: "Approved",
      uploadedBy: auth.sub
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
  await sendEmployeeCredentials(applicant.email, applicant.fullName, code, rawPassword, portalUrl, offerLetterBase64, customMessage).catch(console.error);

  return NextResponse.json({ success: true, employeeId: employee.id });
}
