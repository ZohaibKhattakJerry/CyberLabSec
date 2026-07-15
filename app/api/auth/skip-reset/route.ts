import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";

export async function POST() {
  try {
    const auth = await getAuthFromCookies();
    if (!auth || !auth.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.employee.update({
      where: { id: auth.sub },
      data: { mustResetPassword: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
