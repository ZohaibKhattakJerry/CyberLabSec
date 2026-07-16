import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const employee = await prisma.employee.findUnique({ where: { id: auth.sub } });
    if (!employee || !employee.teamId) {
      return NextResponse.json({ error: "No team assigned" }, { status: 403 });
    }

    const { message } = await req.json();
    if (!message || message.trim() === "") {
      return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 });
    }

    const newMsg = await prisma.teamMessage.create({
      data: {
        teamId: employee.teamId,
        employeeId: employee.id,
        message: message.trim(),
      },
    });

    return NextResponse.json({ message: newMsg });
  } catch (error: unknown) {
    console.error("Team message error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
