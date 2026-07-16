import { prisma } from '@/lib/prisma';
import { getAuthFromCookies } from '@/lib/auth';
import { redirect } from 'next/navigation';
import TicketManagerClient from './TicketManagerClient';

export const dynamic = 'force-dynamic';

export default async function TicketsPage() {
  const auth = await getAuthFromCookies();
  if (!auth || auth.role !== 'admin') redirect('/company/login');

  const tickets = await (prisma as unknown).supportTicket.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      employee: {
        select: { name: true, designation: true, employeeCode: true },
      },
    },
  }).catch(() => []);

  return <TicketManagerClient initialTickets={JSON.parse(JSON.stringify(tickets))} />;
}
