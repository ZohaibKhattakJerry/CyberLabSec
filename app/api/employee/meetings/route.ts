import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthFromCookies } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const auth = await getAuthFromCookies();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const { title, description, proposedTimes } = await req.json();
  if (!title || !proposedTimes || proposedTimes.length === 0) {
    return NextResponse.json({ error: 'Title and at least one proposed time are required' }, { status: 400 });
  }

  const employee = await prisma.employee.findUnique({ where: { id: auth.sub } });
  if (!employee?.teamId) {
    return NextResponse.json({ error: 'You must be assigned to a team to request meetings' }, { status: 400 });
  }

  const meeting = await prisma.meetingRequest.create({
    data: {
      teamId: employee.teamId,
      proposedBy: employee.id,
      title,
      description,
      proposedTimes: JSON.stringify(proposedTimes),
      status: 'Voting',
      votes: '{}'
    }
  });

  return NextResponse.json({ success: true, meeting });
}

export async function GET(req: NextRequest) {
  const auth = await getAuthFromCookies();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const employee = await prisma.employee.findUnique({ where: { id: auth.sub } });
  if (!employee?.teamId) {
    return NextResponse.json({ meetings: [] });
  }

  const meetings = await prisma.meetingRequest.findMany({
    where: { teamId: employee.teamId },
    orderBy: { createdAt: 'desc' },
    include: { proposer: { select: { name: true, photoUrl: true } } }
  });

  return NextResponse.json({ meetings });
}

export async function PUT(req: NextRequest) {
  const auth = await getAuthFromCookies();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const { meetingId, timeSlot } = await req.json();
  if (!meetingId || !timeSlot) {
    return NextResponse.json({ error: 'Meeting ID and time slot are required' }, { status: 400 });
  }

  const meeting = await prisma.meetingRequest.findUnique({ where: { id: meetingId } });
  if (!meeting) return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });

  let votes = JSON.parse(meeting.votes || '{}');
  votes[auth.sub] = timeSlot;

  const updatedMeeting = await prisma.meetingRequest.update({
    where: { id: meetingId },
    data: { votes: JSON.stringify(votes) },
    include: { proposer: { select: { name: true, photoUrl: true } } }
  });

  return NextResponse.json({ success: true, meeting: updatedMeeting });
}
