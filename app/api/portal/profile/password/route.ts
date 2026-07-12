import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const auth = await getAuthFromCookies();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { currentPassword, newPassword } = await req.json();
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Both current and new passwords are required." }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: "New password must be at least 8 characters." }, { status: 400 });
  }

  const employee = await prisma.employee.findUnique({ where: { id: auth.sub } });
  if (!employee) return NextResponse.json({ error: "Employee not found." }, { status: 404 });

  const valid = await bcrypt.compare(currentPassword, employee.passwordHash);
  if (!valid) return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });

  const hash = await bcrypt.hash(newPassword, 12);
  await prisma.employee.update({
    where: { id: auth.sub },
    data: { passwordHash: hash, mustResetPassword: false },
  });

  await prisma.activityLog.create({
    data: { actorId: auth.sub, actorType: "Employee", action: "PASSWORD_CHANGE", metadata: "{}" },
  }).catch(() => {});

  return NextResponse.json({ success: true });
}
