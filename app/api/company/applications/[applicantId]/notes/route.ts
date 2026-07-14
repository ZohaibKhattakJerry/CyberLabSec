import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: { applicantId: string } }) {
  const auth = await getAuthFromCookies();
  if (!auth || auth.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { internalRating, privateNotes } = await req.json();

  if (internalRating !== undefined && internalRating !== null && (internalRating < 1 || internalRating > 5)) {
    return NextResponse.json({ error: "Rating must be 1–5" }, { status: 400 });
  }

  const applicant = await prisma.applicant.findUnique({ where: { id: params.applicantId } });
  if (!applicant) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.applicant.update({
    where: { id: params.applicantId },
    data: {
      ...(internalRating !== undefined && { internalRating }),
      ...(privateNotes !== undefined && { privateNotes }),
    },
  });

  return NextResponse.json({ ok: true });
}
