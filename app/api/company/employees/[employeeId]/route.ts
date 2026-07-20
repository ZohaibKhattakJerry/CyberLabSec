import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";
import { sendEmail } from "@/lib/email";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ employeeId: string }> }
) {
  const auth = await getAuthFromCookies("admin");
  if (!auth || auth.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { employeeId } = await params;
  const body = await req.json();
  const { teamId, designation, status, customMessage, terminationFileBase64, startDate, endDate, tier } = body;

  const updateData: Record<string, unknown> = {};
  if (teamId !== undefined) updateData.teamId = teamId || null;
  if (designation !== undefined) updateData.designation = designation;
  if (tier !== undefined) updateData.tier = tier;
  if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
  if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
  
  const emp = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!emp) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (status !== undefined) {
    if (!["Active", "Terminated"].includes(status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    updateData.status = status;
    if (status === "Terminated") {
      updateData.endDate = new Date();
      
      const emailHtml = `
        <h2>Notice of Employment Termination</h2>
        <p>Dear ${emp.name},</p>
        <p>This email serves as official notice that your employment with CyberLabSec has been terminated, effective immediately.</p>
        ${customMessage ? `<blockquote>${customMessage}</blockquote>` : ""}
        <p>Please find your official termination letter attached for your records.</p>
        <p>Your access to company portals and resources has been revoked.</p>
      `;

      try {
        await sendEmail({
          to: emp.email,
          subject: "Important Notice: Employment Termination",
          html: emailHtml,
          attachments: terminationFileBase64 ? [
            { filename: "CyberLabSec_Termination_Letter.pdf", content: terminationFileBase64, encoding: "base64" }
          ] : undefined
        });
      } catch (e) {
        console.error("Failed to send termination email:", e);
      }
    }
  }

  const updated = await prisma.employee.update({
    where: { id: employeeId },
    data: updateData,
  });

  await prisma.activityLog.create({
    data: {
      actorId: null, actorType: "Admin", action: "EMPLOYEE_UPDATED",
      metadata: JSON.stringify({ employeeId, changes: updateData }),
    },
  }).catch(() => {});

  return NextResponse.json({ success: true, employee: updated });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ employeeId: string }> }
) {
  const auth = await getAuthFromCookies("admin");
  if (!auth || auth.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { employeeId } = await params;

  try {
    const empToDelete = await prisma.employee.findUnique({ where: { id: employeeId } });

    const transactions: any[] = [
      prisma.team.updateMany({ where: { leadEmployeeId: employeeId }, data: { leadEmployeeId: null } }),
      prisma.activityLog.deleteMany({ where: { actorId: employeeId } }),
      prisma.announcement.deleteMany({ where: { OR: [{ employeeId }, { sentById: employeeId }] } }),
      prisma.taskSubmission.deleteMany({ where: { employeeId } }),
      prisma.teamMessage.deleteMany({ where: { employeeId } }),
      prisma.notification.deleteMany({ where: { userId: employeeId } }),
      prisma.cEOReview.deleteMany({ where: { submitterId: employeeId } }),
      prisma.pointTransaction.deleteMany({ where: { employeeId } }),
      prisma.badge.deleteMany({ where: { employeeId } }),
      prisma.employee.delete({ where: { id: employeeId } }),
    ];

    if (empToDelete?.applicantId) {
      transactions.push(
        prisma.interviewSession.deleteMany({ where: { applicantId: empToDelete.applicantId } }),
        prisma.offerLetter.deleteMany({ where: { applicantId: empToDelete.applicantId } }),
        prisma.cEOReview.deleteMany({ where: { applicantId: empToDelete.applicantId } }),
        prisma.applicant.delete({ where: { id: empToDelete.applicantId } })
      );
    }

    await prisma.$transaction(transactions);

    await prisma.activityLog.create({
      data: {
        actorId: null, actorType: "Admin", action: "EMPLOYEE_DELETED",
        metadata: JSON.stringify({ employeeId }),
      },
    }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete employee:", error);
    return NextResponse.json({ error: "Failed to delete employee data." }, { status: 500 });
  }
}
