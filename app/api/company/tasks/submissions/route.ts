import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthFromCookies } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const auth = await getAuthFromCookies();
  if (!auth || auth.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const taskId = searchParams.get('taskId');
  
  const submissions = await prisma.taskSubmission.findMany({
    where: taskId ? { taskId } : {},
    include: { employee: { select: { name: true, designation: true, employeeCode: true } }, task: { select: { title: true } } },
    orderBy: { submittedAt: 'desc' }
  });
  return NextResponse.json({ submissions });
}
