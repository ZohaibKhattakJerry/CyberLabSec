import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";
import { getFilePath } from "@/lib/fileStorage";
import fs from "fs";
import mime from "mime-types";
import path from "path";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ applicantId: string; type: string }> }
) {
  const auth = await getAuthFromCookies();
  if (!auth || auth.role !== "admin") return new NextResponse("Forbidden", { status: 403 });

  const { applicantId, type } = await params;
  if (type !== "cv" && type !== "photo") return new NextResponse("Invalid type", { status: 400 });

  const applicant = await prisma.applicant.findUnique({ where: { id: applicantId } });
  if (!applicant) return new NextResponse("Not found", { status: 404 });

  const relativePath = type === "cv" ? applicant.cvFileUrl : applicant.photoUrl;
  if (!relativePath) return new NextResponse("File not found", { status: 404 });

  const absPath = getFilePath(relativePath);
  if (!fs.existsSync(absPath)) return new NextResponse("File missing on disk", { status: 404 });

  const ext = path.extname(absPath);
  const contentType = mime.contentType(ext) || "application/octet-stream";
  
  // Read file as buffer
  const buffer = fs.readFileSync(absPath);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `inline; filename="${applicant.fullName.replace(/\s+/g, '_')}_${type.toUpperCase()}${ext}"`,
    },
  });
}
