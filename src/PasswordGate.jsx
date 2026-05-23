import { useState } from "react";
import { COLORS } from "./helpers.js";
import config from "./config.js";

export default function PasswordGate({ onUnlock }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [shaking, setShaking] = useState(false);

  const attempt = () => {
    if (password === config.groupPassword) {
      onUnlock();
    } else {
      setError(true);
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
      setPassword("");
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: COLORS.bg,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
    }}>
      <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20%      { transform: translateX(-8px); }
          40%      { transform: translateX(8px); }
          60%      { transform: translateX(-5px); }
          80%      { transform: translateX(5px); }
        }
        .shaking { animation: shake 0.45s ease; }
        .gate-card {
          background: #1e2435;
          border: 1px solid #2a3050;
          border-radius: 20px;
          padding: 48px 44px;
          max-width: 400px;
          width: 100%;
          box-shadow: 0 24px 64px rgba(0,0,0,.6);
          text-align: center;
        }
        .gate-input {
          width: 100%;
          padding: 13px 18px;
          background: #181c27;
          border: 1px solid #2a3050;
          border-radius: 10px;
          color: #e8eaf6;
          font-size: 1.1rem;
          font-family: 'Crimson Pro', Georgia, serif;
          outline: none;
          letter-spacing: .12em;
          text-align: center;
          transition: border-color .15s;
          margin-bottom: 6px;
        }
        .gate-input:focus { border-color: #6c8eff; }
        .gate-input.error { border-color: #fb7185; }
      `}</style>

      <div className={`gate-card${shaking ? " shaking" : ""}`}>
        <div style={{ fontSize: "2.8rem", marginBottom: 14 }}>{config.groupIcon}</div>
        <h1 style={{ color: COLORS.text, fontSize: "1.75rem", fontWeight: 600, marginBottom: 8 }}>
          {config.groupName}
        </h1>
        <p style={{ color: COLORS.muted, fontSize: ".95rem", marginBottom: 36 }}>
          {config.groupSubtitle}
        </p>

        <label style={{ color: COLORS.muted, fontSize: ".78rem", letterSpacing: ".08em", textTransform: "uppercase", display: "block", marginBottom: 10 }}>
          Group Password
        </label>
        <input
          type="password"
          className={`gate-input${error ? " error" : ""}`}
          value={password}
          onChange={e => { setPassword(e.target.value); setError(false); }}
          onKeyDown={e => e.key === "Enter" && attempt()}
          placeholder="••••••••••••"
          autoFocus
        />
        {error && (
          <p style={{ color: COLORS.rose, fontSize: ".82rem", marginBottom: 12 }}>
            Incorrect password — try again
          </p>
        )}
        {!error && <div style={{ height: 18 }} />}

        <button
          className="btn-primary"
          style={{ width: "100%", marginTop: 4 }}
          disabled={!password}
          onClick={attempt}
        >
          Enter →
        </button>

        <p style={{ color: COLORS.subtle, fontSize: ".75rem", marginTop: 24 }}>
          Ask your group leader for the password
        </p>
      </div>
    </div>
  );
}
