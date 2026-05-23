import { useState, useEffect, useRef } from "react";
import { COLORS, AVATARS, AVATAR_BG, fieldInput, generateId, lsSet, STORAGE_KEYS, formatTime } from "./helpers.js";

export default function ChatTab({ messages, setMessages, user }) {
  const [text, setText] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = () => {
    if (!text.trim()) return;
    const updated = [...messages, {
      id: generateId(),
      text: text.trim(),
      author: user.name,
      avatarIdx: user.avatarIdx,
      at: Date.now(),
    }];
    setMessages(updated);
    lsSet(STORAGE_KEYS.messages, updated);
    setText("");
  };

  const isMe = (author) => author === user.name;

  const grouped = messages.map((m, i) => {
    const prev = messages[i - 1];
    const sameAuthor = prev && prev.author === m.author && m.at - prev.at < 300000;
    return { ...m, sameAuthor };
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 80px)" }}>
      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 8 }}>
        {grouped.map(m => (
          <div
            key={m.id}
            style={{
              display: "flex",
              flexDirection: isMe(m.author) ? "row-reverse" : "row",
              alignItems: "flex-end",
              gap: 8,
              marginBottom: m.sameAuthor ? 4 : 14,
              paddingLeft:  isMe(m.author) ? 40 : 0,
              paddingRight: isMe(m.author) ? 0  : 40,
            }}
          >
            {/* Avatar */}
            {!isMe(m.author) && !m.sameAuthor && (
              <div style={{
                width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1.2rem",
                background: AVATAR_BG[m.avatarIdx % AVATAR_BG.length],
              }}>
                {AVATARS[m.avatarIdx]}
              </div>
            )}
            {!isMe(m.author) && m.sameAuthor && <div style={{ width: 34, flexShrink: 0 }} />}

            <div>
              {!m.sameAuthor && (
                <div style={{
                  color: COLORS.muted, fontSize: ".73rem", marginBottom: 3,
                  textAlign: isMe(m.author) ? "right" : "left",
                  paddingLeft: isMe(m.author) ? 0 : 4,
                }}>
                  {!isMe(m.author) && <span style={{ color: COLORS.accent, fontWeight: 600 }}>{m.author} </span>}
                  {formatTime(m.at)}
                </div>
              )}
              <div style={{
                background: isMe(m.author)
                  ? "linear-gradient(135deg,#6c8eff,#a78bfa)"
                  : COLORS.card,
                border: isMe(m.author) ? "none" : `1px solid ${COLORS.border}`,
                borderRadius: 12,
                borderBottomRightRadius: isMe(m.author) ? 4 : 12,
                borderBottomLeftRadius:  isMe(m.author) ? 12 : 4,
                padding: "9px 14px",
                color: COLORS.text,
                fontSize: ".9rem",
                maxWidth: 420,
                lineHeight: 1.5,
                wordBreak: "break-word",
              }}>
                {m.text}
              </div>
            </div>
          </div>
        ))}

        {messages.length === 0 && (
          <div style={{ textAlign: "center", color: COLORS.muted, padding: 60 }}>
            <div style={{ fontSize: "2rem", marginBottom: 8 }}>👋</div>
            <p>No messages yet — say hello!</p>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ display: "flex", gap: 10, paddingTop: 12, borderTop: `1px solid ${COLORS.border}` }}>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Type a message…"
          style={{ ...fieldInput, flex: 1, padding: "11px 16px" }}
        />
        <button className="btn-primary" onClick={send} disabled={!text.trim()} style={{ padding: "11px 20px" }}>
          Send
        </button>
      </div>
    </div>
  );
}
