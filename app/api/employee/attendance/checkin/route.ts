import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthFromCookies } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const auth = await getAuthFromCookies("employee");
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const pstString = new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" });
  const pstNow = new Date(pstString);
  const today = new Date(pstNow.getFullYear(), pstNow.getMonth(), pstNow.getDate());
  
  // Late if past 9:30 AM PST
  const lateThreshold = new Date(today);
  lateThreshold.setHours(9, 30, 0, 0);
  const status = pstNow > lateThreshold ? 'Late' : 'Present';

  try {
    const existing = await (prisma as any).attendanceRecord.findUnique({
      where: { employeeId_date: { employeeId: auth.sub, date: today } }
    });
    if (existing) return NextResponse.json({ success: true, alreadyCheckedIn: true });

    await (prisma as any).attendanceRecord.create({
      data: { employeeId: auth.sub, date: today, loginTime: pstNow, status }
    });
    return NextResponse.json({ success: true, status });
  } catch {
    return NextResponse.json({ success: false });
  }
}
