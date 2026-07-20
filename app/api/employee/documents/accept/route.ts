import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const auth = await getAuthFromCookies("employee");
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title } = await req.json();
  if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });

  try {
    const doc = await prisma.employeeDocument.findFirst({
      where: { employeeId: auth.sub, title }
    });

    if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });
    if (doc.status === "Accepted") return NextResponse.json({ success: true, message: "Already accepted" });

    const updated = await prisma.employeeDocument.update({
      where: { id: doc.id },
      data: { status: "Accepted" }
    });

    await prisma.activityLog.create({
      data: {
        actorId: auth.sub,
        actorType: "Employee",
        action: "DOCUMENT_ACCEPTED",
        metadata: JSON.stringify({ documentId: doc.id, title })
      }
    }).catch(() => {});

    return NextResponse.json({ success: true, document: updated });
  } catch (error) {
    console.error("Document accept error:", error);
    return NextResponse.json({ error: "Failed to accept document" }, { status: 500 });
  }
}
