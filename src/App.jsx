import { useState, useEffect, useCallback } from "react";
import {
  COLORS, AVATARS, AVATAR_BG,
  STORAGE_KEYS, lsGet, lsSet,
} from "./helpers.js";
import PasswordGate  from "./PasswordGate.jsx";
import LoginScreen   from "./LoginScreen.jsx";
import CalendarTab   from "./CalendarTab.jsx";
import IdeasTab      from "./IdeasTab.jsx";
import ChatTab       from "./ChatTab.jsx";
import CommsTab      from "./CommsTab.jsx";
import config        from "./config.js";

const TABS = [
  { id: "calendar", label: "Calendar",       icon: "📅" },
  { id: "ideas",    label: "Ideas",          icon: "💡" },
  { id: "chat",     label: "Chat",           icon: "💬" },
  { id: "comms",    label: "Communications", icon: "📢" },
];

// Session key — password unlock survives page refresh within the same browser tab
const SESSION_KEY = "lg_unlocked";
const USER_KEY    = "lg_user";

export default function App() {
  // Auth states
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(SESSION_KEY) === "1");
  const [user,     setUser]     = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(USER_KEY)) || null; } catch { return null; }
  });

  // Data states — loaded from localStorage
  const [events,   setEvents]   = useState(() => lsGet(STORAGE_KEYS.events,   []));
  const [ideas,    setIdeas]     = useState(() => lsGet(STORAGE_KEYS.ideas,    []));
  const [messages, setMessages]  = useState(() => lsGet(STORAGE_KEYS.messages, []));
  const [comms,    setComms]     = useState(() => lsGet(STORAGE_KEYS.comms,    []));

  const [tab, setTab] = useState("calendar");

  // Re-sync from localStorage when window regains focus (basic multi-tab support)
  const syncFromStorage = useCallback(() => {
    setEvents(lsGet(STORAGE_KEYS.events,   []));
    setIdeas(lsGet(STORAGE_KEYS.ideas,     []));
    setMessages(lsGet(STORAGE_KEYS.messages, []));
    setComms(lsGet(STORAGE_KEYS.comms,     []));
  }, []);

  useEffect(() => {
    window.addEventListener("focus", syncFromStorage);
    // Also poll every 10s for other browsers on the same machine
    const interval = setInterval(syncFromStorage, 10000);
    return () => {
      window.removeEventListener("focus", syncFromStorage);
      clearInterval(interval);
    };
  }, [syncFromStorage]);

  // Persist unlock to sessionStorage
  const handleUnlock = () => {
    sessionStorage.setItem(SESSION_KEY, "1");
    setUnlocked(true);
  };

  // Persist user to sessionStorage
  const handleJoin = (name, avatarIdx) => {
    const u = { name, avatarIdx };
    sessionStorage.setItem(USER_KEY, JSON.stringify(u));
    setUser(u);
  };

  const handleLeave = () => {
    sessionStorage.removeItem(USER_KEY);
    setUser(null);
  };

  // ── Render gates ──────────────────────────────────────────────────────────
  if (!unlocked) return <PasswordGate onUnlock={handleUnlock} />;
  if (!user)     return <LoginScreen  onJoin={handleJoin} />;

  return (
    <div style={{ background: COLORS.bg, minHeight: "100vh", color: COLORS.text }}>
      {/* Header */}
      <div style={{
        background: COLORS.surface,
        borderBottom: `1px solid ${COLORS.border}`,
        padding: "0 20px",
        display: "flex",
        alignItems: "center",
        height: 60,
        gap: 20,
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}>
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginRight: 8 }}>
          <span style={{ fontSize: "1.3rem" }}>{config.groupIcon}</span>
          <span style={{ color: COLORS.text, fontWeight: 600, fontSize: "1.05rem", letterSpacing: ".01em" }}>
            {config.groupName}
          </span>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, flex: 1, flexWrap: "wrap" }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                background: tab === t.id ? COLORS.accentSoft : "transparent",
                border: "none",
                borderRadius: 8,
                color: tab === t.id ? COLORS.accent : COLORS.muted,
                padding: "6px 14px",
                cursor: "pointer",
                fontSize: ".88rem",
                fontFamily: "'Crimson Pro', Georgia, serif",
                fontWeight: tab === t.id ? 600 : 400,
                transition: "all .12s",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* User badge */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: AVATAR_BG[user.avatarIdx % AVATAR_BG.length],
            fontSize: "1.1rem",
          }}>
            {AVATARS[user.avatarIdx]}
          </div>
          <span style={{ color: COLORS.muted, fontSize: ".85rem" }}>{user.name}</span>
          <button
            onClick={handleLeave}
            style={{
              background: "transparent",
              border: `1px solid ${COLORS.border}`,
              borderRadius: 6,
              color: COLORS.muted,
              padding: "3px 8px",
              cursor: "pointer",
              fontSize: ".75rem",
              fontFamily: "inherit",
            }}
          >
            Leave
          </button>
        </div>
      </div>

      {/* Page content */}
      <div style={{ padding: 20 }}>
        {tab === "calendar" && <CalendarTab events={events}   setEvents={setEvents}   user={user} />}
        {tab === "ideas"    && <IdeasTab    ideas={ideas}     setIdeas={setIdeas}     user={user} />}
        {tab === "chat"     && <ChatTab     messages={messages} setMessages={setMessages} user={user} />}
        {tab === "comms"    && <CommsTab    comms={comms}     setComms={setComms}     user={user} />}
      </div>
    </div>
  );
}
