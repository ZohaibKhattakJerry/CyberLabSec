import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";

export async function GET() {
  const auth = await getAuthFromCookies("admin");
  if (!auth || auth.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const logs = await prisma.activityLog.findMany({
    orderBy: { timestamp: "desc" },
    take: 500,
  });

  return NextResponse.json({
    logs: logs.map((l) => ({ ...l, createdAt: l.timestamp.toISOString(), timestamp: l.timestamp.toISOString() })),
  });
}
