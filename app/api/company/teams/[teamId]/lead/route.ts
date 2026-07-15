import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: { teamId: string } }) {
  const auth = await getAuthFromCookies();
  if (!auth || auth.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { leadEmployeeId } = await req.json();

  const team = await prisma.team.update({
    where: { id: params.teamId },
    data: { leadEmployeeId },
  });

  return NextResponse.json({ success: true, team }, { status: 200 });
}
