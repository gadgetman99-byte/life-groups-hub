import { useState } from "react";
import { COLORS, fieldInput, generateId, lsSet, STORAGE_KEYS, formatTime } from "./helpers.js";

const TYPES = {
  announcement: { label: "Announcement",  color: "#6c8eff", icon: "📢" },
  prayer:        { label: "Prayer Request", color: "#a78bfa", icon: "🙏" },
  need:          { label: "Need / Resource", color: "#fbbf24", icon: "🤝" },
  celebration:   { label: "Celebration",    color: "#4ade80", icon: "🎉" },
  reminder:      { label: "Reminder",       color: "#fb7185", icon: "⏰" },
};

const EMOJIS = ["❤️", "🙏", "👍", "🎉", "😮"];

export default function CommsTab({ comms, setComms, user }) {
  const [form, setForm]       = useState({ title: "", body: "", type: "announcement" });
  const [expandedId, setExpandedId] = useState(null);

  const post = () => {
    if (!form.title.trim() || !form.body.trim()) return;
    const updated = [{
      ...form,
      id: generateId(),
      author: user.name,
      avatarIdx: user.avatarIdx,
      at: Date.now(),
      reactions: {},
    }, ...comms];
    setComms(updated);
    lsSet(STORAGE_KEYS.comms, updated);
    setForm({ title: "", body: "", type: "announcement" });
  };

  const react = (id, emoji) => {
    const updated = comms.map(c => {
      if (c.id !== id) return c;
      const reacts = { ...c.reactions };
      if (!reacts[emoji]) reacts[emoji] = [];
      const has = reacts[emoji].includes(user.name);
      reacts[emoji] = has
        ? reacts[emoji].filter(n => n !== user.name)
        : [...reacts[emoji], user.name];
      if (!reacts[emoji].length) delete reacts[emoji];
      return { ...c, reactions: reacts };
    });
    setComms(updated);
    lsSet(STORAGE_KEYS.comms, updated);
  };

  return (
    <div style={{ height: "calc(100vh - 80px)", overflowY: "auto" }}>
      {/* Post form */}
      <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 20, marginBottom: 20 }}>
        <h3 style={{ color: COLORS.text, marginBottom: 14, fontSize: "1rem", fontWeight: 600 }}>📬 Post a Message</h3>
        <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
          <select
            value={form.type}
            onChange={e => setForm({ ...form, type: e.target.value })}
            style={{ ...fieldInput, width: 170 }}
          >
            {Object.entries(TYPES).map(([k, v]) => (
              <option key={k} value={k}>{v.icon} {v.label}</option>
            ))}
          </select>
          <input
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            placeholder="Subject…"
            style={{ ...fieldInput, flex: 1 }}
          />
        </div>
        <textarea
          value={form.body}
          onChange={e => setForm({ ...form, body: e.target.value })}
          placeholder="Write your message…"
          rows={3}
          style={{ ...fieldInput, resize: "vertical", marginBottom: 12 }}
        />
        <button
          className="btn-primary"
          onClick={post}
          disabled={!form.title.trim() || !form.body.trim()}
          style={{ padding: "9px 24px", fontSize: ".9rem" }}
        >
          Post
        </button>
      </div>

      {/* Feed */}
      {comms.map(c => {
        const t = TYPES[c.type] || TYPES.announcement;
        const expanded = expandedId === c.id;
        const isLong = c.body.length > 200;

        return (
          <div key={c.id} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, marginBottom: 12, overflow: "hidden" }}>
            <div style={{ padding: "14px 16px" }}>
              {/* Header row */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span style={{
                  background: t.color + "22", color: t.color,
                  fontSize: ".72rem", padding: "2px 10px", borderRadius: 10,
                  fontWeight: 700, letterSpacing: ".04em",
                }}>
                  {t.icon} {t.label}
                </span>
                <span style={{ color: COLORS.muted, fontSize: ".75rem" }}>{formatTime(c.at)}</span>
                <span style={{ color: COLORS.muted, fontSize: ".75rem", marginLeft: "auto" }}>— {c.author}</span>
              </div>

              {/* Title & body */}
              <h3 style={{ color: COLORS.text, fontSize: "1rem", fontWeight: 600, marginBottom: 6 }}>{c.title}</h3>
              <p style={{
                color: COLORS.muted, fontSize: ".88rem", lineHeight: 1.6,
                maxHeight: expanded ? "none" : "4em",
                overflow: "hidden",
              }}>
                {c.body}
              </p>
              {isLong && (
                <button
                  onClick={() => setExpandedId(expanded ? null : c.id)}
                  style={{ background: "none", border: "none", color: COLORS.accent, cursor: "pointer", fontSize: ".8rem", marginTop: 4, fontFamily: "inherit", padding: 0 }}
                >
                  {expanded ? "Show less" : "Read more"}
                </button>
              )}

              {/* Reactions */}
              <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap", alignItems: "center" }}>
                {EMOJIS.map(e => {
                  const count = (c.reactions[e] || []).length;
                  const hasReacted = (c.reactions[e] || []).includes(user.name);
                  return (
                    <button
                      key={e}
                      onClick={() => react(c.id, e)}
                      style={{
                        background: hasReacted ? COLORS.accentSoft : "transparent",
                        border: `1px solid ${hasReacted ? COLORS.accent : COLORS.border}`,
                        borderRadius: 20,
                        padding: "3px 9px",
                        cursor: "pointer",
                        fontSize: ".8rem",
                        color: COLORS.text,
                        fontFamily: "inherit",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        transition: "all .12s",
                      }}
                    >
                      {e}{count > 0 && <span style={{ fontSize: ".75rem", color: COLORS.muted }}>{count}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}

      {comms.length === 0 && (
        <p style={{ color: COLORS.muted, textAlign: "center", padding: 40 }}>Nothing posted yet</p>
      )}
    </div>
  );
}
