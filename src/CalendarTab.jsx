import { useState } from "react";
import {
  COLORS, DAYS, MONTHS, EVENT_COLORS,
  fieldLabel, fieldInput, overlay, modalBox, closeBtn,
  generateId, lsSet, STORAGE_KEYS,
} from "./helpers.js";

const navBtn = {
  background: COLORS.surface,
  border: `1px solid ${COLORS.border}`,
  color: COLORS.text,
  width: 34,
  height: 34,
  borderRadius: 8,
  cursor: "pointer",
  fontSize: "1.1rem",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const actionBtn = {
  background: "transparent",
  border: "1px solid",
  borderRadius: 8,
  padding: "8px 0",
  cursor: "pointer",
  fontSize: ".88rem",
  fontFamily: "'Crimson Pro', Georgia, serif",
  transition: "all .12s",
};

export default function CalendarTab({ events, setEvents, user }) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [modal, setModal] = useState(null);
  const [editForm, setEditForm] = useState(null);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const eventsForDay = (d) => {
    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    return events.filter(e => e.date === key);
  };

  const openNew = (d) => {
    const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    setEditForm({ id: null, title: "", date, time: "18:00", location: "", description: "", color: EVENT_COLORS[0] });
  };

  const saveEvent = () => {
    if (!editForm.title.trim()) return;
    const ev = { ...editForm, id: editForm.id || generateId(), createdBy: user.name, createdAt: Date.now() };
    const updated = editForm.id
      ? events.map(e => e.id === editForm.id ? ev : e)
      : [...events, ev];
    setEvents(updated);
    lsSet(STORAGE_KEYS.events, updated);
    setEditForm(null);
  };

  const deleteEvent = (id) => {
    const updated = events.filter(e => e.id !== id);
    setEvents(updated);
    lsSet(STORAGE_KEYS.events, updated);
    setModal(null);
  };

  const isToday = (d) =>
    d && today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;

  const upcomingEvents = [...events]
    .filter(e => new Date(e.date + "T00:00:00") >= new Date(today.toDateString()))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 6);

  return (
    <div style={{ display: "flex", gap: 20, height: "calc(100vh - 80px)", overflow: "hidden" }}>
      {/* Main calendar */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Nav */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <button style={navBtn} onClick={() => setViewDate(new Date(year, month - 1, 1))}>‹</button>
          <h2 style={{ color: COLORS.text, fontSize: "1.3rem", fontWeight: 600 }}>
            {MONTHS[month]} {year}
          </h2>
          <button style={navBtn} onClick={() => setViewDate(new Date(year, month + 1, 1))}>›</button>
        </div>

        {/* Day headers */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3, marginBottom: 3 }}>
          {DAYS.map(d => (
            <div key={d} style={{ textAlign: "center", color: COLORS.muted, fontSize: ".75rem", padding: "4px 0", letterSpacing: ".06em", textTransform: "uppercase" }}>
              {d}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3, flex: 1, overflowY: "auto" }}>
          {cells.map((d, i) => {
            const dayEvts = d ? eventsForDay(d) : [];
            return (
              <div
                key={i}
                onClick={() => d && openNew(d)}
                style={{
                  background: isToday(d) ? COLORS.accentSoft : COLORS.surface,
                  border: isToday(d) ? `1px solid ${COLORS.accent}` : `1px solid ${COLORS.border}`,
                  borderRadius: 8,
                  padding: "6px 6px 4px",
                  cursor: d ? "pointer" : "default",
                  minHeight: 72,
                  transition: "background .12s",
                }}
                onMouseEnter={e => { if (d) e.currentTarget.style.background = isToday(d) ? COLORS.accentSoft : "#232840"; }}
                onMouseLeave={e => { if (d) e.currentTarget.style.background = isToday(d) ? COLORS.accentSoft : COLORS.surface; }}
              >
                {d && <>
                  <span style={{ fontSize: ".78rem", fontWeight: 600, color: isToday(d) ? COLORS.accent : COLORS.muted, display: "block", marginBottom: 3 }}>
                    {d}
                  </span>
                  {dayEvts.slice(0, 3).map(ev => (
                    <div
                      key={ev.id}
                      onClick={e => { e.stopPropagation(); setModal(ev); }}
                      style={{
                        background: ev.color + "22",
                        border: `1px solid ${ev.color}55`,
                        borderLeft: `2px solid ${ev.color}`,
                        borderRadius: 4,
                        padding: "1px 4px",
                        marginBottom: 2,
                        fontSize: ".68rem",
                        color: ev.color,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {ev.title}
                    </div>
                  ))}
                  {dayEvts.length > 3 && <div style={{ fontSize: ".63rem", color: COLORS.muted, textAlign: "right" }}>+{dayEvts.length - 3}</div>}
                </>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Sidebar */}
      <div style={{ width: 240, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 16, flex: 1, overflowY: "auto" }}>
          <h3 style={{ color: COLORS.text, fontSize: ".85rem", fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 14 }}>
            📅 Upcoming
          </h3>
          {upcomingEvents.length === 0 && <p style={{ color: COLORS.muted, fontSize: ".85rem" }}>No upcoming events</p>}
          {upcomingEvents.map(ev => (
            <div key={ev.id} onClick={() => setModal(ev)} style={{ borderLeft: `3px solid ${ev.color}`, paddingLeft: 10, marginBottom: 14, cursor: "pointer" }}>
              <div style={{ color: COLORS.text, fontSize: ".88rem", fontWeight: 600 }}>{ev.title}</div>
              <div style={{ color: COLORS.muted, fontSize: ".75rem" }}>{ev.date}{ev.time && ` · ${ev.time}`}</div>
              {ev.location && <div style={{ color: COLORS.muted, fontSize: ".73rem" }}>📍 {ev.location}</div>}
            </div>
          ))}
        </div>
        <button className="btn-primary" onClick={() => openNew(today.getDate())} style={{ borderRadius: 10, padding: "11px 0", fontSize: ".95rem" }}>
          + New Event
        </button>
      </div>

      {/* Event detail modal */}
      {modal && (
        <div style={overlay} onClick={() => setModal(null)}>
          <div style={modalBox} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: modal.color, marginTop: 4 }} />
              <button style={closeBtn} onClick={() => setModal(null)}>✕</button>
            </div>
            <h2 style={{ color: COLORS.text, fontSize: "1.3rem", marginBottom: 8 }}>{modal.title}</h2>
            <div style={{ color: COLORS.muted, fontSize: ".9rem", marginBottom: 4 }}>🗓 {modal.date}{modal.time && ` at ${modal.time}`}</div>
            {modal.location && <div style={{ color: COLORS.muted, fontSize: ".9rem", marginBottom: 4 }}>📍 {modal.location}</div>}
            {modal.description && <p style={{ color: COLORS.text, fontSize: ".9rem", marginTop: 12, lineHeight: 1.6 }}>{modal.description}</p>}
            <div style={{ color: COLORS.muted, fontSize: ".78rem", marginTop: 12 }}>Added by {modal.createdBy}</div>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button onClick={() => { setEditForm({ ...modal }); setModal(null); }} style={{ ...actionBtn, flex: 1, borderColor: COLORS.accent, color: COLORS.accent }}>Edit</button>
              <button onClick={() => deleteEvent(modal.id)} style={{ ...actionBtn, flex: 1, borderColor: COLORS.rose, color: COLORS.rose }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit / Create modal */}
      {editForm && (
        <div style={overlay} onClick={() => setEditForm(null)}>
          <div style={{ ...modalBox, maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ color: COLORS.text, fontSize: "1.2rem" }}>{editForm.id ? "Edit" : "New"} Event</h2>
              <button style={closeBtn} onClick={() => setEditForm(null)}>✕</button>
            </div>
            {[
              { label: "Title",    key: "title",    type: "text", placeholder: "Event name…" },
              { label: "Date",     key: "date",     type: "date" },
              { label: "Time",     key: "time",     type: "time" },
              { label: "Location", key: "location", type: "text", placeholder: "Where?" },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 14 }}>
                <label style={fieldLabel}>{f.label}</label>
                <input
                  type={f.type}
                  value={editForm[f.key]}
                  placeholder={f.placeholder || ""}
                  onChange={e => setEditForm({ ...editForm, [f.key]: e.target.value })}
                  style={fieldInput}
                />
              </div>
            ))}
            <div style={{ marginBottom: 14 }}>
              <label style={fieldLabel}>Description</label>
              <textarea
                value={editForm.description}
                onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                placeholder="Details…"
                rows={3}
                style={{ ...fieldInput, resize: "vertical" }}
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={fieldLabel}>Color</label>
              <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                {EVENT_COLORS.map(c => (
                  <div
                    key={c}
                    onClick={() => setEditForm({ ...editForm, color: c })}
                    style={{
                      width: 22, height: 22, borderRadius: "50%", background: c, cursor: "pointer",
                      border: editForm.color === c ? "2px solid white" : "2px solid transparent",
                      transform: editForm.color === c ? "scale(1.2)" : "scale(1)",
                      transition: "transform .1s",
                    }}
                  />
                ))}
              </div>
            </div>
            <button className="btn-primary" style={{ width: "100%" }} onClick={saveEvent}>
              {editForm.id ? "Save Changes" : "Add Event"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
