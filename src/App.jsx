import { useState, useEffect, useRef, useCallback } from "react";
import { COLORS, AVATARS, AVATAR_BG, api } from "./helpers.js";
import LandingScreen from "./LandingScreen.jsx";
import LoginScreen   from "./LoginScreen.jsx";
import CalendarTab   from "./CalendarTab.jsx";
import IdeasTab      from "./IdeasTab.jsx";
import ChatTab       from "./ChatTab.jsx";
import CommsTab      from "./CommsTab.jsx";

const TABS = [
  { id:"calendar", label:"Calendar",       icon:"📅" },
  { id:"ideas",    label:"Ideas",          icon:"💡" },
  { id:"chat",     label:"Chat",           icon:"💬" },
  { id:"comms",    label:"Communications", icon:"📢" },
];

const TENANT_KEY = "lg_tenant"; // persisted in localStorage — group membership sticks
const USER_KEY   = "lg_user";   // persisted in localStorage — user account sticks

export default function App() {
  const [tenant, setTenant] = useState(() => {
    try { return JSON.parse(localStorage.getItem(TENANT_KEY)) || null; } catch { return null; }
  });
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem(USER_KEY)) || null; } catch { return null; }
  });

  const [tab,      setTab]      = useState("calendar");
  const [events,   setEvents]   = useState([]);
  const [ideas,    setIdeas]    = useState([]);
  const [messages, setMessages] = useState([]);
  const [comms,    setComms]    = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const pollRef = useRef(null);
  const lastMsgId = useRef(null);

  const loadAll = useCallback(async () => {
    if (!tenant) return;
    try {
      const [e, i, m, c] = await Promise.all([
        api.getEvents(tenant.id),
        api.getIdeas(tenant.id),
        api.getMessages(tenant.id),
        api.getComms(tenant.id),
      ]);
      setEvents(e);
      setIdeas(i);
      setMessages(m);
      setComms(c);
      if (m.length > 0) lastMsgId.current = m[m.length-1].id;
    } catch(e) {
      console.error("poll error:", e);
    }
  }, [tenant]);

  // Poll for new messages every 5s, everything else every 15s
  const pollMessages = useCallback(async () => {
    if (!tenant) return;
    try {
      const newMsgs = await api.getMessages(tenant.id, lastMsgId.current);
      if (newMsgs.length > 0) {
        setMessages(prev => {
          const ids = new Set(prev.map(m => m.id));
          const fresh = newMsgs.filter(m => !ids.has(m.id));
          if (fresh.length === 0) return prev;
          lastMsgId.current = fresh[fresh.length-1].id;
          return [...prev, ...fresh];
        });
      }
    } catch {}
  }, [tenant]);

  useEffect(() => {
    if (!tenant || !user) return;
    setLoading(true);
    loadAll().finally(() => setLoading(false));

    // Poll messages every 5s
    const msgInterval = setInterval(pollMessages, 5000);
    // Poll everything else every 15s
    const fullInterval = setInterval(loadAll, 15000);
    return () => {
      clearInterval(msgInterval);
      clearInterval(fullInterval);
    };
  }, [tenant, user, loadAll, pollMessages]);

  const handleTenantJoined = (t) => {
    localStorage.setItem(TENANT_KEY, JSON.stringify(t));
    setTenant(t);
  };

  const handleUserJoined = (u) => {
    // u is { id, name, username, avatarIdx, tenantId } from /api/users/login or /register
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    setUser(u);
  };

  const handleLeave = () => {
    localStorage.removeItem(USER_KEY);
    setUser(null);
  };

  const handleLeaveGroup = () => {
    localStorage.removeItem(TENANT_KEY);
    localStorage.removeItem(USER_KEY);
    setTenant(null);
    setUser(null);
    setEvents([]); setIdeas([]); setMessages([]); setComms([]);
  };

  if (!tenant) return <LandingScreen onJoined={handleTenantJoined} />;
  if (!user)   return <LoginScreen   onJoin={handleUserJoined} tenant={tenant} onLeaveGroup={handleLeaveGroup} />;

  return (
    <div style={{ background:COLORS.bg, minHeight:"100vh", color:COLORS.text }}>
      {/* Header */}
      <div style={{
        background:COLORS.surface, borderBottom:`1px solid ${COLORS.border}`,
        padding:"0 16px", display:"flex", alignItems:"center",
        height:56, gap:12, position:"sticky", top:0, zIndex:50,
      }}>
        <div style={{display:"flex", alignItems:"center", gap:8, flexShrink:0}}>
          <span style={{fontSize:"1.2rem"}}>⛪</span>
          <div>
            <div style={{color:COLORS.text, fontWeight:600, fontSize:".95rem", lineHeight:1.1}}>
              {tenant.name}
            </div>
            <div style={{color:COLORS.muted, fontSize:".68rem", letterSpacing:".04em"}}>
              /{tenant.slug}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{display:"flex", gap:2, flex:1, overflowX:"auto"}}>
          {TABS.map(t => (
            <button key={t.id} onClick={()=>setTab(t.id)} style={{
              background: tab===t.id ? COLORS.accentSoft : "transparent",
              border:"none", borderRadius:8,
              color: tab===t.id ? COLORS.accent : COLORS.muted,
              padding:"5px 10px", cursor:"pointer", whiteSpace:"nowrap",
              fontSize:".82rem", fontFamily:"'Crimson Pro',Georgia,serif",
              fontWeight: tab===t.id ? 600 : 400, transition:"all .12s",
              display:"flex", alignItems:"center", gap:4,
            }}>
              <span>{t.icon}</span>
              <span style={{display:"none"}} className="tab-label">{t.label}</span>
            </button>
          ))}
        </div>

        {/* User */}
        <div style={{display:"flex", alignItems:"center", gap:6, flexShrink:0}}>
          <div style={{
            width:28, height:28, borderRadius:8, flexShrink:0,
            display:"flex", alignItems:"center", justifyContent:"center",
            background:AVATAR_BG[user.avatarIdx % AVATAR_BG.length], fontSize:"1rem",
          }}>{AVATARS[user.avatarIdx]}</div>
          <span style={{color:COLORS.muted, fontSize:".8rem", maxWidth:70, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>
            {user.name}
          </span>
          <button onClick={handleLeave} title="Switch user" style={smallBtn}>👤</button>
          <button onClick={handleLeaveGroup} title="Leave group" style={smallBtn}>⇐</button>
        </div>
      </div>

      {/* Tab labels below header on wider screens */}
      <style>{`
        @media(min-width:600px){.tab-label{display:inline !important;}}
        @media(min-width:600px){.tab-btn{padding:5px 14px !important;}}
      `}</style>

      {loading && (
        <div style={{textAlign:"center", padding:12, color:COLORS.muted, fontSize:".82rem"}}>
          Loading…
        </div>
      )}

      <div style={{padding:16}}>
        {tab==="calendar" && <CalendarTab events={events} setEvents={setEvents} user={user} tenant={tenant} />}
        {tab==="ideas"    && <IdeasTab    ideas={ideas}   setIdeas={setIdeas}   user={user} tenant={tenant} />}
        {tab==="chat"     && <ChatTab     messages={messages} setMessages={setMessages} user={user} tenant={tenant} />}
        {tab==="comms"    && <CommsTab    comms={comms}   setComms={setComms}   user={user} tenant={tenant} />}
      </div>
    </div>
  );
}

const smallBtn = {
  background:"transparent", border:`1px solid #2a3050`,
  borderRadius:6, color:"#7b82a0", padding:"3px 6px",
  cursor:"pointer", fontSize:".75rem", fontFamily:"inherit",
};
