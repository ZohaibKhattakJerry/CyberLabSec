import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth = await getAuthFromCookies("employee");
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const documents = await prisma.employeeDocument.findMany({
    where: { employeeId: auth.sub },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json({ documents });
}
