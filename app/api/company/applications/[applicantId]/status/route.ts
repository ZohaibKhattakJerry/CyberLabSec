import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ applicantId: string }> }
) {
  const auth = await getAuthFromCookies();
  if (!auth || auth.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { applicantId } = await params;
  const { status } = await req.json();

  const validStatuses = ["Applied","Reviewing","Shortlisted","InterviewInvited","Passed","Failed","Rejected","Hired","Blocked"];
  if (!validStatuses.includes(status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });

  const updated = await prisma.applicant.update({
    where: { id: applicantId },
    data: { status },
    include: { jobPosting: true }
  });

  if (status === "Rejected") {
    const { sendDeclineEmail } = await import("@/lib/email");
    await sendDeclineEmail(updated.email, updated.fullName, updated.jobPosting.title).catch(console.error);
  }

  return NextResponse.json({ success: true, status: updated.status });
}
