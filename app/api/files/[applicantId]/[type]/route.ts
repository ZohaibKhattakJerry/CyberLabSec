import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";
import { getFilePath } from "@/lib/fileStorage";
import fs from "fs";
import mime from "mime-types";
import path from "path";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<any> }
) {
  const auth = await getAuthFromCookies();
  if (!auth) return new NextResponse("Unauthorized", { status: 401 });
  // Allow admins, employees, and legacy tokens without explicit roles to view CVs
  if (auth.role && auth.role !== "admin" && auth.role !== "employee") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const { applicantId, type } = await params;
  if (type !== "cv" && type !== "photo") return new NextResponse("Invalid type", { status: 400 });

  const applicant = await prisma.applicant.findUnique({ where: { id: applicantId } });
  if (!applicant) return new NextResponse("Not found", { status: 404 });

  const relativePath = type === "cv" ? applicant.cvFileUrl : applicant.photoUrl;
  if (!relativePath) return new NextResponse("File not found", { status: 404 });

  let buffer: Buffer;
  let contentType = "application/octet-stream";
  let ext = ".pdf";

  if (relativePath.startsWith("http")) {
    return NextResponse.redirect(relativePath);
  }

  if (relativePath.startsWith("/api/blob")) {
    return NextResponse.redirect(new URL(relativePath, req.url));
  }

  if (relativePath.startsWith("data:")) {
    const parts = relativePath.split(",");
    const meta = parts[0];
    contentType = meta.split(":")[1].split(";")[0];
    const base64Data = parts[1];
    buffer = Buffer.from(base64Data, "base64");
    if (contentType === "image/jpeg") ext = ".jpg";
    else if (contentType === "image/png") ext = ".png";
    else if (contentType === "application/msword") ext = ".doc";
    else if (contentType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") ext = ".docx";
  } else {
    const absPath = getFilePath(relativePath);
    if (!fs.existsSync(absPath)) return new NextResponse("File missing on disk", { status: 404 });
    ext = path.extname(absPath);
    contentType = mime.contentType(ext) || "application/octet-stream";
    buffer = fs.readFileSync(absPath);
  }

  return new NextResponse(Uint8Array.from(buffer), {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `inline; filename="${applicant.fullName.replace(/\s+/g, "_")}_${type.toUpperCase()}${ext}"`,
    },
  });
}
