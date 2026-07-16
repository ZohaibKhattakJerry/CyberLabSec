import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthFromCookies } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const auth = await getAuthFromCookies();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const meetings = await prisma.meetingRequest.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      team: { select: { name: true } },
      proposer: { select: { name: true, photoUrl: true } }
    }
  });

  return NextResponse.json({ meetings });
}

export async function PUT(req: NextRequest) {
  const auth = await getAuthFromCookies();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const { meetingId, status, confirmedTime, meetingLink } = await req.json();
  if (!meetingId || !status) {
    return NextResponse.json({ error: 'Meeting ID and status are required' }, { status: 400 });
  }

  const updatedMeeting = await prisma.meetingRequest.update({
    where: { id: meetingId },
    data: { status, confirmedTime: confirmedTime ? new Date(confirmedTime) : null, meetingLink },
    include: {
      team: { select: { name: true } },
      proposer: { select: { name: true, photoUrl: true } }
    }
  });

  return NextResponse.json({ success: true, meeting: updatedMeeting });
}
