import { prisma } from "@/lib/prisma";
import { Users, Briefcase, FileText, CheckCircle } from "lucide-react";
import DashboardChartsClient from "./DashboardChartsClient";
import { format, subDays } from "date-fns";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [
    employeesCount,
    postingsCount,
    activeTasksCount,
    pendingApplicantsCount,
    applicants,
    teamsWithTasks,
  ] = await Promise.all([
    prisma.employee.count({ where: { status: "Active" } }),
    prisma.jobPosting.count({ where: { status: "Open" } }),
    prisma.task.count({ where: { deadline: { gte: new Date() } } }),
    prisma.applicant.count({ where: { status: { in: ["Applied", "Reviewing", "Shortlisted", "InterviewInvited", "Passed"] } } }),
    prisma.applicant.findMany({ select: { createdAt: true, status: true } }),
    prisma.team.findMany({ include: { tasks: { include: { submissions: true } } } })
  ]);

  // Aggregate application data for the last 7 days
  const last7Days = Array.from({ length: 7 }).map((_, i) => format(subDays(new Date(), 6 - i), "MMM dd"));
  const applicationsData = last7Days.map((date: any) => {
    return {
      date,
      count: applicants.filter(a => format(a.createdAt, "MMM dd") === date).length
    };
  });

  // Aggregate task data by team
  const tasksData = teamsWithTasks.map((team: any) => {
    let pending = 0;
    let completed = 0;
    team.tasks.forEach(task => {
      if (task.submissions.some(s => s.status === "Approved")) {
        completed++;
      } else {
        pending++;
      }
    });
    return { team: team.name, pending, completed };
  });

  // Aggregate applicant status
  const statuses = ["Applied", "Reviewing", "Shortlisted", "InterviewInvited", "Passed", "Failed", "Rejected"];
  const applicantStatusData = statuses.map((status: any) => ({
    name: status,
    value: applicants.filter(a => a.status === status).length
  })).filter(s => s.value > 0);

  const chartData = {
    applicationsData,
    tasksData,
    applicantStatusData
  };

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 32 }}>Admin Dashboard</h1>
      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 24, marginBottom: 40 }}>
        <StatCard icon={<Users size={24} color="var(--purple)" />} label="Active Employees" value={employeesCount} />
        <StatCard icon={<Briefcase size={24} color="var(--blue)" />} label="Open Postings" value={postingsCount} />
        <StatCard icon={<FileText size={24} color="var(--amber)" />} label="Active Tasks" value={activeTasksCount} />
        <StatCard icon={<CheckCircle size={24} color="var(--green)" />} label="Pending Applicants" value={pendingApplicantsCount} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 24 }}>
        <DashboardChartsClient data={chartData} />
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="card" style={{ padding: 24, display: "flex", alignItems: "center", gap: 16 }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 28, fontWeight: 800, color: "var(--text-primary)" }}>{value}</div>
      </div>
    </div>
  );
}
