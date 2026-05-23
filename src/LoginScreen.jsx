import { useState } from "react";
import { COLORS, AVATARS } from "./helpers.js";
import config from "./config.js";

export default function LoginScreen({ onJoin }) {
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState(0);

  return (
    <div style={{
      minHeight: "100vh",
      background: COLORS.bg,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
    }}>
      <div style={{
        background: "#1e2435",
        border: "1px solid #2a3050",
        borderRadius: 20,
        padding: "48px 44px",
        maxWidth: 440,
        width: "100%",
        boxShadow: "0 24px 64px rgba(0,0,0,.6)",
      }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: "2.6rem", marginBottom: 12 }}>{config.groupIcon}</div>
          <h1 style={{ color: COLORS.text, fontSize: "1.9rem", fontWeight: 600, letterSpacing: ".01em" }}>
            {config.groupName}
          </h1>
          <p style={{ color: COLORS.muted, marginTop: 6, fontSize: "1rem" }}>
            {config.groupSubtitle}
          </p>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ color: COLORS.muted, fontSize: ".82rem", letterSpacing: ".08em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>
            Your Name
          </label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && name.trim() && onJoin(name.trim(), avatar)}
            placeholder="Enter your name…"
            style={{
              width: "100%",
              padding: "12px 16px",
              background: COLORS.surface,
              border: "1px solid #2a3050",
              borderRadius: 10,
              color: COLORS.text,
              fontSize: "1rem",
              outline: "none",
              fontFamily: "inherit",
            }}
          />
        </div>

        <div style={{ marginBottom: 32 }}>
          <label style={{ color: COLORS.muted, fontSize: ".82rem", letterSpacing: ".08em", textTransform: "uppercase", display: "block", marginBottom: 10 }}>
            Choose Your Avatar
          </label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {AVATARS.map((a, i) => (
              <button
                key={i}
                className={`avatar-btn${avatar === i ? " selected" : ""}`}
                onClick={() => setAvatar(i)}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        <button
          className="btn-primary"
          style={{ width: "100%" }}
          disabled={!name.trim()}
          onClick={() => onJoin(name.trim(), avatar)}
        >
          Join the Group →
        </button>
      </div>
    </div>
  );
}
