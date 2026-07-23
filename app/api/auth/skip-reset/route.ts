import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";

export async function POST() {
  try {
    const auth = await getAuthFromCookies("employee");
    console.log("skip-reset auth:", auth);
    if (!auth || !auth.sub) {
      return NextResponse.json({ error: "Unauthorized: getAuthFromCookies returned null" }, { status: 401 });
    }

    const updated = await prisma.employee.update({
      where: { id: auth.sub },
      data: { mustResetPassword: false },
    });
    console.log("skip-reset updated employee:", updated.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("skip-reset Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
