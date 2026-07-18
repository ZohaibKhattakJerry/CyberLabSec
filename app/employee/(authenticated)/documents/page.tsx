"use server";

import { getAuthFromCookies } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Shield, FileText, Download, Award, Briefcase, FileSignature, Lock, Clock, CheckCircle2, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  const auth = await getAuthFromCookies();
  if (!auth) redirect("/employee/login");

  const employee = await prisma.employee.findUnique({
    where: { id: auth.sub },
    select: { 
      id: true, 
      name: true,
      status: true, 
      employmentType: true, 
      documents: {
        orderBy: { createdAt: "desc" }
      } 
    },
  });

  if (!employee) redirect("/employee/login");

  const dbDocs = employee.documents || [];
  const getDoc = (title: string) => dbDocs.find(d => d.title === title);
  const getDocUrl = (title: string) => getDoc(title)?.fileUrl || null;

  const isCompleted = employee.status === "Inactive";
  const empType = employee.employmentType || "Employee";

  const universalDocs = [
    {
      label: "Offer Letter",
      desc: "Your official employment offer letter",
      icon: "📄",
      category: "HR Document",
      status: "available" as const,
      url: `/api/files/offer-letter/${employee.id}`,
    },
    {
      label: "Non-Disclosure Agreement (NDA)",
      desc: "Confidentiality agreement signed on joining",
      icon: "🔒",
      category: "Legal",
      status: (getDocUrl("NDA") ? "available" : "pending") as "available" | "pending",
      url: getDocUrl("NDA"),
    },
    {
      label: "Policy Documents",
      desc: "Company policies, code of conduct, and HR guidelines",
      icon: "📋",
      category: "Policy",
      status: "pending" as const,
      url: null,
    },
  ];

  const typeSpecificDocs: typeof universalDocs = [];

  if (empType === "Full-Time" || empType === "Employee") {
    typeSpecificDocs.push(
      {
        label: "Employment Contract",
        desc: "Your full-time employment agreement",
        icon: "📝",
        category: "Contract",
        status: (getDocUrl("Employment Contract") ? "available" : "pending") as "available" | "pending",
        url: getDocUrl("Employment Contract"),
      },
      {
        label: "Benefits & Compensation Info",
        desc: "Health benefits, leave policy, and compensation details",
        icon: "💼",
        category: "HR Document",
        status: "pending" as const,
        url: null,
      }
    );
  }

  if (empType === "Intern") {
    typeSpecificDocs.push(
      {
        label: "Internship Completion Certificate",
        desc: isCompleted ? "Your official certificate of completion" : "Issued upon successful program completion",
        icon: "🎓",
        category: "Certificate",
        status: (isCompleted ? "available" : "locked") as "available" | "pending" | "locked",
        url: isCompleted ? `/api/company/employees/${employee.id}/certificate?type=completion` : null,
      },
      {
        label: "Letter of Recommendation (LoR)",
        desc: isCompleted ? "Performance-based recommendation letter" : "Issued upon program completion",
        icon: "📜",
        category: "Certificate",
        status: (isCompleted ? "available" : "locked") as "available" | "pending" | "locked",
        url: isCompleted ? `/api/company/employees/${employee.id}/certificate?type=lor` : null,
      }
    );
  }

  if (empType === "Contract") {
    typeSpecificDocs.push(
      {
        label: "Contract Agreement",
        desc: "Your project-based contract terms and scope",
        icon: "📃",
        category: "Contract",
        status: (getDocUrl("Contract Agreement") ? "available" : "pending") as "available" | "pending",
        url: getDocUrl("Contract Agreement"),
      },
      {
        label: "Project NDA",
        desc: "Project-specific non-disclosure agreement",
        icon: "🛡️",
        category: "Legal",
        status: (getDocUrl("Project NDA") ? "available" : "pending") as "available" | "pending",
        url: getDocUrl("Project NDA"),
      }
    );
  }

  if (empType === "Part-Time") {
    typeSpecificDocs.push(
      {
        label: "Part-Time Agreement",
        desc: "Your part-time work schedule and terms",
        icon: "🗓️",
        category: "Contract",
        status: (getDocUrl("Part-Time Agreement") ? "available" : "pending") as "available" | "pending",
        url: getDocUrl("Part-Time Agreement"),
      }
    );
  }

  const standardDocTitles = ["Offer Letter", "NDA", "Employment Contract", "Contract Agreement", "Project NDA", "Part-Time Agreement"];
  const extraDocs = dbDocs.filter(d => !standardDocTitles.includes(d.title));

  const empTypeBadge =
    empType === "Intern"
      ? { bg: "rgba(245,158,11,0.12)", color: "#f59e0b", border: "rgba(245,158,11,0.3)" }
      : empType === "Contract"
      ? { bg: "rgba(59,130,246,0.12)", color: "#3b82f6", border: "rgba(59,130,246,0.3)" }
      : empType === "Part-Time"
      ? { bg: "rgba(34,197,94,0.12)", color: "#22c55e", border: "rgba(34,197,94,0.3)" }
      : { bg: "rgba(168,85,247,0.12)", color: "var(--purple)", border: "rgba(168,85,247,0.3)" };

  const totalAvailable = [...universalDocs, ...typeSpecificDocs].filter(d => d.status === "available").length;
  const totalDocs = [...universalDocs, ...typeSpecificDocs].length;

  return (
    <div style={{ maxWidth: 860, margin: "0 auto" }}>

      {/* ── HEADER ── */}
      <div className="card" style={{ padding: "28px 32px", marginBottom: 24, background: "linear-gradient(135deg, rgba(168,85,247,0.06) 0%, rgba(109,40,217,0.03) 100%)", border: "1px solid rgba(168,85,247,0.15)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
          <div style={{ width: 60, height: 60, borderRadius: 16, background: "rgba(168,85,247,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--purple)", flexShrink: 0, border: "1px solid rgba(168,85,247,0.25)" }}>
            <FileText size={28} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 4 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>My Documents</h1>
              <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 999, background: empTypeBadge.bg, color: empTypeBadge.color, border: `1px solid ${empTypeBadge.border}`, letterSpacing: "0.04em" }}>
                {empType}
              </span>
            </div>
            <p style={{ color: "var(--text-muted)", fontSize: 13, margin: 0 }}>
              Your official employment records, certificates, and legal documents
            </p>
          </div>
          {/* Progress */}
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: "var(--purple)", lineHeight: 1 }}>{totalAvailable}<span style={{ fontSize: 14, color: "var(--text-muted)", fontWeight: 500 }}>/{totalDocs}</span></div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>Available</div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ marginTop: 20, background: "rgba(255,255,255,0.05)", borderRadius: 999, height: 6, overflow: "hidden" }}>
          <div style={{ height: "100%", borderRadius: 999, background: "linear-gradient(90deg, var(--purple), #a855f7)", width: `${totalDocs > 0 ? (totalAvailable / totalDocs) * 100 : 0}%`, transition: "width 0.5s ease" }} />
        </div>
      </div>

      {/* ── UNIVERSAL DOCUMENTS ── */}
      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <Shield size={15} color="var(--purple)" />
          <h2 style={{ fontSize: 12, fontWeight: 700, color: "var(--purple)", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>Universal Records</h2>
        </div>
        <div style={{ display: "grid", gap: 10 }}>
          {universalDocs.map(doc => <DocCard key={doc.label} doc={doc} />)}
        </div>
      </div>

      {/* ── TYPE-SPECIFIC DOCUMENTS ── */}
      {typeSpecificDocs.length > 0 && (
        <div className="card" style={{ padding: 24, marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            {empType === "Intern" ? <Award size={15} color="var(--amber)" /> : empType === "Contract" ? <FileSignature size={15} color="var(--blue)" /> : <Briefcase size={15} color="var(--green)" />}
            <h2 style={{ fontSize: 12, fontWeight: 700, color: empType === "Intern" ? "var(--amber)" : empType === "Contract" ? "var(--blue)" : "var(--green)", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>
              {empType === "Intern" ? "Internship Documents" : empType === "Contract" ? "Contract Documents" : empType === "Part-Time" ? "Part-Time Documents" : "Employment Documents"}
            </h2>
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            {typeSpecificDocs.map(doc => <DocCard key={doc.label} doc={doc} />)}
          </div>
          {empType === "Intern" && !isCompleted && (
            <div style={{ marginTop: 16, padding: "12px 16px", background: "rgba(245,158,11,0.06)", borderRadius: 10, borderLeft: "3px solid var(--amber)", display: "flex", alignItems: "center", gap: 10 }}>
              <Clock size={14} color="var(--amber)" style={{ flexShrink: 0 }} />
              <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: 0 }}>
                Your Internship Certificate and Letter of Recommendation will be generated and made available here after your program ends.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── EXTRA UPLOADED DOCUMENTS ── */}
      {extraDocs.length > 0 && (
        <div className="card" style={{ padding: 24, marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <FileText size={15} color="var(--text-secondary)" />
            <h2 style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>Other Documents</h2>
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            {extraDocs.map(doc => (
              <DocCard
                key={doc.id}
                doc={{
                  label: doc.title,
                  desc: `Type: ${doc.type}`,
                  icon: "📄",
                  category: doc.type,
                  status: doc.fileUrl ? "available" : "pending",
                  url: doc.fileUrl || null,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── SECURITY NOTE ── */}
      <div style={{ padding: "14px 18px", background: "rgba(168,85,247,0.04)", borderRadius: 10, border: "1px solid rgba(168,85,247,0.1)", display: "flex", alignItems: "center", gap: 12 }}>
        <Lock size={14} color="var(--purple)" style={{ flexShrink: 0 }} />
        <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>
          All documents are encrypted and securely stored. Only you and authorized HR personnel have access to these files. Contact HR to request any missing documents.
        </p>
      </div>
    </div>
  );
}

function DocCard({ doc }: { doc: { label: string; desc: string; icon: string; category: string; status: "available" | "pending" | "locked"; url: string | null } }) {
  const isAvailable = doc.status === "available";
  const isLocked = doc.status === "locked";

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "14px 18px",
        background: isAvailable ? "rgba(34,197,94,0.03)" : isLocked ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.02)",
        borderRadius: 12,
        border: `1px solid ${isAvailable ? "rgba(34,197,94,0.15)" : isLocked ? "rgba(255,255,255,0.04)" : "var(--border-subtle)"}`,
        transition: "all 0.2s",
        gap: 16,
        flexWrap: "wrap",
        opacity: isLocked ? 0.55 : 1,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ fontSize: 20, width: 44, height: 44, borderRadius: 11, background: isAvailable ? "rgba(34,197,94,0.1)" : "rgba(0,0,0,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {doc.icon}
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 7 }}>
            {doc.label}
            {isAvailable && <CheckCircle2 size={13} color="var(--green)" />}
            {isLocked && <Lock size={12} color="var(--text-muted)" />}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ padding: "1px 6px", borderRadius: 4, background: "rgba(255,255,255,0.05)", fontSize: 10, fontWeight: 600, letterSpacing: "0.03em" }}>{doc.category}</span>
            {doc.desc}
          </div>
        </div>
      </div>

      {isAvailable && doc.url ? (
        <a
          href={doc.url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary btn-sm"
          style={{ gap: 6, flexShrink: 0, borderColor: "rgba(34,197,94,0.3)", color: "var(--green)" }}
        >
          <Download size={13} /> Download
        </a>
      ) : isLocked ? (
        <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
          <Lock size={11} /> Locked
        </span>
      ) : (
        <span style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
          <AlertCircle size={11} /> Not Yet Issued
        </span>
      )}
    </div>
  );
}
