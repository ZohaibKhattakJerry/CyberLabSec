"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Users, Trash2, X, Loader2, ClipboardList, CalendarDays,
  ChevronRight, Shield, Star, Crown, UserPlus, Settings,
  Target, TrendingUp, CheckCircle2, Clock, AlertTriangle,
  LayoutGrid, Sparkles, ArrowRight, Filter, Search, Eye,
  ExternalLink, FileText, CheckCircle, AlertCircle
} from "lucide-react";
import { format, isPast, formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";
import CompanyLeaveClient from "../leave/CompanyLeaveClient";

type Member = { id: string; name: string; designation: string; employeeCode: string };
type Team = {
  id: string; name: string; leadEmployeeId: string | null;
  members: Member[];
  tasks: { id: string; title: string; deadline: string }[];
  _count: { tasks: number; messages: number };
  createdAt: string;
};
type Employee = { id: string; name: string; employeeCode: string; designation: string; teamId: string | null };

// ─── Priority & Status configs ───────────────────────────────────────────
const PRIORITY: Record<string, { color: string; bg: string; border: string; label: string }> = {
  Low:      { color: "#22c55e", bg: "rgba(34,197,94,0.1)",   border: "rgba(34,197,94,0.25)",   label: "Low" },
  Medium:   { color: "#60a5fa", bg: "rgba(96,165,250,0.1)",  border: "rgba(96,165,250,0.25)",  label: "Medium" },
  High:     { color: "#fb923c", bg: "rgba(251,146,60,0.1)",  border: "rgba(251,146,60,0.25)",  label: "High" },
  Critical: { color: "#f87171", bg: "rgba(248,113,113,0.1)", border: "rgba(248,113,113,0.25)", label: "Critical" },
};
const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  Assigned:         { label: "Assigned",          color: "#6b7280", bg: "rgba(107,114,128,0.12)" },
  "In Progress":    { label: "In Progress",       color: "#60a5fa", bg: "rgba(96,165,250,0.12)" },
  Submitted:        { label: "Submitted",          color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  "Under Review":   { label: "Under Review",      color: "#a78bfa", bg: "rgba(167,139,250,0.12)" },
  "Need more information": { label: "Revisions",  color: "#fb923c", bg: "rgba(251,146,60,0.12)" },
  Completed:        { label: "Completed",         color: "#34d399", bg: "rgba(52,211,153,0.12)" },
};

// ─── Kanban Columns ──────────────────────────────────────────────────────
const KANBAN_COLS = [
  { id: "todo",     label: "To Do",       statuses: ["Assigned"],                                    color: "#6b7280", icon: "📋" },
  { id: "progress", label: "In Progress", statuses: ["In Progress"],                                  color: "#60a5fa", icon: "⚡" },
  { id: "review",   label: "Under Review",statuses: ["Submitted", "Under Review"],                   color: "#a78bfa", icon: "🔍" },
  { id: "revision", label: "Revisions",   statuses: ["Need more information", "ChangesRequested"],   color: "#fb923c", icon: "🔄" },
  { id: "done",     label: "Completed",   statuses: ["Completed"],                                    color: "#34d399", icon: "✅" },
];

export default function TeamsClient({
  teams, employees, allTasks = [], initialLeaves = []
}: {
  teams: Team[]; employees: Employee[]; allTasks?: any[]; initialLeaves?: any[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<"teams" | "tasks" | "leave">("teams");

  // Teams state
  const [showCreate, setShowCreate] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [addMemberId, setAddMemberId] = useState("");

  // Tasks state
  const [tasks, setTasks] = useState<any[]>(allTasks);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterPriority, setFilterPriority] = useState("All");
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [taskLoading, setTaskLoading] = useState(false);
  const [reviewTask, setReviewTask] = useState<any | null>(null);
  const [reviewAction, setReviewAction] = useState<{ submissionId: string; action: "approve" | "request_changes" } | null>(null);
  const [feedback, setFeedback] = useState("");
  const [qualityRating, setQualityRating] = useState(0);
  const [taskForm, setTaskForm] = useState({ title: "", brief: "", deadline: "", teamId: "", assigneeId: "", priority: "Medium", assignType: "Team", targetUrl: "", scopeRules: "", vulnFocus: "" });
  const [attachments, setAttachments] = useState<{ name: string; url: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Team actions ─────────────────────────────────────────────────────
  const createTeam = async () => {
    if (!newTeamName.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/company/teams", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTeamName }),
      });
      if (!res.ok) throw new Error("Failed");
      setNewTeamName(""); setShowCreate(false);
      toast.success("Team created!");
      startTransition(() => router.refresh());
    } catch { toast.error("Failed to create team"); }
    finally { setLoading(false); }
  };

  const deleteTeam = async (id: string, name: string) => {
    if (!confirm(`Delete team "${name}"? Members will be unassigned.`)) return;
    setLoading(true);
    try {
      await fetch(`/api/company/teams/${id}`, { method: "DELETE" });
      toast.success("Team deleted");
      startTransition(() => router.refresh());
    } catch { toast.error("Failed to delete team"); }
    finally { setLoading(false); }
  };

  const setTeamLead = async (teamId: string, leadEmployeeId: string) => {
    try {
      await fetch(`/api/company/teams/${teamId}/lead`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadEmployeeId: leadEmployeeId || null }),
      });
      toast.success("Lead updated!");
      startTransition(() => router.refresh());
    } catch { toast.error("Failed to update lead"); }
  };

  const addMember = async (teamId: string, employeeId: string) => {
    if (!employeeId) return toast.error("Select an employee");
    setLoading(true);
    try {
      const res = await fetch(`/api/company/teams/${teamId}/members`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Member added!");
      setAddMemberId(""); setShowAddMember(false);
      startTransition(() => router.refresh());
    } catch { toast.error("Failed to add member"); }
    finally { setLoading(false); }
  };

  const removeMember = async (teamId: string, employeeId: string, name: string) => {
    if (!confirm(`Remove ${name} from team?`)) return;
    setLoading(true);
    try {
      await fetch(`/api/company/teams/${teamId}/members/${employeeId}`, { method: "DELETE" });
      toast.success("Member removed");
      startTransition(() => router.refresh());
    } catch { toast.error("Failed to remove member"); }
    finally { setLoading(false); }
  };

  // ── Task actions ─────────────────────────────────────────────────────
  const filteredTasks = tasks.filter(t => {
    const q = search.toLowerCase();
    const matchSearch = !q || t.title?.toLowerCase().includes(q) || (t.team?.name || "").toLowerCase().includes(q);
    const matchStatus = filterStatus === "All" || t.status === filterStatus;
    const matchPriority = filterPriority === "All" || t.priority === filterPriority;
    return matchSearch && matchStatus && matchPriority;
  });

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title || !taskForm.deadline) return toast.error("Fill required fields");
    if (taskForm.assignType === "Team" && !taskForm.teamId) return toast.error("Select a team");
    if (taskForm.assignType === "Individual" && !taskForm.assigneeId) return toast.error("Select an employee");
    setTaskLoading(true);
    try {
      const selectedEmp = taskForm.assignType === "Individual" ? employees.find(e => e.id === taskForm.assigneeId) : null;
      const payload = {
        ...taskForm,
        teamId: taskForm.assignType === "Team" ? taskForm.teamId : (selectedEmp?.teamId || taskForm.teamId || null),
        assigneeId: taskForm.assignType === "Individual" ? taskForm.assigneeId : undefined,
        attachments,
      };
      const res = await fetch("/api/company/tasks", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed");
      const { task } = await res.json();
      const newTeam = teams.find(t => t.id === taskForm.teamId) || { id: "no-team", name: "Direct Assignment" };
      setTasks([{ ...task, team: newTeam, submissions: [] }, ...tasks]);
      setShowCreateTask(false);
      setTaskForm({ title: "", brief: "", deadline: "", teamId: "", assigneeId: "", priority: "Medium", assignType: "Team", targetUrl: "", scopeRules: "", vulnFocus: "" });
      setAttachments([]);
      toast.success("Task deployed! 🚀");
    } catch { toast.error("Failed to create task"); }
    finally { setTaskLoading(false); }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Delete this task? All submissions will be lost.")) return;
    try {
      await fetch(`/api/company/tasks/${taskId}`, { method: "DELETE" });
      setTasks(tasks.filter(t => t.id !== taskId));
      toast.success("Task deleted");
    } catch { toast.error("Failed to delete task"); }
  };

  const handleReview = async () => {
    if (!reviewAction) return;
    if (reviewAction?.action === "request_changes" && !feedback.trim()) return toast.error("Feedback required");
    setTaskLoading(true);
    try {
      const res = await fetch("/api/company/tasks/review", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId: reviewAction.submissionId, action: reviewAction?.action, feedback: feedback.trim(), qualityRating: qualityRating || null }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success(reviewAction?.action === "approve" ? "Approved! 🎉 Points awarded!" : "Revisions requested ✓");
      setReviewAction(null); setFeedback(""); setQualityRating(0); setReviewTask(null);
      startTransition(() => router.refresh());
    } catch { toast.error("Failed to submit review"); }
    finally { setTaskLoading(false); }
  };

  // Stats for header
  const totalMembers = teams.reduce((acc, t) => acc + t.members.length, 0);
  const pendingReview = tasks.filter(t => t.status === "Submitted" || t.status === "Under Review").length;
  const completedTasks = tasks.filter(t => t.status === "Completed").length;
  const overdueTasks = tasks.filter(t => isPast(new Date(t.deadline)) && t.status !== "Completed").length;

  const unassignedEmployees = employees.filter(e => !e.teamId);

  return (
    <>
      <style>{`
        /* ── Workspace Design System ──────────────────────────────── */
        .ws-page { padding-bottom: 80px; }

        /* Header */
        .ws-header {
          background: linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(168,85,247,0.04) 50%, transparent 100%);
          border: 1px solid rgba(99,102,241,0.15); border-radius: 24px;
          padding: clamp(20px,4vw,32px); margin-bottom: 28px; position: relative; overflow: hidden;
        }
        .ws-header::before {
          content: ''; position: absolute; top: -40px; right: -40px;
          width: 200px; height: 200px; border-radius: 50%;
          background: radial-gradient(circle, rgba(168,85,247,0.08) 0%, transparent 70%);
          pointer-events: none;
        }

        /* Stat cards */
        .ws-stat { display: flex; align-items: center; gap: 12px; padding: 14px 18px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 14px; min-width: 0; flex: 1; }
        .ws-stat-icon { width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .ws-stat-val { font-size: 22px; font-weight: 900; color: #fff; line-height: 1; }
        .ws-stat-lbl { font-size: 11px; color: #6b7280; font-weight: 500; margin-top: 2px; }

        /* Tab nav */
        .ws-tabs { display: flex; gap: 4px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; padding: 5px; margin-bottom: 24px; overflow-x: auto; }
        .ws-tab { display: flex; align-items: center; gap: 8px; padding: 10px 20px; border-radius: 12px; border: none; cursor: pointer; font-size: 13px; font-weight: 600; transition: all 0.2s; white-space: nowrap; }
        .ws-tab-active { background: linear-gradient(135deg, rgba(99,102,241,0.25), rgba(168,85,247,0.2)); color: #a5b4fc; box-shadow: 0 2px 8px rgba(99,102,241,0.2); }
        .ws-tab-inactive { background: transparent; color: #6b7280; }
        .ws-tab-inactive:hover { background: rgba(255,255,255,0.06); color: #9ca3af; }

        /* Team cards */
        .ws-team-card {
          background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px;
          transition: all 0.25s; cursor: pointer; overflow: hidden; position: relative;
        }
        .ws-team-card:hover { background: rgba(255,255,255,0.045); border-color: rgba(99,102,241,0.3); transform: translateY(-2px); box-shadow: 0 8px 32px rgba(0,0,0,0.3); }
        .ws-team-card-header { padding: 20px 22px 16px; border-bottom: 1px solid rgba(255,255,255,0.06); }
        .ws-team-card-body { padding: 16px 22px 20px; }

        /* Member avatar */
        .ws-avatar { width: 34px; height: 34px; border-radius: 50%; background: linear-gradient(135deg, rgba(99,102,241,0.3), rgba(168,85,247,0.3)); display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; color: #c4b5fd; border: 2px solid rgba(99,102,241,0.2); flex-shrink: 0; }

        /* Kanban */
        .ws-kanban { display: grid; grid-template-columns: repeat(5, minmax(210px, 1fr)); gap: 14px; overflow-x: auto; padding-bottom: 20px; }
        @media (max-width: 1100px) { .ws-kanban { grid-template-columns: repeat(3, minmax(210px, 1fr)); } }
        @media (max-width: 700px) { .ws-kanban { grid-template-columns: repeat(2, minmax(180px, 1fr)); } }
        @media (max-width: 480px) { .ws-kanban { grid-template-columns: 1fr; } }

        .ws-kanban-col { background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.07); border-radius: 18px; padding: 14px; display: flex; flex-direction: column; gap: 10px; min-height: 300px; }
        .ws-kanban-col-header { display: flex; align-items: center; justify-content: space-between; padding: 0 2px 10px; border-bottom: 1px solid rgba(255,255,255,0.06); }

        /* Task card */
        .ws-task-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 14px; cursor: pointer; transition: all 0.2s; position: relative; }
        .ws-task-card:hover { background: rgba(255,255,255,0.07); border-color: rgba(99,102,241,0.3); transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.25); }

        .ws-priority-pill { display: inline-flex; align-items: center; gap: 4px; font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 20px; letter-spacing: 0.04em; border: 1px solid; }

        /* Submission rows */
        .ws-sub-row { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 12px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); transition: background 0.2s; }
        .ws-sub-row:hover { background: rgba(255,255,255,0.05); }

        /* Forms */
        .ws-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(10px); z-index: 500; display: flex; align-items: flex-end; justify-content: center; padding: 0; }
        @media (min-width: 640px) { .ws-modal-overlay { align-items: center; padding: 24px; } }
        .ws-modal { background: linear-gradient(180deg, #0e0d18 0%, #09080f 100%); border: 1px solid rgba(99,102,241,0.2); border-radius: 28px 28px 0 0; width: 100%; max-width: 640px; max-height: 90vh; display: flex; flex-direction: column; box-shadow: 0 -20px 60px rgba(0,0,0,0.6); overflow: hidden; }
        @media (min-width: 640px) { .ws-modal { border-radius: 28px; } }
        .ws-modal-header { padding: 22px 26px 18px; border-bottom: 1px solid rgba(255,255,255,0.07); display: flex; align-items: center; gap: 14px; flex-shrink: 0; }
        .ws-modal-body { padding: 22px 26px 26px; overflow-y: auto; flex: 1; display: grid; gap: 18px; }
        .ws-modal-footer { padding: 16px 26px; border-top: 1px solid rgba(255,255,255,0.07); display: flex; gap: 10px; flex-shrink: 0; }

        .ws-input { width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 11px 14px; color: #fff; font-size: 14px; transition: all 0.2s; outline: none; }
        .ws-input:focus { border-color: rgba(99,102,241,0.5); background: rgba(99,102,241,0.06); box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
        .ws-label { font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 7px; display: block; }
        .ws-label-req::after { content: ' *'; color: #a78bfa; }

        .ws-btn-primary { display: inline-flex; align-items: center; justify-content: center; gap: 7px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; border: none; border-radius: 12px; padding: 11px 22px; font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.2s; }
        .ws-btn-primary:hover:not(:disabled) { filter: brightness(1.1); transform: translateY(-1px); box-shadow: 0 6px 20px rgba(99,102,241,0.35); }
        .ws-btn-primary:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }

        .ws-btn-secondary { display: inline-flex; align-items: center; justify-content: center; gap: 7px; background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.1); color: #9ca3af; border-radius: 12px; padding: 11px 20px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .ws-btn-secondary:hover { background: rgba(255,255,255,0.12); color: #d1d5db; }

        .ws-btn-danger { display: inline-flex; align-items: center; justify-content: center; gap: 6px; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.25); color: #f87171; border-radius: 10px; padding: 7px 12px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .ws-btn-danger:hover { background: rgba(239,68,68,0.2); }

        .ws-chip { display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; font-size: 12px; color: #9ca3af; font-weight: 500; }
        .ws-chip-lead { background: rgba(168,85,247,0.12); border-color: rgba(168,85,247,0.25); color: #c4b5fd; }

        /* Review panel */
        .ws-review-panel { background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; padding: 20px; margin-top: 16px; display: grid; gap: 14px; }
        .ws-star { background: none; border: none; cursor: pointer; padding: 4px; transition: transform 0.15s; }
        .ws-star:hover { transform: scale(1.2); }

        /* Empty state */
        .ws-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; text-align: center; }
        .ws-empty-icon { width: 72px; height: 72px; border-radius: 20px; background: rgba(99,102,241,0.08); border: 1px solid rgba(99,102,241,0.15); display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; }

        /* Task list table */
        .ws-task-list { display: grid; gap: 10px; }
        .ws-task-row { background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; padding: 16px 20px; display: flex; align-items: center; gap: 16px; flex-wrap: wrap; transition: all 0.2s; }
        .ws-task-row:hover { background: rgba(255,255,255,0.05); border-color: rgba(99,102,241,0.2); }

        @keyframes fadeSlide { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .ws-fade { animation: fadeSlide 0.3s ease both; }
      `}</style>

      <div className="ws-page ws-fade">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="ws-header">
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20, marginBottom: 22, flexWrap: "wrap" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, rgba(99,102,241,0.3), rgba(168,85,247,0.3))", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <LayoutGrid size={18} style={{ color: "#a5b4fc" }} />
                </div>
                <h1 style={{ fontSize: "clamp(20px,4vw,26px)", fontWeight: 900, letterSpacing: "-0.02em", color: "#fff" }}>Workspace</h1>
              </div>
              <p style={{ color: "#6b7280", fontSize: 13 }}>Command center for teams, operational tasks, and leave management.</p>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              {activeTab === "teams" && (
                <button className="ws-btn-primary" onClick={() => setShowCreate(true)}>
                  <Plus size={16} /> New Team
                </button>
              )}
              {activeTab === "tasks" && (
                <button className="ws-btn-primary" onClick={() => setShowCreateTask(!showCreateTask)}>
                  <Plus size={16} /> Deploy Task
                </button>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {[
              { icon: <Users size={16} style={{ color: "#818cf8" }} />, bg: "rgba(99,102,241,0.12)", val: teams.length, lbl: "Active Teams" },
              { icon: <Shield size={16} style={{ color: "#f59e0b" }} />, bg: "rgba(245,158,11,0.12)", val: totalMembers, lbl: "Team Members" },
              { icon: <ClipboardList size={16} style={{ color: "#34d399" }} />, bg: "rgba(52,211,153,0.12)", val: completedTasks, lbl: "Completed Tasks" },
              { icon: <AlertTriangle size={16} style={{ color: "#f87171" }} />, bg: "rgba(248,113,113,0.12)", val: overdueTasks, lbl: "Overdue" },
              { icon: <Eye size={16} style={{ color: "#a78bfa" }} />, bg: "rgba(167,139,250,0.12)", val: pendingReview, lbl: "Pending Review" },
            ].map((s, i) => (
              <div key={i} className="ws-stat" style={{ minWidth: 110 }}>
                <div className="ws-stat-icon" style={{ background: s.bg }}>{s.icon}</div>
                <div>
                  <div className="ws-stat-val">{s.val}</div>
                  <div className="ws-stat-lbl">{s.lbl}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Tabs ────────────────────────────────────────────────────────── */}
        <div className="ws-tabs">
          {[
            { id: "teams", label: "Teams", icon: <Users size={15} />, count: teams.length },
            { id: "tasks", label: "Tasks", icon: <ClipboardList size={15} />, count: tasks.length },
            { id: "leave", label: "Leave Requests", icon: <CalendarDays size={15} />, count: initialLeaves.length },
          ].map(tab => (
            <button
              key={tab.id}
              className={`ws-tab ${activeTab === tab.id ? "ws-tab-active" : "ws-tab-inactive"}`}
              onClick={() => setActiveTab(tab.id as any)}
            >
              {tab.icon} {tab.label}
              <span style={{ padding: "1px 7px", borderRadius: 20, background: activeTab === tab.id ? "rgba(99,102,241,0.3)" : "rgba(255,255,255,0.08)", fontSize: 10, fontWeight: 800, color: activeTab === tab.id ? "#c4b5fd" : "#4b5563" }}>{tab.count}</span>
            </button>
          ))}
        </div>

        {/* ── TEAMS TAB ────────────────────────────────────────────────────── */}
        {activeTab === "teams" && (
          <div className="ws-fade">
            {teams.length === 0 ? (
              <div className="ws-empty">
                <div className="ws-empty-icon"><Users size={32} style={{ color: "#6366f1" }} /></div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 8 }}>No Teams Yet</h3>
                <p style={{ color: "#6b7280", fontSize: 13, maxWidth: 300 }}>Create your first team and assign members to start deploying tasks.</p>
                <button className="ws-btn-primary" style={{ marginTop: 20 }} onClick={() => setShowCreate(true)}><Plus size={16} /> Create First Team</button>
              </div>
            ) : (
              <>
                {/* Unassigned employees alert */}
                {unassignedEmployees.length > 0 && (
                  <div style={{ padding: "12px 18px", background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 14, marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
                    <AlertCircle size={16} style={{ color: "#f59e0b", flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: "#d1d5db" }}>
                      <strong style={{ color: "#fbbf24" }}>{unassignedEmployees.length} employee{unassignedEmployees.length > 1 ? "s" : ""}</strong> not assigned to any team:&nbsp;
                      {unassignedEmployees.slice(0, 3).map(e => e.name).join(", ")}{unassignedEmployees.length > 3 ? ` +${unassignedEmployees.length - 3} more` : ""}
                    </span>
                  </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 18 }}>
                  {teams.map((team) => {
                    const lead = team.members.find(m => m.id === team.leadEmployeeId);
                    const tasksDue = team.tasks.filter(t => isPast(new Date(t.deadline))).length;

                    return (
                      <div key={team.id} className="ws-team-card">
                        {/* Card header */}
                        <div className="ws-team-card-header">
                          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                              <div style={{ width: 44, height: 44, borderRadius: 14, background: "linear-gradient(135deg, rgba(99,102,241,0.25), rgba(168,85,247,0.2))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                                🛡️
                              </div>
                              <div>
                                <h3 style={{ fontSize: 16, fontWeight: 800, color: "#fff", marginBottom: 2 }}>{team.name}</h3>
                                <div style={{ display: "flex", gap: 12, fontSize: 11, color: "#6b7280" }}>
                                  <span>{team.members.length} member{team.members.length !== 1 ? "s" : ""}</span>
                                  <span>·</span>
                                  <span>{team._count.tasks} task{team._count.tasks !== 1 ? "s" : ""}</span>
                                  {tasksDue > 0 && <><span>·</span><span style={{ color: "#f87171" }}>⚠ {tasksDue} overdue</span></>}
                                </div>
                              </div>
                            </div>
                            <button className="ws-btn-danger" style={{ padding: "6px 10px" }} onClick={() => deleteTeam(team.id, team.name)} title="Delete team">
                              <Trash2 size={13} />
                            </button>
                          </div>

                          {/* Lead selector */}
                          <div>
                            <label className="ws-label">Team Lead</label>
                            <select
                              className="ws-input"
                              value={team.leadEmployeeId || ""}
                              onChange={e => setTeamLead(team.id, e.target.value)}
                              style={{ fontSize: 13, padding: "8px 12px" }}
                            >
                              <option value="">— No Lead Assigned —</option>
                              {team.members.map(m => (
                                <option key={m.id} value={m.id}>{m.name} ({m.designation})</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Members */}
                        <div className="ws-team-card-body">
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.07em" }}>Members</span>
                            <button
                              style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)", borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 700, color: "#a5b4fc", cursor: "pointer" }}
                              onClick={() => { setSelectedTeam(team); setShowAddMember(true); }}
                            >
                              <UserPlus size={12} /> Add
                            </button>
                          </div>

                          {team.members.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "16px 0", color: "#4b5563", fontSize: 12 }}>
                              No members. Add someone to get started.
                            </div>
                          ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                              {team.members.map(m => (
                                <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                  <div className="ws-avatar">{m.name.charAt(0)}</div>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: "#e5e7eb", display: "flex", alignItems: "center", gap: 6 }}>
                                      {m.name}
                                      {m.id === team.leadEmployeeId && (
                                        <span style={{ fontSize: 10, fontWeight: 800, background: "rgba(168,85,247,0.15)", color: "#c4b5fd", border: "1px solid rgba(168,85,247,0.3)", borderRadius: 20, padding: "1px 7px" }}>
                                          <Crown size={9} style={{ display: "inline", marginRight: 3 }} />Lead
                                        </span>
                                      )}
                                    </div>
                                    <div style={{ fontSize: 11, color: "#4b5563" }}>{m.designation} · {m.employeeCode}</div>
                                  </div>
                                  <button
                                    onClick={() => removeMember(team.id, m.id, m.name)}
                                    style={{ background: "none", border: "none", cursor: "pointer", color: "#374151", padding: 4, borderRadius: 6, transition: "color 0.2s" }}
                                    title="Remove member"
                                    onMouseEnter={e => (e.currentTarget.style.color = "#f87171")}
                                    onMouseLeave={e => (e.currentTarget.style.color = "#374151")}
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Quick task button */}
                          <button
                            className="ws-btn-secondary"
                            style={{ width: "100%", marginTop: 14, fontSize: 12, padding: "9px 14px" }}
                            onClick={() => { setActiveTab("tasks"); setTaskForm(f => ({ ...f, teamId: team.id, assignType: "Team" })); setShowCreateTask(true); }}
                          >
                            <ClipboardList size={13} /> Assign Task to this Team <ArrowRight size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── TASKS TAB ────────────────────────────────────────────────────── */}
        {activeTab === "tasks" && (
          <div className="ws-fade">
            {/* Task Create Form */}
            {showCreateTask && (
              <div style={{ background: "rgba(99,102,241,0.04)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 20, padding: "24px 26px", marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(99,102,241,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Sparkles size={18} style={{ color: "#818cf8" }} />
                  </div>
                  <h2 style={{ fontSize: 17, fontWeight: 800, color: "#fff", margin: 0 }}>Deploy New Task</h2>
                </div>
                <form onSubmit={handleCreateTask}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginBottom: 16 }}>
                    <div>
                      <label className="ws-label ws-label-req">Task Title</label>
                      <input className="ws-input" value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} placeholder="e.g. Initial Recon Report" required />
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                      <div style={{ flex: 1 }}>
                        <label className="ws-label ws-label-req">Assign To</label>
                        <select className="ws-input" value={taskForm.assignType} onChange={e => setTaskForm({ ...taskForm, assignType: e.target.value })}>
                          <option value="Team">Team</option>
                          <option value="Individual">Individual</option>
                        </select>
                      </div>
                      <div style={{ flex: 2 }}>
                        <label className="ws-label ws-label-req">{taskForm.assignType === "Team" ? "Team" : "Employee"}</label>
                        {taskForm.assignType === "Team" ? (
                          <select className="ws-input" value={taskForm.teamId} onChange={e => setTaskForm({ ...taskForm, teamId: e.target.value })} required>
                            <option value="" disabled>Select team...</option>
                            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                          </select>
                        ) : (
                          <select className="ws-input" value={taskForm.assigneeId} onChange={e => setTaskForm({ ...taskForm, assigneeId: e.target.value })} required>
                            <option value="" disabled>Select employee...</option>
                            {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.employeeCode})</option>)}
                          </select>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="ws-label ws-label-req">Priority</label>
                      <select className="ws-input" value={taskForm.priority} onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}>
                        {Object.entries(PRIORITY).map(([k]) => <option key={k} value={k}>{k}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="ws-label ws-label-req">Deadline</label>
                      <input type="datetime-local" className="ws-input" value={taskForm.deadline} onChange={e => setTaskForm({ ...taskForm, deadline: e.target.value })} required />
                    </div>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <label className="ws-label">Operational Briefing</label>
                    <textarea className="ws-input" rows={3} value={taskForm.brief} onChange={e => setTaskForm({ ...taskForm, brief: e.target.value })} placeholder="Detailed objectives, deliverables, and expected outcomes..." style={{ resize: "vertical" }} />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginBottom: 16 }}>
                    <div>
                      <label className="ws-label">Target URL (optional)</label>
                      <input className="ws-input" value={taskForm.targetUrl} onChange={e => setTaskForm({ ...taskForm, targetUrl: e.target.value })} placeholder="https://target.example.com" />
                    </div>
                    <div>
                      <label className="ws-label">Vulnerability Focus (optional)</label>
                      <input className="ws-input" value={taskForm.vulnFocus} onChange={e => setTaskForm({ ...taskForm, vulnFocus: e.target.value })} placeholder="e.g. SQLi, XSS, IDOR" />
                    </div>
                    <div style={{ gridColumn: "1 / -1" }}>
                      <label className="ws-label">Scope & Rules of Engagement (optional)</label>
                      <textarea className="ws-input" rows={2} value={taskForm.scopeRules} onChange={e => setTaskForm({ ...taskForm, scopeRules: e.target.value })} placeholder="In-scope: *.target.com\nOut-of-scope: admin.target.com" style={{ resize: "vertical" }} />
                    </div>
                  </div>

                  {/* Attachments */}
                  <div style={{ marginBottom: 20 }}>
                    <label className="ws-label">Attachments</label>
                    <input
                      ref={fileInputRef}
                      type="file" multiple accept="application/pdf,image/*"
                      style={{ display: "none" }}
                      onChange={e => {
                        Array.from(e.target.files || []).forEach(file => {
                          const reader = new FileReader();
                          reader.onload = ev => {
                            if (ev.target?.result) setAttachments(prev => [...prev, { name: file.name, url: ev.target!.result as string }]);
                          };
                          reader.readAsDataURL(file);
                        });
                        e.target.value = "";
                      }}
                    />
                    <button type="button" className="ws-btn-secondary" style={{ width: "100%", padding: "10px 14px", fontSize: 13 }} onClick={() => fileInputRef.current?.click()}>
                      <FileText size={14} /> Click to attach files (PDF/Images)
                    </button>
                    {attachments.length > 0 && (
                      <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {attachments.map((att, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 12px", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 8 }}>
                            <FileText size={12} style={{ color: "#818cf8" }} />
                            <span style={{ fontSize: 12, color: "#c4b5fd" }}>{att.name}</span>
                            <button type="button" onClick={() => setAttachments(attachments.filter((_, j) => j !== i))} style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", padding: "0 2px" }}>✕</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                    <button type="button" className="ws-btn-secondary" onClick={() => setShowCreateTask(false)}>Cancel</button>
                    <button type="submit" className="ws-btn-primary" disabled={taskLoading}>
                      {taskLoading ? <><Loader2 size={16} className="animate-spin" /> Deploying...</> : <><Sparkles size={16} /> Deploy Task</>}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Filters */}
            <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
                <Search size={15} style={{ position: "absolute", left: 12, top: 12, color: "#4b5563" }} />
                <input className="ws-input" placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 38 }} />
              </div>
              <select className="ws-input" style={{ width: 150 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="All">All Statuses</option>
                {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <select className="ws-input" style={{ width: 130 }} value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
                <option value="All">All Priorities</option>
                {Object.keys(PRIORITY).map(k => <option key={k} value={k}>{k}</option>)}
              </select>
              <span style={{ fontSize: 11, fontWeight: 700, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "5px 12px", color: "#9ca3af", whiteSpace: "nowrap" }}>
                {filteredTasks.length} tasks
              </span>
            </div>

            {/* Kanban Board */}
            {tasks.length === 0 ? (
              <div className="ws-empty">
                <div className="ws-empty-icon"><ClipboardList size={32} style={{ color: "#6366f1" }} /></div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 8 }}>No Tasks Yet</h3>
                <p style={{ color: "#6b7280", fontSize: 13, maxWidth: 300 }}>Deploy your first task to get teams working.</p>
                <button className="ws-btn-primary" style={{ marginTop: 20 }} onClick={() => setShowCreateTask(true)}><Plus size={16} /> Deploy First Task</button>
              </div>
            ) : (
              <div className="ws-kanban">
                {KANBAN_COLS.map(col => {
                  const colTasks = filteredTasks.filter(t => col.statuses.includes(t.status));
                  return (
                    <div key={col.id} className="ws-kanban-col">
                      <div className="ws-kanban-col-header">
                        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                          <span style={{ fontSize: 14 }}>{col.icon}</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: col.color }}>{col.label}</span>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 800, background: `${col.color}20`, color: col.color, borderRadius: 20, padding: "2px 8px", border: `1px solid ${col.color}40` }}>{colTasks.length}</span>
                      </div>

                      {colTasks.map((task: any) => {
                        const pc = PRIORITY[task.priority] || PRIORITY.Medium;
                        const isOverdue = isPast(new Date(task.deadline)) && task.status !== "Completed";
                        const submissionCount = task.submissions?.length || 0;
                        const memberCount = task.team?.members?.length || 0;
                        const pendingSubs = task.submissions?.filter((s: any) => s.status === "Pending" || s.status === "Under Review").length || 0;

                        return (
                          <div key={task.id} className="ws-task-card" style={{ borderLeft: `3px solid ${pc.color}` }}>
                            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: "#f3f4f6", lineHeight: 1.4, flex: 1 }}>{task.title}</div>
                              <button
                                onClick={() => handleDeleteTask(task.id)}
                                style={{ background: "none", border: "none", cursor: "pointer", color: "#374151", padding: 2, flexShrink: 0, borderRadius: 6 }}
                                onMouseEnter={e => (e.currentTarget.style.color = "#f87171")}
                                onMouseLeave={e => (e.currentTarget.style.color = "#374151")}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>

                            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10 }}>
                              <span className="ws-priority-pill" style={{ color: pc.color, background: pc.bg, borderColor: pc.border }}>
                                {pc.label}
                              </span>
                              {isOverdue && (
                                <span className="ws-priority-pill" style={{ color: "#f87171", background: "rgba(248,113,113,0.1)", borderColor: "rgba(248,113,113,0.3)" }}>
                                  ⚠ Overdue
                                </span>
                              )}
                            </div>

                            <div style={{ display: "flex", gap: 12, fontSize: 11, color: "#4b5563", marginBottom: 10 }}>
                              <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                                <Users size={10} /> {task.team?.name || "Direct"}
                              </span>
                              <span style={{ display: "flex", alignItems: "center", gap: 3, color: isOverdue ? "#f87171" : "#4b5563" }}>
                                <Clock size={10} /> {format(new Date(task.deadline), "MMM d")}
                              </span>
                            </div>

                            {/* Submission progress bar */}
                            {memberCount > 0 && (
                              <div style={{ marginBottom: 10 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#4b5563", marginBottom: 4 }}>
                                  <span>Submissions</span>
                                  <span style={{ color: submissionCount >= memberCount ? "#34d399" : "#f59e0b", fontWeight: 700 }}>{submissionCount}/{memberCount}</span>
                                </div>
                                <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 10, overflow: "hidden" }}>
                                  <div style={{ height: "100%", borderRadius: 10, background: `linear-gradient(90deg, ${submissionCount >= memberCount ? "#34d399" : "#f59e0b"}, ${submissionCount >= memberCount ? "#22c55e" : "#fb923c"})`, width: `${memberCount > 0 ? (submissionCount / memberCount) * 100 : 0}%`, transition: "width 0.3s" }} />
                                </div>
                              </div>
                            )}

                            <div style={{ display: "flex", gap: 6 }}>
                              {pendingSubs > 0 && (
                                <span style={{ fontSize: 10, fontWeight: 800, padding: "2px 7px", borderRadius: 20, background: "rgba(167,139,250,0.15)", color: "#c4b5fd", border: "1px solid rgba(167,139,250,0.3)" }}>
                                  {pendingSubs} to review
                                </span>
                              )}
                              <button
                                onClick={() => setReviewTask(reviewTask?.id === task.id ? null : task)}
                                style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "4px 8px", cursor: "pointer", color: "#9ca3af", marginLeft: "auto", transition: "all 0.15s" }}
                              >
                                <Eye size={11} /> Review
                              </button>
                            </div>
                          </div>
                        );
                      })}

                      {colTasks.length === 0 && (
                        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#374151", fontSize: 12, textAlign: "center", padding: "20px 0" }}>
                          No tasks here
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Review Panel (slides in below kanban) */}
            {reviewTask && (
              <div style={{ marginTop: 24, background: "rgba(0,0,0,0.5)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 20, padding: 24 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 800, color: "#fff", marginBottom: 4 }}>{reviewTask.title}</h3>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>Team Submissions · {reviewTask.submissions?.length || 0} of {reviewTask.team?.members?.length || 0} submitted</div>
                  </div>
                  <button onClick={() => { setReviewTask(null); setReviewAction(null); setFeedback(""); setQualityRating(0); }} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "8px", color: "#9ca3af", cursor: "pointer" }}>
                    <X size={16} />
                  </button>
                </div>

                {!reviewTask.team?.members || reviewTask.team.members.length === 0 ? (
                  <p style={{ color: "#4b5563", fontSize: 13, textAlign: "center", padding: "20px 0" }}>No members in this team.</p>
                ) : (
                  <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
                    {reviewTask.team.members.map((member: any) => {
                      const sub = reviewTask.submissions?.find((s: any) => s.employee?.id === member.id);
                      const sStatus = STATUS[sub?.status] || { label: "Waiting", color: "#374151", bg: "rgba(55,65,81,0.1)" };

                      return (
                        <div key={member.id} style={{ background: "rgba(255,255,255,0.025)", border: `1px solid ${sub ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.05)"}`, borderRadius: 16, padding: 18, opacity: sub ? 1 : 0.6 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                            <div className="ws-avatar">{member.name.charAt(0)}</div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 700, fontSize: 14, color: "#e5e7eb" }}>{member.name}</div>
                              <div style={{ fontSize: 11, color: "#4b5563" }}>{member.employeeCode}</div>
                            </div>
                            <span style={{ fontSize: 10, fontWeight: 800, padding: "3px 9px", borderRadius: 20, background: sub ? sStatus.bg : "rgba(107,114,128,0.1)", color: sub ? sStatus.color : "#6b7280", border: `1px solid ${sub ? sStatus.color + "40" : "rgba(107,114,128,0.2)"}` }}>
                              {sub ? sStatus.label : "Not Submitted"}
                            </span>
                          </div>

                          {sub ? (
                            <div>
                              {sub.summary && (
                                <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 12, padding: "8px 10px", background: "rgba(0,0,0,0.2)", borderRadius: 8, lineHeight: 1.5 }}>{sub.summary}</div>
                              )}
                              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                                {sub.linkResponse && (
                                  <a href={sub.linkResponse} target="_blank" rel="noopener noreferrer" className="ws-btn-secondary" style={{ fontSize: 11, padding: "5px 10px" }}>
                                    <ExternalLink size={11} /> View Link
                                  </a>
                                )}
                                {(() => {
                                  try {
                                    const files = JSON.parse(sub.files || "[]");
                                    return files.map((f: any, i: number) => (
                                      <a key={i} href={f.url} target="_blank" rel="noopener noreferrer" download={f.name} className="ws-btn-secondary" style={{ fontSize: 11, padding: "5px 10px" }}>
                                        <FileText size={11} /> {f.name || `File ${i + 1}`}
                                      </a>
                                    ));
                                  } catch { return null; }
                                })()}
                              </div>

                              {sub.reviewerFeedback && (
                                <div style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: 10, marginBottom: 12 }}>
                                  <div style={{ fontSize: 10, fontWeight: 700, color: "#f59e0b", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>Previous Feedback</div>
                                  <p style={{ fontSize: 12, color: "#d1d5db", margin: 0 }}>{sub.reviewerFeedback}</p>
                                </div>
                              )}

                              {(sub.status === "Pending" || sub.status === "Under Review") && (
                                reviewAction?.submissionId === sub.id ? (
                                  <div className="ws-review-panel">
                                    <div style={{ fontWeight: 700, fontSize: 13, color: "#fff" }}>
                                      {reviewAction?.action === "approve" ? "✅ Approving Submission" : "🔄 Requesting Revisions"}
                                    </div>

                                    {reviewAction?.action === "approve" && (
                                      <div>
                                        <label className="ws-label">Quality Rating (bonus points)</label>
                                        <div style={{ display: "flex", gap: 4 }}>
                                          {[1, 2, 3, 4, 5].map(star => (
                                            <button key={star} type="button" className="ws-star" onClick={() => setQualityRating(star === qualityRating ? 0 : star)}>
                                              <Star size={22} fill={star <= qualityRating ? "#f59e0b" : "none"} color={star <= qualityRating ? "#f59e0b" : "#374151"} />
                                            </button>
                                          ))}
                                          {qualityRating > 0 && <span style={{ fontSize: 12, color: "#f59e0b", alignSelf: "center", fontWeight: 700 }}>+{qualityRating * 5} pts</span>}
                                        </div>
                                      </div>
                                    )}

                                    <div>
                                      <label className="ws-label" style={{ color: reviewAction?.action === "request_changes" ? "#f59e0b" : "#6b7280" }}>
                                        {reviewAction?.action === "approve" ? "Optional Feedback" : "Required Feedback ✱"}
                                      </label>
                                      <textarea className="ws-input" rows={3} value={feedback} onChange={e => setFeedback(e.target.value)}
                                        placeholder={reviewAction?.action === "approve" ? "Great work! Specific notes..." : "What needs to be changed and why..."} style={{ resize: "vertical" }} />
                                    </div>

                                    <div style={{ display: "flex", gap: 8 }}>
                                      <button className="ws-btn-secondary" style={{ flex: 1, padding: "9px" }} onClick={() => setReviewAction(null)}>Cancel</button>
                                      <button
                                        className="ws-btn-primary"
                                        style={{ flex: 2, padding: "9px", background: reviewAction?.action === "approve" ? "linear-gradient(135deg, #22c55e, #16a34a)" : "linear-gradient(135deg, #f59e0b, #d97706)" }}
                                        onClick={handleReview}
                                        disabled={taskLoading || (reviewAction?.action === "request_changes" && !feedback.trim())}
                                      >
                                        {taskLoading ? <Loader2 size={14} className="animate-spin" /> : reviewAction?.action === "approve" ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                                        {reviewAction?.action === "approve" ? "Approve & Award Points" : "Request Revisions"}
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div style={{ display: "flex", gap: 8 }}>
                                    <button
                                      onClick={() => { setReviewAction({ submissionId: sub.id, action: "approve" }); setFeedback(""); setQualityRating(0); }}
                                      style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 10, color: "#34d399", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                                    >
                                      <CheckCircle size={13} /> Approve
                                    </button>
                                    <button
                                      onClick={() => { setReviewAction({ submissionId: sub.id, action: "request_changes" }); setFeedback(""); setQualityRating(0); }}
                                      style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px", background: "rgba(251,146,60,0.1)", border: "1px solid rgba(251,146,60,0.3)", borderRadius: 10, color: "#fb923c", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                                    >
                                      <AlertTriangle size={13} /> Revisions
                                    </button>
                                  </div>
                                )
                              )}
                            </div>
                          ) : (
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 60, color: "#374151", fontSize: 12, background: "rgba(0,0,0,0.2)", borderRadius: 10 }}>
                              Awaiting submission
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── LEAVE TAB ───────────────────────────────────────────────────── */}
        {activeTab === "leave" && (
          <div className="ws-fade">
            <CompanyLeaveClient initialLeaves={initialLeaves} hideHeader />
          </div>
        )}
      </div>

      {/* ── CREATE TEAM MODAL ────────────────────────────────────────────── */}
      {showCreate && (
        <div className="ws-modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="ws-modal" onClick={e => e.stopPropagation()}>
            <div className="ws-modal-header">
              <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(99,102,241,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Users size={20} style={{ color: "#818cf8" }} />
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: 17, fontWeight: 800, color: "#fff", margin: 0 }}>Create New Team</h2>
                <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>Give your team a strong, memorable name.</p>
              </div>
              <button onClick={() => setShowCreate(false)} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "7px", color: "#6b7280", cursor: "pointer" }}>
                <X size={16} />
              </button>
            </div>
            <div className="ws-modal-body" style={{ padding: "22px 26px" }}>
              <div>
                <label className="ws-label ws-label-req">Team Name</label>
                <input
                  className="ws-input"
                  value={newTeamName}
                  onChange={e => setNewTeamName(e.target.value)}
                  placeholder="e.g. Red Team Alpha, OSINT Unit, Pentest Squad..."
                  onKeyDown={e => e.key === "Enter" && createTeam()}
                  autoFocus
                />
              </div>
            </div>
            <div className="ws-modal-footer">
              <button className="ws-btn-secondary" style={{ flex: 1 }} onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="ws-btn-primary" style={{ flex: 2 }} onClick={createTeam} disabled={loading || !newTeamName.trim()}>
                {loading ? <><Loader2 size={16} className="animate-spin" /> Creating...</> : <><Shield size={16} /> Create Team</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ADD MEMBER MODAL ─────────────────────────────────────────────── */}
      {showAddMember && selectedTeam && (
        <div className="ws-modal-overlay" onClick={() => { setShowAddMember(false); setAddMemberId(""); }}>
          <div className="ws-modal" onClick={e => e.stopPropagation()}>
            <div className="ws-modal-header">
              <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(99,102,241,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <UserPlus size={20} style={{ color: "#818cf8" }} />
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: 17, fontWeight: 800, color: "#fff", margin: 0 }}>Add Member to {selectedTeam.name}</h2>
                <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>Assign an employee to this team.</p>
              </div>
              <button onClick={() => { setShowAddMember(false); setAddMemberId(""); }} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "7px", color: "#6b7280", cursor: "pointer" }}>
                <X size={16} />
              </button>
            </div>
            <div className="ws-modal-body" style={{ padding: "22px 26px" }}>
              <div>
                <label className="ws-label ws-label-req">Select Employee</label>
                <select className="ws-input" value={addMemberId} onChange={e => setAddMemberId(e.target.value)}>
                  <option value="">Select an employee...</option>
                  {employees
                    .filter(e => !selectedTeam.members.find(m => m.id === e.id))
                    .map(e => (
                      <option key={e.id} value={e.id}>
                        {e.name} ({e.employeeCode}){e.teamId ? " — already in team" : ""}
                      </option>
                    ))
                  }
                </select>
                {employees.filter(e => !selectedTeam.members.find(m => m.id === e.id)).length === 0 && (
                  <p style={{ fontSize: 12, color: "#6b7280", marginTop: 8 }}>All employees are already in this team.</p>
                )}
              </div>
            </div>
            <div className="ws-modal-footer">
              <button className="ws-btn-secondary" style={{ flex: 1 }} onClick={() => { setShowAddMember(false); setAddMemberId(""); }}>Cancel</button>
              <button className="ws-btn-primary" style={{ flex: 2 }} onClick={() => addMember(selectedTeam.id, addMemberId)} disabled={loading || !addMemberId}>
                {loading ? <><Loader2 size={16} className="animate-spin" /> Adding...</> : <><UserPlus size={16} /> Add to Team</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
