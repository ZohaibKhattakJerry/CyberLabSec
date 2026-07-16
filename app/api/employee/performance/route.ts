import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthFromCookies } from '@/lib/auth';
import { subDays } from 'date-fns';

export async function GET(req: NextRequest) {
  const auth = await getAuthFromCookies();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const since = subDays(new Date(), 30);
  
  const [submissions, employee, attendance] = await Promise.all([
    prisma.taskSubmission.findMany({ where: { employeeId: auth.sub, submittedAt: { gte: since } }, include: { task: { select: { deadline: true } } } }),
    prisma.employee.findUnique({ where: { id: auth.sub }, select: { points: true } }),
    (prisma as unknown).attendanceRecord.findMany({ where: { employeeId: auth.sub, date: { gte: since } } }).catch(() => [])
  ]);
  
  const approved = submissions.filter(s => s.status === 'Approved');
  const onTime = approved.filter(s => new Date(s.submittedAt) <= new Date(s.task.deadline));
  const scores = submissions.filter(s => s.reviewerScore != null).map(s => s.reviewerScore as number);
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a,b) => a+b, 0) / scores.length) : 0;
  const totalDays = Math.max(attendance.length, 1);
  const presentDays = attendance.filter((a: unknown) => a.status !== 'Absent').length;
  
  return NextResponse.json({
    tasksCompleted: approved.length,
    tasksOnTime: approved.length > 0 ? Math.round((onTime.length / approved.length) * 100) : 100,
    avgScore,
    attendanceRate: Math.round((presentDays / totalDays) * 100),
    points: employee?.points || 0,
    streak: presentDays
  });
}
