import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const auth = await getAuthFromCookies();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { githubUrl, linkedinUrl } = await req.json();

    await prisma.employee.update({
      where: { id: auth.sub },
      data: {
        githubUrl: githubUrl || null,
        linkedinUrl: linkedinUrl || null,
      },
    });

    await prisma.activityLog.create({
      data: {
        actorId: auth.sub,
        actorType: "Employee",
        action: "UPDATED_SOCIAL_LINKS",
        metadata: JSON.stringify({}),
      },
    }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error.message || "Failed to update profile" }, { status: 500 });
  }
}
