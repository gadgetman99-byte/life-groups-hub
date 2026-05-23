import { useState, useEffect } from "react";
import { COLORS, AVATARS, api } from "./helpers.js";

const isAdminMode = () => new URLSearchParams(window.location.search).get("admin") === "1";

export default function LandingScreen({ onAuthed }) {
  const adminMode = isAdminMode();
  const [mode, setMode] = useState(adminMode ? "admin" : "login");
  return (
    <div style={shell}>
      <div style={card}>
        <div style={{textAlign:"center", marginBottom:26}}>
          <div style={{fontSize:"2.4rem", marginBottom:8}}>⛪</div>
          <h1 style={{color:COLORS.text, fontSize:"1.7rem", fontWeight:600}}>Life Groups Hub</h1>
          <p style={{color:COLORS.muted, marginTop:6, fontSize:".9rem"}}>
            Community calendar &amp; conversation space
          </p>
        </div>

        {/* Mode tabs */}
        <div style={{display:"flex", background:COLORS.surface, borderRadius:10, padding:4, marginBottom:24}}>
          {(adminMode ? ["login","register","admin"] : ["login","register"]).map(m=>(
            <button key={m} onClick={()=>setMode(m)} style={tabBtn(mode===m)}>
              {m==="login" ? "Log In" : m==="register" ? "Register" : "Admin"}
            </button>
          ))}
        </div>

        {mode==="login"    && <LoginForm    onAuthed={onAuthed} />}
        {mode==="register" && <RegisterForm onAuthed={onAuthed} />}
        {mode==="admin"    && <AdminPanel   onAuthed={onAuthed} />}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
function LoginForm({ onAuthed }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [matches, setMatches]   = useState(null); // array of { user, tenant } if multi
  const [pickIdx, setPickIdx]   = useState(0);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const submit = async () => {
    if (!username.trim() || !password) return;
    setLoading(true); setError("");
    try {
      const res = await api.loginUser(username.trim(), password);
      if (res.matches.length === 1) {
        onAuthed(res.matches[0].tenant, res.matches[0].user);
      } else {
        setMatches(res.matches);
      }
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  };

  if (matches && matches.length > 1) {
    return (
      <div>
        <p style={{color:COLORS.muted, fontSize:".9rem", marginBottom:14}}>
          You belong to multiple lifegroups. Choose one:
        </p>
        <select value={pickIdx} onChange={e=>setPickIdx(Number(e.target.value))} style={inp}>
          {matches.map((m,i)=>(<option key={i} value={i}>{m.tenant.name}</option>))}
        </select>
        <button className="btn-primary" style={{width:"100%", marginTop:14}}
          onClick={()=>onAuthed(matches[pickIdx].tenant, matches[pickIdx].user)}>
          Continue →
        </button>
        <button onClick={()=>setMatches(null)} style={linkBtn}>← back</button>
      </div>
    );
  }

  return (
    <>
      <Field label="Username">
        <input value={username} onChange={e=>setUsername(e.target.value)}
          autoComplete="username" placeholder="your username" style={inp}/>
      </Field>
      <Field label="Password" extraMb={error ? 10 : 24}>
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&submit()}
          autoComplete="current-password" placeholder="••••••••" style={inp}/>
      </Field>
      {error && <p style={errorText}>{error}</p>}
      <button className="btn-primary" style={{width:"100%", opacity:loading?.6:1}}
        disabled={loading || !username.trim() || !password} onClick={submit}>
        {loading ? "Please wait…" : "Log In →"}
      </button>
    </>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
function RegisterForm({ onAuthed }) {
  const [tenants, setTenants]   = useState([]);
  const [tenantId, setTenantId] = useState("");
  const [tenantPw, setTenantPw] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [avatar, setAvatar]     = useState(0);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  useEffect(() => {
    api.listTenants().then(rows => {
      setTenants(rows);
      if (rows.length > 0) setTenantId(rows[0].id);
    }).catch(e => setError(e.message));
  }, []);

  const submit = async () => {
    if (!tenantId || !tenantPw || !username.trim() || !password) return;
    setLoading(true); setError("");
    try {
      const res = await api.registerUser(tenantId, tenantPw, username.trim(), password, avatar);
      onAuthed(res.tenant, res.user);
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  };

  if (tenants.length === 0) {
    return <p style={{color:COLORS.muted, fontSize:".88rem", textAlign:"center"}}>
      {error || "Loading lifegroups…"}
    </p>;
  }

  return (
    <>
      <Field label="Lifegroup">
        <select value={tenantId} onChange={e=>setTenantId(e.target.value)} style={inp}>
          {tenants.map(t=>(<option key={t.id} value={t.id}>{t.name}</option>))}
        </select>
      </Field>
      <Field label="Lifegroup Join Code">
        <input type="password" value={tenantPw} onChange={e=>setTenantPw(e.target.value)}
          placeholder="From your group admin" style={inp}/>
      </Field>
      <Field label="Choose a Username">
        <input value={username} onChange={e=>setUsername(e.target.value)}
          autoComplete="username" placeholder="alan" style={inp}/>
      </Field>
      <Field label="Choose a Password">
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&submit()}
          autoComplete="new-password" placeholder="at least 4 characters" style={inp}/>
      </Field>
      <Field label="Choose Your Avatar" extraMb={error ? 10 : 24}>
        <div style={{display:"flex", flexWrap:"wrap", gap:6}}>
          {AVATARS.map((a,i)=>(
            <button key={i} className={`avatar-btn${avatar===i?" selected":""}`} onClick={()=>setAvatar(i)}>{a}</button>
          ))}
        </div>
      </Field>
      {error && <p style={errorText}>{error}</p>}
      <button className="btn-primary" style={{width:"100%", opacity:loading?.6:1}}
        disabled={loading || !tenantId || !tenantPw || !username.trim() || !password}
        onClick={submit}>
        {loading ? "Please wait…" : "Create Account →"}
      </button>
    </>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
function AdminPanel({ onAuthed }) {
  const [adminPw, setAdminPw]   = useState("");
  const [section, setSection]   = useState("create"); // "create" | "users"

  // create group
  const [groupName, setGroupName] = useState("");
  const [groupPw, setGroupPw]   = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [msg, setMsg]           = useState("");

  // manage users
  const [tenants, setTenants]   = useState([]);
  const [pickedTenant, setPickedTenant] = useState("");
  const [users, setUsers]       = useState([]);

  const refreshTenants = async () => {
    try {
      const t = await api.adminListTenants(adminPw);
      setTenants(t);
      if (t.length > 0 && !pickedTenant) setPickedTenant(t[0].id);
    } catch(e) { setError(e.message); }
  };

  const refreshUsers = async () => {
    if (!pickedTenant) return;
    try { setUsers(await api.adminListUsers(pickedTenant, adminPw)); }
    catch(e) { setError(e.message); }
  };

  useEffect(() => { if (section==="users" && adminPw) refreshTenants(); }, [section, adminPw]);
  useEffect(() => { if (section==="users" && pickedTenant) refreshUsers(); }, [section, pickedTenant]);

  const createGroup = async () => {
    if (!adminPw || !groupName || !groupPw) return;
    const slug = groupName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    if (!slug) { setError("Lifegroup name needs at least one letter or number"); return; }
    setLoading(true); setError(""); setMsg("");
    try {
      const t = await api.createTenant(groupName, slug, groupPw, adminPw);
      setMsg(`Created "${t.name}". Share the join code with members.`);
      setGroupName(""); setGroupPw("");
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const deleteUser = async (id, username) => {
    if (!confirm(`Remove ${username} from this lifegroup?`)) return;
    try {
      await api.adminDeleteUser(id, adminPw);
      setUsers(users.filter(u=>u.id!==id));
    } catch(e) { setError(e.message); }
  };

  return (
    <>
      <Field label="Admin Password">
        <input type="password" value={adminPw} onChange={e=>setAdminPw(e.target.value)}
          placeholder="••••••••" style={inp}/>
      </Field>

      <div style={{display:"flex", gap:6, marginBottom:18}}>
        {["create","users"].map(s=>(
          <button key={s} onClick={()=>{setSection(s); setError(""); setMsg("");}} style={{
            flex:1, padding:"6px 0", borderRadius:8, border:`1px solid ${COLORS.border}`,
            background: section===s ? COLORS.accentSoft : "transparent",
            color: section===s ? COLORS.accent : COLORS.muted,
            cursor:"pointer", fontFamily:"inherit", fontSize:".82rem",
          }}>
            {s==="create" ? "Create Lifegroup" : "Manage Users"}
          </button>
        ))}
      </div>

      {section==="create" && (
        <>
          <Field label="Lifegroup Name">
            <input value={groupName} onChange={e=>setGroupName(e.target.value)}
              placeholder="SRC Friday Lifegroup" style={inp}/>
          </Field>
          <Field label="Join Code (share with members)" extraMb={error||msg ? 10 : 18}>
            <input type="password" value={groupPw} onChange={e=>setGroupPw(e.target.value)}
              placeholder="••••••••" style={inp}/>
          </Field>
          {error && <p style={errorText}>{error}</p>}
          {msg && <p style={{color:COLORS.green, fontSize:".83rem", marginBottom:14}}>{msg}</p>}
          <button className="btn-primary" style={{width:"100%", opacity:loading?.6:1}}
            disabled={loading || !adminPw || !groupName || !groupPw}
            onClick={createGroup}>
            {loading ? "Creating…" : "Create Lifegroup"}
          </button>
        </>
      )}

      {section==="users" && (
        <>
          {tenants.length === 0 && <p style={{color:COLORS.muted, fontSize:".88rem"}}>
            Enter admin password above, then a list of lifegroups will appear.
          </p>}
          {tenants.length > 0 && (
            <>
              <Field label="Lifegroup">
                <select value={pickedTenant} onChange={e=>setPickedTenant(e.target.value)} style={inp}>
                  {tenants.map(t=>(<option key={t.id} value={t.id}>{t.name}</option>))}
                </select>
              </Field>
              {users.length === 0 ? (
                <p style={{color:COLORS.muted, fontSize:".88rem"}}>No users in this lifegroup.</p>
              ) : (
                <div>
                  {users.map(u=>(
                    <div key={u.id} style={{
                      display:"flex", alignItems:"center", justifyContent:"space-between",
                      padding:"8px 10px", marginBottom:6, background:COLORS.surface,
                      border:`1px solid ${COLORS.border}`, borderRadius:8,
                    }}>
                      <span style={{color:COLORS.text, fontSize:".9rem"}}>
                        {AVATARS[u.avatarIdx]} {u.name}
                      </span>
                      <button onClick={()=>deleteUser(u.id, u.name)} style={{
                        background:"transparent", border:`1px solid ${COLORS.rose}`,
                        color:COLORS.rose, borderRadius:6, padding:"3px 9px",
                        fontSize:".75rem", cursor:"pointer", fontFamily:"inherit",
                      }}>Remove</button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
          {error && <p style={errorText}>{error}</p>}
        </>
      )}
    </>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
function Field({ label, children, extraMb }) {
  return (
    <div style={{marginBottom: extraMb ?? 14}}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

const shell = {
  minHeight:"100vh", background:COLORS.bg,
  display:"flex", alignItems:"center", justifyContent:"center", padding:20,
};
const card = {
  background:"#1e2435", border:"1px solid #2a3050", borderRadius:20,
  padding:"40px 36px", maxWidth:440, width:"100%",
  boxShadow:"0 24px 64px rgba(0,0,0,.6)",
};
const tabBtn = (active) => ({
  flex:1, padding:"8px 0", borderRadius:8, border:"none",
  background: active ? COLORS.accentSoft : "transparent",
  color: active ? COLORS.accent : COLORS.muted,
  cursor:"pointer", fontFamily:"inherit", fontSize:".9rem",
  fontWeight: active ? 600 : 400, transition:"all .12s",
});
const labelStyle = {
  color:"#7b82a0", fontSize:".78rem", letterSpacing:".06em",
  textTransform:"uppercase", display:"block", marginBottom:6,
};
const inp = {
  width:"100%", padding:"11px 14px", background:"#181c27",
  border:"1px solid #2a3050", borderRadius:10, color:"#e8eaf6",
  fontSize:"1rem", outline:"none", fontFamily:"inherit",
};
const errorText = { color:"#fb7185", fontSize:".83rem", marginBottom:14 };
const linkBtn = {
  marginTop:14, width:"100%", background:"transparent", border:"none",
  color:"#7b82a0", fontSize:".82rem", cursor:"pointer", fontFamily:"inherit",
};
