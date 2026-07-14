"use client";

import { useState } from "react";
import { Send, Loader2, MessageSquare } from "lucide-react";
import { format } from "date-fns";

interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: "admin" | "employee";
  text: string;
  timestamp: string;
}

interface Props {
  taskId: string;
  initialComments: Comment[];
  currentUserId: string;
  currentUserRole: "admin" | "employee";
}

export default function TaskComments({ taskId, initialComments, currentUserId, currentUserRole }: Props) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/tasks/${taskId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to post comment."); return; }
      setComments((prev) => [...prev, data.comment]);
      setText("");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); submit(); }
  };

  return (
    <div className="card" style={{ padding: 20 }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 7 }}>
        <MessageSquare size={15} color="var(--purple)" /> Comments{comments.length > 0 && <span className="badge badge-gray" style={{ fontSize: 11 }}>{comments.length}</span>}
      </h3>

      {/* Thread */}
      <div style={{ display: "grid", gap: 10, marginBottom: comments.length > 0 ? 16 : 0 }}>
        {comments.length === 0 && (
          <p style={{ fontSize: 13, color: "var(--text-muted)", padding: "10px 0" }}>No comments yet. Start the conversation.</p>
        )}
        {comments.map((c) => {
          const isMe = c.authorId === currentUserId;
          const isAdmin = c.authorRole === "admin";
          return (
            <div key={c.id} style={{ display: "flex", gap: 10, alignItems: "flex-start", flexDirection: isMe ? "row-reverse" : "row" }}>
              {/* Avatar */}
              <div style={{
                width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                background: isAdmin ? "rgba(168,85,247,0.15)" : "rgba(59,130,246,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 700,
                color: isAdmin ? "var(--purple)" : "var(--blue)",
              }}>
                {c.authorName.charAt(0).toUpperCase()}
              </div>
              {/* Bubble */}
              <div style={{ maxWidth: "75%" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, flexDirection: isMe ? "row-reverse" : "row" }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>{isMe ? "You" : c.authorName}</span>
                  {isAdmin && !isMe && <span className="badge badge-purple" style={{ fontSize: 9 }}>Admin</span>}
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{format(new Date(c.timestamp), "MMM d, h:mm a")}</span>
                </div>
                <div style={{
                  padding: "10px 14px", borderRadius: 10, fontSize: 13, lineHeight: 1.6,
                  background: isMe ? "rgba(168,85,247,0.12)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${isMe ? "rgba(168,85,247,0.25)" : "var(--border-subtle)"}`,
                  color: "var(--text-secondary)",
                  textAlign: isMe ? "right" : "left",
                }}>
                  {c.text}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
        <textarea
          className="input"
          placeholder="Write a comment… (Ctrl+Enter to send)"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKey}
          style={{ flex: 1, minHeight: 72, resize: "vertical", fontSize: 13 }}
        />
        <button
          className="btn btn-primary"
          style={{ gap: 6, alignSelf: "flex-end", flexShrink: 0 }}
          onClick={submit}
          disabled={loading || !text.trim()}
        >
          {loading ? <Loader2 size={14} className="spin" /> : <Send size={14} />}
          Send
        </button>
      </div>
      {error && <p style={{ color: "var(--red)", fontSize: 12, marginTop: 6 }}>{error}</p>}
    </div>
  );
}
