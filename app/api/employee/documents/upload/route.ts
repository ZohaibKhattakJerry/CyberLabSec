import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const auth = await getAuthFromCookies("employee");
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, type, fileUrl } = await req.json();
  if (!title || !fileUrl) return NextResponse.json({ error: "Title and file are required" }, { status: 400 });

  try {
    const doc = await prisma.employeeDocument.create({
      data: {
        employeeId: auth.sub,
        title,
        type: type || "Other",
        status: "Available",
        fileUrl
      }
    });

    await prisma.activityLog.create({
      data: {
        actorId: auth.sub,
        actorType: "Employee",
        action: "DOCUMENT_UPLOADED",
        metadata: JSON.stringify({ documentId: doc.id, title })
      }
    }).catch(() => {});

    return NextResponse.json({ success: true, document: doc });
  } catch (error) {
    console.error("Document upload error:", error);
    return NextResponse.json({ error: "Failed to upload document" }, { status: 500 });
  }
}
