import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthFromCookies } from '@/lib/auth';
import { differenceInCalendarDays } from 'date-fns';

export async function POST(req: NextRequest) {
  const auth = await getAuthFromCookies();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { type, startDate, endDate, reason } = await req.json();
  if (!type || !startDate || !endDate || !reason) return NextResponse.json({ error: 'All fields required' }, { status: 400 });
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (end < start) return NextResponse.json({ error: 'End date must be after start date' }, { status: 400 });
  const totalDays = differenceInCalendarDays(end, start) + 1;
  const leave = await (prisma as unknown).leaveRequest.create({
    data: { employeeId: auth.sub, type, startDate: start, endDate: end, totalDays, reason }
  });
  return NextResponse.json({ success: true, leave });
}

export async function GET(req: NextRequest) {
  const auth = await getAuthFromCookies();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const leaves = await (prisma as unknown).leaveRequest.findMany({ where: { employeeId: auth.sub }, orderBy: { createdAt: 'desc' } });
  return NextResponse.json({ leaves });
}
