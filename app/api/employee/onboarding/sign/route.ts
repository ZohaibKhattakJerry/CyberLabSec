// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthFromCookies("employee");
    if (!auth || !auth.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { documentId, signerName, pdfFileUrl } = await req.json();

    if (!documentId || !signerName || signerName.trim().length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const document = await prisma.onboardingDocument.findUnique({
      where: { id: documentId }
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const employee = await prisma.employee.findUnique({
      where: { id: auth.sub },
      select: { employmentType: true }
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    // Upsert signature
    const signature = await prisma.documentSignature.upsert({
      where: {
        employeeId_documentId: {
          employeeId: auth.sub,
          documentId: document.id
        }
      },
      update: {
        signerName: signerName.trim(),
        signedAt: new Date(),
        documentVersion: document.version,
        ipAddress: req.headers.get("x-forwarded-for") || req.ip,
        pdfFileUrl: pdfFileUrl || undefined
      },
      create: {
        employeeId: auth.sub,
        documentId: document.id,
        signerName: signerName.trim(),
        documentVersion: document.version,
        ipAddress: req.headers.get("x-forwarded-for") || req.ip,
        pdfFileUrl: pdfFileUrl || null
      }
    });

    // Mirror to EmployeeDocument so Admin and Employee portals see it uniformly
    const existingDoc = await prisma.employeeDocument.findFirst({
      where: { employeeId: auth.sub, title: document.title }
    });

    if (existingDoc) {
      await prisma.employeeDocument.update({
        where: { id: existingDoc.id },
        data: {
          status: "Signed",
          fileUrl: pdfFileUrl || existingDoc.fileUrl
        }
      });
    } else {
      await prisma.employeeDocument.create({
        data: {
          employeeId: auth.sub,
          title: document.title,
          type: document.type,
          status: "Signed",
          fileUrl: pdfFileUrl || "",
          uploadedBy: "System"
        }
      });
    }

    return NextResponse.json({ success: true, signature });
  } catch (error: any) {
    console.error("POST /api/employee/onboarding/sign error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
