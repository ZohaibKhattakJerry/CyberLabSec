import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";

export async function GET() {
  const auth = await getAuthFromCookies();
  if (!auth || auth.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    let config = await prisma.adminConfig.findUnique({ where: { id: "singleton" } });
    if (!config) {
      config = await prisma.adminConfig.create({
        data: { id: "singleton", data: JSON.stringify({ companyName: "CyberLabSec", defaultPassMark: 60, timezone: "UTC" }) }
      });
    }
    return NextResponse.json(JSON.parse(config.data));
  } catch {
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await getAuthFromCookies();
  if (!auth || auth.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = await req.json();
    await prisma.adminConfig.upsert({
      where: { id: "singleton" },
      create: { id: "singleton", data: JSON.stringify(data) },
      update: { data: JSON.stringify(data) }
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
