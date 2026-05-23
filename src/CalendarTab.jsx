import { useState } from "react";
import { COLORS, DAYS, MONTHS, EVENT_COLORS, api, fieldLabel, fieldInput, overlay, modalBox, closeBtn } from "./helpers.js";

const navBtn = { background:COLORS.surface, border:`1px solid ${COLORS.border}`, color:COLORS.text, width:34, height:34, borderRadius:8, cursor:"pointer", fontSize:"1.1rem" };
const actionBtn = { background:"transparent", border:"1px solid", borderRadius:8, padding:"8px 0", cursor:"pointer", fontSize:".88rem", fontFamily:"'Crimson Pro',Georgia,serif", transition:"all .12s" };

export default function CalendarTab({ events, setEvents, user, tenant }) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [modal,    setModal]    = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [saving,   setSaving]   = useState(false);

  const year = viewDate.getFullYear(), month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month+1, 0).getDate();

  const cells = [];
  for (let i=0; i<firstDay; i++) cells.push(null);
  for (let d=1; d<=daysInMonth; d++) cells.push(d);

  const eventsForDay = (d) => {
    const key = `${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    return events.filter(e=>e.date===key);
  };

  const openNew = (d) => {
    const date = `${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    setEditForm({ id:null, title:"", date, time:"18:00", location:"", description:"", color:EVENT_COLORS[0] });
  };

  const saveEvent = async () => {
    if (!editForm.title.trim() || saving) return;
    setSaving(true);
    try {
      if (editForm.id) {
        const updated = await api.updateEvent(editForm.id, { title:editForm.title, date:editForm.date, time:editForm.time, location:editForm.location, description:editForm.description, color:editForm.color });
        setEvents(events.map(e=>e.id===editForm.id ? updated : e));
      } else {
        const created = await api.createEvent({ tenant_id:tenant.id, title:editForm.title, date:editForm.date, time:editForm.time, location:editForm.location, description:editForm.description, color:editForm.color, created_by:user.name });
        setEvents([...events, created]);
      }
      setEditForm(null);
    } catch(e) { alert(e.message); }
    finally { setSaving(false); }
  };

  const deleteEvent = async (id) => {
    try {
      await api.deleteEvent(id);
      setEvents(events.filter(e=>e.id!==id));
      setModal(null);
    } catch(e) { alert(e.message); }
  };

  const isToday = (d) => d && today.getFullYear()===year && today.getMonth()===month && today.getDate()===d;

  const upcoming = [...events]
    .filter(e=>new Date(e.date+"T00:00:00")>=new Date(today.toDateString()))
    .sort((a,b)=>a.date.localeCompare(b.date)).slice(0,6);

  return (
    <div style={{display:"flex", gap:16, height:"calc(100vh - 88px)", overflow:"hidden"}}>
      <div style={{flex:1, display:"flex", flexDirection:"column", overflow:"hidden"}}>
        <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12}}>
          <button style={navBtn} onClick={()=>setViewDate(new Date(year,month-1,1))}>‹</button>
          <h2 style={{color:COLORS.text, fontSize:"1.2rem", fontWeight:600}}>{MONTHS[month]} {year}</h2>
          <button style={navBtn} onClick={()=>setViewDate(new Date(year,month+1,1))}>›</button>
        </div>
        <div style={{display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2, marginBottom:2}}>
          {DAYS.map(d=><div key={d} style={{textAlign:"center", color:COLORS.muted, fontSize:".72rem", padding:"3px 0", letterSpacing:".05em", textTransform:"uppercase"}}>{d}</div>)}
        </div>
        <div style={{display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2, flex:1, overflowY:"auto"}}>
          {cells.map((d,i)=>{
            const dayEvts = d ? eventsForDay(d) : [];
            return (
              <div key={i} onClick={()=>d&&openNew(d)} style={{
                background:isToday(d)?COLORS.accentSoft:COLORS.surface,
                border:isToday(d)?`1px solid ${COLORS.accent}`:`1px solid ${COLORS.border}`,
                borderRadius:6, padding:"4px 4px 2px", cursor:d?"pointer":"default", minHeight:64,
              }}
              onMouseEnter={e=>{if(d)e.currentTarget.style.background=isToday(d)?COLORS.accentSoft:"#232840";}}
              onMouseLeave={e=>{if(d)e.currentTarget.style.background=isToday(d)?COLORS.accentSoft:COLORS.surface;}}>
                {d && <>
                  <span style={{fontSize:".72rem", fontWeight:600, color:isToday(d)?COLORS.accent:COLORS.muted, display:"block", marginBottom:2}}>{d}</span>
                  {dayEvts.slice(0,2).map(ev=>(
                    <div key={ev.id} onClick={e=>{e.stopPropagation();setModal(ev);}} style={{
                      background:ev.color+"22", borderLeft:`2px solid ${ev.color}`, borderRadius:3,
                      padding:"1px 3px", marginBottom:1, fontSize:".64rem", color:ev.color,
                      cursor:"pointer", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis",
                    }}>{ev.title}</div>
                  ))}
                  {dayEvts.length>2&&<div style={{fontSize:".6rem",color:COLORS.muted,textAlign:"right"}}>+{dayEvts.length-2}</div>}
                </>}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{width:220, display:"flex", flexDirection:"column", gap:12}}>
        <div style={{background:COLORS.card, border:`1px solid ${COLORS.border}`, borderRadius:12, padding:14, flex:1, overflowY:"auto"}}>
          <h3 style={{color:COLORS.text, fontSize:".82rem", fontWeight:600, letterSpacing:".05em", textTransform:"uppercase", marginBottom:12}}>📅 Upcoming</h3>
          {upcoming.length===0&&<p style={{color:COLORS.muted, fontSize:".82rem"}}>No upcoming events</p>}
          {upcoming.map(ev=>(
            <div key={ev.id} onClick={()=>setModal(ev)} style={{borderLeft:`3px solid ${ev.color}`, paddingLeft:8, marginBottom:12, cursor:"pointer"}}>
              <div style={{color:COLORS.text, fontSize:".84rem", fontWeight:600}}>{ev.title}</div>
              <div style={{color:COLORS.muted, fontSize:".72rem"}}>{ev.date}{ev.time&&` · ${ev.time}`}</div>
              {ev.location&&<div style={{color:COLORS.muted, fontSize:".7rem"}}>📍 {ev.location}</div>}
            </div>
          ))}
        </div>
        <button className="btn-primary" onClick={()=>openNew(today.getDate())} style={{borderRadius:10, padding:"10px 0", fontSize:".9rem"}}>+ New Event</button>
      </div>

      {modal&&(
        <div style={overlay} onClick={()=>setModal(null)}>
          <div style={modalBox} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex", justifyContent:"space-between", marginBottom:14}}>
              <div style={{width:10,height:10,borderRadius:"50%",background:modal.color,marginTop:5}}/>
              <button style={closeBtn} onClick={()=>setModal(null)}>✕</button>
            </div>
            <h2 style={{color:COLORS.text, fontSize:"1.2rem", marginBottom:6}}>{modal.title}</h2>
            <div style={{color:COLORS.muted, fontSize:".88rem", marginBottom:3}}>🗓 {modal.date}{modal.time&&` at ${modal.time}`}</div>
            {modal.location&&<div style={{color:COLORS.muted, fontSize:".88rem"}}>📍 {modal.location}</div>}
            {modal.description&&<p style={{color:COLORS.text, fontSize:".88rem", marginTop:10, lineHeight:1.6}}>{modal.description}</p>}
            <div style={{color:COLORS.muted, fontSize:".75rem", marginTop:10}}>Added by {modal.created_by}</div>
            <div style={{display:"flex", gap:10, marginTop:18}}>
              <button onClick={()=>{setEditForm({...modal, time:modal.time||"", location:modal.location||"", description:modal.description||""});setModal(null);}} style={{...actionBtn, flex:1, borderColor:COLORS.accent, color:COLORS.accent}}>Edit</button>
              <button onClick={()=>deleteEvent(modal.id)} style={{...actionBtn, flex:1, borderColor:COLORS.rose, color:COLORS.rose}}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {editForm&&(
        <div style={overlay} onClick={()=>setEditForm(null)}>
          <div style={{...modalBox, maxWidth:420}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18}}>
              <h2 style={{color:COLORS.text, fontSize:"1.1rem"}}>{editForm.id?"Edit":"New"} Event</h2>
              <button style={closeBtn} onClick={()=>setEditForm(null)}>✕</button>
            </div>
            {[{label:"Title",key:"title",type:"text",ph:"Event name…"},{label:"Date",key:"date",type:"date"},{label:"Time",key:"time",type:"time"},{label:"Location",key:"location",type:"text",ph:"Where?"}].map(f=>(
              <div key={f.key} style={{marginBottom:12}}>
                <label style={fieldLabel}>{f.label}</label>
                <input type={f.type} value={editForm[f.key]} placeholder={f.ph||""} onChange={e=>setEditForm({...editForm,[f.key]:e.target.value})} style={fieldInput}/>
              </div>
            ))}
            <div style={{marginBottom:12}}>
              <label style={fieldLabel}>Description</label>
              <textarea value={editForm.description} onChange={e=>setEditForm({...editForm,description:e.target.value})} rows={3} style={{...fieldInput,resize:"vertical"}}/>
            </div>
            <div style={{marginBottom:18}}>
              <label style={fieldLabel}>Color</label>
              <div style={{display:"flex", gap:8, marginTop:4}}>
                {EVENT_COLORS.map(c=>(
                  <div key={c} onClick={()=>setEditForm({...editForm,color:c})} style={{width:20,height:20,borderRadius:"50%",background:c,cursor:"pointer",border:editForm.color===c?"2px solid white":"2px solid transparent",transform:editForm.color===c?"scale(1.25)":"scale(1)",transition:"transform .1s"}}/>
                ))}
              </div>
            </div>
            <button className="btn-primary" style={{width:"100%", opacity:saving?.7:1}} disabled={saving} onClick={saveEvent}>
              {saving?"Saving…":editForm.id?"Save Changes":"Add Event"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
