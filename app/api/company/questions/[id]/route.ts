import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await getAuthFromCookies();
  if (!auth || auth.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { category, difficulty, type, prompt, options, correctOption, rubric, points } = body;

    const q = await prisma.questionBank.update({
      where: { id: params.id },
      data: { category, difficulty, type, prompt, options, correctOption, rubric, points: Number(points) },
    });

    return NextResponse.json(q);
  } catch (err) {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await getAuthFromCookies();
  if (!auth || auth.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await prisma.questionBank.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
