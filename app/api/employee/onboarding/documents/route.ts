import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthFromCookies("employee");
    if (!auth || !auth.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const employee = await prisma.employee.findUnique({
      where: { id: auth.sub },
      select: { employmentType: true }
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    // Fetch all onboarding documents
    const allDocs = await prisma.onboardingDocument.findMany();
    
    // Filter docs that apply to the employee's role
    const requiredDocs = allDocs.filter(doc => {
      try {
        const roles = JSON.parse(doc.appliesToRoles);
        return roles.includes(employee.employmentType);
      } catch (e) {
        return false;
      }
    });

    // Fetch signatures for this employee
    const signatures = await prisma.documentSignature.findMany({
      where: { employeeId: auth.sub }
    });

    // Map signatures to required docs
    const docsWithStatus = requiredDocs.map(doc => {
      const sig = signatures.find(s => s.documentId === doc.id);
      return {
        id: doc.id,
        title: doc.title,
        subtitle: doc.subtitle,
        bodyText: doc.bodyText,
        version: doc.version,
        isSigned: !!sig,
        signedAt: sig?.signedAt || null,
        pdfFileUrl: sig?.pdfFileUrl || null
      };
    });

    return NextResponse.json({ documents: docsWithStatus });
  } catch (error: any) {
    console.error("GET /api/employee/onboarding/documents error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
