"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Shield, Upload, X, CheckCircle, Loader2, AlertCircle, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";

interface Posting {
  id: string; title: string; type: string; department: string;
  location: string; description: string; requirements: string;
  universityRequired: boolean; deadline: string;
}

interface FormData {
  fullName: string; email: string; phone: string; cnic: string;
  universityName: string; semester: string;
  portfolioLinks: string; consentData: boolean; consentInterview: boolean;
}

type ScreeningStatus = "idle" | "uploading" | "screening" | "done" | "error";

const CNIC_REGEX = /^\d{5}-\d{7}-\d{1}$/;
const PHONE_REGEX = /^(\+92|0)[0-9]{10}$/;

export default function ApplicationForm({ posting }: { posting: Posting }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>({
    fullName: "", email: "", phone: "", cnic: "",
    universityName: "", semester: "",
    portfolioLinks: "", consentData: false, consentInterview: false,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [cvDrag, setCvDrag] = useState(false);
  const [photoDrag, setPhotoDrag] = useState(false);
  const [status, setStatus] = useState<ScreeningStatus>("idle");
  const [statusMsg, setStatusMsg] = useState("");
  const [applicationId, setApplicationId] = useState("");
  const cvRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);

  const set = (k: keyof FormData, v: string | boolean) =>
    setForm((f) => ({ ...f, [k]: v }));

  const validateStep1 = () => {
    const e: typeof errors = {};
    if (!form.fullName.trim()) e.fullName = "Full name is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Valid email required";
    if (!PHONE_REGEX.test(form.phone.replace(/\s/g, ""))) e.phone = "Valid Pakistani phone number required";
    if (!CNIC_REGEX.test(form.cnic)) e.cnic = "CNIC format: 12345-1234567-1";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e: typeof errors = {};
    if (!cvFile) e.fullName = "CV is required";
    if (posting.universityRequired && !form.universityName.trim()) e.universityName = "University name is required";
    if (posting.universityRequired && !form.semester.trim()) e.semester = "Semester is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!form.consentData || !form.consentInterview) {
      toast.error("Please accept both consent checkboxes");
      return;
    }
    setStatus("uploading");
    setStatusMsg("Uploading your application...");

    try {
      const fd = new FormData();
      fd.append("postingId", posting.id);
      fd.append("fullName", form.fullName);
      fd.append("email", form.email);
      fd.append("phone", form.phone);
      fd.append("cnic", form.cnic);
      fd.append("universityName", form.universityName);
      fd.append("semester", form.semester);
      fd.append("portfolioLinks", form.portfolioLinks);
      fd.append("consentData", String(form.consentData));
      fd.append("consentInterview", String(form.consentInterview));
      if (cvFile) fd.append("cv", cvFile);
      if (photoFile) fd.append("photo", photoFile);

      const res = await fetch("/api/applications/submit", { method: "POST", body: fd });
      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setStatusMsg(data.error || "Submission failed");
        return;
      }

      setApplicationId(data.applicationId);
      setStatus("screening");
      setStatusMsg("Received — our AI is reviewing your profile...");

      // Poll for screening result
      pollScreening(data.applicationId);
    } catch {
      setStatus("error");
      setStatusMsg("Network error. Please try again.");
    }
  };

  const pollScreening = async (appId: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/applications/${appId}/status`);
        const data = await res.json();
        if (data.status === "Shortlisted" || data.status === "InterviewInvited") {
          clearInterval(interval);
          setStatus("done");
          setStatusMsg("shortlisted");
        } else if (data.status === "Rejected") {
          clearInterval(interval);
          setStatus("done");
          setStatusMsg("reviewed");
        } else if (data.status === "Reviewing") {
          setStatusMsg("We are currently processing your application and evaluating your profile...");
        }
      } catch { /* keep polling */ }
    }, 3000);
    setTimeout(() => { clearInterval(interval); if (status === "screening") { setStatus("done"); setStatusMsg("reviewed"); } }, 120000);
  };

  if (status === "screening" || (status === "done") || status === "uploading") {
    return <ScreeningScreen status={status} message={statusMsg} posting={posting} />;
  }

  if (status === "error") {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div className="card" style={{ maxWidth: 480, width: "100%", padding: 40, textAlign: "center" }}>
          <AlertCircle size={48} color="var(--purple)" style={{ margin: "0 auto 20px" }} />
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Submission Failed</h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: 24 }}>{statusMsg}</p>
          <button className="btn btn-primary" onClick={() => setStatus("idle")}>Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      {/* Nav */}
      <nav style={{ borderBottom: "1px solid var(--border)", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(10,10,15,0.9)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 50 }}>
        <Link href="/careers" style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, textDecoration: "none", color: "var(--text-secondary)", fontSize: 14 }}>
          <ChevronLeft size={16} /> Back to Careers
        </Link>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, flex: 1 }}>
          <div style={{ width: 28, height: 28, background: "var(--purple)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Shield size={16} color="#fff" />
          </div>
          <span style={{ fontWeight: 800, fontSize: 16 }}>CyberLab</span>
        </div>
        <div style={{ flex: 1 }}></div>
      </nav>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "40px 24px" }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
            <span className={posting.type === "Job" ? "badge badge-purple" : "badge badge-purple"}>{posting.type}</span>
            <span className="badge badge-gray">{posting.department}</span>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 8 }}>Apply: {posting.title}</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>{posting.location}</p>
        </div>

        {/* Step indicator */}
        <div style={{ display: "flex", gap: 8, marginBottom: 32, alignItems: "center" }}>
          {[1, 2, 3].map((s) => (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, background: s <= step ? "var(--purple)" : "rgba(255,255,255,0.06)", color: s <= step ? "#fff" : "var(--text-muted)", transition: "all 0.3s" }}>{s}</div>
              {s < 3 && <div style={{ width: 40, height: 2, background: s < step ? "var(--purple)" : "rgba(255,255,255,0.06)", transition: "all 0.3s" }} />}
            </div>
          ))}
          <span style={{ marginLeft: 8, fontSize: 13, color: "var(--text-muted)" }}>
            {step === 1 ? "Personal Info" : step === 2 ? "Documents" : "Review & Consent"}
          </span>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
              <div className="card" style={{ padding: 28 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24 }}>Personal Information</h2>
                <div style={{ display: "grid", gap: 20 }}>
                  <Field label="Full Name" required error={errors.fullName}>
                    <input className={`input${errors.fullName ? " input-error" : ""}`} value={form.fullName} onChange={(e) => set("fullName", e.target.value)} placeholder="Your full legal name" />
                  </Field>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <Field label="Email Address" required error={errors.email}>
                      <input className={`input${errors.email ? " input-error" : ""}`} type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@example.com" />
                    </Field>
                    <Field label="Phone Number" required error={errors.phone}>
                      <input className={`input${errors.phone ? " input-error" : ""}`} value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="03XX-XXXXXXX" />
                    </Field>
                  </div>
                  <Field label="CNIC Number" required error={errors.cnic}>
                    <input className={`input${errors.cnic ? " input-error" : ""}`} value={form.cnic} onChange={(e) => set("cnic", e.target.value)} placeholder="12345-1234567-1" maxLength={15} />
                    <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>Your CNIC is encrypted and used to prevent duplicate applications.</p>
                  </Field>
                  <Field label="Portfolio Links (Optional)">
                    <textarea className="input" rows={3} value={form.portfolioLinks} onChange={(e) => set("portfolioLinks", e.target.value)} placeholder="HackerOne, Bugcrowd, GitHub, LinkedIn — one per line" />
                  </Field>
                </div>
                <div style={{ marginTop: 28, display: "flex", justifyContent: "flex-end" }}>
                  <button className="btn btn-primary" onClick={() => { if (validateStep1()) setStep(2); }}>Continue <ChevronRight size={16} /></button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
              <div className="card" style={{ padding: 28 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24 }}>Documents & Details</h2>
                <div style={{ display: "grid", gap: 20 }}>
                  {/* CV Upload */}
                  <Field label="CV / Resume" required error={errors.fullName}>
                    <div
                      style={{ border: `2px dashed ${cvDrag ? "var(--purple)" : cvFile ? "var(--green)" : "var(--border)"}`, borderRadius: 8, padding: "24px", textAlign: "center", cursor: "pointer", transition: "all 0.2s", background: cvFile ? "rgba(34,197,94,0.04)" : "transparent" }}
                      onClick={() => cvRef.current?.click()}
                      onDragOver={(e) => { e.preventDefault(); setCvDrag(true); }}
                      onDragLeave={() => setCvDrag(false)}
                      onDrop={(e) => { e.preventDefault(); setCvDrag(false); const f = e.dataTransfer.files[0]; if (f) setCvFile(f); }}
                    >
                      {cvFile ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center" }}>
                          <CheckCircle size={20} color="var(--green)" />
                          <span style={{ color: "var(--green)", fontSize: 14 }}>{cvFile.name}</span>
                          <button onClick={(e) => { e.stopPropagation(); setCvFile(null); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={16} /></button>
                        </div>
                      ) : (
                        <>
                          <Upload size={28} style={{ margin: "0 auto 10px", color: "var(--text-muted)" }} />
                          <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: 0 }}>Drop CV here or click to browse</p>
                          <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>PDF, DOC, DOCX — max 5MB</p>
                        </>
                      )}
                    </div>
                    <input ref={cvRef} type="file" hidden accept=".pdf,.doc,.docx" onChange={(e) => { const f = e.target.files?.[0]; if (f) setCvFile(f); }} />
                  </Field>

                  {/* Photo Upload */}
                  <Field label="Profile Photo (Optional)">
                    <div
                      style={{ border: `2px dashed ${photoDrag ? "var(--purple)" : photoFile ? "var(--green)" : "var(--border)"}`, borderRadius: 8, padding: "20px", textAlign: "center", cursor: "pointer", transition: "all 0.2s" }}
                      onClick={() => photoRef.current?.click()}
                      onDragOver={(e) => { e.preventDefault(); setPhotoDrag(true); }}
                      onDragLeave={() => setPhotoDrag(false)}
                      onDrop={(e) => { e.preventDefault(); setPhotoDrag(false); const f = e.dataTransfer.files[0]; if (f) setPhotoFile(f); }}
                    >
                      {photoFile ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center" }}>
                          <CheckCircle size={20} color="var(--green)" />
                          <span style={{ color: "var(--green)", fontSize: 14 }}>{photoFile.name}</span>
                          <button onClick={(e) => { e.stopPropagation(); setPhotoFile(null); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={16} /></button>
                        </div>
                      ) : (
                        <>
                          <Upload size={24} style={{ margin: "0 auto 8px", color: "var(--text-muted)" }} />
                          <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>JPG, PNG — max 2MB</p>
                        </>
                      )}
                    </div>
                    <input ref={photoRef} type="file" hidden accept=".jpg,.jpeg,.png,.webp" onChange={(e) => { const f = e.target.files?.[0]; if (f) setPhotoFile(f); }} />
                  </Field>

                  {posting.universityRequired && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      <Field label="University Name" required error={errors.universityName}>
                        <input className={`input${errors.universityName ? " input-error" : ""}`} value={form.universityName} onChange={(e) => set("universityName", e.target.value)} placeholder="University name" />
                      </Field>
                      <Field label="Current Semester" required error={errors.semester}>
                        <select className={`input${errors.semester ? " input-error" : ""}`} value={form.semester} onChange={(e) => set("semester", e.target.value)}>
                          <option value="">Select semester</option>
                          {[1,2,3,4,5,6,7,8].map((s: any) => <option key={s} value={String(s)}>Semester {s}</option>)}
                        </select>
                      </Field>
                    </div>
                  )}
                </div>
                <div style={{ marginTop: 28, display: "flex", justifyContent: "space-between" }}>
                  <button className="btn btn-secondary" onClick={() => setStep(1)}><ChevronLeft size={16} /> Back</button>
                  <button className="btn btn-primary" onClick={() => { if (validateStep2()) setStep(3); }}>Continue <ChevronRight size={16} /></button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
              <div className="card" style={{ padding: 28 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Review & Consent</h2>
                <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 24 }}>Please review your details and accept the required consents before submitting.</p>

                <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 8, border: "1px solid var(--border)", padding: 16, marginBottom: 24 }}>
                  <div style={{ display: "grid", gap: 10, fontSize: 14 }}>
                    {[
                      ["Name", form.fullName], ["Email", form.email], ["Phone", form.phone],
                      ["CNIC", form.cnic.replace(/(\d{5})-(\d{7})-(\d)/, "$1-*******-$3")],
                      ["Position", posting.title], ["CV", cvFile?.name || "—"],
                    ].map(([k, v]) => (
                      <div key={k} style={{ display: "flex", gap: 8 }}>
                        <span style={{ color: "var(--text-muted)", width: 80, flexShrink: 0 }}>{k}</span>
                        <span style={{ color: "var(--text-primary)" }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: "grid", gap: 16, marginBottom: 28 }}>
                  <label style={{ display: "flex", gap: 12, alignItems: "flex-start", cursor: "pointer" }}>
                    <input type="checkbox" checked={form.consentData} onChange={(e) => set("consentData", e.target.checked)} style={{ marginTop: 2, accentColor: "var(--purple)", width: 16, height: 16, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                      I consent to CyberLab processing my personal data (including CV, contact details, and government ID) for recruitment purposes, in accordance with applicable data protection laws. My data will be stored securely and not shared with third parties.
                    </span>
                  </label>
                  <label style={{ display: "flex", gap: 12, alignItems: "flex-start", cursor: "pointer" }}>
                    <input type="checkbox" checked={form.consentInterview} onChange={(e) => set("consentInterview", e.target.checked)} style={{ marginTop: 2, accentColor: "var(--purple)", width: 16, height: 16, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                      I understand that shortlisted candidates will undergo an automated technical assessment. I agree to complete this assessment independently. I acknowledge that any use of unauthorized assistance or automated tools will result in disqualification.
                    </span>
                  </label>
                </div>

                <div style={{ background: "rgba(168,85,247,0.06)", border: "1px solid rgba(168,85,247,0.15)", borderRadius: 8, padding: "12px 16px", fontSize: 13, color: "var(--text-secondary)", marginBottom: 24 }}>
                  Please note: Multiple applications for the same role using identical credentials will be automatically flagged and may affect your candidacy.
                </div>

                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <button className="btn btn-secondary" onClick={() => setStep(2)}><ChevronLeft size={16} /> Back</button>
                  <button className="btn btn-primary btn-lg" onClick={handleSubmit} disabled={!form.consentData || !form.consentInterview}>
                    Submit Application
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Honeypot */}
        <input type="text" name="website" style={{ display: "none" }} tabIndex={-1} autoComplete="off" />
      </div>
    </div>
  );
}

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={`label${required ? " label-required" : ""}`}>{label}</label>
      {children}
      {error && <p className="error-text"><AlertCircle size={12} />{error}</p>}
    </div>
  );
}

function ScreeningScreen({ status, message, posting }: { status: ScreeningStatus; message: string; posting: Posting }) {
  const isDone = status === "done";
  const isShortlisted = message === "shortlisted";

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <motion.div className="card scan-effect" style={{ maxWidth: 520, width: "100%", padding: 48, textAlign: "center" }} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: isDone ? (isShortlisted ? "rgba(34,197,94,0.1)" : "rgba(168,85,247,0.1)") : "rgba(168,85,247,0.1)", border: `2px solid ${isDone ? (isShortlisted ? "var(--green)" : "var(--purple)") : "var(--purple)"}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 28px", boxShadow: isDone ? `0 0 30px ${isShortlisted ? "rgba(34,197,94,0.2)" : "var(--purple-glow)"}` : "var(--shadow-purple)" }}>
          {isDone ? (isShortlisted ? <CheckCircle size={36} color="var(--green)" /> : <Shield size={36} color="var(--purple)" />) : <Loader2 size={36} color="var(--purple)" style={{ animation: "spin 1s linear infinite" }} />}
        </div>

        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>
          {status === "uploading" ? "Uploading..." : isDone ? (isShortlisted ? "Shortlisted! 🎉" : "Application Received") : "Review in Progress"}
        </h2>

        <p style={{ color: "var(--text-secondary)", fontSize: 15, lineHeight: 1.7, marginBottom: 24 }}>
          {isDone
            ? isShortlisted
              ? "Congratulations! Your profile has been shortlisted. Check your email for an interview invitation link. The link expires in 48 hours."
              : "Thank you for applying. We've reviewed your application and will be in touch if there's a match for future opportunities."
            : message}
        </p>

        {!isDone && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 12, color: "var(--text-muted)" }}>
            {["Receiving your application...", "Processing documents...", "Evaluating profile fit...", "Finalizing review..."].map((step, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div className="spinner" style={{ width: 12, height: 12, opacity: 0.5 }} />
                {step}
              </div>
            ))}
          </div>
        )}

        {isDone && (
          <Link href="/careers" className="btn btn-secondary" style={{ marginTop: 8 }}>
            Back to Careers
          </Link>
        )}
      </motion.div>
    </div>
  );
}
