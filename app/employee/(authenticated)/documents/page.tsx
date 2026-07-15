import { getAuthFromCookies } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Shield, Eye, FileText } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  const auth = await getAuthFromCookies();
  if (!auth) redirect("/employee/login");

  const employee = await prisma.employee.findUnique({
    where: { id: auth.sub },
    select: { id: true, status: true },
  });

  if (!employee) redirect("/employee/login");

  const documents = [
    { label: "Offer Letter", desc: "Your employment offer letter", icon: "📄", available: true, href: `/api/files/offer-letter/${employee.id}` },
    { label: "Internship Completion Certificate", desc: "Certificate upon program completion", icon: "🎓", available: employee.status === "Inactive", href: `/api/company/employees/${employee.id}/certificate?type=completion` },
    { label: "Letter of Recommendation", desc: "Performance-based recommendation letter", icon: "📝", available: employee.status === "Inactive", href: `/api/company/employees/${employee.id}/certificate?type=lor` },
  ];

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(168,85,247,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--purple)" }}>
          <FileText size={24} />
        </div>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>My Documents</h1>
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Access your official employment records and certificates.</p>
        </div>
      </div>

      <div className="card" style={{ padding: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8, color: "var(--text-primary)" }}>
          <Shield size={16} color="var(--purple)" /> Official Records
        </h2>
        
        <div style={{ display: "grid", gap: 12 }}>
          {documents.map((doc) => (
            <div key={doc.label} className="card-hover" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", background: "rgba(255,255,255,0.02)", borderRadius: 12, border: "1px solid var(--border-subtle)", transition: "all 0.2s" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ fontSize: 24, width: 40, height: 40, borderRadius: 10, background: "rgba(0,0,0,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {doc.icon}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>{doc.label}</div>
                  <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>{doc.desc}</div>
                </div>
              </div>
              {doc.available ? (
                <a href={doc.href} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ gap: 6 }}>
                  <Eye size={14} /> View Document
                </a>
              ) : (
                <span className="badge badge-gray" style={{ fontSize: 12 }}>Not available yet</span>
              )}
            </div>
          ))}
        </div>
        
        {employee.status !== "Inactive" && (
          <div style={{ marginTop: 20, padding: 16, background: "rgba(168,85,247,0.05)", borderRadius: 8, borderLeft: "4px solid var(--purple)" }}>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <Shield size={14} color="var(--purple)" />
              Completion Certificate and LoR will be securely generated and made available here after your program ends.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
