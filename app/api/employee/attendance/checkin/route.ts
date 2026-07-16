import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthFromCookies } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const auth = await getAuthFromCookies();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const lateThreshold = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 30); // 9:30 AM
  const status = now > lateThreshold ? 'Late' : 'Present';

  try {
    const existing = await (prisma as unknown).attendanceRecord.findUnique({
      where: { employeeId_date: { employeeId: auth.sub, date: today } }
    });
    if (existing) return NextResponse.json({ success: true, alreadyCheckedIn: true });

    await (prisma as unknown).attendanceRecord.create({
      data: { employeeId: auth.sub, date: today, loginTime: now, status }
    });
    return NextResponse.json({ success: true, status });
  } catch {
    return NextResponse.json({ success: false });
  }
}
