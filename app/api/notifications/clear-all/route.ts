import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";

export async function DELETE(req: NextRequest) {
  const auth = await getAuthFromCookies();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.notification.deleteMany({
    where: { userId: auth.sub },
  });

  return NextResponse.json({ success: true }, { status: 200 });
}
