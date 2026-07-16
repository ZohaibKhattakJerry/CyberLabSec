import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthFromCookies } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const auth = await getAuthFromCookies();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { category, title, description, priority } = await req.json();
  if (!title || !description) return NextResponse.json({ error: 'Title and description required' }, { status: 400 });
  const ticket = await prisma.supportTicket.create({
    data: { employeeId: auth.sub, category: category || 'General', title, description, priority: priority || 'Medium' }
  });
  return NextResponse.json({ success: true, ticket });
}

export async function GET(req: NextRequest) {
  const auth = await getAuthFromCookies();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const tickets = await prisma.supportTicket.findMany({ where: { employeeId: auth.sub }, orderBy: { createdAt: 'desc' } });
  return NextResponse.json({ tickets });
}
