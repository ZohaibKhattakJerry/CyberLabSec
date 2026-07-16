import { getAuthFromCookies } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Shield, FileText, Download, Award, Briefcase, FileSignature } from "lucide-react";

export const dynamic = "force-dynamic";

type DocSection = {
  heading: string;
  icon: React.ReactNode;
  color: string;
  docs: DocItem[];
};

type DocItem = {
  label: string;
  desc: string;
  icon: string;
  url: string | null;
};

export default async function DocumentsPage() {
  const auth = await getAuthFromCookies();
  if (!auth) redirect("/employee/login");

  const employee = await prisma.employee.findUnique({
    where: { id: auth.sub },
    select: { id: true, status: true, employmentType: true },
  });

  if (!employee) redirect("/employee/login");

  const isCompleted = employee.status === "Inactive";
  const empType = employee.employmentType || "Employee";

  // --- Universal documents (all employment types) ---
  const universalDocs: DocItem[] = [
    {
      label: "Offer Letter",
      desc: "Your official employment offer letter",
      icon: "📄",
      url: `/api/files/offer-letter/${employee.id}`,
    },
    {
      label: "Non-Disclosure Agreement (NDA)",
      desc: "Confidentiality agreement signed on joining",
      icon: "🔒",
      url: null, // will be set if uploaded
    },
    {
      label: "Policy Documents",
      desc: "Company policies, code of conduct, and HR guidelines",
      icon: "📋",
      url: null,
    },
  ];

  // --- Type-specific documents ---
  const typeSpecificDocs: DocItem[] = [];

  if (empType === "Full-Time" || empType === "Employee") {
    typeSpecificDocs.push(
      {
        label: "Employment Contract",
        desc: "Your full-time employment agreement",
        icon: "📝",
        url: null,
      },
      {
        label: "Benefits & Compensation Info",
        desc: "Health benefits, leave policy, and compensation details",
        icon: "💼",
        url: null,
      }
    );
  }

  if (empType === "Intern") {
    typeSpecificDocs.push(
      {
        label: "Internship Completion Certificate",
        desc: "Certificate issued upon successful program completion",
        icon: "🎓",
        url: isCompleted
          ? `/api/company/employees/${employee.id}/certificate?type=completion`
          : null,
      },
      {
        label: "Letter of Recommendation (LoR)",
        desc: "Performance-based recommendation letter",
        icon: "📜",
        url: isCompleted
          ? `/api/company/employees/${employee.id}/certificate?type=lor`
          : null,
      }
    );
  }

  if (empType === "Contract") {
    typeSpecificDocs.push(
      {
        label: "Contract Agreement",
        desc: "Your project-based contract terms and scope",
        icon: "📃",
        url: null,
      },
      {
        label: "Project NDA",
        desc: "Project-specific non-disclosure agreement",
        icon: "🛡️",
        url: null,
      }
    );
  }

  if (empType === "Part-Time") {
    typeSpecificDocs.push(
      {
        label: "Part-Time Agreement",
        desc: "Your part-time work schedule and terms",
        icon: "🗓️",
        url: null,
      }
    );
  }

  const sections: DocSection[] = [
    {
      heading: "Universal Records",
      icon: <Shield size={16} />,
      color: "var(--purple)",
      docs: universalDocs,
    },
    ...(typeSpecificDocs.length > 0
      ? [
          {
            heading:
              empType === "Intern"
                ? "Internship Documents"
                : empType === "Contract"
                ? "Contract Documents"
                : empType === "Part-Time"
                ? "Part-Time Documents"
                : "Employment Documents",
            icon:
              empType === "Intern" ? (
                <Award size={16} />
              ) : empType === "Contract" ? (
                <FileSignature size={16} />
              ) : (
                <Briefcase size={16} />
              ),
            color:
              empType === "Intern"
                ? "var(--amber)"
                : empType === "Contract"
                ? "var(--blue)"
                : "var(--green)",
            docs: typeSpecificDocs,
          },
        ]
      : []),
  ];

  const empTypeBadgeColor =
    empType === "Intern"
      ? { bg: "rgba(245,158,11,0.12)", color: "#f59e0b", border: "rgba(245,158,11,0.3)" }
      : empType === "Contract"
      ? { bg: "rgba(59,130,246,0.12)", color: "#3b82f6", border: "rgba(59,130,246,0.3)" }
      : empType === "Part-Time"
      ? { bg: "rgba(34,197,94,0.12)", color: "#22c55e", border: "rgba(34,197,94,0.3)" }
      : { bg: "rgba(168,85,247,0.12)", color: "var(--purple)", border: "rgba(168,85,247,0.3)" };

  return (
    <div style={{ maxWidth: 820, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            background: "rgba(168,85,247,0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--purple)",
            flexShrink: 0,
            border: "1px solid rgba(168,85,247,0.2)",
          }}
        >
          <FileText size={26} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>My Documents</h1>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: "3px 10px",
                borderRadius: 999,
                background: empTypeBadgeColor.bg,
                color: empTypeBadgeColor.color,
                border: `1px solid ${empTypeBadgeColor.border}`,
                letterSpacing: "0.04em",
              }}
            >
              {empType}
            </span>
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 4 }}>
            Access your official employment records and certificates.
          </p>
        </div>
      </div>

      {/* Document Sections */}
      <div style={{ display: "grid", gap: 20 }}>
        {sections.map((section) => (
          <div key={section.heading} className="card" style={{ padding: 24 }}>
            <h2
              style={{
                fontSize: 13,
                fontWeight: 700,
                marginBottom: 16,
                display: "flex",
                alignItems: "center",
                gap: 8,
                color: section.color,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              {section.icon} {section.heading}
            </h2>

            <div style={{ display: "grid", gap: 10 }}>
              {section.docs.map((doc) => (
                <div
                  key={doc.label}
                  className="card-hover"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "14px 18px",
                    background: "rgba(255,255,255,0.02)",
                    borderRadius: 12,
                    border: "1px solid var(--border-subtle)",
                    transition: "all 0.2s",
                    gap: 16,
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div
                      style={{
                        fontSize: 22,
                        width: 42,
                        height: 42,
                        borderRadius: 10,
                        background: "rgba(0,0,0,0.2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {doc.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
                        {doc.label}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                        {doc.desc}
                      </div>
                    </div>
                  </div>

                  {doc.url ? (
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary btn-sm"
                      style={{ gap: 6, flexShrink: 0 }}
                    >
                      <Download size={13} /> Download
                    </a>
                  ) : (
                    <span
                      className="badge badge-gray"
                      style={{ fontSize: 11, flexShrink: 0, opacity: 0.7 }}
                    >
                      Not Yet Issued
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Info note for interns awaiting completion */}
      {empType === "Intern" && !isCompleted && (
        <div
          style={{
            marginTop: 20,
            padding: "14px 18px",
            background: "rgba(168,85,247,0.05)",
            borderRadius: 10,
            borderLeft: "4px solid var(--purple)",
          }}
        >
          <p
            style={{
              fontSize: 13,
              color: "var(--text-secondary)",
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Shield size={14} color="var(--purple)" />
            Your Internship Certificate and LoR will be securely generated and made available here
            after your program ends.
          </p>
        </div>
      )}
    </div>
  );
}
