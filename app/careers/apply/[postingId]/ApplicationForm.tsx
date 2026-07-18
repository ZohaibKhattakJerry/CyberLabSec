"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Shield, Upload, X, CheckCircle, Loader2, AlertCircle, ChevronLeft, ChevronRight, Check } from "lucide-react";
import PublicNav from "@/components/public/PublicNav";

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
      if (res.ok) {
        setOtpSent(true);
        toast.success("Verification code sent to your email");
      } else {
        toast.error("Failed to send code. Try again.");
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
        if (data.status === "Shortlisted" || data.status === "InterviewInvited" || data.status === "Interview") {
          clearInterval(interval);
          setStatus("done");
          setStatusMsg("shortlisted");
        } else if (data.status === "Rejected" || data.status === "Applied") {
          clearInterval(interval);
          setStatus("done");
          setStatusMsg("reviewed");
        } else if (data.status === "Reviewing") {
          setStatusMsg("We are currently processing your application and evaluating your profile...");
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
          <>
            <Link href="/careers/status" className="hide-mobile" style={{ fontSize: 14, color: "var(--text-secondary)", textDecoration: "none", fontWeight: 500, transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "var(--text-primary)"} onMouseLeave={e => e.currentTarget.style.color = "var(--text-secondary)"}>
              Track Application
            </Link>
            <Link href="/careers" style={{ fontSize: 14, color: "var(--text-secondary)", textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}>
              <ChevronLeft size={16} /> Back to Jobs
            </Link>
          </>
        }
      />

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "clamp(24px, 5vw, 40px) clamp(16px, 4vw, 24px)" }}>
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
        <div style={{ display: "flex", gap: 8, marginBottom: 32, alignItems: "center", overflowX: "auto", paddingBottom: 8, WebkitOverflowScrolling: "touch", scrollbarWidth: "none", flexWrap: "nowrap" }}>
          {[1, 2, 3, 4].map((s) => (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, background: s <= step ? "var(--purple)" : "rgba(255,255,255,0.06)", color: s <= step ? "#fff" : "var(--text-muted)", transition: "all 0.3s" }}>{s}</div>
              {s < 4 && <div style={{ width: 24, height: 2, background: s < step ? "var(--purple)" : "rgba(255,255,255,0.06)", transition: "all 0.3s" }} />}
            </div>
          ))}
          <span style={{ marginLeft: 8, fontSize: 13, color: "var(--text-primary)", fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0 }}>
            {step === 1 ? "Personal Info" : step === 2 ? "Links & Profile" : step === 3 ? "Documents" : "Review & Consent"}
          </span>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
              <div className="card" style={{ padding: "clamp(20px, 4vw, 28px)" }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24 }}>Personal Information</h2>
                <div style={{ display: "grid", gap: 20 }}>
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


                  <div className="grid-mobile-1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <Field label="Phone Number" required error={errors.phone}>
                      <input className={`input${errors.phone ? " input-error" : ""}`} value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="03XX-XXXXXXX" />
                    </Field>
                    <Field label="City" required error={errors.city}>
                      <input className={`input${errors.city ? " input-error" : ""}`} value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="E.g., Lahore" />
                    </Field>
                  </div>
                  
                </div>
                <div style={{ marginTop: 28, display: "flex", justifyContent: "flex-end" }}>
                  <button className="btn btn-primary" onClick={() => { if (validateStep1()) setStep(2); }}>Continue <ChevronRight size={16} /></button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
              <div className="card" style={{ padding: "clamp(20px, 4vw, 28px)" }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24 }}>Education & Security Profiles</h2>
                <div style={{ display: "grid", gap: 20 }}>
                  
                  {posting.universityRequired && (
                    <>
                      <div className="grid-mobile-1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
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
                      <div className="grid-mobile-1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                        <Field label="Degree & Field of Study" required error={errors.degree}>
                          <input className={`input${errors.degree ? " input-error" : ""}`} value={form.degree} onChange={(e) => set("degree", e.target.value)} placeholder="e.g. BS Computer Science" />
                        </Field>
                        <Field label="CGPA (optional)">
                          <input className="input" value={form.cgpa} onChange={(e) => set("cgpa", e.target.value)} placeholder="e.g. 3.5 / 4.0" />
                        </Field>
                      </div>
                    </>
                  )}

                  <div className="grid-mobile-1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
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
                <div style={{ marginTop: 28, display: "flex", justifyContent: "space-between" }}>
                  <button className="btn btn-secondary" onClick={() => setStep(1)}><ChevronLeft size={16} /> Back</button>
                  <button className="btn btn-primary" onClick={() => { if (validateStep2()) setStep(3); }}>Continue <ChevronRight size={16} /></button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
              <div className="card" style={{ padding: "clamp(20px, 4vw, 28px)" }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24 }}>Documents & Motivation</h2>
                <div style={{ display: "grid", gap: 20 }}>
                  
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
                <div style={{ marginTop: 28, display: "flex", justifyContent: "space-between" }}>
                  <button className="btn btn-secondary" onClick={() => setStep(2)}><ChevronLeft size={16} /> Back</button>
                  <button className="btn btn-primary" onClick={() => { if (validateStep3()) setStep(4); }}>Continue <ChevronRight size={16} /></button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
              <div className="card" style={{ padding: "clamp(20px, 4vw, 28px)" }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Review & Consent</h2>
                <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 24 }}>Please review your details and accept the required consents before submitting.</p>

                <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 8, border: "1px solid var(--border)", padding: 16, marginBottom: 24 }}>
                  <div style={{ display: "grid", gap: 10, fontSize: 14 }}>
                    {[
                      ["Name", form.fullName], ["Email", form.email], ["Phone", form.phone],
                      ["Position", posting.title], ["CV", cvFile?.name || "—"],
                    ].map(([k, v]) => (
                      <div key={k} style={{ display: "flex", gap: 8 }}>
                        <span style={{ color: "var(--text-muted)", width: 80, flexShrink: 0 }}>{k}</span>
                        <span style={{ color: "var(--text-primary)", wordBreak: "break-word" }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: "grid", gap: 16, marginBottom: 28 }}>
                  <label style={{ display: "flex", gap: 12, alignItems: "flex-start", cursor: "pointer" }}>
                    <input type="checkbox" checked={form.consentData} onChange={(e) => set("consentData", e.target.checked)} style={{ marginTop: 2, accentColor: "var(--purple)", width: 16, height: 16, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                      I consent to CyberLabSec processing my personal data (including CV, contact details, and government ID) for recruitment purposes, in accordance with applicable data protection laws. My data will be stored securely and not shared with third parties.
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

                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
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
      {error && <p className="error-text"><AlertCircle size={12} />{error}</p>}
    </div>
  );
}

function ScreeningScreen({ status, message, referenceId }: { status: ScreeningStatus; message: string; referenceId?: string; }) {
  const isDone = status === "done";
  const isShortlisted = message === "shortlisted";
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (status !== "screening") return;
    const interval = setInterval(() => {
      setCurrentStep(s => (s < 3 ? s + 1 : 3));
    }, 2500);
    return () => clearInterval(interval);
  }, [status]);

  const steps = ["Receiving your application...", "Processing documents...", "Evaluating profile fit...", "Finalizing review..."];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <style>{`
        @keyframes confettiFall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(168,85,247,0.3); }
          50% { box-shadow: 0 0 50px rgba(168,85,247,0.7), 0 0 80px rgba(37,99,235,0.3); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
      `}</style>
      {isShortlisted && isDone && (
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
          {[...Array(20)].map((_, i) => (
            <div key={i} style={{
              position: 'absolute',
              width: Math.random() * 8 + 4,
              height: Math.random() * 8 + 4,
              borderRadius: '50%',
              background: ['#7c3aed', '#2563eb', '#22c55e', '#f59e0b', '#ec4899'][i % 5],
              left: `${Math.random() * 100}%`,
              top: '-20px',
              animation: `confettiFall ${2 + Math.random() * 3}s ${Math.random() * 2}s linear infinite`,
              opacity: 0.8
            }} />
          ))}
        </div>
      )}
      <motion.div className="card-glass scan-effect" style={{ maxWidth: 520, width: "100%", padding: 48, textAlign: "center", position: "relative", overflow: "hidden" }} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
        <div style={{ position: "relative", width: 96, height: 96, margin: "0 auto 32px" }}>
          {!isDone && (
            <>
              <motion.div initial={{ scale: 0.8, opacity: 0.8 }} animate={{ scale: 2.5, opacity: 0 }} transition={{ repeat: Infinity, duration: 2.5, ease: "easeOut" }} style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid var(--purple)", zIndex: 0, transform: "translateZ(0)" }} />
              <motion.div initial={{ scale: 0.8, opacity: 0.8 }} animate={{ scale: 2.5, opacity: 0 }} transition={{ repeat: Infinity, duration: 2.5, ease: "easeOut", delay: 1.25 }} style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid var(--purple)", zIndex: 0, transform: "translateZ(0)" }} />
            </>
          )}
          <div style={{ position: "relative", zIndex: 10, width: "100%", height: "100%", borderRadius: "50%", background: isDone ? (isShortlisted ? "rgba(34,197,94,0.1)" : "rgba(168,85,247,0.1)") : "var(--bg-card)", border: `2px solid ${isDone ? (isShortlisted ? "var(--green)" : "var(--purple)") : "var(--purple)"}`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: isDone ? `0 0 30px ${isShortlisted ? "rgba(34,197,94,0.2)" : "var(--purple-glow)"}` : "var(--shadow-purple)", backdropFilter: "blur(4px)" }}>
            {isDone ? (isShortlisted ? <CheckCircle size={40} color="var(--green)" /> : <Shield size={40} color="var(--purple)" />) : <Shield size={40} color="var(--purple)" />}
          </div>
        </div>

        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>
          {status === "uploading" ? "Uploading..." : isDone ? (isShortlisted ? "Shortlisted! 🎉" : "Application Received") : "Review in Progress"}
        </h2>

        <p style={{ color: "var(--text-secondary)", fontSize: 15, lineHeight: 1.7, marginBottom: 28 }}>
          {isDone
            ? isShortlisted
              ? "Congratulations! Your profile has been shortlisted. Check your email for an interview invitation link. The link expires in 48 hours."
              : "Thank you for applying. We've reviewed your application and will be in touch if there's a match for future opportunities."
            : message}
        </p>

        {isDone && referenceId && (
          <div style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.2)", borderRadius: 12, padding: 16, marginBottom: 24 }}>
            {isShortlisted && (
              <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                <CheckCircle size={18} color="var(--green)" />
                <span style={{ fontSize: 13, color: 'var(--green)', fontWeight: 600 }}>Interview invitation sent to your email!</span>
              </div>
            )}
            <p style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Application Reference ID</p>
            <p style={{ 
              fontSize: 20, fontWeight: 800, fontFamily: 'monospace',
              background: 'linear-gradient(90deg, #a78bfa, #60a5fa, #a78bfa)',
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: 'shimmer 3s linear infinite'
            }}>{referenceId}</p>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 8 }}>
              You can track your status anytime at <Link href="/careers/status" style={{ color: "var(--purple)" }}>/careers/status</Link> using this ID.
            </p>
          </div>
        )}

        {!isDone && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, textAlign: "left", background: "rgba(0,0,0,0.2)", padding: 20, borderRadius: 12, border: "1px solid var(--border-subtle)" }}>
            {steps.map((step, i) => {
              const isPast = currentStep > i;
              const isActive = currentStep === i;
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, opacity: isPast || isActive ? 1 : 0.4, transition: "opacity 0.3s" }}>
                  <div style={{ width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {isPast ? <CheckCircle size={16} color="var(--green)" /> : isActive ? <Loader2 size={16} className="spinner" color="var(--purple)" /> : <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--text-muted)" }} />}
                  </div>
                  <span style={{ fontSize: 14, color: isPast ? "var(--text-secondary)" : isActive ? "var(--purple-light)" : "var(--text-muted)", fontWeight: isActive ? 600 : 400 }}>
                    {step}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {isDone && (
          <Link href="/careers" className="btn btn-secondary" style={{ marginTop: 12 }}>
            Back to Careers
          </Link>
        )}
      </motion.div>
    </div>
  );
}
