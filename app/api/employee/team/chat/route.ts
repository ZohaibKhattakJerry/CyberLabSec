import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthFromCookies("employee");
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const employee = await prisma.employee.findUnique({ where: { id: auth.sub } });
    if (!employee || !employee.teamId) {
      return NextResponse.json({ error: "No team assigned" }, { status: 403 });
    }

    // Opportunistic cleanup: delete files older than 24 hours to save DB storage
    try {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      await prisma.teamMessage.updateMany({
        where: {
          teamId: employee.teamId,
          fileUrl: { not: null },
          createdAt: { lt: yesterday }
        },
        data: {
          fileUrl: null,
          fileName: null,
          fileType: null,
          fileSize: null
        }
      });
    } catch (err) {
      console.error("Failed to cleanup old chat files:", err);
    }

    const { message, fileUrl, fileName, fileType, fileSize } = await req.json();
    if ((!message || message.trim() === "") && !fileUrl) {
      return NextResponse.json({ error: "Message or file is required" }, { status: 400 });
    }

    let finalFileUrl = fileUrl || null;
    if (fileUrl && fileUrl.startsWith("data:")) {
      const extMatch = fileUrl.match(/^data:(.*?);base64,/);
      const ext = extMatch ? extMatch[1].split('/')[1] || 'bin' : 'bin';
      const b64Data = fileUrl.split(",")[1];
      const buffer = Buffer.from(b64Data, "base64");
      
      const { put } = await import("@vercel/blob");
      const blobName = `chat-${employee.teamId}-${Date.now()}.${ext}`;
      const blob = await put(blobName, buffer, { access: "private" });
      finalFileUrl = `/api/blob?url=${encodeURIComponent(blob.url)}`;
    }

    const newMsg = await prisma.teamMessage.create({
      data: {
        teamId: employee.teamId,
        employeeId: employee.id,
        message: message?.trim() || "",
        fileUrl: finalFileUrl,
        fileName: fileName || null,
        fileType: fileType || null,
        fileSize: fileSize || null,
      },
    });

    return NextResponse.json({ message: newMsg });
  } catch (error: unknown) {
    console.error("Team message error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
