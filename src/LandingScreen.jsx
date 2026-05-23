import { useState } from "react";
import { COLORS, api } from "./helpers.js";

export default function LandingScreen({ onJoined }) {
  const [mode, setMode]       = useState("join"); // "join" | "create"
  const [slug, setSlug]       = useState("");
  const [password, setPassword] = useState("");
  const [name, setName]       = useState("");
  const [groupName, setGroupName] = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  const join = async () => {
    if (!slug || !password) return;
    setLoading(true); setError("");
    try {
      const tenant = await api.authTenant(slug.toLowerCase(), password);
      onJoined(tenant);
    } catch(e) {
      setError(e.message);
    } finally { setLoading(false); }
  };

  const create = async () => {
    if (!groupName || !slug || !password) return;
    setLoading(true); setError("");
    try {
      const tenant = await api.createTenant(groupName, slug, password);
      onJoined(tenant);
    } catch(e) {
      setError(e.message);
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight:"100vh", background:COLORS.bg,
      display:"flex", alignItems:"center", justifyContent:"center", padding:20,
    }}>
      <div style={{
        background:"#1e2435", border:"1px solid #2a3050", borderRadius:20,
        padding:"44px 40px", maxWidth:420, width:"100%",
        boxShadow:"0 24px 64px rgba(0,0,0,.6)",
      }}>
        <div style={{textAlign:"center", marginBottom:28}}>
          <div style={{fontSize:"2.6rem", marginBottom:10}}>⛪</div>
          <h1 style={{color:COLORS.text, fontSize:"1.8rem", fontWeight:600}}>Life Groups Hub</h1>
          <p style={{color:COLORS.muted, marginTop:6, fontSize:".95rem"}}>
            Community calendar &amp; conversation space
          </p>
        </div>

        {/* Mode toggle */}
        <div style={{display:"flex", background:COLORS.surface, borderRadius:10, padding:4, marginBottom:24}}>
          {["join","create"].map(m => (
            <button key={m} onClick={()=>{setMode(m);setError("");}} style={{
              flex:1, padding:"8px 0", borderRadius:8, border:"none",
              background: mode===m ? COLORS.accentSoft : "transparent",
              color: mode===m ? COLORS.accent : COLORS.muted,
              cursor:"pointer", fontFamily:"inherit", fontSize:".9rem",
              fontWeight: mode===m ? 600 : 400, transition:"all .12s",
            }}>
              {m==="join" ? "Join a Group" : "Create a Group"}
            </button>
          ))}
        </div>

        {mode === "create" && (
          <div style={{marginBottom:14}}>
            <label style={{color:COLORS.muted, fontSize:".78rem", letterSpacing:".06em", textTransform:"uppercase", display:"block", marginBottom:6}}>
              Group Name
            </label>
            <input value={groupName} onChange={e=>setGroupName(e.target.value)}
              placeholder="Hays Praise Life Group"
              style={inp} />
          </div>
        )}

        <div style={{marginBottom:14}}>
          <label style={{color:COLORS.muted, fontSize:".78rem", letterSpacing:".06em", textTransform:"uppercase", display:"block", marginBottom:6}}>
            Group ID (slug)
          </label>
          <input value={slug} onChange={e=>setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,"-"))}
            placeholder="hays-praise"
            style={inp} />
          {mode==="create" && <p style={{color:COLORS.muted, fontSize:".73rem", marginTop:4}}>
            Members will use this to find your group
          </p>}
        </div>

        <div style={{marginBottom: error ? 10 : 24}}>
          <label style={{color:COLORS.muted, fontSize:".78rem", letterSpacing:".06em", textTransform:"uppercase", display:"block", marginBottom:6}}>
            {mode==="create" ? "Set Group Password" : "Group Password"}
          </label>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&(mode==="join"?join():create())}
            placeholder="••••••••"
            style={inp} />
        </div>

        {error && <p style={{color:COLORS.rose, fontSize:".83rem", marginBottom:14}}>{error}</p>}

        <button className="btn-primary"
          style={{width:"100%", opacity:loading?.6:1}}
          disabled={loading || !slug || !password || (mode==="create"&&!groupName)}
          onClick={mode==="join"?join:create}>
          {loading ? "Please wait…" : mode==="join" ? "Enter Group →" : "Create Group →"}
        </button>
      </div>
    </div>
  );
}

const inp = {
  width:"100%", padding:"11px 14px", background:"#181c27",
  border:"1px solid #2a3050", borderRadius:10, color:"#e8eaf6",
  fontSize:"1rem", outline:"none", fontFamily:"inherit",
};
