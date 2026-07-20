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

  let base64Pdf = undefined;
  if (offerLetterBase64 && offerLetterBase64.startsWith("data:application/pdf;base64,")) {
    base64Pdf = offerLetterBase64.split(",")[1];
    
    // Upload to Vercel Blob
    const { put } = await import("@vercel/blob");
    const buffer = Buffer.from(base64Pdf, "base64");
    const blob = await put(`offer-letter-${employeeCode}.pdf`, buffer, {
      access: "private",
      contentType: "application/pdf"
    });
    fileUrlToSave = `/api/blob?url=${encodeURIComponent(blob.url)}`;

    await prisma.employeeDocument.create({
      data: {
        employeeId: employee.id,
        title: "Offer Letter",
        type: "Offer Letter",
        fileUrl: fileUrlToSave,
        status: "Approved",
        uploadedBy: auth.sub
      }
    });
  }

  let cvUrlToSave = undefined;
  if (cvBase64 && cvBase64.startsWith("data:application/pdf;base64,")) {
    const cvBase64Data = cvBase64.split(",")[1];
    const { put } = await import("@vercel/blob");
    const buffer = Buffer.from(cvBase64Data, "base64");
    const blob = await put(`cv-${employeeCode}.pdf`, buffer, {
      access: "public",
      contentType: "application/pdf"
    });
    cvUrlToSave = blob.url;
    
    await prisma.employee.update({
      where: { id: employee.id },
      data: { cvUrl: cvUrlToSave }
    });
  }

  const { generateAndUploadDocument, getNDATemplate, getCodeOfConductTemplate, getInternshipAgreementTemplate, getEmploymentContractTemplate, getFixedTermAgreementTemplate, getHandbookAcknowledgmentTemplate } = await import("@/lib/document-generator");
  const d = new Date().toLocaleDateString("en-US");

  const ndaUrl = await generateAndUploadDocument(
    "Non-Disclosure Agreement", employee.name, employee.designation, d, employee.employeeCode, getNDATemplate("CyberLabSec", employee.designation)
  );
  await prisma.employeeDocument.create({ data: { employeeId: employee.id, title: "NDA", type: "NDA", fileUrl: ndaUrl, status: "Pending Consent" } });

  const cocUrl = await generateAndUploadDocument(
    "Code of Conduct Acceptance", employee.name, employee.designation, d, employee.employeeCode, getCodeOfConductTemplate()
  );
  await prisma.employeeDocument.create({ data: { employeeId: employee.id, title: "Code of Conduct Acceptance", type: "Policy", fileUrl: cocUrl, status: "Pending Consent" } });

  if (employee.employmentType === "Intern") {
    const iaUrl = await generateAndUploadDocument(
      "Internship Agreement", employee.name, employee.designation, d, employee.employeeCode, getInternshipAgreementTemplate(employee.designation)
    );
    await prisma.employeeDocument.create({ data: { employeeId: employee.id, title: "Internship Agreement", type: "Agreement", fileUrl: iaUrl, status: "Approved" } });
  } else if (employee.employmentType === "Employee" || employee.employmentType === "Full-Time") {
    const ecUrl = await generateAndUploadDocument(
      "Employment Contract", employee.name, employee.designation, d, employee.employeeCode, getEmploymentContractTemplate(employee.designation)
    );
    await prisma.employeeDocument.create({ data: { employeeId: employee.id, title: "Employment Contract", type: "Agreement", fileUrl: ecUrl, status: "Approved" } });

    const haUrl = await generateAndUploadDocument(
      "Employee Handbook Acknowledgment", employee.name, employee.designation, d, employee.employeeCode, getHandbookAcknowledgmentTemplate()
    );
    await prisma.employeeDocument.create({ data: { employeeId: employee.id, title: "Employee Handbook Acknowledgment", type: "Policy", fileUrl: haUrl, status: "Pending Consent" } });
  } else if (employee.employmentType === "Contract") {
    const ftaUrl = await generateAndUploadDocument(
      "Fixed-Term Agreement", employee.name, employee.designation, d, employee.employeeCode, getFixedTermAgreementTemplate(employee.designation)
    );
    await prisma.employeeDocument.create({ data: { employeeId: employee.id, title: "Fixed-Term Agreement", type: "Agreement", fileUrl: ftaUrl, status: "Approved" } });
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
      actorId: null, actorType: "Admin", action: "DIRECT_HIRE_CREATED",
      metadata: JSON.stringify({ employeeId: employee.id, employeeCode }),
    },
  }).catch(() => {});

  return NextResponse.json({ success: true, employeeCode, employeeId: employee.id });
}
