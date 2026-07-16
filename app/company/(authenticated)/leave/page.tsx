import { prisma } from '@/lib/prisma';
import { getAuthFromCookies } from '@/lib/auth';
import { redirect } from 'next/navigation';
import CompanyLeaveClient from './CompanyLeaveClient';

export const dynamic = 'force-dynamic';

export default async function CompanyLeavePage() {
  const auth = await getAuthFromCookies();
  if (!auth || auth.role !== 'admin') redirect('/company/login');

  const leaves = await (prisma as any).leaveRequest.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      employee: {
        select: {
          name: true,
          designation: true,
          employeeCode: true,
          team: { select: { name: true } },
        },
      },
    },
  }).catch(() => []);

  return <CompanyLeaveClient initialLeaves={JSON.parse(JSON.stringify(leaves))} />;
}
