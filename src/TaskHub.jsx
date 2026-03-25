import { useState, useMemo } from "react";
import { CheckCircle2, Circle, Clock, AlertCircle, Filter, User, Flag, ArrowUpRight, Loader, Pencil, Crown, ListTodo } from "lucide-react";
import { THEME, PRIORITY_COLORS, STATUS_CONFIG, glassCard, agentName } from "./theme";
import { supabase } from "./supabaseClient";

const TaskHub = ({ tasks, clients, onRefresh, onEditTask }) => {
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterStatus, setFilterStatus] = useState("active");
  const [updatingId, setUpdatingId] = useState(null);

  const clientMap = useMemo(() => {
    const m = {};
    (clients || []).forEach((c) => { m[c.id] = c; });
    return m;
  }, [clients]);

  // Sheba's tasks only, filtered
  const shebaTasks = useMemo(() => {
    let t = (tasks || []).filter((x) => x.assigned_to === "sheba");
    if (filterPriority !== "all") t = t.filter((x) => x.priority === filterPriority);
    if (filterStatus === "active") t = t.filter((x) => x.status !== "completed");
    else if (filterStatus !== "all") t = t.filter((x) => x.status === filterStatus);
    return t.sort((a, b) => {
      const po = { high: 0, medium: 1, low: 2 };
      const so = { in_progress: 0, pending: 1, completed: 2 };
      if (so[a.status] !== so[b.status]) return so[a.status] - so[b.status];
      return (po[a.priority] || 1) - (po[b.priority] || 1);
    });
  }, [tasks, filterPriority, filterStatus]);

  // Group by client
  const grouped = useMemo(() => {
    const map = new Map();
    const unlinked = [];
    shebaTasks.forEach((t) => {
      if (t.client_id && clientMap[t.client_id]) {
        const cid = t.client_id;
        if (!map.has(cid)) map.set(cid, []);
        map.get(cid).push(t);
      } else {
        unlinked.push(t);
      }
    });
    // Sort groups: groups with overdue/high-priority first
    const sorted = [...map.entries()].sort((a, b) => {
      const scoreGroup = (tasks) => {
        let s = 0;
        tasks.forEach((t) => {
          if (t.priority === "high" && t.status !== "completed") s += 10;
          if (t.due_date) {
            const diff = Math.ceil((new Date(t.due_date + "T00:00:00") - new Date(new Date().toDateString())) / 86400000);
            if (diff < 0) s += 20;
            else if (diff <= 2) s += 5;
          }
        });
        return s;
      };
      return scoreGroup(b[1]) - scoreGroup(a[1]);
    });
    return { sorted, unlinked };
  }, [shebaTasks, clientMap]);

  const cycleStatus = async (task) => {
    const next = { pending: "in_progress", in_progress: "completed", completed: "pending" };
    const newStatus = next[task.status] || "pending";
    setUpdatingId(task.id);
    await supabase.from("tasks").update({ status: newStatus }).eq("id", task.id);
    onRefresh?.();
    setUpdatingId(null);
  };

  const dueLabel = (d) => {
    if (!d) return null;
    const due = new Date(d + "T00:00:00");
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diff = Math.ceil((due - now) / 86400000);
    if (diff < 0) return { text: `${Math.abs(diff)}d overdue`, color: THEME.RED };
    if (diff === 0) return { text: "Due today", color: THEME.ORANGE };
    if (diff === 1) return { text: "Tomorrow", color: THEME.ORANGE };
    if (diff <= 7) return { text: `${diff} days`, color: THEME.WHITE };
    return { text: new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }), color: THEME.TEXT_DIM };
  };

  const allSheba = (tasks || []).filter((t) => t.assigned_to === "sheba");
  const counts = {
    total: allSheba.length,
    active: allSheba.filter((t) => t.status !== "completed").length,
    overdue: allSheba.filter((t) => {
      if (!t.due_date || t.status === "completed") return false;
      return new Date(t.due_date + "T00:00:00") < new Date(new Date().toDateString());
    }).length,
    completed: allSheba.filter((t) => t.status === "completed").length,
  };

  const chipStyle = (active) => ({
    padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
    fontFamily: "'Space Grotesk', sans-serif", border: "1px solid",
    transition: "all 0.2s",
    background: active ? `${THEME.GOLD}18` : "transparent",
    color: active ? THEME.GOLD : THEME.TEXT_DIM,
    borderColor: active ? `${THEME.GOLD}40` : "transparent",
  });

  const renderTaskRow = (task, idx) => {
    const sc = STATUS_CONFIG[task.status] || STATUS_CONFIG.pending;
    const pc = PRIORITY_COLORS[task.priority] || THEME.ORANGE;
    const due = dueLabel(task.due_date);
    const isCompleted = task.status === "completed";

    return (
      <div
        key={task.id}
        style={{
          display: "flex", alignItems: "center", gap: 14, padding: "14px 18px",
          background: "rgba(255,255,255,0.02)", borderRadius: 10, marginBottom: 6,
          opacity: isCompleted ? 0.5 : 1, transition: "all 0.2s",
          borderLeft: `3px solid ${pc}`,
        }}
      >
        <button
          onClick={() => cycleStatus(task)}
          disabled={updatingId === task.id}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 2, flexShrink: 0 }}
          title={`Click to cycle: ${sc.label}`}
        >
          {updatingId === task.id ? (
            <Loader size={18} color={THEME.GOLD} style={{ animation: "spinIn 0.6s linear infinite" }} />
          ) : task.status === "completed" ? (
            <CheckCircle2 size={18} color={THEME.GREEN} style={{ filter: `drop-shadow(0 0 4px ${THEME.GREEN})` }} />
          ) : task.status === "in_progress" ? (
            <ArrowUpRight size={18} color={THEME.BLUE} style={{ filter: `drop-shadow(0 0 4px ${THEME.BLUE})` }} />
          ) : (
            <Circle size={18} color={THEME.TEXT_DIM} />
          )}
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: isCompleted ? THEME.TEXT_DIM : THEME.WHITE, textDecoration: isCompleted ? "line-through" : "none", fontFamily: "'Space Grotesk'" }}>
            {task.title}
          </div>
        </div>

        <div style={{
          padding: "3px 8px", borderRadius: 5, fontSize: 9, fontWeight: 700,
          textTransform: "uppercase", letterSpacing: 1,
          background: `${pc}15`, color: pc,
          flexShrink: 0,
        }}>
          {task.priority}
        </div>

        {due && (
          <div style={{ fontSize: 11, fontWeight: 600, color: due.color, display: "flex", alignItems: "center", gap: 3, flexShrink: 0 }}>
            {due.color === THEME.RED ? <AlertCircle size={11} /> : <Clock size={11} />}
            {due.text}
          </div>
        )}
        {!due && <span style={{ fontSize: 11, color: THEME.TEXT_DIM, fontStyle: "italic", flexShrink: 0 }}>No date</span>}

        <div style={{
          padding: "3px 10px", borderRadius: 6, fontSize: 10, fontWeight: 600,
          background: sc.bg, color: sc.color, flexShrink: 0,
        }}>
          {sc.label}
        </div>

        <button
          onClick={() => onEditTask?.(task)}
          style={{
            background: "none", border: "none", cursor: "pointer", padding: 3,
            color: THEME.TEXT_DIM, transition: "color 0.2s", flexShrink: 0,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = THEME.GOLD; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = THEME.TEXT_DIM; }}
          title="Edit task"
        >
          <Pencil size={13} />
        </button>
      </div>
    );
  };

  return (
    <div style={{ animation: "fadeIn 0.4s ease-out" }}>
      {/* ── Header Banner ── */}
      <div style={{ ...glassCard({ padding: "24px 32px", marginBottom: 24, position: "relative", overflow: "hidden", border: `1px solid ${THEME.GOLD}25` }) }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${THEME.GOLD}, ${THEME.CYAN}, ${THEME.GOLD})` }} />
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: `linear-gradient(135deg, ${THEME.GOLD}25, ${THEME.CYAN}15)`, border: `1px solid ${THEME.GOLD}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Crown size={20} color={THEME.GOLD} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: THEME.WHITE, fontFamily: "'Space Grotesk'", letterSpacing: -0.3 }}>
              Sheba's Task Hub
            </h2>
            <div style={{ fontSize: 12, color: THEME.TEXT_DIM, marginTop: 2 }}>
              {counts.active} active tasks &middot; {counts.overdue > 0 ? <span style={{ color: THEME.RED }}>{counts.overdue} overdue</span> : "0 overdue"}
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI Strip ── */}
      <div className="bsf-kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: "My Tasks", value: counts.total, color: THEME.WHITE, accent: THEME.GOLD },
          { label: "Active", value: counts.active, color: THEME.BLUE, accent: THEME.BLUE },
          { label: "Overdue", value: counts.overdue, color: counts.overdue > 0 ? THEME.RED : THEME.GREEN, accent: counts.overdue > 0 ? THEME.RED : THEME.GREEN },
          { label: "Completed", value: counts.completed, color: THEME.GREEN, accent: THEME.GREEN },
        ].map((kpi) => (
          <div key={kpi.label} style={{ ...glassCard({ padding: "18px 22px", position: "relative", overflow: "hidden" }) }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${kpi.accent}, transparent)` }} />
            <div style={{ fontSize: 10, color: THEME.TEXT_DIM, textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 700, marginBottom: 6 }}>{kpi.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: kpi.color, fontFamily: "'Space Grotesk'", lineHeight: 1 }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* ── Filter Bar ── */}
      <div className="bsf-filter-bar" style={{ ...glassCard({ padding: "12px 20px", marginBottom: 20, display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }) }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: THEME.TEXT_DIM }}>
          <Filter size={14} />
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5 }}>Filters</span>
        </div>
        <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.08)" }} />
        <div style={{ display: "flex", gap: 6 }}>
          {[{ id: "all", label: "All" }, { id: "active", label: "Active" }, { id: "pending", label: "Pending" }, { id: "completed", label: "Done" }].map((s) => (
            <button key={s.id} onClick={() => setFilterStatus(s.id)} style={chipStyle(filterStatus === s.id)}>{s.label}</button>
          ))}
        </div>
        <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.08)" }} />
        <div style={{ display: "flex", gap: 6 }}>
          {[{ id: "all", label: "All" }, { id: "high", label: "High" }, { id: "medium", label: "Med" }, { id: "low", label: "Low" }].map((p) => (
            <button key={p.id} onClick={() => setFilterPriority(p.id)} style={chipStyle(filterPriority === p.id)}>{p.label}</button>
          ))}
        </div>
      </div>

      {/* ── Grouped Task List ── */}
      {shebaTasks.length === 0 ? (
        <div style={{ ...glassCard({ padding: 60, textAlign: "center" }) }}>
          <ListTodo size={48} color={THEME.TEXT_DIM} style={{ opacity: 0.3, marginBottom: 16 }} />
          <div style={{ fontSize: 16, color: THEME.TEXT_DIM, fontWeight: 500 }}>No tasks match your filters</div>
          <div style={{ fontSize: 13, color: THEME.TEXT_DIM, marginTop: 6, opacity: 0.7 }}>Use the Command tab to brain-dump and auto-create tasks</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Client-grouped sections */}
          {grouped.sorted.map(([clientId, clientTasks]) => {
            const client = clientMap[clientId];
            return (
              <div key={clientId} style={{ ...glassCard({ padding: "20px 24px" }) }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, paddingBottom: 12, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <User size={14} color={THEME.GOLD} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: THEME.WHITE, fontFamily: "'Space Grotesk'" }}>
                    {client?.name || "Unknown Client"}
                  </span>
                  <span style={{ fontSize: 11, color: THEME.TEXT_DIM, marginLeft: 4 }}>
                    {client?.type} &middot; {client?.stage}
                  </span>
                  <span style={{ fontSize: 11, color: THEME.GOLD, marginLeft: "auto", fontWeight: 600 }}>
                    {clientTasks.length} task{clientTasks.length !== 1 ? "s" : ""}
                  </span>
                </div>
                {clientTasks.map((t, i) => renderTaskRow(t, i))}
              </div>
            );
          })}

          {/* Unlinked tasks */}
          {grouped.unlinked.length > 0 && (
            <div style={{ ...glassCard({ padding: "20px 24px" }) }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, paddingBottom: 12, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <ListTodo size={14} color={THEME.TEXT_DIM} />
                <span style={{ fontSize: 14, fontWeight: 700, color: THEME.WHITE, fontFamily: "'Space Grotesk'" }}>
                  General Tasks
                </span>
                <span style={{ fontSize: 11, color: THEME.TEXT_DIM, marginLeft: "auto", fontWeight: 600 }}>
                  {grouped.unlinked.length} task{grouped.unlinked.length !== 1 ? "s" : ""}
                </span>
              </div>
              {grouped.unlinked.map((t, i) => renderTaskRow(t, i))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskHub;
