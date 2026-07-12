"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Clock, AlertTriangle, CheckCircle, Loader2, ChevronRight } from "lucide-react";

interface Question {
  id: string; type: "open" | "mcq"; prompt: string;
  options?: string[]; correctOption?: number; rubric?: string; points: number;
}

interface Props {
  sessionId: string; token: string; applicantName: string; applicantEmail: string;
  jobTitle: string; questions: Question[]; passMark: number; emailVerified: boolean;
  attempts: number; maxAttempts: number;
}

type Phase = "verify" | "intro" | "interview" | "submitting" | "done" | "terminated" | "failed_retry" | "terminated_final";

export default function InterviewClient({ sessionId, token, applicantName, applicantEmail, jobTitle, questions, passMark, emailVerified, attempts, maxAttempts }: Props) {
  const [phase, setPhase] = useState<Phase>(emailVerified ? "intro" : "verify");
  const [verifyEmail, setVerifyEmail] = useState("");
  const [verifyCnic, setVerifyCnic] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(120); // 2 min per question
  const [totalTime, setTotalTime] = useState(0);

  // Anti-cheat signals
  const pasteAttempts = useRef(0);
  const tabBlurCount = useRef(0);
  // eslint-disable-next-line react-hooks/purity
  const answerStartTime = useRef<number>(Date.now());
  const answerTypingSpeed = useRef<number[]>([]);

  // Timer per question
  useEffect(() => {
    if (phase !== "interview") return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTimeLeft(questions[currentQ]?.type === "open" ? 180 : 60);
    // eslint-disable-next-line react-hooks/purity
    answerStartTime.current = Date.now();
  }, [currentQ, phase, questions]);

  useEffect(() => {
    if (phase !== "interview") return;
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          handleNext();
          return 0;
        }
        return t - 1;
      });
      setTotalTime((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, currentQ]);

  // Anti-cheating & Tab blur detection
  useEffect(() => {
    if (phase !== "interview") return;
    const handleBlur = () => { tabBlurCount.current += 1; };
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleKeyDownGlob = (e: KeyboardEvent) => {
      // Prevent copy, paste, cut shortcuts
      if ((e.ctrlKey || e.metaKey) && ["c", "v", "x", "p"].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
    };

    window.addEventListener("blur", handleBlur);
    window.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("keydown", handleKeyDownGlob);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) tabBlurCount.current += 1;
    });
    return () => {
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("keydown", handleKeyDownGlob);
    };
  }, [phase]);

  const handleVerify = async () => {
    if (!verifyEmail.trim() || !verifyCnic.trim()) {
      setVerifyError("Please enter both email and CNIC to verify your identity.");
      return;
    }
    const res = await fetch(`/api/interview/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, email: verifyEmail.trim(), cnic: verifyCnic.trim() }),
    });
    if (res.ok) {
      setPhase("intro");
    } else {
      const d = await res.json();
      setVerifyError(d.error || "Verification failed. Please check your details.");
    }
  };

  const currentAnswer = answers[questions[currentQ]?.id] || "";
  const setAnswer = (val: string) => {
    setAnswers((a) => ({ ...a, [questions[currentQ].id]: val }));
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    pasteAttempts.current += 1;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const elapsed = Date.now() - answerStartTime.current;
    const chars = (e.target as HTMLTextAreaElement).value.length;
    if (chars > 0 && elapsed > 0) {
      answerTypingSpeed.current.push(chars / (elapsed / 1000));
    }
  };

  const checkSuspicion = useCallback((): boolean => {
    const avgSpeed = answerTypingSpeed.current.reduce((a, b) => a + b, 0) / Math.max(answerTypingSpeed.current.length, 1);
    // > 8 chars/second is implausibly fast (120+ wpm adjusted)
    const suspiciousSpeed = avgSpeed > 8;
    const suspicionScore = (pasteAttempts.current * 30) + (tabBlurCount.current * 20) + (suspiciousSpeed ? 40 : 0);
    return suspicionScore >= 60;
  }, []);

  const submitInterview = useCallback(async () => {
    const suspicious = checkSuspicion();
    setPhase("submitting");

    const res = await fetch("/api/interview/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        answers,
        cheatingSignals: {
          pasteAttempts: pasteAttempts.current,
          tabBlurCount: tabBlurCount.current,
          totalTimeSeconds: totalTime,
        },
        suspicionFlag: suspicious,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.result === "Retry") {
        if (data.terminated) {
          setPhase("terminated");
        } else {
          setPhase("failed_retry");
        }
      } else if (data.terminated) {
        setPhase("terminated_final");
      } else {
        setPhase("done");
      }
    } else {
      setPhase("done");
    }
  }, [answers, sessionId, totalTime, checkSuspicion]);

  const handleNext = useCallback(async () => {
    // Check cheating after last open-ended answer
    if (currentQ === questions.length - 1) {
      submitInterview();
      return;
    }
    setCurrentQ((q) => q + 1);
  }, [currentQ, questions.length, submitInterview]);

  // ── VERIFY PHASE ──
  if (phase === "verify") {
    return (
      <Layout>
        <motion.div className="card" style={{ maxWidth: 480, width: "100%", padding: 40 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
            <img src="/logo.png" alt="CyberLabSec Logo" style={{ height: 48, objectFit: "contain" }} />
          </div>
          <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 24 }}>
            Before starting your interview for <strong>{jobTitle}</strong>, please verify your identity.
          </p>
          <div style={{ display: "grid", gap: 16, marginBottom: 20 }}>
            <div>
              <label className="label label-required">Email Address</label>
              <input className="input" type="email" value={verifyEmail} onChange={(e) => setVerifyEmail(e.target.value)} placeholder="The email you applied with" />
            </div>
            <div>
              <label className="label label-required">CNIC Number</label>
              <input className="input" value={verifyCnic} onChange={(e) => setVerifyCnic(e.target.value)} placeholder="12345-1234567-1" />
            </div>
          </div>
          {verifyError && <p style={{ color: "var(--purple)", fontSize: 13, marginBottom: 16 }}>{verifyError}</p>}
          <button className="btn btn-primary" style={{ width: "100%" }} onClick={handleVerify}>
            Verify Identity <ChevronRight size={16} />
          </button>
        </motion.div>
      </Layout>
    );
  }

  // ── INTRO PHASE ──
  if (phase === "intro") {
    return (
      <Layout>
        <motion.div className="card" style={{ maxWidth: 620, width: "100%", padding: 40 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Hi {applicantName.split(" ")[0]}! 👋</h1>
          <p style={{ color: "var(--text-secondary)", marginBottom: 28 }}>Welcome to your CyberLab interview for <strong style={{ color: "var(--text-primary)" }}>{jobTitle}</strong>.</p>
          
          <div style={{ display: "grid", gap: 12, marginBottom: 28 }}>
            {[
              ["📋", `${questions.length} questions total — ${questions.filter(q => q.type === "open").length} written, ${questions.filter(q => q.type === "mcq").length} multiple choice`],
              ["⏱️", "Each question has its own timer — open questions: 3 min, MCQ: 1 min"],
              ["🚫", "Do not paste text or switch tabs — these are recorded as signals"],
              ["🤖", "Your answers will be evaluated based on technical depth and accuracy"],
              ["🔄", `Attempt ${attempts + 1} of ${maxAttempts} available. Use them wisely.`],
            ].map(([icon, text]) => (
              <div key={text as string} style={{ display: "flex", gap: 12, fontSize: 14, color: "var(--text-secondary)" }}>
                <span>{icon}</span><span>{text}</span>
              </div>
            ))}
          </div>

          <div style={{ background: "rgba(168,85,247,0.06)", border: "1px solid rgba(168,85,247,0.15)", borderRadius: 8, padding: 14, fontSize: 13, color: "#fca5a5", marginBottom: 28 }}>
            ⚠️ Irregular activity (paste, tab-switch, AI-generated answers) detected above a threshold will immediately terminate the interview and permanently block your CNIC from future applications.
          </div>

          <button className="btn btn-primary btn-lg" style={{ width: "100%" }} onClick={() => setPhase("interview")}>
            Start Interview <ChevronRight size={16} />
          </button>
        </motion.div>
      </Layout>
    );
  }

  // ── INTERVIEW PHASE ──
  if (phase === "interview") {
    if (!questions || questions.length === 0) {
      return (
        <Layout>
          <div className="card" style={{ maxWidth: 520, width: "100%", padding: 48, textAlign: "center" }}>
            <AlertTriangle size={48} color="var(--amber)" style={{ margin: "0 auto 20px" }} />
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Interview Unavailable</h2>
            <p style={{ color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 24 }}>
              The AI screening could not generate valid questions for your profile. Please contact support.
            </p>
          </div>
        </Layout>
      );
    }
    const q = questions[currentQ];
    const progress = ((currentQ) / questions.length) * 100;
    const timePercent = (timeLeft / (q.type === "open" ? 180 : 60)) * 100;

    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", flexDirection: "column" }}>
        {/* Interview header */}
        <div style={{ borderBottom: "1px solid var(--border)", padding: "0 24px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg-secondary)", position: "sticky", top: 0, zIndex: 50 }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <img src="/logo.png" alt="CyberLabSec Logo" style={{ height: 32, objectFit: "contain" }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Q{currentQ + 1} of {questions.length}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: timeLeft <= 30 ? "var(--purple)" : "var(--text-secondary)", fontSize: 13, fontFamily: "monospace", fontWeight: 600 }}>
              <Clock size={14} />
              {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="progress-bar" style={{ borderRadius: 0, height: 3 }}>
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        {/* Time bar */}
        <div className="progress-bar" style={{ borderRadius: 0, height: 2, background: "transparent" }}>
          <div style={{ height: "100%", width: `${timePercent}%`, background: timeLeft <= 30 ? "var(--purple)" : "var(--green)", transition: "width 1s linear, background 0.3s" }} />
        </div>

        <div style={{ flex: 1, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 24px" }}>
          <AnimatePresence mode="wait">
            <motion.div key={q.id} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }} style={{ maxWidth: 720, width: "100%" }}>
              <div className="card" style={{ padding: 32 }}>
                <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
                  <span className={q.type === "open" ? "badge badge-blue" : "badge badge-amber"}>
                    {q.type === "open" ? "Written Answer" : "Multiple Choice"}
                  </span>
                  <span className="badge badge-gray">{q.points} pts</span>
                </div>

                <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.6, marginBottom: 24 }}>{q.prompt}</h2>

                {q.type === "mcq" && q.options ? (
                  <div style={{ display: "grid", gap: 10 }}>
                    {q.options.map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => setAnswer(String(i))}
                        style={{
                          padding: "14px 18px", textAlign: "left", borderRadius: 8, cursor: "pointer",
                          border: `1px solid ${currentAnswer === String(i) ? "var(--purple)" : "var(--border)"}`,
                          background: currentAnswer === String(i) ? "rgba(168,85,247,0.08)" : "rgba(255,255,255,0.02)",
                          color: currentAnswer === String(i) ? "var(--text-primary)" : "var(--text-secondary)",
                          fontSize: 14, transition: "all 0.2s", fontFamily: "inherit",
                        }}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                ) : (
                  <textarea
                    className="input"
                    style={{ minHeight: 180, resize: "vertical" }}
                    placeholder="Type your answer here..."
                    value={currentAnswer}
                    onChange={(e) => setAnswer(e.target.value)}
                    onPaste={handlePaste}
                    onKeyDown={handleKeyDown}
                  />
                )}

                <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end" }}>
                  <button className="btn btn-primary" onClick={handleNext} disabled={q.type === "mcq" && !currentAnswer}>
                    {currentQ === questions.length - 1 ? "Submit Interview" : "Next Question"}
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // ── SUBMITTING ──
  if (phase === "submitting") {
    return (
      <Layout>
        <div className="card" style={{ maxWidth: 420, width: "100%", padding: 48, textAlign: "center" }}>
          <Loader2 size={48} color="var(--purple)" style={{ margin: "0 auto 20px", animation: "spin 1s linear infinite" }} />
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Submitting Your Answers</h2>
          <p style={{ color: "var(--text-secondary)" }}>Our AI is scoring your interview. Please wait...</p>
        </div>
      </Layout>
    );
  }

  // ── TERMINATED (cheating but has retry) ──
  if (phase === "terminated") {
    return (
      <Layout>
        <div className="card" style={{ maxWidth: 520, width: "100%", padding: 48, textAlign: "center", borderColor: "var(--border-accent)" }}>
          <AlertTriangle size={48} color="var(--purple)" style={{ margin: "0 auto 20px" }} />
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: "var(--purple)" }}>Attempt Terminated</h2>
          <p style={{ color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 24 }}>
            Irregular activity was detected — your submission shows signs of an AI-generated or copied answer. This attempt has been recorded as failed. You have {maxAttempts - attempts - 1} attempts remaining.
          </p>
          <button className="btn btn-primary" onClick={() => window.location.reload()} style={{ width: "100%" }}>
            Start Next Attempt <ChevronRight size={16} />
          </button>
        </div>
      </Layout>
    );
  }

  // ── FAILED BUT HAS RETRY ──
  if (phase === "failed_retry") {
    return (
      <Layout>
        <div className="card" style={{ maxWidth: 520, width: "100%", padding: 48, textAlign: "center" }}>
          <AlertTriangle size={48} color="var(--amber)" style={{ margin: "0 auto 20px" }} />
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Attempt Failed</h2>
          <p style={{ color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 24 }}>
            Your score did not meet the passing criteria for this role. You have {maxAttempts - attempts - 1} attempts remaining. A new set of questions will be generated.
          </p>
          <button className="btn btn-primary" onClick={() => window.location.reload()} style={{ width: "100%" }}>
            Start Next Attempt <ChevronRight size={16} />
          </button>
        </div>
      </Layout>
    );
  }

  // ── TERMINATED FINAL (No retries left) ──
  if (phase === "terminated_final") {
    return (
      <Layout>
        <div className="card" style={{ maxWidth: 520, width: "100%", padding: 48, textAlign: "center", borderColor: "var(--border-accent)" }}>
          <AlertTriangle size={48} color="var(--purple)" style={{ margin: "0 auto 20px" }} />
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: "var(--purple)" }}>Interview Terminated</h2>
          <p style={{ color: "var(--text-secondary)", lineHeight: 1.7 }}>
            Irregular activity was detected. Your interview has been permanently terminated and you have no remaining attempts.
          </p>
        </div>
      </Layout>
    );
  }

  // ── DONE ──
  return (
    <Layout>
      <motion.div className="card" style={{ maxWidth: 520, width: "100%", padding: 48, textAlign: "center" }} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
        <CheckCircle size={56} color="var(--green)" style={{ margin: "0 auto 24px", filter: "drop-shadow(0 0 16px rgba(34,197,94,0.3))" }} />
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>Interview Complete</h2>
        <p style={{ color: "var(--text-secondary)", lineHeight: 1.7 }}>
          Thank you, {applicantName.split(" ")[0]}. Your responses are being reviewed by our team. We&apos;ll be in touch via email with your results.
        </p>
        <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 16 }}>You may now close this window.</p>
      </motion.div>
    </Layout>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, var(--purple) 0%, transparent 100%)" }} />
      {children}
    </div>
  );
}
