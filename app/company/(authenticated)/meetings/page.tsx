import { prisma } from '@/lib/prisma';
import { getAuthFromCookies } from '@/lib/auth';
import { redirect } from 'next/navigation';
import CompanyMeetingClient from './CompanyMeetingClient';

export const dynamic = 'force-dynamic';

export default async function CompanyMeetingsPage() {
  const auth = await getAuthFromCookies();
  if (!auth) redirect('/company/login');

  const meetings = await (prisma as unknown).meetingRequest.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      team: { select: { name: true } },
      proposer: { select: { name: true, photoUrl: true } }
    }
  }).catch(() => []);

  return <CompanyMeetingClient initialMeetings={JSON.parse(JSON.stringify(meetings))} />;
}
