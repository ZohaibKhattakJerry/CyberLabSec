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
  jobTitle: string; questions: Question[]; initialAnswers?: Record<string, string>; passMark: number; emailVerified: boolean;
  attempts: number; maxAttempts: number;
}

type Phase = "verify" | "intro" | "interview" | "submitting" | "done" | "terminated" | "failed_retry" | "terminated_final";

export default function InterviewClient({ sessionId, token, applicantName, applicantEmail, jobTitle, questions, initialAnswers = {}, passMark, emailVerified, attempts, maxAttempts }: Props) {
  const [phase, setPhase] = useState<Phase>("intro");
  
  // Calculate starting question index based on existing answers
  const initialQIndex = questions.findIndex(q => !initialAnswers[q.id]);
  const startQ = initialQIndex === -1 ? Math.max(0, questions.length - 1) : initialQIndex;
  
  const [currentQ, setCurrentQ] = useState(startQ);
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers);
  const [timeLeft, setTimeLeft] = useState(120); // 2 min per question
  const [totalTime, setTotalTime] = useState(0);

  // Integrity state
  const [tabSwitches, setTabSwitches] = useState(0);
  const [tabSwitchToast, setTabSwitchToast] = useState(false);
  const [pasteWarning, setPasteWarning] = useState(false);

  // Anti-cheat signals
  const pasteAttempts = useRef(0);
  const tabBlurCount = useRef(0);
  // eslint-disable-next-line react-hooks/purity
  const answerStartTime = useRef<number>(Date.now());
  const answerTypingSpeed = useRef<number[]>([]);

  // Timer per question
  useEffect(() => {
    if (phase !== "interview") return;
    const storageKey = `timer_${sessionId}_${currentQ}`;
    const savedEnd = localStorage.getItem(storageKey);
    const duration = questions[currentQ]?.type === "open" ? 180 : 60;
    
    if (savedEnd) {
      const remaining = Math.max(0, Math.floor((parseInt(savedEnd) - Date.now()) / 1000));
      setTimeLeft(remaining);
    } else {
      setTimeLeft(duration);
      localStorage.setItem(storageKey, String(Date.now() + duration * 1000));
    }
    
    // eslint-disable-next-line react-hooks/purity
    answerStartTime.current = Date.now() + 3000; // Delay by 3s to prevent false positives on early keystrokes
  }, [currentQ, phase, questions, sessionId]);

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

  // Autosave answers every 30s
  useEffect(() => {
    if (phase !== "interview") return;
    const interval = setInterval(() => {
      fetch("/api/interview/autosave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, answers })
      }).catch(console.error);
    }, 30000);
    return () => clearInterval(interval);
  }, [phase, sessionId, answers]);

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
    return () => {
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("keydown", handleKeyDownGlob);
    };
  }, [phase]);

  // Feature 1: Visibility change detection — tab switch logging
  useEffect(() => {
    if (phase !== "interview") return;
    const handleVisibility = () => {
      if (!document.hidden) return;
      tabBlurCount.current += 1;
      setTabSwitches((prev) => {
        const newCount = prev + 1;
        // Show toast warning
        setTabSwitchToast(true);
        setTimeout(() => setTabSwitchToast(false), 4000);
        // Log to server
        fetch("/api/interview/integrity", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, type: "tab_switch", count: newCount }),
        }).catch(console.error);
        return newCount;
      });
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [phase, sessionId]);

  const currentAnswer = answers[questions[currentQ]?.id] || "";
  const setAnswer = (val: string) => {
    setAnswers((a) => ({ ...a, [questions[currentQ].id]: val }));
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    pasteAttempts.current += 1;
    // Feature 2: Show paste warning
    setPasteWarning(true);
    setTimeout(() => setPasteWarning(false), 3000);
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

  // ── INTRO PHASE ──
  if (phase === "intro") {
    return (
      <IntroPhase applicantName={applicantName} jobTitle={jobTitle} questions={questions} attempts={attempts} maxAttempts={maxAttempts} onStart={() => setPhase("interview")} />
    );
  }

  // ── INTERVIEW PHASE ──
  if (phase === "interview") {
    // Feature 4: Auto-terminate after 5+ tab switches
    if (tabSwitches >= 5) {
      return (
        <Layout>
          <motion.div
            className="card"
            style={{ maxWidth: 560, width: "100%", padding: 48, textAlign: "center", borderColor: "var(--border-accent)" }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <AlertTriangle size={52} color="var(--purple)" style={{ margin: "0 auto 20px" }} />
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 16, color: "var(--purple)" }}>
              Interview Terminated
            </h2>
            <p style={{ color: "var(--text-secondary)", lineHeight: 1.75, marginBottom: 20 }}>
              Due to multiple integrity violations (5+ tab switches), this interview session has been automatically ended.
            </p>
            <p style={{ color: "var(--text-muted)", fontSize: 13, lineHeight: 1.6 }}>
              If you believe this is an error, contact{" "}
              <a href="mailto:careers@cyberlabsec.tech" style={{ color: "var(--purple)", textDecoration: "underline" }}>
                careers@cyberlabsec.tech
              </a>{" "}
              before restarting.
            </p>
          </motion.div>
        </Layout>
      );
    }

    if (!questions || questions.length === 0) {
      return (
        <Layout>
          <div className="card" style={{ maxWidth: 520, width: "100%", padding: 48, textAlign: "center" }}>
            <AlertTriangle size={48} color="var(--amber)" style={{ margin: "0 auto 20px" }} />
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Interview Unavailable</h2>
            <p style={{ color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 24 }}>
              We couldn&apos;t load your interview questions. Please contact support.
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
        {/* Feature 1: Tab-switch toast */}
        <AnimatePresence>
          {tabSwitchToast && (
            <motion.div
              initial={{ opacity: 0, y: -40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              transition={{ duration: 0.25 }}
              style={{
                position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)",
                zIndex: 9999, background: "rgba(234,179,8,0.15)",
                border: "1px solid rgba(234,179,8,0.5)", borderRadius: 10,
                padding: "10px 20px", fontSize: 13, fontWeight: 600,
                color: "#fbbf24", backdropFilter: "blur(12px)",
                boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
                maxWidth: "90vw", textAlign: "center",
              }}
            >
              ⚠️ Tab switch detected. This is logged and reviewed.
            </motion.div>
          )}
        </AnimatePresence>

        {/* Interview header */}
        <div className="flex-mobile-col" style={{ borderBottom: "1px solid var(--border)", padding: "12px 24px", minHeight: 56, height: "auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, background: "var(--bg-secondary)", position: "sticky", top: 0, zIndex: 50 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <img src="/logo.png" alt="CyberLabSec Logo" style={{ height: 24, objectFit: "contain" }} />
            <div style={{ height: 16, width: 1, background: "var(--border)" }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>Active Session</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", justifyContent: "flex-end" }}>
            {/* Feature 3: Integrity counter */}
            {tabSwitches > 0 && (
              <span style={{
                fontSize: 12, fontWeight: 600,
                color: "#fbbf24",
                background: "rgba(234,179,8,0.1)",
                border: "1px solid rgba(234,179,8,0.3)",
                borderRadius: 6, padding: "2px 8px",
              }}>
                ⚠️ {tabSwitches} warning{tabSwitches !== 1 ? "s" : ""}
              </span>
            )}
            {/* Section label: Written X/Y · MCQ X/Y */}
            {(() => {
              const totalOpen = questions.filter(q => q.type === "open").length;
              const totalMCQ = questions.filter(q => q.type === "mcq").length;
              const doneOpen = questions.slice(0, currentQ + 1).filter(q => q.type === "open").length;
              const doneMCQ = questions.slice(0, currentQ + 1).filter(q => q.type === "mcq").length;
              return (
                <span style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", gap: 6, alignItems: "center", fontWeight: 500 }}>
                  {totalOpen > 0 && <span style={{ color: "var(--blue)" }}>Written {Math.min(doneOpen, totalOpen)}/{totalOpen}</span>}
                  {totalOpen > 0 && totalMCQ > 0 && <span>·</span>}
                  {totalMCQ > 0 && <span style={{ color: "var(--amber)" }}>MCQ {Math.min(doneMCQ, totalMCQ)}/{totalMCQ}</span>}
                </span>
              );
            })()}
            <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 500 }}>Q{currentQ + 1} of {questions.length}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: timeLeft <= 30 ? "var(--purple)" : "var(--text-primary)", fontSize: 14, fontFamily: "monospace", fontWeight: 700 }}>
              <Clock size={16} />
              {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "00")}
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
              <div className="card" style={{ padding: 32, boxShadow: "0 12px 32px rgba(0,0,0,0.2)" }}>
                <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
                  <span className={q.type === "open" ? "badge badge-blue" : "badge badge-amber"}>
                    {q.type === "open" ? "Written Answer" : "Multiple Choice"}
                  </span>
                  <span className="badge badge-gray">{q.points} pts</span>
                </div>

                <h2 style={{ fontSize: 20, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.6, marginBottom: 32 }}>{q.prompt}</h2>

                {q.type === "mcq" && q.options ? (
                  <div style={{ display: "grid", gap: 12 }}>
                    {q.options.map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => setAnswer(String(i))}
                        style={{
                          padding: "16px 20px", textAlign: "left", borderRadius: 10, cursor: "pointer",
                          border: `1px solid ${currentAnswer === String(i) ? "var(--purple)" : "var(--border)"}`,
                          background: currentAnswer === String(i) ? "rgba(168,85,247,0.08)" : "rgba(255,255,255,0.02)",
                          color: currentAnswer === String(i) ? "var(--text-primary)" : "var(--text-secondary)",
                          fontSize: 15, transition: "all 0.2s", fontFamily: "inherit",
                          boxShadow: currentAnswer === String(i) ? "0 4px 12px rgba(168,85,247,0.15)" : "none",
                        }}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                ) : (
                  <>
                    <textarea
                      className="input"
                      style={{ minHeight: 200, resize: "vertical", fontSize: 15, lineHeight: 1.6, padding: 20 }}
                      placeholder="Type your answer here..."
                      value={currentAnswer}
                      onChange={(e) => setAnswer(e.target.value)}
                      onPaste={handlePaste}
                      onKeyDown={handleKeyDown}
                    />
                    {/* Feature 2: Paste warning */}
                    {pasteWarning && (
                      <div style={{
                        marginTop: 12, padding: "10px 16px", borderRadius: 8,
                        background: "rgba(234,179,8,0.1)",
                        border: "1px solid rgba(234,179,8,0.35)",
                        color: "#fbbf24", fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", gap: 8
                      }}>
                        <Shield size={14} /> Paste is disabled for integrity. Please type your answer independently.
                      </div>
                    )}
                  </>
                )}

                <div style={{ marginTop: 32, display: "flex", justifyContent: "flex-end", borderTop: "1px solid var(--border-subtle)", paddingTop: 24 }}>
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

import { ClipboardList, RefreshCw } from "lucide-react";

function IntroPhase({ applicantName, jobTitle, questions, attempts, maxAttempts, onStart }: { applicantName: string; jobTitle: string; questions: Question[]; attempts: number; maxAttempts: number; onStart: () => void }) {
  const [consent, setConsent] = useState(false);
  
  return (
    <Layout>
      <motion.div className="card" style={{ maxWidth: 680, width: "100%", padding: 48, border: "1px solid var(--border-subtle)" }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12, letterSpacing: "-0.02em", color: "var(--text-primary)" }}>Welcome, {applicantName.split(" ")[0]}</h1>
        <p style={{ color: "var(--text-secondary)", marginBottom: 36, fontSize: 15, lineHeight: 1.6 }}>You are about to begin your technical interview for the <strong style={{ color: "var(--text-primary)", fontWeight: 600 }}>{jobTitle}</strong> position.</p>
        
        <div className="grid-mobile-1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 32 }}>
          <div style={{ padding: 16, background: "rgba(255,255,255,0.02)", borderRadius: 12, border: "1px solid var(--border-subtle)", display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div style={{ color: "var(--purple)", marginTop: 2 }}><ClipboardList size={20} /></div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>Format</div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>{questions.length} questions total ({questions.filter((q: any) => q.type === "open").length} written, {questions.filter((q: any) => q.type === "mcq").length} MCQ).</div>
            </div>
          </div>
          <div style={{ padding: 16, background: "rgba(255,255,255,0.02)", borderRadius: 12, border: "1px solid var(--border-subtle)", display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div style={{ color: "var(--purple)", marginTop: 2 }}><Clock size={20} /></div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>Time Limits</div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>Each question has its own timer (3m for written, 1m for MCQ).</div>
            </div>
          </div>
          <div style={{ padding: 16, background: "rgba(255,255,255,0.02)", borderRadius: 12, border: "1px solid var(--border-subtle)", display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div style={{ color: "var(--amber)", marginTop: 2 }}><AlertTriangle size={20} /></div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>Strict Integrity</div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>Do not switch tabs or paste content. This leads to termination.</div>
            </div>
          </div>
          <div style={{ padding: 16, background: "rgba(255,255,255,0.02)", borderRadius: 12, border: "1px solid var(--border-subtle)", display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div style={{ color: "var(--blue)", marginTop: 2 }}><RefreshCw size={20} /></div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>Attempts</div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>Attempt {attempts + 1} of {maxAttempts} available. New questions are generated on retry.</div>
            </div>
          </div>
        </div>

        <div style={{ background: "rgba(168,85,247,0.06)", border: "1px solid rgba(168,85,247,0.15)", borderRadius: 12, padding: 20, fontSize: 13, color: "var(--text-secondary)", marginBottom: 28 }}>
          <strong style={{ color: "var(--purple)", display: "flex", alignItems: "center", gap: 6, marginBottom: 8, fontSize: 14 }}><Shield size={16} /> Technical Assessment Integrity</strong>
          This assessment is heavily monitored. Using LLMs, copy-pasting, or switching tabs will be flagged by our scoring AI and may result in immediate failure and ban from future applications. We want to see <em>your</em> unfiltered thinking.
        </div>

        <label style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 32, cursor: "pointer", padding: "12px 0" }}>
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} style={{ width: 18, height: 18, accentColor: "var(--purple)", cursor: "pointer", flexShrink: 0, marginTop: 2 }} />
          <span style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.5, userSelect: "none" }}>
            I agree to complete this assessment independently without external aids, and acknowledge that my browser interactions are monitored for integrity.
          </span>
        </label>

        <button className="btn btn-primary btn-lg" style={{ width: "100%", padding: 16, fontSize: 15 }} onClick={onStart} disabled={!consent}>
          Acknowledge & Start Interview <ChevronRight size={18} style={{ marginLeft: 4 }} />
        </button>
      </motion.div>
    </Layout>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: 4, background: "linear-gradient(90deg, #7e22ce 0%, #a855f7 50%, #d8b4fe 100%)" }} />
      {children}
    </div>
  );
}
