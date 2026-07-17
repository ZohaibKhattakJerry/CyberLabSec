import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ employeeId: string }> }) {
  const auth = await getAuthFromCookies();
  if (!auth || auth.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const resolvedParams = await params;
  const employeeId = resolvedParams.employeeId;

  const { reason, effectiveDate, _generateCertificate, _generateLoR, customCertificateBase64, customLorBase64 } = await req.json();
  if (!reason || !effectiveDate) return NextResponse.json({ error: "Reason and effective date required" }, { status: 400 });

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: { team: true },
  });
  if (!employee) return NextResponse.json({ error: "Employee not found" }, { status: 404 });

  const effectiveDateObj = new Date(effectiveDate);
  const isImmediate = effectiveDateObj <= new Date();

  const { put } = await import("@vercel/blob");
  let customCertificateUrl = null;
  let customLorUrl = null;

  if (customCertificateBase64 && customCertificateBase64.startsWith("data:")) {
    const extMatch = customCertificateBase64.match(/^data:(.*?);base64,/);
    const ext = extMatch ? extMatch[1].split('/')[1] : "pdf";
    const b64Data = customCertificateBase64.split(",")[1];
    const buffer = Buffer.from(b64Data, "base64");
    const blob = await put(`offboard-cert-${employeeId}-${Date.now()}.${ext}`, buffer, { access: "private" });
    customCertificateUrl = `/api/blob?url=${encodeURIComponent(blob.url)}`;
  }

  if (customLorBase64 && customLorBase64.startsWith("data:")) {
    const extMatch = customLorBase64.match(/^data:(.*?);base64,/);
    const ext = extMatch ? extMatch[1].split('/')[1] : "pdf";
    const b64Data = customLorBase64.split(",")[1];
    const buffer = Buffer.from(b64Data, "base64");
    const blob = await put(`offboard-lor-${employeeId}-${Date.now()}.${ext}`, buffer, { access: "private" });
    customLorUrl = `/api/blob?url=${encodeURIComponent(blob.url)}`;
  }

  await prisma.employee.update({
    where: { id: employeeId },
    data: {
      offboardedAt: effectiveDateObj,
      offboardReason: reason,
      customCertificateUrl,
      customLorUrl,
      ...(isImmediate ? { status: "Inactive" } : {}),
    },
  });

  await prisma.activityLog.create({
    data: {
      actorId: auth.sub,
      actorType: "Admin",
      action: "EMPLOYEE_OFFBOARDED",
      metadata: JSON.stringify({ employeeId, employeeName: employee.name, reason, effectiveDate, isImmediate }),
    },
  }).catch(() => {});

  return NextResponse.json({ success: true, isImmediate, employeeId });
}
