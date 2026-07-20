import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth = await getAuthFromCookies("admin");
  if (!auth || auth.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const tickets = await prisma.supportTicket.findMany({
    include: {
      employee: {
        select: { name: true, email: true, employeeCode: true, tier: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json({ tickets });
}
