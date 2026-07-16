import { prisma } from '@/lib/prisma';
import { getAuthFromCookies } from '@/lib/auth';
import { redirect } from 'next/navigation';
import MeetingClient from './MeetingClient';

export const dynamic = 'force-dynamic';

export default async function MeetingsPage() {
  const auth = await getAuthFromCookies();
  if (!auth) redirect('/employee/login');

  const employee = await prisma.employee.findUnique({ where: { id: auth.sub } });

  let meetings = [];
  if (employee?.teamId) {
    meetings = await prisma.meetingRequest.findMany({
      where: { teamId: employee.teamId },
      orderBy: { createdAt: 'desc' },
      include: { proposer: { select: { name: true, photoUrl: true } } }
    }).catch(() => []);
  }

  return <MeetingClient initialMeetings={JSON.parse(JSON.stringify(meetings))} currentUser={auth.sub} />;
}
