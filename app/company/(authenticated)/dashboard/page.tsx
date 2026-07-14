import { prisma } from "@/lib/prisma";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    employees,
    openPostings,
    newApplications,
    activeTasks,
    overdueTasks,
    pendingApprovals,
    pendingReviews,
    recentActivity,
    tasksByStatus,
    hiringFunnel,
    topEmployees,
  ] = await Promise.all([
    prisma.employee.count({ where: { status: "Active" } }),
    prisma.jobPosting.count({ where: { status: "Published" } }),
    prisma.applicant.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.task.count({ where: { status: { in: ["Assigned", "InProgress", "Submitted"] } } }),
    prisma.task.count({ where: { deadline: { lt: now }, status: { not: "Completed" } } }),
    prisma.cEOReview.count({ where: { status: "Pending" } }).catch(() => 0),
    prisma.taskSubmission.count({ where: { status: "Pending" } }),
    prisma.activityLog.findMany({ orderBy: { timestamp: "desc" }, take: 20 }),
    prisma.task.groupBy({ by: ["status"], _count: { id: true } }),
    prisma.applicant.groupBy({ by: ["status"], _count: { id: true } }),
    prisma.employee.findMany({
      where: { status: "Active" },
      orderBy: { points: "desc" },
      take: 5,
      select: { id: true, name: true, designation: true, points: true, monthlyPoints: true },
    }),
  ]);

  const data = {
    stats: {
      employees,
      openPostings,
      newApplications,
      activeTasks,
      overdueTasks,
      pendingApprovals,
      pendingReviews,
    },
    recentActivity: recentActivity.map((a) => ({
      id: a.id,
      action: a.action,
      actorId: a.actorId || "",
      metadata: a.metadata,
      createdAt: a.timestamp.toISOString(),
    })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tasksByStatus: tasksByStatus as any[],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    hiringFunnel: hiringFunnel as any[],
    topEmployees,
  };

  return <DashboardClient data={data} />;
}
