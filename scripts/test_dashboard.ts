import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function test() {
  const employeeCode = 'CL-2026-9F94';
  const employee = await prisma.employee.findUnique({
    where: { employeeCode },
    select: {
      id: true, name: true, email: true, designation: true,
      employeeCode: true, employmentType: true, tier: true,
      status: true, photoUrl: true, startDate: true, endDate: true,
      points: true, monthlyPoints: true, teamId: true,
      team: {
        select: {
          id: true, name: true,
          members: { select: { id: true, name: true, designation: true, status: true }, where: { status: "Active" } },
          tasks: {
            select: { 
              id: true, title: true, deadline: true, status: true, 
              submissions: { select: { status: true } } 
            },
            orderBy: { deadline: 'asc' },
          },
        },
      },
      badges: { orderBy: { awardedAt: 'desc' }, take: 5, select: { id: true, type: true, label: true, awardedAt: true } },
      pointTransactions: { orderBy: { createdAt: 'desc' }, take: 3, select: { points: true, reason: true, createdAt: true } },
    },
  });

  if (!employee) {
    console.log("No employee found");
    return;
  }

  console.log("Found employee:", employee.name, employee.status);
  
  const now = new Date();
  const [countAhead, rawAnnouncements, myReceipts, activityLogs] = await Promise.all([
      prisma.employee.count({ where: { status: 'Active', monthlyPoints: { gt: employee.monthlyPoints } } }),
      prisma.announcement.findMany({
        where: { 
          OR: [
            { scope: "Company" },
            { scope: "Team", teamId: employee.teamId || undefined },
            { scope: "Individual", employeeId: employee.id },
          ],
          AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] }],
          sentAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } 
        },
        orderBy: { sentAt: 'desc' }, take: 5,
        select: { id: true, title: true, message: true, scope: true, sentAt: true, isPinned: true, sentBy: { select: { name: true } } },
      }),
      prisma.announcementReadReceipt.findMany({ where: { employeeId: employee.id }, select: { announcementId: true } }),
      prisma.activityLog.findMany({ where: { actorId: employee.id }, orderBy: { timestamp: 'desc' }, take: 5, select: { id: true, action: true, timestamp: true } }),
  ]);
  console.log("Dashboard queries OK", countAhead);
}

test().catch(e => console.error("Error:", e)).finally(() => prisma.$disconnect());
