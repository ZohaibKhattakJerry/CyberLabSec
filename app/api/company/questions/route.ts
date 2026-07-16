import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";

export async function GET() {
  const auth = await getAuthFromCookies();
  if (!auth || auth.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const questions = await prisma.questionBank.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json(questions);
  } catch {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await getAuthFromCookies();
  if (!auth || auth.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { category, difficulty, type, prompt, options, correctOption, rubric, points } = body;

    const q = await prisma.questionBank.create({
      data: { category, difficulty, type, prompt, options, correctOption, rubric, points: Number(points) },
    });

    return NextResponse.json(q, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
