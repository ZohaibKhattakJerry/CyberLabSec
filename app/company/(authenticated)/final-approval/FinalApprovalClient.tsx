"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { _Shield, _FileText, CheckCircle, Loader2, X, XCircle } from "lucide-react";
import toast from "react-hot-toast";

type Review = {
  id: string; type: string; submitterId: string; applicantId: string | null;
  status: string; comments: string | null; createdAt: string;
  submitter: { name: string; designation: string };
  applicant: unknown;
};

export default function FinalApprovalClient({ reviews }: { reviews: Review[] }) {
  const router = useRouter();
  const [_isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Review | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState("");
  const [successDialog, setSuccessDialog] = useState<{show: boolean; status: string; reviewType: string}>({show: false, status: "", reviewType: ""});
  const [customMessage, setCustomMessage] = useState("");
  const [offerLetterFileBase64, setOfferLetterFileBase64] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      setActionMsg("Offer letter must be a PDF file.");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setActionMsg("Offer letter PDF must be smaller than 3MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      setOfferLetterFileBase64(base64);
      setActionMsg("");
    };
    reader.readAsDataURL(file);
  };

  const handleAction = async (reviewId: string, status: "Approved" | "Rejected") => {
    if (status === "Approved" && selected?.type === "Hire Request" && !offerLetterFileBase64) {
      setActionMsg("Offer letter PDF is required to approve a hire request.");
      return;
    }

    setActionLoading(true); setActionMsg("");
    try {
      const res = await fetch(`/api/company/final-approval/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId, status, customMessage, offerLetterFileBase64 }),
      });
      
      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error("The server took too long to respond. The action might have succeeded, please refresh the page to check.");
      }
      
      if (!res.ok) { setActionMsg(data.error || "Failed to process review"); return; }
      
      setSuccessDialog({ show: true, status, reviewType: selected?.type || "Request" });
      startTransition(() => { router.refresh(); setSelected(null); });
    } catch (error: unknown) {
      setActionMsg(error.message || "An unexpected error occurred.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 4 }}>Final Approval Console</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>Final approval for hires and executive decisions.</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
        {reviews.map((r: Review) => (
          <div key={r.id} className="card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <span className="badge badge-purple">{r.type}</span>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{format(new Date(r.createdAt), "MMM d")}</span>
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>
                {r.type === "Hire Request" && r.applicant ? r.applicant.fullName : "General Review"}
              </h3>
            </div>
            
            {r.applicant && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <span className="badge badge-gray">{r.applicant.jobPosting.title}</span>
                <span className="badge badge-green">Score: {r.applicant.interviewSession?.totalScore}%</span>
              </div>
            )}

            <button className="btn btn-secondary" style={{ width: "100%", justifyContent: "center" }} onClick={() => { setSelected(r); setCustomMessage(""); setOfferLetterFileBase64(null); setActionMsg(""); }}>
              Review Request
            </button>
          </div>
        ))}
        {reviews.length === 0 && (
          <div style={{ gridColumn: "1 / -1", padding: 40, textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>
            No requests pending final approval.
          </div>
        )}
      </div>

      {selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div className="card" style={{ maxWidth: 640, width: "100%", padding: 32, maxHeight: "90vh", overflowY: "auto" }}>
            <div className="flex-mobile-col" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, gap: 16 }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800 }}>{selected.type}</h2>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                <X size={20} />
              </button>
            </div>

            {selected.applicant && (
              <>
                <div style={{ marginBottom: 20, padding: 16, background: "rgba(255,255,255,0.02)", borderRadius: 8, border: "1px solid var(--border)" }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{selected.applicant.fullName}</h3>
                  <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 12 }}>{selected.applicant.jobPosting.title} ({selected.applicant.jobPosting.type})</p>
                  
                  <div className="grid-mobile-1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <div style={{ padding: "12px", background: "var(--bg-card)", borderRadius: 6 }}>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>AI Screening Score</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: selected.applicant.fitScore ? "var(--green)" : "var(--text-muted)" }}>
                        {selected.applicant.fitScore ? `${selected.applicant.fitScore}%` : "—"}
                      </div>
                    </div>
                    <div style={{ padding: "12px", background: "var(--bg-card)", borderRadius: 6 }}>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Interview Score</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: selected.applicant.interviewSession?.totalScore ? "var(--green)" : "var(--text-muted)" }}>
                        {selected.applicant.interviewSession?.totalScore ? `${selected.applicant.interviewSession.totalScore}%` : "—"}
                      </div>
                    </div>
                  </div>
                </div>

                {selected.applicant.fitReasoning && (
                  <div style={{ marginBottom: 24 }}>
                    <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: "var(--text-muted)", textTransform: "uppercase" }}>AI Assessment Notes</h3>
                    <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, padding: "12px", background: "rgba(255,255,255,0.02)", borderRadius: 8, borderLeft: "2px solid var(--purple)" }}>
                      {selected.applicant.fitReasoning}
                    </p>
                  </div>
                )}
              </>
            )}

            {selected.comments && (
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: "var(--text-muted)", textTransform: "uppercase" }}>Submitter Comments</h3>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, padding: "12px", background: "rgba(255,255,255,0.02)", borderRadius: 8, borderLeft: "2px solid var(--blue)" }}>
                  {selected.comments}
                </p>
              </div>
            )}

            <div style={{ marginBottom: 24 }}>
              <label className="label">Custom Message (Included in Welcome Email or Rejection)</label>
              <textarea 
                className="input" 
                style={{ minHeight: 80 }} 
                placeholder="Welcome to the team! We are excited to have you..."
                value={customMessage}
                onChange={e => setCustomMessage(e.target.value)}
              />
            </div>

            {selected.type === "Hire Request" && (
              <div style={{ marginBottom: 24 }}>
                <label className="label">Attached Offer Letter (PDF)</label>
                <input type="file" accept="application/pdf" className="input" onChange={handleFileUpload} />
                {offerLetterFileBase64 && <p style={{ fontSize: 13, color: "var(--green)", marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}><CheckCircle size={14} /> PDF attached successfully</p>}
              </div>
            )}

            {actionMsg && (
              <div style={{ marginBottom: 20, padding: "12px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, fontSize: 13, color: "var(--red)" }}>
                {actionMsg}
              </div>
            )}

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8 }}>
              <button className="btn btn-primary" onClick={() => handleAction(selected.id, "Approved")} disabled={actionLoading} style={{ flex: 1, justifyContent: "center", padding: "14px", background: "var(--green)" }}>
                {actionLoading ? <Loader2 size={16} className="spin" /> : <CheckCircle size={18} />}
                Approve Request
              </button>
              <button className="btn btn-secondary" onClick={() => handleAction(selected.id, "Rejected")} disabled={actionLoading} style={{ flex: 1, justifyContent: "center", padding: "14px", color: "var(--red)", border: "1px solid var(--red)" }}>
                {actionLoading ? <Loader2 size={16} className="spin" /> : <XCircle size={18} />}
                Reject Request
              </button>
            </div>
          </div>
        </div>
      )}

      {successDialog.show && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div className="card" style={{ maxWidth: 400, width: "100%", padding: 32, textAlign: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(34,197,94,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <CheckCircle size={32} color="var(--green)" />
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>{successDialog.status}</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
              The {successDialog.reviewType.toLowerCase()} has been successfully {successDialog.status.toLowerCase()}. The applicant will be notified of the decision automatically.
            </p>
            <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", padding: "14px" }} onClick={() => setSuccessDialog({show: false, status: "", reviewType: ""})}>
              Close & Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
