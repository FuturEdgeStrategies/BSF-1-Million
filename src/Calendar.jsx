import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, MapPin, Clock, StickyNote, User } from "lucide-react";
import { THEME, glassCard } from "./theme";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const CalendarView = ({ events, clients }) => {
  const [current, setCurrent] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [selectedDate, setSelectedDate] = useState(null);

  const clientMap = useMemo(() => {
    const m = {};
    (clients || []).forEach((c) => { m[c.id] = c; });
    return m;
  }, [clients]);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const firstDay = new Date(current.year, current.month, 1);
  const lastDay = new Date(current.year, current.month + 1, 0);
  const startOffset = firstDay.getDay();
  const totalDays = lastDay.getDate();

  const monthLabel = firstDay.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const eventsByDate = useMemo(() => {
    const map = {};
    (events || []).forEach((ev) => {
      if (!ev.event_date) return;
      if (!map[ev.event_date]) map[ev.event_date] = [];
      map[ev.event_date].push(ev);
    });
    return map;
  }, [events]);

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) cells.push(d);

  const prev = () => setCurrent((c) => c.month === 0 ? { year: c.year - 1, month: 11 } : { year: c.year, month: c.month - 1 });
  const next = () => setCurrent((c) => c.month === 11 ? { year: c.year + 1, month: 0 } : { year: c.year, month: c.month + 1 });
  const goToday = () => { setCurrent({ year: today.getFullYear(), month: today.getMonth() }); setSelectedDate(todayStr); };

  const dateStr = (day) => `${current.year}-${String(current.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const selectedEvents = selectedDate ? (eventsByDate[selectedDate] || []) : [];

  return (
    <div style={{ animation: "fadeIn 0.4s ease-out" }}>
      {/* Month Nav */}
      <div style={{ ...glassCard({ padding: "20px 28px", marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between" }) }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={prev} style={navBtn}><ChevronLeft size={18} color={THEME.WHITE} /></button>
          <button onClick={next} style={navBtn}><ChevronRight size={18} color={THEME.WHITE} /></button>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: THEME.WHITE, fontFamily: "'Space Grotesk'", letterSpacing: -0.3 }}>{monthLabel}</h2>
        </div>
        <button onClick={goToday} style={{ padding: "8px 18px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Space Grotesk'", background: `${THEME.GOLD}15`, border: `1px solid ${THEME.GOLD}30`, color: THEME.GOLD, transition: "all 0.2s" }}>
          Today
        </button>
      </div>

      {/* Calendar Grid */}
      <div style={{ ...glassCard({ padding: 20, marginBottom: 24 }) }}>
        {/* Day headers */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 8 }}>
          {DAYS.map((d) => (
            <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: THEME.TEXT_DIM, textTransform: "uppercase", letterSpacing: 1.5, padding: "8px 0" }}>
              {d}
            </div>
          ))}
        </div>

        {/* Date cells */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
          {cells.map((day, i) => {
            if (!day) return <div key={`e-${i}`} />;
            const ds = dateStr(day);
            const isToday = ds === todayStr;
            const isSelected = ds === selectedDate;
            const dayEvents = eventsByDate[ds] || [];
            const hasEvents = dayEvents.length > 0;

            return (
              <button
                key={ds}
                onClick={() => setSelectedDate(ds === selectedDate ? null : ds)}
                style={{
                  padding: "10px 6px", minHeight: 80, borderRadius: 10, border: "none", cursor: "pointer",
                  display: "flex", flexDirection: "column", alignItems: "stretch", gap: 4,
                  background: isSelected ? `${THEME.GOLD}12` : isToday ? `${THEME.BLUE}10` : "rgba(255,255,255,0.02)",
                  outline: isToday ? `1px solid ${THEME.BLUE}50` : isSelected ? `1px solid ${THEME.GOLD}40` : "1px solid transparent",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { if (!isSelected && !isToday) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                onMouseLeave={(e) => { if (!isSelected && !isToday) e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
              >
                <div style={{ fontSize: 13, fontWeight: isToday ? 700 : 500, color: isToday ? THEME.BLUE : THEME.WHITE, textAlign: "right", paddingRight: 4, fontFamily: "'Space Grotesk'" }}>
                  {day}
                </div>
                {dayEvents.slice(0, 3).map((ev, j) => (
                  <div key={ev.id || j} style={{
                    fontSize: 9, fontWeight: 600, padding: "2px 6px", borderRadius: 4, overflow: "hidden",
                    textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "left",
                    background: `${THEME.GOLD}20`, color: THEME.GOLD,
                  }}>
                    {ev.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div style={{ fontSize: 9, color: THEME.TEXT_DIM, textAlign: "left", paddingLeft: 6 }}>
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Events */}
      {selectedDate && (
        <div style={{ ...glassCard({ padding: "20px 24px" }) }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: THEME.WHITE, fontFamily: "'Space Grotesk'" }}>
            {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          </h3>
          {selectedEvents.length === 0 ? (
            <div style={{ padding: 20, textAlign: "center", color: THEME.TEXT_DIM, fontSize: 13 }}>
              No events on this day
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {selectedEvents.map((ev) => {
                const client = ev.client_id ? clientMap[ev.client_id] : null;
                return (
                  <div key={ev.id} style={{ padding: "14px 18px", borderRadius: 10, background: "rgba(255,255,255,0.03)", borderLeft: `3px solid ${THEME.GOLD}` }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: THEME.WHITE, fontFamily: "'Space Grotesk'", marginBottom: 6 }}>
                      {ev.title}
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 14, fontSize: 12 }}>
                      {(ev.time_start || ev.time_end) && (
                        <span style={{ display: "flex", alignItems: "center", gap: 4, color: THEME.CYAN }}>
                          <Clock size={12} />
                          {ev.time_start}{ev.time_end ? ` – ${ev.time_end}` : ""}
                        </span>
                      )}
                      {ev.location && (
                        <span style={{ display: "flex", alignItems: "center", gap: 4, color: THEME.ORANGE }}>
                          <MapPin size={12} />
                          {ev.location}
                        </span>
                      )}
                      {client && (
                        <span style={{ display: "flex", alignItems: "center", gap: 4, color: THEME.GOLD }}>
                          <User size={12} />
                          {client.name}
                        </span>
                      )}
                    </div>
                    {ev.notes && (
                      <div style={{ marginTop: 8, fontSize: 12, color: THEME.TEXT_DIM, display: "flex", alignItems: "flex-start", gap: 6 }}>
                        <StickyNote size={11} style={{ marginTop: 2, flexShrink: 0 }} />
                        {ev.notes}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const navBtn = {
  width: 36, height: 36, borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.04)", cursor: "pointer", display: "flex",
  alignItems: "center", justifyContent: "center", transition: "all 0.2s",
};

export default CalendarView;
