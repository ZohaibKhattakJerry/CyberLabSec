import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ employeeId: string }> }) {
  const auth = await getAuthFromCookies();
  if (!auth || auth.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { employeeId } = await params;

  const documents = await prisma.employeeDocument.findMany({
    where: { employeeId },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json({ documents });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ employeeId: string }> }) {
  const auth = await getAuthFromCookies();
  if (!auth || auth.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { employeeId } = await params;
  const { title, type, fileUrl } = await req.json();

  if (!title || !type) return NextResponse.json({ error: "Title and type are required" }, { status: 400 });

  const doc = await prisma.employeeDocument.create({
    data: {
      employeeId,
      title,
      type,
      fileUrl,
      status: "Approved",
      uploadedBy: auth.sub
    }
  });

  return NextResponse.json({ success: true, document: doc });
}
