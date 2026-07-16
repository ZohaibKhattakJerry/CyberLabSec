import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const auth = await getAuthFromCookies();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let newPassword;
  try {
    const body = await req.json();
    newPassword = body.newPassword;
  } catch {
    // Body might be empty
  }

  const updateData: unknown = {
    onboardingCompleted: true,
    policyAcknowledgedAt: new Date(),
  };

  if (newPassword) {
    updateData.passwordHash = await bcrypt.hash(newPassword, 10);
    updateData.mustResetPassword = false;
  }

  await prisma.employee.update({
    where: { id: auth.sub },
    data: updateData,
  });

  await prisma.activityLog.create({
    data: {
      actorId: auth.sub,
      actorType: "Employee",
      action: "ONBOARDING_COMPLETE",
      metadata: JSON.stringify({}),
    },
  }).catch(() => {});

  return NextResponse.json({ success: true });
}
