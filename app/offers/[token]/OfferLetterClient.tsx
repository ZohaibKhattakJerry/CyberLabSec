"use client";

import { useState } from "react";
import { CheckCircle, X, Clock, AlertTriangle, Loader2, Shield } from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";

interface Props {
  offerId: string;
  token: string;
  content: string;
  status: string;
  expiresAt: string;
  candidateName: string;
  jobTitle: string;
  isExpired: boolean;
  isDecided: boolean;
  acceptedName: string | null;
  declineReason: string | null;
}

export default function OfferLetterClient({ token, content, status, expiresAt, candidateName, jobTitle, isExpired, isDecided, acceptedName }: Props) {
  const [action, setAction] = useState<"accept" | "decline" | null>(null);
  const [signatureName, setSignatureName] = useState("");
  const [declineNote, setDeclineNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [doneAction, setDoneAction] = useState<"accepted" | "declined" | null>(null);

  const handleRespond = async () => {
    if (!action) return;
    if (action === "accept" && !signatureName.trim()) {
      toast.error("Please type your full name to accept");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/offers/${token}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, signatureName: signatureName.trim(), declineReason: declineNote.trim() }),
      });
      if (!res.ok) throw new Error("Failed");
      setDone(true);
      setDoneAction(action === "accept" ? "accepted" : "declined");
    } catch {
      toast.error("Failed to submit. Please try again or contact careers@cyberlabsec.tech");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ maxWidth: 500, width: "100%", textAlign: "center" }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%", background: doneAction === "accepted" ? "rgba(34,197,94,0.1)" : "rgba(100,116,139,0.1)", border: `2px solid ${doneAction === "accepted" ? "rgba(34,197,94,0.4)" : "rgba(100,116,139,0.3)"}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
            {doneAction === "accepted" ? <CheckCircle size={40} color="var(--green)" /> : <X size={40} color="var(--text-muted)" />}
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 12, color: "var(--text-primary)" }}>
            {doneAction === "accepted" ? "Offer Accepted!" : "Offer Declined"}
          </h1>
          <p style={{ fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.7 }}>
            {doneAction === "accepted"
              ? `Congratulations! Your acceptance of the ${jobTitle} position at CyberLabSec has been recorded. You'll receive a welcome email with next steps shortly.`
              : "Your decision has been noted. Thank you for considering CyberLabSec. We wish you the best in your future endeavors."}
          </p>
          {doneAction === "accepted" && (
            <div style={{ marginTop: 24, padding: 16, background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 12 }}>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>📧 Check your email for login credentials and onboarding instructions.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", padding: "32px 16px" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(168,85,247,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Shield size={20} color="var(--purple)" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: "var(--text-primary)" }}>CyberLabSec</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Official Offer Letter</div>
          </div>
        </div>

        {/* Status banners */}
        {isExpired && (
          <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 12, padding: 16, marginBottom: 24, display: "flex", gap: 12, alignItems: "center" }}>
            <AlertTriangle size={20} color="var(--red)" />
            <div>
              <div style={{ fontWeight: 700, color: "var(--red)" }}>Offer Expired</div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>This offer expired on {format(new Date(expiresAt), "MMMM d, yyyy 'at' h:mm a")}. Contact careers@cyberlabsec.tech if you believe this is an error.</div>
            </div>
          </div>
        )}

        {isDecided && !done && (
          <div style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: 12, padding: 16, marginBottom: 24 }}>
            <div style={{ fontWeight: 700, color: "var(--green)", marginBottom: 4 }}>
              {status === "Accepted" ? "✅ You have accepted this offer" : "Offer Declined"}
            </div>
            {acceptedName && <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>Digitally signed by: {acceptedName}</div>}
          </div>
        )}

        {!isExpired && !isDecided && (
          <div style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 12, padding: 14, marginBottom: 24, display: "flex", alignItems: "center", gap: 10 }}>
            <Clock size={16} color="var(--blue)" />
            <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              This offer expires on <strong style={{ color: "var(--text-primary)" }}>{format(new Date(expiresAt), "MMMM d, yyyy")}</strong>. Please respond before the deadline.
            </span>
          </div>
        )}

        {/* Offer content */}
        <div className="card" style={{ padding: 40, marginBottom: 32, lineHeight: 1.8 }}>
          <div dangerouslySetInnerHTML={{ __html: content }} style={{ color: "var(--text-secondary)", fontSize: 15 }} />
        </div>

        {/* Action area */}
        {!isExpired && !isDecided && (
          <div className="card" style={{ padding: 28 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: "var(--text-primary)" }}>Respond to This Offer</h3>

            {!action && (
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1, minWidth: 160 }}
                  onClick={() => setAction("accept")}
                >
                  <CheckCircle size={16} /> Accept Offer
                </button>
                <button
                  className="btn btn-secondary"
                  style={{ flex: 1, minWidth: 160 }}
                  onClick={() => setAction("decline")}
                >
                  <X size={16} /> Decline
                </button>
              </div>
            )}

            {action === "accept" && (
              <div style={{ display: "grid", gap: 16 }}>
                <div style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 10, padding: 16 }}>
                  <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: 0 }}>
                    By typing your full name below and clicking &quot;Accept&quot;, you confirm that you have read and agree to the terms of this offer letter. This constitutes a digital signature and will be timestamped.
                  </p>
                </div>
                <div>
                  <label className="label label-required">Type your full name to sign</label>
                  <input
                    className="input"
                    value={signatureName}
                    onChange={e => setSignatureName(e.target.value)}
                    placeholder={`Type: ${candidateName}`}
                  />
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button className="btn btn-secondary" onClick={() => setAction(null)}>Back</button>
                  <button className="btn btn-primary" onClick={handleRespond} disabled={loading || !signatureName.trim()} style={{ flex: 1 }}>
                    {loading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : "✅ Accept Offer"}
                  </button>
                </div>
              </div>
            )}

            {action === "decline" && (
              <div style={{ display: "grid", gap: 16 }}>
                <div>
                  <label className="label">Reason for declining (optional)</label>
                  <textarea className="input" rows={3} value={declineNote} onChange={e => setDeclineNote(e.target.value)} placeholder="e.g. Accepted another offer, timing not right..." />
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button className="btn btn-secondary" onClick={() => setAction(null)}>Back</button>
                  <button className="btn btn-danger" onClick={handleRespond} disabled={loading} style={{ flex: 1 }}>
                    {loading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : "Decline Offer"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
