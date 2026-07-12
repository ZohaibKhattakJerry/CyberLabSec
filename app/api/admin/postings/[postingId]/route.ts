import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ postingId: string }> }
) {
  const auth = await getAuthFromCookies();
  if (!auth || auth.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { postingId } = await params;

  const posting = await prisma.jobPosting.findUnique({
    where: { id: postingId },
    include: { _count: { select: { applicants: true } } },
  });

  if (!posting) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (posting._count.applicants > 0) return NextResponse.json({ error: "Cannot delete posting with applicants" }, { status: 400 });

  await prisma.jobPosting.delete({ where: { id: postingId } });

  return NextResponse.json({ success: true });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ postingId: string }> }
) {
  const auth = await getAuthFromCookies();
  if (!auth || auth.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { postingId } = await params;
  const body = await req.json();

  const updateData: Record<string, unknown> = {};
  if (body.title !== undefined) updateData.title = body.title;
  if (body.type !== undefined) updateData.type = body.type;
  if (body.department !== undefined) updateData.department = body.department;
  if (body.location !== undefined) updateData.location = body.location;
  if (body.description !== undefined) updateData.description = body.description;
  if (body.requirements !== undefined) updateData.requirements = body.requirements;
  if (body.universityRequired !== undefined) updateData.universityRequired = body.universityRequired;
  if (body.deadline !== undefined) updateData.deadline = new Date(body.deadline);
  if (body.status !== undefined) updateData.status = body.status;
  if (body.shortlistThreshold !== undefined) updateData.shortlistThreshold = Number(body.shortlistThreshold);
  if (body.passMark !== undefined) updateData.passMark = Number(body.passMark);

  const updated = await prisma.jobPosting.update({
    where: { id: postingId },
    data: updateData,
  });

  return NextResponse.json({ success: true, posting: updated });
}
