"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Shield, FileText, CheckCircle, Loader2, X, FileSignature } from "lucide-react";

type Applicant = {
  id: string; fullName: string; email: string; phone: string;
  status: string; fitScore: number | null; fitReasoning: string | null;
  createdAt: string; jobPostingId: string;
  jobPosting: { id: string; title: string; type: string };
  interviewSession: { id: string; totalScore: number | null; result: string | null; completedAt: string | null } | null;
};

export default function CeoReviewClient({ applicants }: { applicants: Applicant[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Applicant | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState("");
  const [ceoNotes, setCeoNotes] = useState("");
  const [offerLetterUrl, setOfferLetterUrl] = useState<string | null>(null);

  const generateOfferLetter = async (applicantId: string) => {
    setActionLoading(true); setActionMsg(""); setOfferLetterUrl(null);
    const res = await fetch(`/api/company/applications/${applicantId}/offer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ceoNotes }),
    });
    const data = await res.json();
    setActionLoading(false);
    if (!res.ok) { setActionMsg(data.error || "Failed to generate offer letter"); return; }
    
    setActionMsg("Offer letter generated successfully!");
    setOfferLetterUrl(data.url);
  };

  const approveAndHire = async (applicantId: string) => {
    setActionLoading(true); setActionMsg("");
    const res = await fetch(`/api/company/applications/${applicantId}/hire`, {
      method: "POST",
    });
    const data = await res.json();
    setActionLoading(false);
    if (!res.ok) { setActionMsg(data.error || "Failed to create employee record"); return; }
    
    setActionMsg(`Employee created: ${data.employeeCode}`);
    startTransition(() => { router.refresh(); setSelected(null); });
  };

  return (
    <div>
      <div style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 40, height: 40, background: "var(--purple)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "var(--shadow-purple)" }}>
          <Shield size={20} color="#fff" />
        </div>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 4 }}>CEO Review Console</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>Final approval and offer letter generation for passed candidates.</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
        {applicants.map((a: any) => (
          <div key={a.id} className="card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>{a.fullName}</h3>
              <p style={{ fontSize: 13, color: "var(--text-muted)" }}>{a.email}</p>
            </div>
            
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span className="badge badge-purple">{a.jobPosting.title}</span>
              <span className="badge badge-green">Score: {a.interviewSession?.totalScore}%</span>
            </div>

            <button className="btn btn-secondary" style={{ width: "100%", justifyContent: "center" }} onClick={() => { setSelected(a); setCeoNotes(""); setOfferLetterUrl(null); setActionMsg(""); }}>
              Review Candidate
            </button>
          </div>
        ))}
        {applicants.length === 0 && (
          <div style={{ gridColumn: "1 / -1", padding: 40, textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>
            No candidates pending CEO review.
          </div>
        )}
      </div>

      {selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div className="card" style={{ maxWidth: 640, width: "100%", padding: 32, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800 }}>Review: {selected.fullName}</h2>
                <p style={{ fontSize: 13, color: "var(--text-muted)" }}>{selected.jobPosting.title} ({selected.jobPosting.type})</p>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
              <div style={{ padding: "12px", background: "rgba(255,255,255,0.02)", borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>AI Screening Score</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--green)" }}>{selected.fitScore}%</div>
              </div>
              <div style={{ padding: "12px", background: "rgba(255,255,255,0.02)", borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Interview Score</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--green)" }}>{selected.interviewSession?.totalScore}%</div>
              </div>
            </div>

            {selected.fitReasoning && (
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: "var(--text-muted)", textTransform: "uppercase" }}>AI Assessment Notes</h3>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, padding: "12px", background: "rgba(255,255,255,0.02)", borderRadius: 8, borderLeft: "2px solid var(--purple)" }}>
                  {selected.fitReasoning}
                </p>
              </div>
            )}

            <div style={{ marginBottom: 24 }}>
              <label className="label">CEO Notes (Optional)</label>
              <textarea 
                className="input" 
                style={{ minHeight: 80 }} 
                placeholder="Add notes or specific terms for the offer letter..."
                value={ceoNotes}
                onChange={e => setCeoNotes(e.target.value)}
              />
            </div>

            {actionMsg && (
              <div style={{ marginBottom: 20, padding: "12px", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 8, fontSize: 13, color: "var(--green)" }}>
                {actionMsg}
              </div>
            )}

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {!offerLetterUrl ? (
                <button className="btn btn-secondary" onClick={() => generateOfferLetter(selected.id)} disabled={actionLoading}>
                  {actionLoading ? <Loader2 size={16} className="spin" /> : <FileSignature size={16} />}
                  Generate Offer Letter
                </button>
              ) : (
                <a href={offerLetterUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ gap: 8 }}>
                  <FileText size={16} /> View Offer Letter
                </a>
              )}

              <button className="btn btn-primary" onClick={() => approveAndHire(selected.id)} disabled={actionLoading || !offerLetterUrl}>
                <CheckCircle size={16} />
                Approve & Hire
              </button>
            </div>
            
            {!offerLetterUrl && (
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 12 }}>
                * You must generate an offer letter before approving the hire.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
