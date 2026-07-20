import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthFromCookies } from '@/lib/auth';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  const auth = await getAuthFromCookies("admin");
  if (!auth || auth.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { name, email, designation, employmentType, teamId, startDate } = await req.json();
  if (!name || !email || !designation || !employmentType) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const existing = await prisma.employee.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: 'An employee with this email already exists' }, { status: 409 });

  const year = new Date().getFullYear();
  const code = `CL-${year}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
  const rawPassword = crypto.randomBytes(4).toString('hex');
  const passwordHash = await bcrypt.hash(rawPassword, 12);

  const employee = await prisma.employee.create({
    data: {
      name, email, designation, employmentType,
      employeeCode: code,
      passwordHash,
      mustResetPassword: true,
      forcePasswordChange: true,
      startDate: startDate ? new Date(startDate) : new Date(),
      teamId: teamId || null,
      status: 'Active',
    }
  });

  return NextResponse.json({ success: true, employeeCode: code, tempPassword: rawPassword, employeeId: employee.id });
}
