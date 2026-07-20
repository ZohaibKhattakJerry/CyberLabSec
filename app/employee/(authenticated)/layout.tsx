import { getAuthFromCookies } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import PortalLayout from "../PortalLayout";
import OnboardingWizard from "./OnboardingWizard";

export const dynamic = "force-dynamic";

export default async function EmployeePortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Middleware already guarantees a valid employee token exists.
  // We just need to fetch the employee record.
  const auth = await getAuthFromCookies("employee");
  if (!auth) {
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

  if (!employee) {
    redirect("/employee/login");
  }

  if (employee.mustResetPassword) {
    redirect("/employee/reset-password");
  }

  // Deactivation gate
  if (employee.status === "Inactive" || employee.status === "Terminated") {
    return (
      <div style={{ minHeight: "100vh", background: "#06060A", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ maxWidth: 480, textAlign: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(239,68,68,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#FFFFFF", marginBottom: 10 }}>Account Deactivated</h1>
          <p style={{ color: "#6B7280", fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>Your account has been deactivated. If you believe this is a mistake, please contact your HR team.</p>
          <a href="mailto:hr@cyberlabsec.tech" style={{ color: "#A855F7", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>hr@cyberlabsec.tech</a>
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
