import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<any> }) {
  const auth = await getAuthFromCookies();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const resolvedParams = await params;
  const userId = auth.role === "admin" ? "admin" : auth.sub;

  const notif = await prisma.notification.findUnique({ where: { id: resolvedParams.id } });
  if (!notif || notif.userId !== userId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.notification.update({
    where: { id: resolvedParams.id },
    data: { read: true },
  });

  return NextResponse.json({ success: true });
}
