import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const auth = await getAuthFromCookies("employee");
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const employee = await prisma.employee.findUnique({
    where: { id: auth.sub },
    select: { id: true, completionNotified: true, name: true, employmentType: true }
  });

  if (!employee) return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  if (employee.completionNotified) return NextResponse.json({ success: true, alreadyNotified: true });

  await prisma.employee.update({
    where: { id: auth.sub },
    data: { completionNotified: true }
  });

  // Notify the admin
  await prisma.activityLog.create({
    data: {
      actorId: employee.id,
      actorType: "Employee",
      action: "TENURE_COMPLETED",
      metadata: JSON.stringify({ name: employee.name, type: employee.employmentType }),
    }
  });

  return NextResponse.json({ success: true }, { status: 200 });
}
