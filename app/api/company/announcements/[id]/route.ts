import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuthFromCookies("admin");
  if (!auth || auth.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  await prisma.announcementReadReceipt.deleteMany({
    where: { announcementId: id },
  });

  await prisma.announcement.delete({
    where: { id: id },
  });

  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuthFromCookies("admin");
  if (!auth || auth.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { message, isPinned, expiresAt } = await req.json();

  const announcement = await prisma.announcement.update({
    where: { id: id },
    data: { 
      message, 
      isPinned, 
      expiresAt: expiresAt ? new Date(expiresAt) : null 
    },
  });

  return NextResponse.json({ success: true, announcement });
}
