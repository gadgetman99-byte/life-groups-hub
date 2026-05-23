import { useState, useEffect, useRef } from "react";
import { COLORS, AVATARS, AVATAR_BG, api, fieldInput, formatTime } from "./helpers.js";

export default function ChatTab({ messages, setMessages, user, tenant }) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(()=>{ bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages]);

  const send = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    const optimistic = { id:"opt-"+Date.now(), tenant_id:tenant.id, author:user.name, avatar_idx:user.avatarIdx, text:text.trim(), created_at:new Date().toISOString() };
    setMessages(prev=>[...prev, optimistic]);
    setText("");
    try {
      const saved = await api.sendMessage({ tenant_id:tenant.id, author:user.name, avatar_idx:user.avatarIdx, text:optimistic.text });
      setMessages(prev=>prev.map(m=>m.id===optimistic.id ? saved : m));
    } catch(e) {
      setMessages(prev=>prev.filter(m=>m.id!==optimistic.id));
      setText(optimistic.text);
      alert(e.message);
    } finally { setSending(false); }
  };

  const isMe = a => a===user.name;

  const grouped = messages.map((m,i)=>{
    const prev = messages[i-1];
    const sameAuthor = prev && prev.author===m.author && new Date(m.created_at)-new Date(prev.created_at)<300000;
    return { ...m, sameAuthor };
  });

  return (
    <div style={{display:"flex", flexDirection:"column", height:"calc(100vh - 88px)"}}>
      <div style={{flex:1, overflowY:"auto", paddingBottom:8}}>
        {grouped.map(m=>(
          <div key={m.id} style={{
            display:"flex", flexDirection:isMe(m.author)?"row-reverse":"row",
            alignItems:"flex-end", gap:7, marginBottom:m.sameAuthor?3:12,
            paddingLeft:isMe(m.author)?40:0, paddingRight:isMe(m.author)?0:40,
          }}>
            {!isMe(m.author)&&!m.sameAuthor&&(
              <div style={{width:30,height:30,borderRadius:8,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1rem",background:AVATAR_BG[(m.avatar_idx||0)%AVATAR_BG.length]}}>
                {AVATARS[m.avatar_idx||0]}
              </div>
            )}
            {!isMe(m.author)&&m.sameAuthor&&<div style={{width:30,flexShrink:0}}/>}
            <div>
              {!m.sameAuthor&&(
                <div style={{color:COLORS.muted,fontSize:".7rem",marginBottom:2,textAlign:isMe(m.author)?"right":"left",paddingLeft:isMe(m.author)?0:3}}>
                  {!isMe(m.author)&&<span style={{color:COLORS.accent,fontWeight:600}}>{m.author} </span>}
                  {formatTime(m.created_at)}
                </div>
              )}
              <div style={{
                background:isMe(m.author)?"linear-gradient(135deg,#6c8eff,#a78bfa)":COLORS.card,
                border:isMe(m.author)?"none":`1px solid ${COLORS.border}`,
                borderRadius:11,
                borderBottomRightRadius:isMe(m.author)?3:11,
                borderBottomLeftRadius:isMe(m.author)?11:3,
                padding:"8px 12px", color:COLORS.text, fontSize:".88rem",
                maxWidth:380, lineHeight:1.5, wordBreak:"break-word",
                opacity:m.id?.toString().startsWith("opt-")?.7:1,
              }}>{m.text}</div>
            </div>
          </div>
        ))}
        {messages.length===0&&(
          <div style={{textAlign:"center",color:COLORS.muted,padding:50}}>
            <div style={{fontSize:"1.8rem",marginBottom:6}}>👋</div>
            <p>No messages yet — say hello!</p>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>
      <div style={{display:"flex",gap:8,paddingTop:10,borderTop:`1px solid ${COLORS.border}`}}>
        <input value={text} onChange={e=>setText(e.target.value)}
          onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}}
          placeholder="Type a message…"
          style={{...fieldInput,flex:1,padding:"10px 14px"}}/>
        <button className="btn-primary" onClick={send} disabled={!text.trim()||sending} style={{padding:"10px 18px"}}>
          {sending?"…":"Send"}
        </button>
      </div>
    </div>
  );
}
