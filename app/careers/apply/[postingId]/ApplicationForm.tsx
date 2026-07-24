// @ts-nocheck
"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Shield, Upload, X, CheckCircle, Loader2, AlertCircle, ChevronLeft, ChevronRight, Check, Copy } from "lucide-react";
import PublicNav from "@/components/public/PublicNav";
import confetti from "canvas-confetti";

interface Posting {
  id: string; title: string; type: string; department: string;
  location: string; description: string; requirements: string;
  universityRequired: boolean; deadline: string;
}

interface FormData {
  fullName: string; email: string; phone: string; city: string;
  universityName: string; semester: string; degree: string; cgpa: string;
  linkedIn: string; github: string; tryHackMe: string; hackTheBox: string;
  portfolio: string; bugBounty: string; cve: string; certifications: string; motivation: string;
  consentData: boolean; consentInterview: boolean;
}

const initialForm: FormData = {
  fullName: "", email: "", phone: "", city: "",
  universityName: "", semester: "", degree: "", cgpa: "",
  linkedIn: "", github: "", tryHackMe: "", hackTheBox: "",
  portfolio: "", bugBounty: "", cve: "", certifications: "", motivation: "",
  consentData: false, consentInterview: false,
};

type ScreeningStatus = "idle" | "uploading" | "screening" | "done" | "error";

const PHONE_REGEX = /^(\+92|0)[0-9]{10}$/;

