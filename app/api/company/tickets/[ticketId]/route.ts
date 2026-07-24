import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthFromCookies } from '@/lib/auth';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  const auth = await getAuthFromCookies("admin");
  if (!auth || auth.role !== 'admin')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { ticketId } = await params;
  const { status, response } = await req.json();

  const ticket = await (prisma as unknown).supportTicket.update({
    where: { id: ticketId },
    data: {
      status,
      response: response || undefined,
      respondedBy: auth.sub,
      respondedAt: new Date(),
    },
  });

  if (response) {
    await prisma.notification.create({
      data: {
        userId: ticket.employeeId,
        title: 'Support Ticket Updated',
        message: `Your ticket "${ticket.title}" has been responded to.`,
        type: 'Ticket',
        link: '/employee/support',
      },
    });
  }

  // Log activity
  await prisma.activityLog.create({
    data: {
      actorId: auth.sub,
      actorType: "Admin",
      action: "TICKET_REVIEWED",
      metadata: JSON.stringify({ ticketId, status })
    }
  });

  return NextResponse.json({ success: true, ticket });
}
