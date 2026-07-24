import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthFromCookies } from '@/lib/auth';
import { differenceInCalendarDays } from 'date-fns';

export async function POST(req: NextRequest) {
  const auth = await getAuthFromCookies("employee");
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { type, startDate, endDate, reason } = await req.json();
  if (!type || !startDate || !endDate || !reason) return NextResponse.json({ error: 'All fields required' }, { status: 400 });
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (end < start) return NextResponse.json({ error: 'End date must be after start date' }, { status: 400 });
  const totalDays = differenceInCalendarDays(end, start) + 1;

  // Check for overlaps
  const overlapping = await (prisma as unknown).leaveRequest.findFirst({
    where: {
      employeeId: auth.sub,
      status: { in: ['Pending', 'Approved'] },
      OR: [
        { startDate: { lte: end }, endDate: { gte: start } }
      ]
    }
  });

  if (overlapping) {
    return NextResponse.json({ error: 'Leave request overlaps with an existing request' }, { status: 400 });
  }

  const leave = await (prisma as unknown).leaveRequest.create({
    data: { employeeId: auth.sub, type, startDate: start, endDate: end, totalDays, reason }
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      actorId: auth.sub,
      actorType: "Employee",
      action: "LEAVE_REQUESTED",
      metadata: JSON.stringify({ leaveId: leave.id, type, totalDays })
    }
  });

  // Notify admin
  await prisma.notification.create({
    data: {
      userId: "admin", // Represents admins
      title: "New Leave Request",
      message: `An employee has submitted a ${totalDays}-day ${type} leave request.`,
      type: "Leave",
      link: "/company/leaves"
    }
  });

  return NextResponse.json({ success: true, leave });
}

export async function GET(req: NextRequest) {
  const auth = await getAuthFromCookies("employee");
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const leaves = await (prisma as unknown).leaveRequest.findMany({ where: { employeeId: auth.sub }, orderBy: { createdAt: 'desc' } });
  return NextResponse.json({ leaves });
}