export default function ApplicationForm({ posting }: { posting: Posting }) {
//   const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(initialForm);
  const [isLoaded, setIsLoaded] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  
  // File state
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [cvDrag, setCvDrag] = useState(false);
  const [photoDrag, setPhotoDrag] = useState(false);
  const cvRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);

  // OTP state
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);

  // Status state
  const [status, setStatus] = useState<ScreeningStatus>("idle");
  const [statusMsg, setStatusMsg] = useState("");
  const [_applicationId, setApplicationId] = useState("");
  const [referenceId, setReferenceId] = useState("");

  const set = (k: keyof FormData, v: string | boolean) => {
    setForm((f) => {
      const nf = { ...f, [k]: v };
      localStorage.setItem(`draft_${posting.id}`, JSON.stringify(nf));
      return nf;
    });
  };

  useEffect(() => {
    const draft = localStorage.getItem(`draft_${posting.id}`);
    if (draft) {
      try {
        setForm({ ...initialForm, ...JSON.parse(draft) });
      } catch { }
    }
    setIsLoaded(true);
  }, [posting.id]);

  const sendOtp = async () => {
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast.error("Please enter a valid email address first.");
      return;
    }
    setOtpLoading(true);
    try {
      const res = await fetch("/api/applications/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email })
      });
      const data = await res.json();
      if (res.ok) {
        setOtpSent(true);
        toast.success("Verification code sent to your email");
      } else {
        toast.error(data.error || "Failed to send code. Try again.");
      }
    } catch {
      toast.error("Network error");
    }
    setOtpLoading(false);
  };

  const verifyOtp = async () => {
    if (!otpCode || otpCode.length < 6) return;
    setOtpLoading(true);
    try {
      const res = await fetch("/api/applications/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, code: otpCode })
      });
      if (res.ok) {
        setOtpVerified(true);
        toast.success("Email verified successfully!");
      } else {
        toast.error("Invalid or expired code");
      }
    } catch {
      toast.error("Network error");
    }
    setOtpLoading(false);
  };

  const validateStep1 = () => {
    const e: typeof errors = {};
    if (!form.fullName.trim()) e.fullName = "Required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Valid email required";
    if (!form.phone.trim()) e.phone = "Required";
    if (!form.city.trim()) e.city = "Required";
    setErrors(e);
    if (!otpVerified) {
      toast.error("Please verify your email to continue");
      return false;
    }
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e: typeof errors = {};
    if (posting.universityRequired && !form.universityName.trim()) e.universityName = "Required";
    if (posting.universityRequired && !form.semester.trim()) e.semester = "Required";
    if (posting.universityRequired && !form.degree.trim()) e.degree = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep3 = () => {
    const e: typeof errors = {};
    if (!cvFile) {
      e.cv = "CV is required";
      setErrors(e);
      toast.error("Please upload your CV before continuing.");
      return false;
    }
    if (!form.motivation.trim() || form.motivation.length < 50) e.motivation = "Please provide at least 50 characters";
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
      fd.append("emailVerified", otpVerified ? "true" : "false");
      Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
      
      if (cvFile) fd.append("cv", cvFile);
      if (photoFile) fd.append("photo", photoFile);

      setStatus("screening");
      setStatusMsg("Received — our AI is reviewing your profile...");

      const res = await fetch("/api/applications/submit", { method: "POST", body: fd });
      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setStatusMsg(data.error || "Submission failed");
        return;
      }

      setApplicationId(data.applicationId);
      setReferenceId(data.referenceId);
      localStorage.removeItem(`draft_${posting.id}`); // Clear draft
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
        if (data.status === "Invited for Interview" || data.status === "Selected – Waiting for Approval" || data.status === "Hired") {
          clearInterval(interval);
          setStatus("done");
          setStatusMsg("shortlisted");
        } else if (data.status === "Rejected" || data.status === "Reviewing") {
          clearInterval(interval);
          setStatus("done");
          setStatusMsg("reviewed");
        }
      } catch { /* keep polling */ }
    }, 3000);
    setTimeout(() => { 
      clearInterval(interval); 
      setStatus(prev => {
        if (prev === "screening") {
          setTimeout(() => setStatusMsg("reviewed"), 0);
          return "done";
        }
        return prev;
      });
    }, 120000);
  };

  if (!isLoaded) return <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }} />;

  if (status === "screening" || (status === "done") || status === "uploading") {
    return <ScreeningScreen status={status} message={statusMsg} referenceId={referenceId} />;
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
      <PublicNav
        left={
          <Link href="/careers" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
            <img src="/logo.png" alt="CyberLabSec Logo" style={{ height: 32 }} />
          </Link>
        }
        center={<div />}
        right={
          <Link href="/careers" style={{ fontSize: 14, color: "var(--text-secondary)", textDecoration: "none", display: "flex", alignItems: "center", gap: 6, transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "var(--text-primary)"} onMouseLeave={e => e.currentTarget.style.color = "var(--text-secondary)"}>
            <ChevronLeft size={16} /> Open Positions
          </Link>
        }
      />

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "clamp(16px, 4vw, 32px) clamp(12px, 3vw, 20px)", paddingBottom: "env(safe-area-inset-bottom, 24px)" }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
            <span className={posting.type === "Job" ? "badge badge-purple" : "badge badge-purple"}>{posting.type}</span>
            <span className="badge badge-gray">{posting.department}</span>
          </div>
          <h1 style={{ fontSize: "clamp(24px, 5vw, 28px)", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 8 }}>Apply: {posting.title}</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>{posting.location}</p>
        </div>

        {/* Step indicator */}
        <div style={{ display: "flex", gap: "clamp(6px, 2vw, 12px)", marginBottom: 28, alignItems: "center", flexWrap: "nowrap", overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none", msOverflowStyle: "none" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "clamp(4px, 1.5vw, 10px)", flex: "1 1 auto" }}>
            {[1, 2, 3, 4].map((s) => (
              <div key={s} style={{ display: "flex", alignItems: "center", flex: s < 4 ? "1 1 auto" : "0 0 auto", gap: "clamp(4px, 1.5vw, 10px)" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, background: s === step ? "var(--purple)" : s < step ? "rgba(168,85,247,0.2)" : "rgba(255,255,255,0.04)", color: s === step ? "#fff" : s < step ? "var(--purple-light)" : "var(--text-muted)", transition: "all 0.3s ease", border: s === step ? "none" : "1px solid rgba(255,255,255,0.05)", flexShrink: 0 }}>
                  {s < step ? <CheckCircle size={14} /> : s}
                </div>
                {s < 4 && <div style={{ flex: "1 1 auto", minWidth: 12, height: 2, background: s < step ? "rgba(168,85,247,0.4)" : "rgba(255,255,255,0.06)", transition: "all 0.3s ease", borderRadius: 1 }} />}
              </div>
            ))}
          </div>
          <span style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 600, flexShrink: 0 }}>
            {step === 1 ? "Personal Info" : step === 2 ? "Security Profile" : step === 3 ? "Documents" : "Review"}
          </span>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
              <div className="card" style={{ padding: "clamp(16px, 4vw, 24px)" }}>
                <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 20 }}>Personal Information</h2>
                <div style={{ display: "grid", gap: 16 }}>
                  <Field label="Full Name" required error={errors.fullName}>
                    <input className={`input${errors.fullName ? " input-error" : ""}`} value={form.fullName} onChange={(e) => set("fullName", e.target.value)} placeholder="Your full legal name" />
                  </Field>
                  
                  <Field label="Email Address" required error={errors.email}>
                    <div style={{ display: "flex", gap: 10 }}>
                      <input className={`input${errors.email ? " input-error" : ""}`} type="email" value={form.email} onChange={(e) => { set("email", e.target.value); setOtpSent(false); setOtpVerified(false); }} placeholder="you@example.com" disabled={otpVerified} />
                      {!otpVerified && (
                        <button className="btn btn-secondary" onClick={sendOtp} disabled={otpLoading || otpSent || !form.email}>
                          {otpLoading ? <Loader2 size={16} className="spinner" /> : otpSent ? "Sent" : "Verify"}
                        </button>
                      )}
                    </div>
                  </Field>
                  
                  {otpSent && !otpVerified && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
                      <Field label="Verification Code" required>
                        <div style={{ display: "flex", gap: 10 }}>
                          <input className="input" value={otpCode} onChange={e => setOtpCode(e.target.value)} placeholder="6-digit code" maxLength={6} />
                          <button className="btn btn-primary" onClick={verifyOtp} disabled={otpLoading || otpCode.length < 6}>
                            {otpLoading ? <Loader2 size={16} className="spinner" /> : "Confirm"}
                          </button>
                        </div>
                      </Field>
                    </motion.div>
                  )}


                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
                    <Field label="Phone Number" required error={errors.phone}>
                      <input className={`input${errors.phone ? " input-error" : ""}`} value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="03XX-XXXXXXX" />
                    </Field>
                    <Field label="City" required error={errors.city}>
                      <input className={`input${errors.city ? " input-error" : ""}`} value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="E.g., Lahore" />
                    </Field>
                  </div>
                  
                </div>
                <div className="mobile-sticky-bottom" style={{ marginTop: 28, display: "flex", justifyContent: "flex-end" }}>
                  <button className="btn btn-primary" onClick={() => { if (validateStep1()) setStep(2); }}>Continue <ChevronRight size={16} /></button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
              <div className="card" style={{ padding: "clamp(16px, 4vw, 24px)" }}>
                <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 20 }}>Education & Security Profiles</h2>
                <div style={{ display: "grid", gap: 16 }}>
                  
                  {posting.universityRequired && (
                    <>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
                        <Field label="University Name" required error={errors.universityName}>
                          <input className={`input${errors.universityName ? " input-error" : ""}`} value={form.universityName} onChange={(e) => set("universityName", e.target.value)} placeholder="University name" />
                        </Field>
                        <Field label="Current Semester" required error={errors.semester}>
                          <select className={`input${errors.semester ? " input-error" : ""}`} value={form.semester} onChange={(e) => set("semester", e.target.value)}>
                            <option value="">Select semester</option>
                            {[1,2,3,4,5,6,7,8].map((s: number) => <option key={s} value={String(s)}>Semester {s}</option>)}
                          </select>
                        </Field>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
                        <Field label="Degree & Field of Study" required error={errors.degree}>
                          <input className={`input${errors.degree ? " input-error" : ""}`} value={form.degree} onChange={(e) => set("degree", e.target.value)} placeholder="e.g. BS Computer Science" />
                        </Field>
                        <Field label="CGPA (optional)">
                          <input className="input" value={form.cgpa} onChange={(e) => set("cgpa", e.target.value)} placeholder="e.g. 3.5 / 4.0" />
                        </Field>
                      </div>
                    </>
                  )}

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
                    <Field label="LinkedIn">
                      <input className="input" value={form.linkedIn} onChange={(e) => set("linkedIn", e.target.value)} placeholder="https://linkedin.com/in/..." />
                    </Field>
                    <Field label="GitHub">
                      <input className="input" value={form.github} onChange={(e) => set("github", e.target.value)} placeholder="https://github.com/..." />
                    </Field>
                    <Field label="TryHackMe">
                      <input className="input" value={form.tryHackMe} onChange={(e) => set("tryHackMe", e.target.value)} placeholder="Profile URL or Username" />
                    </Field>
                    <Field label="HackTheBox">
                      <input className="input" value={form.hackTheBox} onChange={(e) => set("hackTheBox", e.target.value)} placeholder="Profile URL or Username" />
                    </Field>
                    <Field label="Portfolio / Writeups">
                      <input className="input" value={form.portfolio} onChange={(e) => set("portfolio", e.target.value)} placeholder="https://..." />
                    </Field>
                    <Field label="Bug Bounty Profile">
                      <input className="input" value={form.bugBounty} onChange={(e) => set("bugBounty", e.target.value)} placeholder="HackerOne / Bugcrowd URL" />
                    </Field>
                  </div>
                  
                  <Field label="CVEs / Bug Disclosures">
                    <input className="input" value={form.cve} onChange={(e) => set("cve", e.target.value)} placeholder="e.g. CVE-2024-XXXX (optional)" />
                  </Field>
                  
                  <Field label="Certifications">
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
                      {["eJPT", "CEH", "Security+", "OSCP", "None yet"].map(cert => {
                        const selected = form.certifications.split(",").map(s => s.trim()).filter(Boolean).includes(cert);
                        return (
                          <button
                            key={cert}
                            type="button"
                            onClick={() => {
                              let current = form.certifications.split(",").map(s => s.trim()).filter(Boolean);
                              let next: string[] = [];
                              if (cert === "None yet") {
                                next = selected ? [] : ["None yet"];
                              } else {
                                current = current.filter(c => c !== "None yet");
                                next = selected ? current.filter(c => c !== cert) : [...current, cert];
                              }
                              set("certifications", next.join(", "));
                            }}
                            style={{
                              padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: "pointer",
                              border: `1.5px solid ${selected ? "var(--purple)" : "var(--border-subtle)"}`,
                              background: selected ? "rgba(168,85,247,0.15)" : "transparent",
                              color: selected ? "var(--purple)" : "var(--text-muted)",
                              transition: "all 0.15s",
                            }}
                          >{cert}</button>
                        );
                      })}
                    </div>
                    <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>Select all that apply. Additional certs can be listed under CVEs above.</p>
                  </Field>

                </div>
                <div className="mobile-sticky-bottom" style={{ marginTop: 28, display: "flex", justifyContent: "space-between" }}>
                  <button className="btn btn-secondary" onClick={() => setStep(1)}><ChevronLeft size={16} /> Back</button>
                  <button className="btn btn-primary" onClick={() => { if (validateStep2()) setStep(3); }}>Continue <ChevronRight size={16} /></button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
              <div className="card" style={{ padding: "clamp(16px, 4vw, 24px)" }}>
                <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 20 }}>Documents & Motivation</h2>
                <div style={{ display: "grid", gap: 16 }}>
                  
                  {/* CV Upload */}
                  <Field label="CV / Resume" required error={errors.cv}>
                    <div
                      style={{ border: `2px dashed ${cvDrag ? "var(--purple)" : cvFile ? "var(--green)" : "var(--border)"}`, borderRadius: 8, padding: "24px", textAlign: "center", cursor: "pointer", transition: "all 0.2s", background: cvFile ? "rgba(34,197,94,0.04)" : "transparent" }}
                      onClick={() => cvRef.current?.click()}
                      onDragOver={(e) => { e.preventDefault(); setCvDrag(true); }}
                      onDragLeave={() => setCvDrag(false)}
                      onDrop={(e) => { 
                        e.preventDefault(); setCvDrag(false); 
                        const f = e.dataTransfer.files[0]; 
                        if (f && ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(f.type) && f.size <= 5*1024*1024) {
                          setCvFile(f); 
                        } else if (f) {
                          toast.error("Invalid CV format or size > 5MB");
                        }
                      }}
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
                    <input ref={cvRef} type="file" hidden accept=".pdf,.doc,.docx" onChange={(e) => { 
                      const f = e.target.files?.[0]; 
                      if (f && ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(f.type) && f.size <= 5*1024*1024) {
                        setCvFile(f); 
                      } else if (f) {
                        toast.error("Invalid CV format or size > 5MB");
                        e.target.value = '';
                      }
                    }} />
                  </Field>

                  <Field label="Why CyberLabSec?" required error={errors.motivation}>
                    <textarea 
                      className={`input${errors.motivation ? " input-error" : ""}`} 
                      rows={5} 
                      value={form.motivation} 
                      onChange={(e) => set("motivation", e.target.value)} 
                      placeholder="Tell us what drives you. Why offensive security? Why here?" 
                      style={{ resize: "vertical" }}
                    />
                  </Field>

                  {/* Photo Upload */}
                  <Field label="Profile Photo (Optional)">
                    <div
                      style={{ border: `2px dashed ${photoDrag ? "var(--purple)" : photoFile ? "var(--green)" : "var(--border)"}`, borderRadius: 8, padding: "20px", textAlign: "center", cursor: "pointer", transition: "all 0.2s" }}
                      onClick={() => photoRef.current?.click()}
                      onDragOver={(e) => { e.preventDefault(); setPhotoDrag(true); }}
                      onDragLeave={() => setPhotoDrag(false)}
                      onDrop={(e) => { 
                        e.preventDefault(); setPhotoDrag(false); 
                        const f = e.dataTransfer.files[0]; 
                        if (f && f.type.startsWith("image/") && f.size <= 2*1024*1024) {
                          setPhotoFile(f); 
                        } else if (f) {
                          toast.error("Invalid photo format or size > 2MB");
                        }
                      }}
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
                    <input ref={photoRef} type="file" hidden accept=".jpg,.jpeg,.png,.webp" onChange={(e) => { 
                      const f = e.target.files?.[0]; 
                      if (f && f.type.startsWith("image/") && f.size <= 2*1024*1024) {
                        setPhotoFile(f); 
                      } else if (f) {
                        toast.error("Invalid photo format or size > 2MB");
                        e.target.value = '';
                      }
                    }} />
                  </Field>

                </div>
                <div className="mobile-sticky-bottom" style={{ marginTop: 28, display: "flex", justifyContent: "space-between" }}>
                  <button className="btn btn-secondary" onClick={() => setStep(2)}><ChevronLeft size={16} /> Back</button>
                  <button className="btn btn-primary" onClick={() => { if (validateStep3()) setStep(4); }}>Continue <ChevronRight size={16} /></button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
              <div className="card" style={{ padding: "clamp(16px, 4vw, 24px)" }}>
                <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>Review & Consent</h2>
                <p style={{ color: "var(--text-secondary)", fontSize: 13, marginBottom: 20 }}>Please review your details and accept the required consents before submitting.</p>

                <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.04)", padding: "14px 16px", marginBottom: 20 }}>
                  <div style={{ display: "grid", gap: 8, fontSize: 13 }}>
                    {[
                      ["Name", form.fullName], ["Email", form.email], ["Phone", form.phone],
                      ["Position", posting.title], ["CV", cvFile?.name || "—"],
                      ...(form.linkedIn ? [["LinkedIn", form.linkedIn]] : []),
                      ...(form.github ? [["GitHub", form.github]] : []),
                      ...(form.portfolio ? [["Portfolio", form.portfolio]] : []),
                      ...(form.bugBounty ? [["Bug Bounty", form.bugBounty]] : []),
                      ...(form.tryHackMe ? [["TryHackMe", form.tryHackMe]] : []),
                      ...(form.hackTheBox ? [["HackTheBox", form.hackTheBox]] : []),
                      ...(form.certifications && form.certifications !== "None yet" ? [["Certs", form.certifications]] : []),
                    ].map(([k, v]) => (
                      <div key={k} style={{ display: "flex", flexWrap: "wrap", gap: "2px 12px", borderBottom: "1px solid rgba(255,255,255,0.02)", paddingBottom: 8, alignItems: "baseline" }}>
                        <span style={{ color: "var(--text-muted)", width: 80, flexShrink: 0, fontWeight: 500, fontSize: 12.5 }}>{k}</span>
                        <span style={{ color: "var(--text-primary)", wordBreak: "break-word", fontWeight: 600, flex: "1 1 auto", minWidth: 150 }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: "grid", gap: 10, marginBottom: 20 }}>
                  <label style={{ display: "flex", gap: 12, alignItems: "flex-start", cursor: "pointer", background: form.consentData ? "rgba(168,85,247,0.08)" : "rgba(255,255,255,0.02)", border: `1px solid ${form.consentData ? "rgba(168,85,247,0.3)" : "rgba(255,255,255,0.05)"}`, padding: "12px 14px", borderRadius: 10, transition: "all 0.2s" }}>
                    <input type="checkbox" checked={form.consentData} onChange={(e) => set("consentData", e.target.checked)} style={{ marginTop: 2, accentColor: "var(--purple)", width: 16, height: 16, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: form.consentData ? "var(--text-primary)" : "var(--text-secondary)", lineHeight: 1.4 }}>
                      I consent to CyberLabSec processing my personal data (including CV and contact details) for recruitment purposes. My data will be stored securely and not shared with third parties.
                    </span>
                  </label>
                  <label style={{ display: "flex", gap: 12, alignItems: "flex-start", cursor: "pointer", background: form.consentInterview ? "rgba(168,85,247,0.08)" : "rgba(255,255,255,0.02)", border: `1px solid ${form.consentInterview ? "rgba(168,85,247,0.3)" : "rgba(255,255,255,0.05)"}`, padding: "12px 14px", borderRadius: 10, transition: "all 0.2s" }}>
                    <input type="checkbox" checked={form.consentInterview} onChange={(e) => set("consentInterview", e.target.checked)} style={{ marginTop: 2, accentColor: "var(--purple)", width: 16, height: 16, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: form.consentInterview ? "var(--text-primary)" : "var(--text-secondary)", lineHeight: 1.4 }}>
                      I agree to complete the automated technical assessment independently without unauthorized assistance or automated tools.
                    </span>
                  </label>
                </div>

                <div style={{ background: "rgba(168,85,247,0.06)", border: "1px solid rgba(168,85,247,0.15)", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "var(--text-secondary)", marginBottom: 20 }}>
                  Please note: Multiple applications for the same role using identical credentials will be automatically flagged and may affect your candidacy.
                </div>

                <div className="mobile-sticky-bottom" style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <button className="btn btn-secondary" onClick={() => setStep(3)} style={{ flex: "1 1 auto" }}><ChevronLeft size={16} /> Back</button>
                  <button className="btn btn-primary btn-lg" onClick={handleSubmit} disabled={!form.consentData || !form.consentInterview} style={{ flex: "2 1 auto" }}>
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
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: 4 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            style={{ overflow: "hidden" }}
            className="error-text"
          >
            <AlertCircle size={12} style={{ display: "inline-block", marginRight: 4, verticalAlign: "text-top" }} />
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}


function ScreeningScreen({ status, message, referenceId }: { status: ScreeningStatus; message: string; referenceId?: string; }) {
  const isBackendDone = status === "done";
  const isShortlisted = message === "shortlisted";
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isAnimationComplete, setIsAnimationComplete] = useState(false);
  
  // The UI transitions to the final success screen ONLY when both are true
  const isDone = isBackendDone && isAnimationComplete;

  const statusRef = useRef(status);
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const steps = [
    "Receiving your application...",
    "Verifying identity & documents...",
    "Cross-checking technical experience...",
    "Evaluating profile fit...",
    "Running quality & fraud checks...",
    "Finalizing review..."
  ];

  useEffect(() => {
    if (statusRef.current !== "screening" && statusRef.current !== "done") return;
    
    const startTime = Date.now();
    const duration = 5000;
    const intervalTime = 50;

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      let nextProgress = Math.min((elapsed / duration) * 100, 100);
      
      // If backend is NOT done yet, gracefully hold at 99%
      if (statusRef.current !== "done" && nextProgress >= 99) {
        nextProgress = 99;
      }

      setProgress(nextProgress);
      
      // Sync steps with progress percentage
      const stepIndex = Math.floor((nextProgress / 100) * steps.length);
      setCurrentStep(Math.min(stepIndex, steps.length));

      // If backend IS done and animation reaches 100%
      if (statusRef.current === "done" && nextProgress >= 100) {
        setProgress(100);
        setCurrentStep(steps.length);
        setIsAnimationComplete(true);
        clearInterval(timer);
        
        // Trigger Canvas Confetti Reward Effect!
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.55 },
          colors: ['#7c3aed', '#2563eb', '#22c55e', '#f59e0b', '#ec4899', '#06b6d4'],
          zIndex: 9999
        });
      }
    }, intervalTime);
    
    return () => clearInterval(timer);
  }, [steps.length]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center", padding: "clamp(16px, 4vw, 32px)", position: "relative" }}>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.9); opacity: 0.8; }
          50% { transform: scale(1.05); opacity: 0.3; }
          100% { transform: scale(0.9); opacity: 0.8; }
        }
        .ai-core-container {
          position: relative;
          width: 110px; height: 110px;
          margin: 0 auto 36px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .ai-core-outer {
          position: absolute; inset: -12px;
          border-radius: 50%;
          border: 1px dashed rgba(168, 85, 247, 0.25);
          animation: spin 16s linear infinite;
        }
        .ai-core-inner {
          position: absolute; inset: -2px;
          border-radius: 50%;
          border: 2px solid transparent;
          border-top-color: rgba(168, 85, 247, 0.6);
          border-bottom-color: rgba(59, 130, 246, 0.6);
          animation: spin 8s linear infinite reverse;
        }
        .ai-core-pulse {
          position: absolute; inset: 12px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(168,85,247,0.15) 0%, transparent 70%);
          animation: pulse-ring 3s ease-in-out infinite;
        }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
      
      {/* Background glow */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", zIndex: 0, background: "radial-gradient(circle at 50% 20%, rgba(124, 58, 237, 0.08), transparent 60%)", pointerEvents: "none" }} />

      <motion.div 
        className="card" 
        style={{ 
          maxWidth: 520, width: "100%", padding: "clamp(32px, 6vw, 48px) clamp(20px, 5vw, 32px)", 
          textAlign: "center", position: "relative", zIndex: 1,
          background: "rgba(10, 10, 14, 0.7)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.06)",
          boxShadow: "0 24px 48px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.08)"
        }} 
        initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Animated AI Core */}
        <div className="ai-core-container">
          {!isDone && (
            <>
              <div className="ai-core-outer" />
              <div className="ai-core-inner" />
              <div className="ai-core-pulse" />
            </>
          )}
          
          <motion.div 
            animate={isDone ? { scale: [1, 1.15, 1], rotateY: 360 } : { scale: [1, 1.05, 1] }} 
            transition={{ duration: isDone ? 1 : 3, repeat: isDone ? 0 : Infinity }}
            style={{ 
              width: 64, height: 64, borderRadius: "50%", 
              background: isDone ? (isShortlisted ? "linear-gradient(135deg, #22c55e, #16a34a)" : "linear-gradient(135deg, #a78bfa, #7c3aed)") : "linear-gradient(135deg, #1e1e1e, #2a2a2a)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: isDone ? `0 0 40px ${isShortlisted ? "rgba(34,197,94,0.4)" : "rgba(168,85,247,0.4)"}` : "0 0 24px rgba(168,85,247,0.2), inset 0 2px 4px rgba(255,255,255,0.05)",
              border: `1px solid ${isDone ? "transparent" : "rgba(168,85,247,0.3)"}`,
              zIndex: 10,
              willChange: "transform"
            }}
          >
            {isDone ? (isShortlisted ? <CheckCircle size={32} color="white" /> : <Shield size={32} color="white" />) : (
              <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity }} style={{ willChange: "opacity" }}>
                <div style={{ width: 22, height: 22, background: "white", borderRadius: "50%", boxShadow: "0 0 16px white" }} />
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Premium Typography */}
        <h2 style={{ fontSize: "clamp(24px, 5vw, 28px)", fontWeight: 800, marginBottom: 12, letterSpacing: "-0.02em", background: "linear-gradient(to right, #fff, #a1a1aa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          {status === "uploading" ? "Uploading..." : isDone ? (isShortlisted ? "You're Shortlisted!" : "Application Received") : "Review in Progress"}
        </h2>
        
        <p style={{ color: "var(--text-secondary)", fontSize: 15, lineHeight: 1.6, marginBottom: 36, maxWidth: 400, margin: "0 auto 36px" }}>
          {isDone
            ? isShortlisted
              ? "Our AI has completed the review. Your interview link has been sent to your email."
              : "Thank you for applying. Your application is safely stored and under review."
            : "Our AI is securely evaluating your profile and documents. Please don't close this window."}
        </p>

        {/* Pipeline stages - Bring back on completion */}
        {isDone && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} style={{ marginBottom: 36 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 20 }}>Application Pipeline</p>
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 0 }}>
              {/* Step 1 */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #22c55e, #16a34a)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 15px rgba(34,197,94,0.3)" }}>
                  <Check size={18} color="white" strokeWidth={3} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--green)" }}>Review</span>
              </div>
              <div style={{ width: 44, height: 2, background: isShortlisted ? "var(--green)" : "rgba(255,255,255,0.1)", marginBottom: 26, flexShrink: 0 }} />
              {/* Step 2 */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: isShortlisted ? "linear-gradient(135deg, #a78bfa, #7c3aed)" : "rgba(255,255,255,0.03)", border: `2px solid ${isShortlisted ? "transparent" : "rgba(255,255,255,0.1)"}`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: isShortlisted ? "0 0 15px rgba(168,85,247,0.3)" : "none" }}>
                  {isShortlisted && <Check size={18} color="white" strokeWidth={3} />}
                </div>
                <span style={{ fontSize: 13, fontWeight: isShortlisted ? 600 : 500, color: isShortlisted ? "var(--purple-light)" : "var(--text-muted)" }}>Interview</span>
              </div>
              <div style={{ width: 44, height: 2, background: "rgba(255,255,255,0.1)", marginBottom: 26, flexShrink: 0 }} />
              {/* Step 3 */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.03)", border: "2px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }} />
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Decision</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Progress Percentage */}
        {!isDone && status === "screening" && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 10, padding: "0 4px" }}>
              <span>Processing...</span>
              <span style={{ color: "var(--purple-light)" }}>{Math.floor(progress)}%</span>
            </div>
            <div style={{ height: 8, background: "rgba(255,255,255,0.06)", borderRadius: 6, overflow: "hidden", position: "relative" }}>
              <motion.div 
                style={{ position: "absolute", top: 0, left: 0, bottom: 0, background: "linear-gradient(90deg, #7c3aed, #3b82f6)", width: `${progress}%` }}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ type: "tween", ease: "linear" }}
              >
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)", animation: "shimmer 2s infinite" }} />
              </motion.div>
            </div>
          </div>
        )}

        {/* Premium Timeline */}
        {!isDone && (
          <div style={{ textAlign: "left", background: "rgba(255,255,255,0.02)", padding: "24px", borderRadius: 16, border: "1px solid rgba(255,255,255,0.04)", position: "relative" }}>
            {steps.map((step, i) => {
              const isPast = currentStep > i;
              const isActive = currentStep === i;
              const isFuture = currentStep < i;
              
              return (
                <div key={i} style={{ display: "flex", gap: 16, position: "relative", paddingBottom: i === steps.length - 1 ? 0 : 22, opacity: isFuture ? 0.3 : 1, transition: "opacity 0.4s ease" }}>
                  {/* Connecting Line */}
                  {i < steps.length - 1 && (
                    <div style={{ position: "absolute", left: 11, top: 26, bottom: 0, width: 2, background: isPast ? "var(--purple-light)" : "rgba(255,255,255,0.08)", transition: "background 0.5s ease" }} />
                  )}
                  
                  {/* Step Indicator */}
                  <div style={{ position: "relative", zIndex: 2 }}>
                    {isPast ? (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--purple)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 12px rgba(168,85,247,0.4)" }}>
                        <Check size={13} color="white" strokeWidth={3} />
                      </motion.div>
                    ) : isActive ? (
                      <div style={{ width: 24, height: 24, borderRadius: "50%", border: "2px solid var(--purple-light)", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(168,85,247,0.1)", boxShadow: "0 0 18px rgba(168,85,247,0.25)" }}>
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }} style={{ position: "absolute", inset: -3, borderRadius: "50%", border: "2px solid transparent", borderTopColor: "var(--purple)" }} />
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--purple-light)", boxShadow: "0 0 8px var(--purple-light)" }} />
                      </div>
                    ) : (
                      <div style={{ width: 24, height: 24, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.1)", background: "var(--bg-primary)" }} />
                    )}
                  </div>
                  
                  {/* Step Text */}
                  <div style={{ paddingTop: 2 }}>
                    <span style={{ fontSize: 14, fontWeight: isActive ? 600 : 500, color: isPast ? "var(--text-primary)" : isActive ? "var(--purple-light)" : "var(--text-secondary)", transition: "color 0.3s ease" }}>
                      {step}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Success States */}
        {isDone && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            {referenceId && (
              <RefIdBox referenceId={referenceId} />
            )}
            <Link href="/careers" className="btn btn-secondary" style={{ width: "100%", justifyContent: "center", marginTop: 8 }}>
              Back to Open Positions
            </Link>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}


function RefIdBox({ referenceId }: { referenceId: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(referenceId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div style={{
      background: "linear-gradient(135deg, rgba(168,85,247,0.1), rgba(99,102,241,0.08))",
      border: "1px solid rgba(168,85,247,0.25)",
      borderRadius: 16,
      padding: "24px",
      marginBottom: 16,
      textAlign: "center",
    }}>
      <p style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10, fontWeight: 700 }}>
        Your Reference ID
      </p>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 12 }}>
        <p style={{
          fontSize: 22, fontWeight: 800, fontFamily: "monospace", margin: 0,
          background: "linear-gradient(90deg, #a78bfa, #60a5fa, #a78bfa)",
          backgroundSize: "200% auto",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          animation: "shimmer 3s linear infinite",
        }}>{referenceId}</p>
        <button
          onClick={copy}
          title="Copy ID"
          style={{ background: copied ? "rgba(34,197,94,0.15)" : "rgba(168,85,247,0.12)", border: `1px solid ${copied ? "rgba(34,197,94,0.3)" : "rgba(168,85,247,0.25)"}`, borderRadius: 8, padding: "6px 8px", cursor: "pointer", color: copied ? "var(--green)" : "var(--purple)", transition: "all 0.2s", display: "flex", alignItems: "center" }}
        >
          {copied ? <CheckCircle size={15} /> : <Copy size={15} />}
        </button>
      </div>
      <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>
        Save this ID — use it to track your status on the <Link href="/careers" style={{ color: "var(--purple-light)", fontWeight: 600 }}>careers page</Link>.
      </p>
    </div>
  );
}
