import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ employeeId: string; docId: string }> }
) {
  const auth = await getAuthFromCookies();
  if (!auth || auth.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { employeeId, docId } = await params;

  const doc = await prisma.employeeDocument.findUnique({ where: { id: docId } });
  if (!doc || doc.employeeId !== employeeId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.employeeDocument.delete({ where: { id: docId } });
  return NextResponse.json({ success: true });
}
