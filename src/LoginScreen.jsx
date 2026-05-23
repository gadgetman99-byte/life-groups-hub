import { useState } from "react";
import { COLORS, AVATARS } from "./helpers.js";

export default function LoginScreen({ onJoin, tenant }) {
  const [name, setName]     = useState("");
  const [avatar, setAvatar] = useState(0);

  return (
    <div style={{minHeight:"100vh",background:COLORS.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:"#1e2435",border:"1px solid #2a3050",borderRadius:20,padding:"40px 36px",maxWidth:400,width:"100%",boxShadow:"0 24px 64px rgba(0,0,0,.6)"}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{fontSize:"2.2rem",marginBottom:8}}>⛪</div>
          <h1 style={{color:COLORS.text,fontSize:"1.6rem",fontWeight:600}}>{tenant?.name||"Life Groups Hub"}</h1>
          <p style={{color:COLORS.muted,marginTop:5,fontSize:".9rem"}}>Who are you?</p>
        </div>
        <div style={{marginBottom:18}}>
          <label style={{color:COLORS.muted,fontSize:".78rem",letterSpacing:".06em",textTransform:"uppercase",display:"block",marginBottom:6}}>Your Name</label>
          <input value={name} onChange={e=>setName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&name.trim()&&onJoin(name.trim(),avatar)}
            placeholder="Enter your name…"
            style={{width:"100%",padding:"11px 14px",background:COLORS.surface,border:"1px solid #2a3050",borderRadius:10,color:COLORS.text,fontSize:"1rem",outline:"none",fontFamily:"inherit"}}/>
        </div>
        <div style={{marginBottom:28}}>
          <label style={{color:COLORS.muted,fontSize:".78rem",letterSpacing:".06em",textTransform:"uppercase",display:"block",marginBottom:8}}>Choose Your Avatar</label>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {AVATARS.map((a,i)=>(
              <button key={i} className={`avatar-btn${avatar===i?" selected":""}`} onClick={()=>setAvatar(i)}>{a}</button>
            ))}
          </div>
        </div>
        <button className="btn-primary" style={{width:"100%"}} disabled={!name.trim()} onClick={()=>onJoin(name.trim(),avatar)}>
          Join →
        </button>
      </div>
    </div>
  );
}
