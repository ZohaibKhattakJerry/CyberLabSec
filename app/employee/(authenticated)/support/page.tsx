import { prisma } from '@/lib/prisma';
import { getAuthFromCookies } from '@/lib/auth';
import { redirect } from 'next/navigation';
import SupportClient from './SupportClient';

export const dynamic = 'force-dynamic';

export default async function SupportPage() {
  const auth = await getAuthFromCookies();
  if (!auth) redirect('/employee/login');
  const tickets = await (prisma as any).supportTicket.findMany({
    where: { employeeId: auth.sub },
    orderBy: { createdAt: 'desc' }
  }).catch(() => []);
  return <SupportClient initialTickets={JSON.parse(JSON.stringify(tickets))} />;
}
