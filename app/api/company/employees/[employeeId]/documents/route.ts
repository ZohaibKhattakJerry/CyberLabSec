import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ employeeId: string }> }) {
  const auth = await getAuthFromCookies("admin");
  if (!auth || auth.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { employeeId } = await params;

  const documents = await prisma.employeeDocument.findMany({
    where: { employeeId },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json({ documents });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ employeeId: string }> }) {
  const auth = await getAuthFromCookies("admin");
  if (!auth || auth.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { employeeId } = await params;
  const { title, type, fileUrl } = await req.json();

  if (!title || !type) return NextResponse.json({ error: "Title and type are required" }, { status: 400 });

  let finalFileUrl = fileUrl || "";
  if (fileUrl && fileUrl.startsWith("data:")) {
    const extMatch = fileUrl.match(/^data:(.*?);base64,/);
    const ext = extMatch ? extMatch[1].split('/')[1] || 'pdf' : 'pdf';
    const b64Data = fileUrl.split(",")[1];
    const buffer = Buffer.from(b64Data, "base64");
    
    const { put } = await import("@vercel/blob");
    const blobName = `employee-doc-${employeeId}-${Date.now()}.${ext}`;
    const blob = await put(blobName, buffer, { access: "private" });
    finalFileUrl = `/api/blob?url=${encodeURIComponent(blob.url)}`;
  }

  const existing = await prisma.employeeDocument.findFirst({
    where: { employeeId, title }
  });

  let doc;
  if (existing) {
    doc = await prisma.employeeDocument.update({
      where: { id: existing.id },
      data: {
        type,
        fileUrl: finalFileUrl,
        status: "Approved",
        uploadedBy: auth.sub
      }
    });
  } else {
    doc = await prisma.employeeDocument.create({
      data: {
        employeeId,
        title,
        type,
        fileUrl: finalFileUrl,
        status: "Approved",
        uploadedBy: auth.sub
      }
    });
  }

  return NextResponse.json({ success: true, document: doc });
}
