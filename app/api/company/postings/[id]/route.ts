import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuthFromCookies();
  if (!auth || auth.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const resolvedParams = await params;
  const body = await req.json();

  const dataToUpdate: any = {};
  if (body.title !== undefined) dataToUpdate.title = body.title.trim();
  if (body.type !== undefined) dataToUpdate.type = body.type;
  if (body.department !== undefined) dataToUpdate.department = body.department.trim();
  if (body.location !== undefined) dataToUpdate.location = body.location.trim();
  if (body.description !== undefined) dataToUpdate.description = body.description.trim();
  if (body.requirements !== undefined) dataToUpdate.requirements = body.requirements.trim();
  if (body.universityRequired !== undefined) dataToUpdate.universityRequired = !!body.universityRequired;
  if (body.deadline !== undefined) dataToUpdate.deadline = new Date(body.deadline);
  if (body.status !== undefined) dataToUpdate.status = body.status;
  if (body.passMark !== undefined) dataToUpdate.passMark = Number(body.passMark) || 60;

  try {
    const posting = await prisma.jobPosting.update({
      where: { id: resolvedParams.id },
      data: dataToUpdate,
    });

    await prisma.activityLog.create({
      data: { actorId: auth.sub, actorType: "Admin", action: "POSTING_UPDATED", metadata: JSON.stringify({ postingId: posting.id, status: body.status }) },
    }).catch(() => {});

    return NextResponse.json({ success: true, posting });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to update posting" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuthFromCookies();
  if (!auth || auth.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const resolvedParams = await params;

  try {
    const posting = await prisma.jobPosting.findUnique({ where: { id: resolvedParams.id }, include: { _count: { select: { applicants: true } } } });
    if (!posting) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (posting._count.applicants > 0) return NextResponse.json({ error: "Cannot delete posting with applicants" }, { status: 400 });

    await prisma.jobPosting.delete({ where: { id: resolvedParams.id } });

    await prisma.activityLog.create({
      data: { actorId: auth.sub, actorType: "Admin", action: "POSTING_DELETED", metadata: JSON.stringify({ postingId: resolvedParams.id }) },
    }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to delete posting" }, { status: 500 });
  }
}
