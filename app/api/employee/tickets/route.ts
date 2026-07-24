import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthFromCookies } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const auth = await getAuthFromCookies("employee");
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { category, title, description, priority } = await req.json();
  if (!title || !description) return NextResponse.json({ error: 'Title and description required' }, { status: 400 });
  const ticket = await prisma.supportTicket.create({
    data: { employeeId: auth.sub, category: category || 'General', title, description, priority: priority || 'Medium' }
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      actorId: auth.sub,
      actorType: "Employee",
      action: "TICKET_SUBMITTED",
      metadata: JSON.stringify({ ticketId: ticket.id, category, priority: priority || 'Medium' })
    }
  });

  // Notify admin
  await prisma.notification.create({
    data: {
      userId: "admin",
      title: "New Support Ticket",
      message: `A new ${priority || 'Medium'} priority support ticket has been submitted.`,
      type: "Ticket",
      link: "/company/support"
    }
  });

  return NextResponse.json({ success: true, ticket });
}

export async function GET(req: NextRequest) {
  const auth = await getAuthFromCookies("employee");
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const tickets = await prisma.supportTicket.findMany({ where: { employeeId: auth.sub }, orderBy: { createdAt: 'desc' } });
  return NextResponse.json({ tickets });
}
