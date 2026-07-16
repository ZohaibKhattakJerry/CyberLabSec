import { prisma } from '@/lib/prisma';
import { getAuthFromCookies } from '@/lib/auth';
import { redirect } from 'next/navigation';
import LeaveClient from './LeaveClient';

export const dynamic = 'force-dynamic';

export default async function LeavePage() {
  const auth = await getAuthFromCookies();
  if (!auth) redirect('/employee/login');

  const leaves = await (prisma as unknown).leaveRequest.findMany({
    where: { employeeId: auth.sub },
    orderBy: { createdAt: 'desc' }
  }).catch(() => []);

  return <LeaveClient initialLeaves={JSON.parse(JSON.stringify(leaves))} />;
}
