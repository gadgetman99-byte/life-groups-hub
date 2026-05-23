export const COLORS = {
  bg: "#0f1117",
  surface: "#181c27",
  card: "#1e2435",
  border: "#2a3050",
  accent: "#6c8eff",
  accentSoft: "#1a2448",
  green: "#4ade80",
  amber: "#fbbf24",
  rose: "#fb7185",
  purple: "#a78bfa",
  text: "#e8eaf6",
  muted: "#7b82a0",
  subtle: "#2e3552",
};

export const AVATARS = ["🦁","🦊","🐻","🦅","🌿","⭐","🌊","🔥","🌙","🦋","🌸","🎯"];
export const AVATAR_BG = ["#1a2448","#2a1a1a","#1a2a1a","#1a1a2a","#2a2a1a","#1a2a2a"];
export const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
export const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
export const EVENT_COLORS = ["#6c8eff","#4ade80","#fbbf24","#fb7185","#a78bfa","#34d399","#f97316"];

export const STORAGE_KEYS = {
  events:   "lg_events",
  ideas:    "lg_ideas",
  messages: "lg_messages",
  comms:    "lg_comms",
};

export function formatTime(ts) {
  const d = new Date(ts);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString();
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// localStorage helpers
export function lsGet(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function lsSet(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {}
}

export const fieldLabel = {
  color: "#7b82a0",
  fontSize: ".78rem",
  letterSpacing: ".06em",
  textTransform: "uppercase",
  display: "block",
  marginBottom: 6,
};

export const fieldInput = {
  background: "#181c27",
  border: "1px solid #2a3050",
  borderRadius: 8,
  color: "#e8eaf6",
  fontSize: ".9rem",
  padding: "9px 12px",
  outline: "none",
  fontFamily: "'Crimson Pro', Georgia, serif",
  width: "100%",
};

export const overlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,.72)",
  backdropFilter: "blur(4px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 100,
  padding: 20,
};

export const modalBox = {
  background: "#1e2435",
  border: "1px solid #2a3050",
  borderRadius: 16,
  padding: 28,
  width: "100%",
  maxWidth: 480,
  boxShadow: "0 24px 64px rgba(0,0,0,.6)",
  maxHeight: "90vh",
  overflowY: "auto",
};

export const closeBtn = {
  background: "transparent",
  border: "none",
  color: "#7b82a0",
  fontSize: "1rem",
  cursor: "pointer",
  padding: "2px 6px",
};
