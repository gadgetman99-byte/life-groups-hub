import { useState, useEffect, useRef, useCallback } from "react";
import { COLORS, AVATARS, AVATAR_BG, api } from "./helpers.js";
import LandingScreen from "./LandingScreen.jsx";
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

const TENANT_KEY = "lg_tenant"; // localStorage — persists across sessions
const USER_KEY   = "lg_user";   // localStorage — stay logged in until Logout

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
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletePw, setDeletePw] = useState("");
  const [deleteError, setDeleteError] = useState("");
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
    const msgInterval = setInterval(pollMessages, 5000);
    const fullInterval = setInterval(loadAll, 15000);
    return () => {
      clearInterval(msgInterval);
      clearInterval(fullInterval);
    };
  }, [tenant, user, loadAll, pollMessages]);

  const handleAuthed = (t, u) => {
    localStorage.setItem(TENANT_KEY, JSON.stringify(t));
    localStorage.setItem(USER_KEY,   JSON.stringify(u));
    setTenant(t);
    setUser(u);
  };

  const handleLogout = () => {
    localStorage.removeItem(TENANT_KEY);
    localStorage.removeItem(USER_KEY);
    setTenant(null);
    setUser(null);
    setEvents([]); setIdeas([]); setMessages([]); setComms([]);
    setMenuOpen(false);
  };

  const handleDeleteAccount = async () => {
    if (!deletePw) return;
    setDeleteError("");
    try {
      await api.deleteSelf(user.id, deletePw);
      handleLogout();
    } catch(e) { setDeleteError(e.message); }
  };

  if (!tenant || !user) return <LandingScreen onAuthed={handleAuthed} />;

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

        {/* User + menu */}
        <div style={{display:"flex", alignItems:"center", gap:6, flexShrink:0, position:"relative"}}>
          <button onClick={()=>setMenuOpen(o=>!o)} style={{
            display:"flex", alignItems:"center", gap:6, background:"transparent",
            border:`1px solid ${COLORS.border}`, borderRadius:8, padding:"3px 8px",
            cursor:"pointer", fontFamily:"inherit",
          }}>
            <div style={{
              width:24, height:24, borderRadius:6,
              display:"flex", alignItems:"center", justifyContent:"center",
              background:AVATAR_BG[user.avatarIdx % AVATAR_BG.length], fontSize:".9rem",
            }}>{AVATARS[user.avatarIdx]}</div>
            <span style={{color:COLORS.muted, fontSize:".8rem", maxWidth:80, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>
              {user.name}
            </span>
            <span style={{color:COLORS.muted, fontSize:".7rem"}}>▾</span>
          </button>
          {menuOpen && (
            <div style={{
              position:"absolute", top:42, right:0, minWidth:180,
              background:COLORS.card, border:`1px solid ${COLORS.border}`,
              borderRadius:10, padding:6, zIndex:60,
              boxShadow:"0 16px 36px rgba(0,0,0,.5)",
            }}>
              <button onClick={handleLogout} style={menuItem}>↩ Log out</button>
              <button onClick={()=>{setDeleting(true); setMenuOpen(false);}} style={{...menuItem, color:COLORS.rose}}>
                ✕ Delete my account
              </button>
            </div>
          )}
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

      {/* Delete account modal */}
      {deleting && (
        <div style={overlay} onClick={()=>setDeleting(false)}>
          <div style={modalBox} onClick={e=>e.stopPropagation()}>
            <h3 style={{color:COLORS.text, marginBottom:10}}>Delete your account?</h3>
            <p style={{color:COLORS.muted, fontSize:".88rem", marginBottom:14}}>
              This removes your user from <strong>{tenant.name}</strong> permanently.
              Your posts and comments will remain but be attributed to your past name.
            </p>
            <input type="password" value={deletePw} onChange={e=>setDeletePw(e.target.value)}
              placeholder="Confirm your password" style={inp} />
            {deleteError && <p style={{color:COLORS.rose, fontSize:".83rem", marginTop:10}}>{deleteError}</p>}
            <div style={{display:"flex", gap:10, marginTop:18}}>
              <button onClick={()=>{setDeleting(false); setDeletePw(""); setDeleteError("");}}
                style={{flex:1, padding:"10px", background:"transparent", border:`1px solid ${COLORS.border}`,
                  borderRadius:8, color:COLORS.text, cursor:"pointer", fontFamily:"inherit"}}>
                Cancel
              </button>
              <button onClick={handleDeleteAccount} disabled={!deletePw}
                style={{flex:1, padding:"10px", background:COLORS.rose, border:"none",
                  borderRadius:8, color:"#fff", cursor:"pointer", fontFamily:"inherit",
                  opacity: deletePw ? 1 : .5}}>
                Delete account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const menuItem = {
  display:"block", width:"100%", textAlign:"left", padding:"7px 12px",
  background:"transparent", border:"none", color:"#e8eaf6",
  cursor:"pointer", fontFamily:"inherit", fontSize:".88rem", borderRadius:6,
};
const overlay = {
  position:"fixed", inset:0, background:"rgba(0,0,0,.72)",
  backdropFilter:"blur(4px)", display:"flex", alignItems:"center",
  justifyContent:"center", zIndex:100, padding:20,
};
const modalBox = {
  background:"#1e2435", border:"1px solid #2a3050", borderRadius:16,
  padding:28, width:"100%", maxWidth:420,
  boxShadow:"0 24px 64px rgba(0,0,0,.6)",
};
const inp = {
  width:"100%", padding:"11px 14px", background:"#181c27",
  border:"1px solid #2a3050", borderRadius:10, color:"#e8eaf6",
  fontSize:"1rem", outline:"none", fontFamily:"inherit",
};
