import { useState } from "react";
import { COLORS, AVATARS, api } from "./helpers.js";

export default function LoginScreen({ onJoin, tenant, onLeaveGroup }) {
  const [mode, setMode]         = useState("login"); // "login" | "register"
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [avatar, setAvatar]     = useState(0);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const submit = async () => {
    if (!username.trim() || !password) return;
    setLoading(true); setError("");
    try {
      const u = mode === "login"
        ? await api.loginUser(tenant.id, username.trim(), password)
        : await api.registerUser(tenant.id, username.trim(), password, avatar);
      onJoin(u);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{minHeight:"100vh",background:COLORS.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:"#1e2435",border:"1px solid #2a3050",borderRadius:20,padding:"40px 36px",maxWidth:400,width:"100%",boxShadow:"0 24px 64px rgba(0,0,0,.6)"}}>
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{fontSize:"2.2rem",marginBottom:8}}>⛪</div>
          <h1 style={{color:COLORS.text,fontSize:"1.5rem",fontWeight:600}}>{tenant?.name||"Life Groups Hub"}</h1>
          <p style={{color:COLORS.muted,marginTop:5,fontSize:".88rem"}}>
            {mode==="login" ? "Welcome back — sign in" : "Create your account"}
          </p>
        </div>

        {/* Mode toggle */}
        <div style={{display:"flex",background:COLORS.surface,borderRadius:10,padding:4,marginBottom:22}}>
          {["login","register"].map(m=>(
            <button key={m} onClick={()=>{setMode(m);setError("");}} style={{
              flex:1,padding:"8px 0",borderRadius:8,border:"none",
              background: mode===m ? COLORS.accentSoft : "transparent",
              color: mode===m ? COLORS.accent : COLORS.muted,
              cursor:"pointer",fontFamily:"inherit",fontSize:".9rem",
              fontWeight: mode===m?600:400,transition:"all .12s",
            }}>
              {m==="login" ? "Log In" : "Register"}
            </button>
          ))}
        </div>

        <div style={{marginBottom:14}}>
          <label style={labelStyle}>Username</label>
          <input value={username} onChange={e=>setUsername(e.target.value)}
            placeholder="e.g. alan"
            autoComplete="username"
            style={inp} />
        </div>

        <div style={{marginBottom: mode==="register" ? 18 : (error?10:24)}}>
          <label style={labelStyle}>Password</label>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&submit()}
            placeholder="••••••••"
            autoComplete={mode==="login"?"current-password":"new-password"}
            style={inp} />
        </div>

        {mode==="register" && (
          <div style={{marginBottom: error?10:24}}>
            <label style={labelStyle}>Choose Your Avatar</label>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {AVATARS.map((a,i)=>(
                <button key={i} className={`avatar-btn${avatar===i?" selected":""}`} onClick={()=>setAvatar(i)}>{a}</button>
              ))}
            </div>
          </div>
        )}

        {error && <p style={{color:COLORS.rose,fontSize:".83rem",marginBottom:14}}>{error}</p>}

        <button className="btn-primary" style={{width:"100%",opacity:loading?.6:1}}
          disabled={loading || !username.trim() || !password}
          onClick={submit}>
          {loading ? "Please wait…" : (mode==="login" ? "Log In →" : "Create Account →")}
        </button>

        {onLeaveGroup && (
          <button onClick={onLeaveGroup} style={{
            marginTop:14, width:"100%", background:"transparent", border:"none",
            color:COLORS.muted, fontSize:".82rem", cursor:"pointer", fontFamily:"inherit",
          }}>
            ← Switch group
          </button>
        )}
      </div>
    </div>
  );
}

const labelStyle = {
  color:"#7b82a0", fontSize:".78rem", letterSpacing:".06em",
  textTransform:"uppercase", display:"block", marginBottom:6,
};
const inp = {
  width:"100%", padding:"11px 14px", background:"#181c27",
  border:"1px solid #2a3050", borderRadius:10, color:"#e8eaf6",
  fontSize:"1rem", outline:"none", fontFamily:"inherit",
};
