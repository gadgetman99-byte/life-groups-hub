import { useState } from "react";
import { COLORS, fieldInput, fieldLabel, generateId, lsSet, STORAGE_KEYS, formatTime } from "./helpers.js";

const CATS = ["activity", "event", "resource", "improvement", "other"];
const CAT_COLORS = {
  activity:    "#6c8eff",
  event:       "#4ade80",
  resource:    "#fbbf24",
  improvement: "#a78bfa",
  other:       "#7b82a0",
};

export default function IdeasTab({ ideas, setIdeas, user }) {
  const [newIdea, setNewIdea]     = useState({ title: "", description: "", category: "activity" });
  const [showing, setShowing]     = useState("all");
  const [expandedId, setExpandedId] = useState(null);
  const [commentText, setCommentText] = useState({});

  const addIdea = () => {
    if (!newIdea.title.trim()) return;
    const updated = [...ideas, {
      ...newIdea,
      id: generateId(),
      votes: [],
      comments: [],
      createdBy: user.name,
      createdAt: Date.now(),
    }];
    setIdeas(updated);
    lsSet(STORAGE_KEYS.ideas, updated);
    setNewIdea({ title: "", description: "", category: "activity" });
  };

  const vote = (id) => {
    const updated = ideas.map(idea => {
      if (idea.id !== id) return idea;
      const hasVoted = idea.votes.includes(user.name);
      return { ...idea, votes: hasVoted ? idea.votes.filter(v => v !== user.name) : [...idea.votes, user.name] };
    });
    setIdeas(updated);
    lsSet(STORAGE_KEYS.ideas, updated);
  };

  const addComment = (id, text) => {
    if (!text.trim()) return;
    const updated = ideas.map(idea =>
      idea.id !== id ? idea : {
        ...idea,
        comments: [...idea.comments, { id: generateId(), text, author: user.name, at: Date.now() }],
      }
    );
    setIdeas(updated);
    lsSet(STORAGE_KEYS.ideas, updated);
  };

  const filtered = showing === "all" ? ideas : ideas.filter(i => i.category === showing);
  const sorted   = [...filtered].sort((a, b) => b.votes.length - a.votes.length);

  return (
    <div style={{ height: "calc(100vh - 80px)", overflowY: "auto" }}>
      {/* New idea form */}
      <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 20, marginBottom: 20 }}>
        <h3 style={{ color: COLORS.text, marginBottom: 14, fontSize: "1rem", fontWeight: 600 }}>💡 Suggest an Idea</h3>
        <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
          <input
            value={newIdea.title}
            onChange={e => setNewIdea({ ...newIdea, title: e.target.value })}
            placeholder="Idea title…"
            style={{ ...fieldInput, flex: 1 }}
          />
          <select
            value={newIdea.category}
            onChange={e => setNewIdea({ ...newIdea, category: e.target.value })}
            style={{ ...fieldInput, width: 140 }}
          >
            {CATS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <textarea
          value={newIdea.description}
          onChange={e => setNewIdea({ ...newIdea, description: e.target.value })}
          placeholder="Describe your idea…"
          rows={2}
          style={{ ...fieldInput, resize: "vertical", marginBottom: 12 }}
        />
        <button className="btn-primary" onClick={addIdea} disabled={!newIdea.title.trim()} style={{ padding: "9px 24px", fontSize: ".9rem" }}>
          Submit Idea
        </button>
      </div>

      {/* Filter chips */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {["all", ...CATS].map(c => (
          <button
            key={c}
            onClick={() => setShowing(c)}
            style={{
              padding: "5px 14px",
              borderRadius: 20,
              border: "1px solid",
              background: showing === c ? (CAT_COLORS[c] || COLORS.accent) : "transparent",
              borderColor: CAT_COLORS[c] || COLORS.accent,
              color: showing === c ? "#fff" : (CAT_COLORS[c] || COLORS.accent),
              fontSize: ".8rem",
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "all .12s",
            }}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Ideas list */}
      {sorted.map(idea => (
        <div key={idea.id} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, marginBottom: 12, overflow: "hidden" }}>
          <div style={{ padding: "16px 16px 12px", display: "flex", gap: 14 }}>
            {/* Vote */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, minWidth: 44 }}>
              <button
                onClick={() => vote(idea.id)}
                style={{
                  background: idea.votes.includes(user.name) ? COLORS.accent : "transparent",
                  border: `1px solid ${COLORS.accent}`,
                  borderRadius: 8,
                  width: 38, height: 38,
                  cursor: "pointer",
                  color: idea.votes.includes(user.name) ? "#fff" : COLORS.accent,
                  fontSize: ".8rem",
                  transition: "all .12s",
                }}
              >
                ▲
              </button>
              <span style={{ color: COLORS.text, fontWeight: 700, fontSize: ".95rem" }}>{idea.votes.length}</span>
            </div>

            {/* Content */}
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <span style={{
                  background: (CAT_COLORS[idea.category] || COLORS.muted) + "22",
                  color: CAT_COLORS[idea.category] || COLORS.muted,
                  fontSize: ".7rem", padding: "2px 8px", borderRadius: 10, fontWeight: 600, letterSpacing: ".04em",
                }}>
                  {idea.category}
                </span>
                <h4 style={{ color: COLORS.text, fontSize: ".98rem", fontWeight: 600 }}>{idea.title}</h4>
              </div>
              {idea.description && <p style={{ color: COLORS.muted, fontSize: ".85rem", marginBottom: 8, lineHeight: 1.5 }}>{idea.description}</p>}
              <div style={{ color: COLORS.muted, fontSize: ".75rem" }}>by {idea.createdBy} · {formatTime(idea.createdAt)}</div>
            </div>

            {/* Comment toggle */}
            <button
              onClick={() => setExpandedId(expandedId === idea.id ? null : idea.id)}
              style={{
                background: "transparent",
                border: `1px solid ${COLORS.border}`,
                borderRadius: 8,
                color: COLORS.muted,
                cursor: "pointer",
                padding: "6px 10px",
                fontSize: ".8rem",
                alignSelf: "flex-start",
                fontFamily: "inherit",
              }}
            >
              💬 {idea.comments.length}
            </button>
          </div>

          {/* Comments */}
          {expandedId === idea.id && (
            <div style={{ background: COLORS.surface, borderTop: `1px solid ${COLORS.border}`, padding: 14 }}>
              {idea.comments.map(c => (
                <div key={c.id} style={{ marginBottom: 10, paddingLeft: 12, borderLeft: `2px solid ${COLORS.border}` }}>
                  <span style={{ color: COLORS.accent, fontSize: ".8rem", fontWeight: 600 }}>{c.author}</span>
                  <span style={{ color: COLORS.muted, fontSize: ".75rem" }}> · {formatTime(c.at)}</span>
                  <p style={{ color: COLORS.text, fontSize: ".85rem", marginTop: 3 }}>{c.text}</p>
                </div>
              ))}
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <input
                  placeholder="Add a comment…"
                  value={commentText[idea.id] || ""}
                  onChange={e => setCommentText({ ...commentText, [idea.id]: e.target.value })}
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      addComment(idea.id, commentText[idea.id] || "");
                      setCommentText({ ...commentText, [idea.id]: "" });
                    }
                  }}
                  style={{ ...fieldInput, flex: 1, padding: "7px 12px", fontSize: ".85rem" }}
                />
                <button
                  className="btn-primary"
                  style={{ padding: "7px 16px", fontSize: ".82rem" }}
                  onClick={() => {
                    addComment(idea.id, commentText[idea.id] || "");
                    setCommentText({ ...commentText, [idea.id]: "" });
                  }}
                >
                  Post
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
      {sorted.length === 0 && <p style={{ color: COLORS.muted, textAlign: "center", padding: 40 }}>No ideas yet — be the first!</p>}
    </div>
  );
}
