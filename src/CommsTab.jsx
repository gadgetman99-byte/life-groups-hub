import { useState } from "react";
import { COLORS, api, fieldInput, formatTime } from "./helpers.js";

const TYPES = {
  announcement: { label:"Announcement",  color:"#6c8eff", icon:"📢" },
  prayer:        { label:"Prayer Request", color:"#a78bfa", icon:"🙏" },
  need:          { label:"Need / Resource",color:"#fbbf24", icon:"🤝" },
  celebration:   { label:"Celebration",   color:"#4ade80", icon:"🎉" },
  reminder:      { label:"Reminder",      color:"#fb7185", icon:"⏰" },
};
const EMOJIS = ["❤️","🙏","👍","🎉","😮"];

export default function CommsTab({ comms, setComms, user, tenant }) {
  const [form, setForm]       = useState({ title:"", body:"", type:"announcement" });
  const [expandedId, setExpanded] = useState(null);
  const [saving, setSaving]   = useState(false);

  const post = async () => {
    if (!form.title.trim()||!form.body.trim()||saving) return;
    setSaving(true);
    try {
      const created = await api.createComm({ tenant_id:tenant.id, type:form.type, title:form.title, body:form.body, author:user.name, avatar_idx:user.avatarIdx });
      setComms([created, ...comms]);
      setForm({ title:"", body:"", type:"announcement" });
    } catch(e) { alert(e.message); }
    finally { setSaving(false); }
  };

  const react = async (id, emoji) => {
    try {
      await api.reactComm(id, emoji, user.name);
      setComms(comms.map(c=>{
        if (c.id!==id) return c;
        const reacts = { ...c.reactions };
        if (!reacts[emoji]) reacts[emoji]=[];
        const has = reacts[emoji].includes(user.name);
        reacts[emoji] = has ? reacts[emoji].filter(n=>n!==user.name) : [...reacts[emoji], user.name];
        if (!reacts[emoji].length) delete reacts[emoji];
        return { ...c, reactions:reacts };
      }));
    } catch(e) { alert(e.message); }
  };

  return (
    <div style={{height:"calc(100vh - 88px)", overflowY:"auto"}}>
      <div style={{background:COLORS.card, border:`1px solid ${COLORS.border}`, borderRadius:12, padding:16, marginBottom:16}}>
        <h3 style={{color:COLORS.text, marginBottom:12, fontSize:".95rem", fontWeight:600}}>📬 Post a Message</h3>
        <div style={{display:"flex", gap:10, marginBottom:10}}>
          <select value={form.type} onChange={e=>setForm({...form,type:e.target.value})} style={{...fieldInput,width:160}}>
            {Object.entries(TYPES).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}
          </select>
          <input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="Subject…" style={{...fieldInput,flex:1}}/>
        </div>
        <textarea value={form.body} onChange={e=>setForm({...form,body:e.target.value})} placeholder="Write your message…" rows={3} style={{...fieldInput,resize:"vertical",marginBottom:10}}/>
        <button className="btn-primary" onClick={post} disabled={!form.title.trim()||!form.body.trim()||saving} style={{padding:"8px 20px",fontSize:".88rem"}}>
          {saving?"Posting…":"Post"}
        </button>
      </div>

      {comms.map(c=>{
        const t = TYPES[c.type]||TYPES.announcement;
        const expanded = expandedId===c.id;
        return (
          <div key={c.id} style={{background:COLORS.card, border:`1px solid ${COLORS.border}`, borderRadius:10, marginBottom:10}}>
            <div style={{padding:"12px 14px"}}>
              <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:6}}>
                <span style={{background:t.color+"22",color:t.color,fontSize:".7rem",padding:"2px 9px",borderRadius:8,fontWeight:700}}>{t.icon} {t.label}</span>
                <span style={{color:COLORS.muted,fontSize:".72rem"}}>{formatTime(c.created_at)}</span>
                <span style={{color:COLORS.muted,fontSize:".72rem",marginLeft:"auto"}}>— {c.author}</span>
              </div>
              <h3 style={{color:COLORS.text,fontSize:".95rem",fontWeight:600,marginBottom:5}}>{c.title}</h3>
              <p style={{color:COLORS.muted,fontSize:".85rem",lineHeight:1.6,maxHeight:expanded?"none":"3.8em",overflow:"hidden"}}>{c.body}</p>
              {c.body.length>180&&(
                <button onClick={()=>setExpanded(expanded?null:c.id)} style={{background:"none",border:"none",color:COLORS.accent,cursor:"pointer",fontSize:".78rem",marginTop:3,fontFamily:"inherit",padding:0}}>
                  {expanded?"Show less":"Read more"}
                </button>
              )}
              <div style={{display:"flex",gap:5,marginTop:10,flexWrap:"wrap"}}>
                {EMOJIS.map(e=>{
                  const count=(c.reactions[e]||[]).length;
                  const has=(c.reactions[e]||[]).includes(user.name);
                  return (
                    <button key={e} onClick={()=>react(c.id,e)} style={{
                      background:has?COLORS.accentSoft:"transparent",
                      border:`1px solid ${has?COLORS.accent:COLORS.border}`,
                      borderRadius:18,padding:"2px 8px",cursor:"pointer",
                      fontSize:".78rem",color:COLORS.text,fontFamily:"inherit",
                      display:"flex",alignItems:"center",gap:3,transition:"all .12s",
                    }}>
                      {e}{count>0&&<span style={{fontSize:".72rem",color:COLORS.muted}}>{count}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
      {comms.length===0&&<p style={{color:COLORS.muted,textAlign:"center",padding:36}}>Nothing posted yet</p>}
    </div>
  );
}
