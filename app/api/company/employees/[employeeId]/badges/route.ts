import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ employeeId: string }> }
) {
  const auth = await getAuthFromCookies("admin");
  if (!auth || auth.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { employeeId } = await params;
  const body = await req.json();
  const { type, label } = body;

  if (!type || !label) {
    return NextResponse.json({ error: "Missing badge details" }, { status: 400 });
  }

  const emp = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!emp) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const badge = await prisma.badge.upsert({
      where: {
        employeeId_type: {
          employeeId,
          type
        }
      },
      update: {
        label,
        awardedAt: new Date()
      },
      create: {
        employeeId,
        type,
        label,
        awardedAt: new Date()
      }
    });

    await prisma.activityLog.create({
      data: {
        actorId: null, actorType: "Admin", action: "BADGE_AWARDED",
        metadata: JSON.stringify({ employeeId, type, label }),
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, badge });
  } catch (error: unknown) {
    console.error("Failed to award badge:", error);
    return NextResponse.json({ error: "Failed to award badge." }, { status: 500 });
  }
}
