import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuthFromCookies();
  if (!auth || auth.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const resolvedParams = await params;
  const body = await req.json();

  const dataToUpdate: unknown = {};
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
  if (body.showApplicantCount !== undefined) dataToUpdate.showApplicantCount = !!body.showApplicantCount;
  if (body.autoShortlist !== undefined) dataToUpdate.autoShortlist = !!body.autoShortlist;
  if (body.assessmentBank !== undefined) dataToUpdate.assessmentBank = body.assessmentBank;
  if (body.answerKey !== undefined) dataToUpdate.answerKey = body.answerKey;
  if (body.assessmentSettings !== undefined) dataToUpdate.assessmentSettings = body.assessmentSettings;
  if (body.stipend !== undefined) dataToUpdate.stipend = body.stipend || null;
  if (body.experienceLevel !== undefined) dataToUpdate.experienceLevel = body.experienceLevel || "Any";
  if (body.duration !== undefined) dataToUpdate.duration = body.duration || null;
  if (body.weeklyHours !== undefined) dataToUpdate.weeklyHours = body.weeklyHours ? parseInt(body.weeklyHours) : null;
  if (body.niceToHave !== undefined) dataToUpdate.niceToHave = body.niceToHave || null;
  if (body.whatYouGain !== undefined) dataToUpdate.whatYouGain = body.whatYouGain || null;
  if (body.openings !== undefined) dataToUpdate.openings = body.openings ? parseInt(body.openings) : 1;

  try {
    const posting = await prisma.jobPosting.update({
      where: { id: resolvedParams.id },
      data: dataToUpdate,
    });

    await prisma.activityLog.create({
      data: { actorId: auth.sub, actorType: "Admin", action: "POSTING_UPDATED", metadata: JSON.stringify({ postingId: posting.id, status: body.status }) },
    }).catch(() => {});

    return NextResponse.json({ success: true, posting });
  } catch {
    return NextResponse.json({ error: "Failed to update posting" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuthFromCookies();
  if (!auth || auth.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const resolvedParams = await params;

  try {
    const posting = await prisma.jobPosting.findUnique({ where: { id: resolvedParams.id } });
    if (!posting) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const applicants = await prisma.applicant.findMany({ where: { jobPostingId: resolvedParams.id }, select: { id: true } });
    const applicantIds = applicants.map(a => a.id);
    if (applicantIds.length > 0) {
      await prisma.interviewSession.deleteMany({ where: { applicantId: { in: applicantIds } } });
      await prisma.cEOReview.deleteMany({ where: { applicantId: { in: applicantIds } } });
      // Remove link from any employees just in case
      await prisma.employee.updateMany({
        where: { applicantId: { in: applicantIds } },
        data: { applicantId: null }
      });
      await prisma.applicant.deleteMany({ where: { jobPostingId: resolvedParams.id } });
    }

    await prisma.jobPosting.delete({ where: { id: resolvedParams.id } });

    await prisma.activityLog.create({
      data: { actorId: auth.sub, actorType: "Admin", action: "POSTING_DELETED", metadata: JSON.stringify({ postingId: resolvedParams.id }) },
    }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete posting" }, { status: 500 });
  }
}
