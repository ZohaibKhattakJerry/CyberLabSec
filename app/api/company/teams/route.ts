import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const auth = await getAuthFromCookies("admin");
  if (!auth || auth.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Team name is required" }, { status: 400 });

  const team = await prisma.team.create({ data: { name: name.trim() } });

  await prisma.activityLog.create({
    data: { actorId: null, actorType: "Admin", action: "TEAM_CREATED", metadata: JSON.stringify({ teamId: team.id, name }) },
  }).catch(() => {});

  return NextResponse.json({ success: true, team }, { status: 201 });
}
