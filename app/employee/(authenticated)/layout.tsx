import { getAuthFromCookies } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import PortalLayout from "../PortalLayout";
import OnboardingWizard from "./OnboardingWizard";

export default async function EmployeePortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await getAuthFromCookies();
  if (!auth || (auth.role !== "employee" && auth.role !== "admin")) {
    redirect("/employee/login");
  }

  const employee = await prisma.employee.findUnique({
    where: { id: auth.sub },
    select: {
      id: true, name: true, email: true, designation: true, employeeCode: true,
      employmentType: true, photoUrl: true, mustResetPassword: true,
      policyAcknowledgedAt: true, teamId: true, status: true,
      team: { select: { id: true, name: true } },
    },
  });

  if (!employee || employee.mustResetPassword) {
    if (employee?.mustResetPassword) redirect("/employee/reset-password");
    redirect("/employee/login");
  }

  // Deactivation gate — show locked page instead of portal
  if (employee.status === "Inactive" || employee.status === "Terminated") {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ maxWidth: 480, textAlign: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(239,68,68,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", marginBottom: 10 }}>Account Deactivated</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>Your account has been deactivated. If you believe this is a mistake or need assistance, please contact your HR team.</p>
          <a href="mailto:hr@cyberlabsec.tech" style={{ color: "var(--purple)", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>hr@cyberlabsec.tech</a>
        </div>
      </div>
    );
  }

  if (!employee.policyAcknowledgedAt) {
    return <OnboardingWizard employee={employee} />;
  }

  return (
    <PortalLayout employee={employee}>
      {children}
    </PortalLayout>
  );
}
