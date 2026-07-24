import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const auth = await getAuthFromCookies("employee");
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, fileUrl } = await req.json();
  if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });

  try {
    let doc = await prisma.employeeDocument.findFirst({
      where: { employeeId: auth.sub, title }
    });

    if (doc && doc.status === "Accepted") {
      return NextResponse.json({ success: true, message: "Already accepted" });
    }

    let updated;
    if (doc) {
      updated = await prisma.employeeDocument.update({
        where: { id: doc.id },
        data: { 
          status: "Accepted",
          ...(fileUrl ? { fileUrl } : {})
        }
      });
    } else {
      updated = await prisma.employeeDocument.create({
        data: {
          employeeId: auth.sub,
          title,
          type: "Consent",
          status: "Accepted",
          fileUrl: fileUrl || null
        }
      });
    }

    await prisma.activityLog.create({
      data: {
        actorId: auth.sub,
        actorType: "Employee",
        action: "DOCUMENT_ACCEPTED",
        metadata: JSON.stringify({ documentId: updated.id, title })
      }
    }).catch(() => {});

    return NextResponse.json({ success: true, document: updated });
  } catch (error: any) {
    console.error("Document accept error:", error);
    return NextResponse.json({ error: "Failed to accept document" }, { status: 500 });
  }
}
