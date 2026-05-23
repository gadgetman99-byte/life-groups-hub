import { useState } from "react";
import { COLORS, api, fieldInput, formatTime } from "./helpers.js";

const CATS = ["activity","event","resource","improvement","other"];
const CAT_COLORS = { activity:"#6c8eff", event:"#4ade80", resource:"#fbbf24", improvement:"#a78bfa", other:"#7b82a0" };

export default function IdeasTab({ ideas, setIdeas, user, tenant }) {
  const [form, setForm]           = useState({ title:"", description:"", category:"activity" });
  const [showing, setShowing]     = useState("all");
  const [expandedId, setExpanded] = useState(null);
  const [commentText, setCommentText] = useState({});
  const [saving, setSaving]       = useState(false);

  const addIdea = async () => {
    if (!form.title.trim() || saving) return;
    setSaving(true);
    try {
      const created = await api.createIdea({ tenant_id:tenant.id, title:form.title, description:form.description, category:form.category, created_by:user.name });
      setIdeas([created, ...ideas]);
      setForm({ title:"", description:"", category:"activity" });
    } catch(e) { alert(e.message); }
    finally { setSaving(false); }
  };

  const vote = async (id) => {
    try {
      await api.voteIdea(id, user.name);
      setIdeas(ideas.map(idea => {
        if (idea.id !== id) return idea;
        const hasVoted = idea.votes.includes(user.name);
        return { ...idea, votes: hasVoted ? idea.votes.filter(v=>v!==user.name) : [...idea.votes, user.name] };
      }));
    } catch(e) { alert(e.message); }
  };

  const addComment = async (id) => {
    const text = commentText[id]||"";
    if (!text.trim()) return;
    try {
      const c = await api.addComment(id, user.name, text);
      setIdeas(ideas.map(idea => idea.id!==id ? idea : { ...idea, comments:[...idea.comments, c] }));
      setCommentText({ ...commentText, [id]:"" });
    } catch(e) { alert(e.message); }
  };

  const filtered = showing==="all" ? ideas : ideas.filter(i=>i.category===showing);
  const sorted   = [...filtered].sort((a,b)=>b.votes.length-a.votes.length);

  return (
    <div style={{height:"calc(100vh - 88px)", overflowY:"auto"}}>
      <div style={{background:COLORS.card, border:`1px solid ${COLORS.border}`, borderRadius:12, padding:16, marginBottom:16}}>
        <h3 style={{color:COLORS.text, marginBottom:12, fontSize:".95rem", fontWeight:600}}>💡 Suggest an Idea</h3>
        <div style={{display:"flex", gap:10, marginBottom:10}}>
          <input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="Idea title…" style={{...fieldInput,flex:1}}/>
          <select value={form.category} onChange={e=>setForm({...form,category:e.target.value})} style={{...fieldInput,width:130}}>{CATS.map(c=><option key={c} value={c}>{c}</option>)}</select>
        </div>
        <textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Describe your idea…" rows={2} style={{...fieldInput,resize:"vertical",marginBottom:10}}/>
        <button className="btn-primary" onClick={addIdea} disabled={!form.title.trim()||saving} style={{padding:"8px 20px",fontSize:".88rem"}}>
          {saving?"Posting…":"Submit Idea"}
        </button>
      </div>

      <div style={{display:"flex", gap:6, marginBottom:14, flexWrap:"wrap"}}>
        {["all",...CATS].map(c=>(
          <button key={c} onClick={()=>setShowing(c)} style={{
            padding:"4px 12px", borderRadius:20, border:"1px solid",
            background:showing===c?(CAT_COLORS[c]||COLORS.accent):"transparent",
            borderColor:CAT_COLORS[c]||COLORS.accent,
            color:showing===c?"#fff":(CAT_COLORS[c]||COLORS.accent),
            fontSize:".78rem", cursor:"pointer", fontFamily:"inherit", transition:"all .12s",
          }}>{c}</button>
        ))}
      </div>

      {sorted.map(idea=>(
        <div key={idea.id} style={{background:COLORS.card, border:`1px solid ${COLORS.border}`, borderRadius:10, marginBottom:10, overflow:"hidden"}}>
          <div style={{padding:"14px 14px 10px", display:"flex", gap:12}}>
            <div style={{display:"flex", flexDirection:"column", alignItems:"center", gap:3, minWidth:40}}>
              <button onClick={()=>vote(idea.id)} style={{
                background:idea.votes.includes(user.name)?COLORS.accent:"transparent",
                border:`1px solid ${COLORS.accent}`, borderRadius:7, width:36, height:36,
                cursor:"pointer", color:idea.votes.includes(user.name)?"#fff":COLORS.accent, fontSize:".78rem",
              }}>▲</button>
              <span style={{color:COLORS.text, fontWeight:700, fontSize:".9rem"}}>{idea.votes.length}</span>
            </div>
            <div style={{flex:1}}>
              <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:3}}>
                <span style={{background:(CAT_COLORS[idea.category]||COLORS.muted)+"22", color:CAT_COLORS[idea.category]||COLORS.muted, fontSize:".68rem", padding:"1px 7px", borderRadius:8, fontWeight:600}}>{idea.category}</span>
                <h4 style={{color:COLORS.text, fontSize:".92rem", fontWeight:600}}>{idea.title}</h4>
              </div>
              {idea.description&&<p style={{color:COLORS.muted, fontSize:".82rem", marginBottom:6, lineHeight:1.5}}>{idea.description}</p>}
              <div style={{color:COLORS.muted, fontSize:".72rem"}}>by {idea.created_by} · {formatTime(idea.created_at)}</div>
            </div>
            <button onClick={()=>setExpanded(expandedId===idea.id?null:idea.id)} style={{background:"transparent", border:`1px solid ${COLORS.border}`, borderRadius:7, color:COLORS.muted, cursor:"pointer", padding:"5px 9px", fontSize:".78rem", alignSelf:"flex-start", fontFamily:"inherit"}}>
              💬 {idea.comments.length}
            </button>
          </div>
          {expandedId===idea.id&&(
            <div style={{background:COLORS.surface, borderTop:`1px solid ${COLORS.border}`, padding:12}}>
              {idea.comments.map(c=>(
                <div key={c.id} style={{marginBottom:8, paddingLeft:10, borderLeft:`2px solid ${COLORS.border}`}}>
                  <span style={{color:COLORS.accent, fontSize:".78rem", fontWeight:600}}>{c.author}</span>
                  <span style={{color:COLORS.muted, fontSize:".72rem"}}> · {formatTime(c.created_at)}</span>
                  <p style={{color:COLORS.text, fontSize:".82rem", marginTop:2}}>{c.text}</p>
                </div>
              ))}
              <div style={{display:"flex", gap:8, marginTop:8}}>
                <input placeholder="Add a comment…" value={commentText[idea.id]||""} onChange={e=>setCommentText({...commentText,[idea.id]:e.target.value})} onKeyDown={e=>{if(e.key==="Enter"){addComment(idea.id);}}} style={{...fieldInput,flex:1,padding:"6px 10px",fontSize:".82rem"}}/>
                <button className="btn-primary" style={{padding:"6px 14px",fontSize:".8rem"}} onClick={()=>addComment(idea.id)}>Post</button>
              </div>
            </div>
          )}
        </div>
      ))}
      {sorted.length===0&&<p style={{color:COLORS.muted, textAlign:"center", padding:36}}>No ideas yet — be the first!</p>}
    </div>
  );
}
