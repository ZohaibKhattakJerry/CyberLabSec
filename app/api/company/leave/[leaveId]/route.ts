import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthFromCookies } from '@/lib/auth';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ leaveId: string }> }
) {
  const auth = await getAuthFromCookies();
  if (!auth || auth.role !== 'admin')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { leaveId } = await params;
  const { status, reviewerNote } = await req.json();

  const leave = await (prisma as unknown).leaveRequest.update({
    where: { id: leaveId },
    data: {
      status,
      reviewerNote: reviewerNote || null,
      reviewedBy: auth.sub,
      reviewedAt: new Date(),
    },
  });

  // Notify employee
  await prisma.notification.create({
    data: {
      userId: leave.employeeId,
      title: `Leave Request ${status}`,
      message: `Your ${leave.type} leave request has been ${status.toLowerCase()}.${
        reviewerNote ? ` Note: ${reviewerNote}` : ''
      }`,
      type: 'Leave',
      link: '/employee/leave',
    },
  });

  return NextResponse.json({ success: true, leave });
}
