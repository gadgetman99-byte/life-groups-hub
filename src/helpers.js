import { useEffect, useState } from "react";

export function useIsMobile(maxWidth = 700) {
  const query = `(max-width: ${maxWidth}px)`;
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia(query).matches
  );
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = (e) => setIsMobile(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);
  return isMobile;
}

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

export function formatTime(ts) {
  const d = new Date(ts);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff/60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff/3600000)}h ago`;
  return d.toLocaleDateString();
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2,7);
}

// ── API client ──────────────────────────────────────────────────────────────
const BASE = "/api";

async function req(method, path, body, extraHeaders) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...(extraHeaders || {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export const api = {
  // Tenants
  createTenant: (name, slug, password, adminPassword) =>
    req("POST", "/tenants", { name, slug, password }, { "x-admin-password": adminPassword }),
  listTenants:  ()                     => req("GET", "/tenants/list"),
  adminListTenants: (adminPassword)    => req("GET", "/tenants", null, { "x-admin-password": adminPassword }),
  deleteTenant: (id, adminPassword)    => req("DELETE", `/tenants/${id}`, null, { "x-admin-password": adminPassword }),

  // Users (per-tenant accounts; username uniqueness is per tenant)
  registerUser: (tenant_id, tenant_password, username, password, avatar_idx) =>
    req("POST", "/users/register", { tenant_id, tenant_password, username, password, avatar_idx }),
  loginUser:    (username, password)   => req("POST", "/users/login", { username, password }),
  deleteSelf:   (user_id, password)    => req("DELETE", `/users/${user_id}`, { password }),
  adminListUsers: (tenant_id, adminPassword) =>
    req("GET", `/users?tenant_id=${tenant_id}`, null, { "x-admin-password": adminPassword }),
  adminDeleteUser: (user_id, adminPassword) =>
    req("DELETE", `/users/${user_id}`, null, { "x-admin-password": adminPassword }),

  // Events
  getEvents:    (tenant_id)            => req("GET", `/events?tenant_id=${tenant_id}`),
  createEvent:  (body)                 => req("POST", "/events", body),
  updateEvent:  (id, body)             => req("PUT", `/events/${id}`, body),
  deleteEvent:  (id)                   => req("DELETE", `/events/${id}`),

  // Ideas
  getIdeas:     (tenant_id)            => req("GET", `/ideas?tenant_id=${tenant_id}`),
  createIdea:   (body)                 => req("POST", "/ideas", body),
  voteIdea:     (id, user_name)        => req("POST", `/ideas/${id}/vote`, { user_name }),
  addComment:   (id, author, text)     => req("POST", `/ideas/${id}/comments`, { author, text }),

  // Messages
  getMessages:  (tenant_id, after)     => req("GET", `/messages?tenant_id=${tenant_id}${after ? `&after=${after}` : ""}`),
  sendMessage:  (body)                 => req("POST", "/messages", body),

  // Comms
  getComms:     (tenant_id)            => req("GET", `/comms?tenant_id=${tenant_id}`),
  createComm:   (body)                 => req("POST", "/comms", body),
  reactComm:    (id, emoji, user_name) => req("POST", `/comms/${id}/react`, { emoji, user_name }),
};

export const fieldLabel = {
  color: "#7b82a0", fontSize: ".78rem", letterSpacing: ".06em",
  textTransform: "uppercase", display: "block", marginBottom: 6,
};
export const fieldInput = {
  background: "#181c27", border: "1px solid #2a3050", borderRadius: 8,
  color: "#e8eaf6", fontSize: ".9rem", padding: "9px 12px", outline: "none",
  fontFamily: "'Crimson Pro', Georgia, serif", width: "100%",
};
export const overlay = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,.72)",
  backdropFilter: "blur(4px)", display: "flex", alignItems: "center",
  justifyContent: "center", zIndex: 100, padding: 20,
};
export const modalBox = {
  background: "#1e2435", border: "1px solid #2a3050", borderRadius: 16,
  padding: 28, width: "100%", maxWidth: 480,
  boxShadow: "0 24px 64px rgba(0,0,0,.6)", maxHeight: "90vh", overflowY: "auto",
};
export const closeBtn = {
  background: "transparent", border: "none", color: "#7b82a0",
  fontSize: "1rem", cursor: "pointer", padding: "2px 6px",
};
