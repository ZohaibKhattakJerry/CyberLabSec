import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthFromCookies("employee");
    if (!auth || !auth.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch signed documents for this employee
    const signatures = await prisma.documentSignature.findMany({
      where: { employeeId: auth.sub },
      include: {
        document: true
      },
      orderBy: { signedAt: "desc" }
    });

    const docs = signatures.map(sig => ({
      id: sig.id,
      documentId: sig.documentId,
      title: sig.document.title,
      subtitle: sig.document.subtitle,
      version: sig.documentVersion,
      signedAt: sig.signedAt,
      pdfFileUrl: sig.pdfFileUrl,
      signerName: sig.signerName
    }));

    // Also fetch EmployeeDocument records (offer letter, etc.)
    const empDocs = await prisma.employeeDocument.findMany({
      where: { employeeId: auth.sub },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ documents: empDocs, signatures: docs });
  } catch (error: any) {
    console.error("GET /api/employee/my-documents error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
