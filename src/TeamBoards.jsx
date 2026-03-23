import { useState, useMemo } from "react";
import {
  User, Target, DollarSign, Calendar, CheckCircle2, Circle, Clock,
  AlertCircle, Flag, TrendingUp, FileText, Shield, Home, Briefcase,
  ArrowRight, Star, Crown, ChevronDown, ChevronUp, Phone, StickyNote,
} from "lucide-react";
import { THEME, glassCard, getSOP, getProgress, formatCurrency, agentName, PRIORITY_COLORS, STATUS_CONFIG } from "./theme";

// ═══════════════════════════════════════════════════
// SHARED COMPONENTS
// ═══════════════════════════════════════════════════

const StatCard = ({ icon, label, value, color, accent }) => (
  <div style={{ ...glassCard({ padding: "22px 26px", position: "relative", overflow: "hidden" }) }}>
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${accent}, transparent)`, animation: "borderGlow 3s ease-in-out infinite" }} />
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: `${accent}15`, border: `1px solid ${accent}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {icon}
      </div>
      <span style={{ fontSize: 10, color: THEME.TEXT_DIM, textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 700 }}>{label}</span>
    </div>
    <div style={{ fontSize: 36, fontWeight: 700, color: color || THEME.WHITE, lineHeight: 1, fontFamily: "'Space Grotesk'", textShadow: `0 0 20px ${accent}40` }}>
      {value}
    </div>
  </div>
);

const MiniClientRow = ({ client, accent, tasks }) => {
  const [expanded, setExpanded] = useState(false);
  const sop = getSOP(client.type);
  const progress = getProgress(client);
  const pct = sop.length > 0 ? (progress / sop.length) * 100 : 0;
  const clientTasks = (tasks || []).filter((t) => t.client_id === client.id);

  const dossierFields = [
    { label: "Type", value: client.type || "—" },
    { label: "Stage", value: client.stage || "—" },
    { label: "Agent", value: agentName(client.agent) },
    { label: "Phone", value: client.phone || "No phone on file" },
    { label: "Lender", value: client.lender || "No lender on file" },
    { label: "Loan Type", value: client.loan_type || "—" },
    { label: "Loan Amount", value: client.loan_amt ? formatCurrency(client.loan_amt) : "—" },
    { label: "Offer Price", value: client.offer_price ? formatCurrency(client.offer_price) : "—" },
    { label: "Pre-Approval", value: client.pre_approval || "—" },
    { label: "Closing Date", value: client.closing_date ? new Date(client.closing_date + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "Not set" },
  ];

  return (
    <div>
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          ...glassCard({
            padding: "16px 20px", display: "flex", alignItems: "center", gap: 16,
            transition: "all 0.2s", cursor: "pointer",
            borderColor: expanded ? `${accent}40` : THEME.GLASS_BORDER,
          }),
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${accent}40`; }}
        onMouseLeave={(e) => { if (!expanded) e.currentTarget.style.borderColor = THEME.GLASS_BORDER; }}
      >
        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${accent}15`, border: `1px solid ${accent}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <User size={16} color={accent} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: THEME.WHITE, fontFamily: "'Space Grotesk'" }}>{client.name}</div>
          <div style={{ fontSize: 11, color: THEME.TEXT_DIM, marginTop: 2 }}>{client.stage}</div>
        </div>
        <div style={{ width: 100 }}>
          <div style={{ fontSize: 10, color: THEME.TEXT_DIM, marginBottom: 4, textAlign: "right", fontWeight: 600 }}>{Math.round(pct)}%</div>
          <div style={{ height: 4, background: "rgba(255,255,255,0.07)", borderRadius: 2, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${pct}%`, borderRadius: 2, background: `linear-gradient(90deg, ${accent}, ${THEME.GOLD})`, transition: "width 0.5s" }} />
          </div>
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: THEME.GOLD, flexShrink: 0, minWidth: 80, textAlign: "right" }}>
          {formatCurrency(client.offer_price || client.loan_amt)}
        </div>
        <div style={{ flexShrink: 0, color: THEME.TEXT_DIM }}>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>

      {/* Expanded Dossier */}
      {expanded && (
        <div style={{
          ...glassCard({
            padding: "20px 24px", marginTop: -1, borderTop: "none",
            borderTopLeftRadius: 0, borderTopRightRadius: 0,
            borderColor: `${accent}40`, animation: "fadeIn 0.2s ease-out",
          }),
        }}>
          {/* Details Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 24px", marginBottom: 16 }}>
            {dossierFields.map(({ label, value }) => (
              <div key={label}>
                <div style={{ fontSize: 10, color: THEME.TEXT_DIM, textTransform: "uppercase", letterSpacing: 1.2, fontWeight: 700, marginBottom: 3 }}>{label}</div>
                <div style={{ fontSize: 13, color: THEME.WHITE, fontWeight: 500 }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Notes */}
          <div style={{ background: "rgba(0,0,0,0.3)", padding: "12px 16px", borderRadius: 10, borderLeft: `3px solid ${accent}`, marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <StickyNote size={11} color={THEME.TEXT_DIM} />
              <span style={{ fontSize: 10, color: THEME.TEXT_DIM, textTransform: "uppercase", letterSpacing: 1.2, fontWeight: 700 }}>Notes</span>
            </div>
            <div style={{ fontSize: 13, color: THEME.WHITE, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
              {client.notes || "No notes documented yet."}
            </div>
          </div>

          {/* Client Tasks */}
          {clientTasks.length > 0 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <Flag size={11} color={accent} />
                <span style={{ fontSize: 10, color: accent, textTransform: "uppercase", letterSpacing: 1.2, fontWeight: 700 }}>Tasks ({clientTasks.length})</span>
              </div>
              {clientTasks.map((t) => (
                <TaskRow key={t.id} task={t} />
              ))}
            </div>
          )}
          {clientTasks.length === 0 && (
            <div style={{ fontSize: 12, color: THEME.TEXT_DIM, fontStyle: "italic" }}>No tasks linked to this client.</div>
          )}

          {/* SOP Progress */}
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ fontSize: 10, color: THEME.TEXT_DIM, textTransform: "uppercase", letterSpacing: 1.2, fontWeight: 700, marginBottom: 10 }}>
              Action Trajectory — {progress}/{sop.length} Steps
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {sop.map((step, idx) => (
                <div key={idx} title={step.step} style={{
                  flex: 1, height: 6, borderRadius: 3,
                  background: idx < progress ? `linear-gradient(90deg, ${accent}, ${THEME.GOLD})` : "rgba(255,255,255,0.07)",
                  transition: "background 0.3s",
                }} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const TaskRow = ({ task, clientName }) => {
  const sc = STATUS_CONFIG[task.status] || STATUS_CONFIG.pending;
  const pc = PRIORITY_COLORS[task.priority] || THEME.ORANGE;
  const dueInfo = (() => {
    if (!task.due_date) return null;
    const due = new Date(task.due_date + "T00:00:00");
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const diff = Math.ceil((due - now) / 86400000);
    if (diff < 0) return { text: `${Math.abs(diff)}d overdue`, color: THEME.RED };
    if (diff === 0) return { text: "Today", color: THEME.ORANGE };
    if (diff <= 3) return { text: `${diff}d`, color: THEME.ORANGE };
    return { text: due.toLocaleDateString("en-US", { month: "short", day: "numeric" }), color: THEME.TEXT_DIM };
  })();

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      {task.status === "completed"
        ? <CheckCircle2 size={16} color={THEME.GREEN} />
        : task.status === "in_progress"
        ? <ArrowRight size={16} color={THEME.BLUE} />
        : <Circle size={16} color={THEME.TEXT_DIM} />}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: task.status === "completed" ? THEME.TEXT_DIM : THEME.WHITE, textDecoration: task.status === "completed" ? "line-through" : "none" }}>{task.title}</div>
        {clientName && <div style={{ fontSize: 11, color: THEME.TEXT_DIM, marginTop: 1 }}>{clientName}</div>}
      </div>
      <div style={{ padding: "2px 8px", borderRadius: 4, fontSize: 9, fontWeight: 700, textTransform: "uppercase", background: `${pc}15`, color: pc, letterSpacing: 0.8 }}>{task.priority}</div>
      {dueInfo && <span style={{ fontSize: 11, color: dueInfo.color, fontWeight: 600 }}>{dueInfo.text}</span>}
    </div>
  );
};

// ═══════════════════════════════════════════════════
// BOB DEAN'S BOARD
// ═══════════════════════════════════════════════════
export const BobBoard = ({ clients, tasks }) => {
  const bobClients = useMemo(() => (clients || []).filter((c) => c.agent === "bob"), [clients]);
  const bobTasks = useMemo(() => (tasks || []).filter((t) => t.assigned_to === "bob"), [tasks]);

  const clientMap = useMemo(() => {
    const m = {};
    (clients || []).forEach((c) => { m[c.id] = c.name; });
    return m;
  }, [clients]);

  const totalValue = useMemo(() => {
    return bobClients.reduce((sum, c) => {
      const v = Number(c.offer_price) || Number(c.loan_amt) || 0;
      return sum + v;
    }, 0);
  }, [bobClients]);

  // Investors show under Buyers but keep their Investor badge
  const buyers = bobClients.filter((c) => c.type === "Buyer" || c.type === "Investor");
  const sellers = bobClients.filter((c) => c.type === "Seller");
  const underContract = bobClients.filter((c) => c.stage === "Under Contract" || c.stage === "Due Diligence" || c.stage === "Clear to Close");
  const activeTasks = bobTasks.filter((t) => t.status !== "completed");
  const overdueTasks = bobTasks.filter((t) => {
    if (!t.due_date || t.status === "completed") return false;
    return new Date(t.due_date + "T00:00:00") < new Date(new Date().toDateString());
  });

  return (
    <div style={{ animation: "fadeIn 0.4s ease-out" }}>
      {/* Welcome Banner */}
      <div style={{
        ...glassCard({
          padding: "28px 32px", marginBottom: 28, position: "relative", overflow: "hidden",
          border: `1px solid ${THEME.BLUE}25`,
        }),
      }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${THEME.BLUE}, ${THEME.GOLD}, ${THEME.BLUE})` }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 10, color: THEME.BLUE, fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, marginBottom: 6 }}>Agent Dashboard</div>
            <h2 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: THEME.WHITE, fontFamily: "'Space Grotesk'", letterSpacing: -0.5 }}>
              Bob Dean
            </h2>
            <div style={{ fontSize: 13, color: THEME.TEXT_DIM, marginTop: 4 }}>
              Licensed Real Estate Agent — Burley Sells Florida
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: `linear-gradient(135deg, ${THEME.BLUE}30, ${THEME.GOLD}20)`, border: `1px solid ${THEME.BLUE}40`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Briefcase size={24} color={THEME.BLUE} />
            </div>
          </div>
        </div>
      </div>

      {/* KPI Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        <StatCard icon={<Target size={18} color={THEME.GREEN} />} label="Active Deals" value={bobClients.length} color={THEME.WHITE} accent={THEME.GREEN} />
        <StatCard icon={<DollarSign size={18} color={THEME.GOLD} />} label="Pipeline Value" value={formatCurrency(totalValue)} color={THEME.GOLD} accent={THEME.GOLD} />
        <StatCard icon={<FileText size={18} color={THEME.CYAN} />} label="Under Contract" value={underContract.length} color={THEME.CYAN} accent={THEME.CYAN} />
        <StatCard icon={<AlertCircle size={18} color={overdueTasks.length > 0 ? THEME.RED : THEME.GREEN} />} label="Overdue Tasks" value={overdueTasks.length} color={overdueTasks.length > 0 ? THEME.RED : THEME.GREEN} accent={overdueTasks.length > 0 ? THEME.RED : THEME.GREEN} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* Left: Pipeline by Type */}
        <div>
          {/* Buyers */}
          {buyers.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <Home size={14} color={THEME.BLUE} />
                <span style={{ fontSize: 13, fontWeight: 700, color: THEME.WHITE, textTransform: "uppercase", letterSpacing: 1.2 }}>Buyers</span>
                <span style={{ fontSize: 11, color: THEME.TEXT_DIM, marginLeft: "auto" }}>{buyers.length}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {buyers.map((c) => <MiniClientRow key={c.id} client={c} accent={THEME.BLUE} tasks={tasks} />)}
              </div>
            </div>
          )}

          {/* Sellers */}
          {sellers.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <TrendingUp size={14} color={THEME.GOLD} />
                <span style={{ fontSize: 13, fontWeight: 700, color: THEME.WHITE, textTransform: "uppercase", letterSpacing: 1.2 }}>Sellers</span>
                <span style={{ fontSize: 11, color: THEME.TEXT_DIM, marginLeft: "auto" }}>{sellers.length}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {sellers.map((c) => <MiniClientRow key={c.id} client={c} accent={THEME.GOLD} tasks={tasks} />)}
              </div>
            </div>
          )}

          {bobClients.length === 0 && (
            <div style={{ ...glassCard({ padding: 40, textAlign: "center" }) }}>
              <User size={36} color={THEME.TEXT_DIM} style={{ opacity: 0.3, marginBottom: 12 }} />
              <div style={{ color: THEME.TEXT_DIM, fontSize: 14 }}>No clients assigned yet</div>
            </div>
          )}
        </div>

        {/* Right: Tasks */}
        <div>
          <div style={{ ...glassCard({ padding: "20px 24px" }) }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <Flag size={14} color={THEME.GOLD} />
              <span style={{ fontSize: 13, fontWeight: 700, color: THEME.WHITE, textTransform: "uppercase", letterSpacing: 1.2 }}>My Tasks</span>
              <span style={{ fontSize: 11, color: THEME.TEXT_DIM, marginLeft: "auto" }}>
                {activeTasks.length} active
              </span>
            </div>
            {bobTasks.length === 0 ? (
              <div style={{ padding: 24, textAlign: "center", color: THEME.TEXT_DIM, fontSize: 13 }}>No tasks yet</div>
            ) : (
              <div>
                {bobTasks.slice(0, 15).map((t) => (
                  <TaskRow key={t.id} task={t} clientName={t.client_id ? clientMap[t.client_id] : null} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════
// AMBER'S TC BOARD
// ═══════════════════════════════════════════════════
export const AmberBoard = ({ clients, tasks }) => {
  const amberClients = useMemo(() => (clients || []).filter((c) => c.agent === "amber"), [clients]);
  const amberTasks = useMemo(() => (tasks || []).filter((t) => t.assigned_to === "amber"), [tasks]);

  const clientMap = useMemo(() => {
    const m = {};
    (clients || []).forEach((c) => { m[c.id] = c.name; });
    return m;
  }, [clients]);

  const tcClients = amberClients.filter((c) => c.type === "TC");
  const otherClients = amberClients.filter((c) => c.type !== "TC");

  // Compliance stages
  const stageGroups = useMemo(() => {
    const groups = { "Needs Action": [], "In Review": [], "Compliance": [], "Ready to Close": [], "Closed": [] };
    tcClients.forEach((c) => {
      if (c.stage === "Received" || c.stage === "Pending Sigs") groups["Needs Action"].push(c);
      else if (c.stage === "Docs In Review") groups["In Review"].push(c);
      else if (c.stage === "Compliance") groups["Compliance"].push(c);
      else if (c.stage === "Clear to Close") groups["Ready to Close"].push(c);
      else if (c.stage === "Closed") groups["Closed"].push(c);
      else groups["Needs Action"].push(c);
    });
    return groups;
  }, [tcClients]);

  const activeTasks = amberTasks.filter((t) => t.status !== "completed");
  const urgentTasks = amberTasks.filter((t) => t.priority === "high" && t.status !== "completed");

  const upcomingClosings = amberClients.filter((c) => {
    if (!c.closing_date) return false;
    const d = new Date(c.closing_date + "T00:00:00");
    const now = new Date();
    const diff = (d - now) / 86400000;
    return diff >= 0 && diff <= 14;
  });

  const stageColors = {
    "Needs Action": THEME.RED,
    "In Review": THEME.ORANGE,
    "Compliance": THEME.PURPLE,
    "Ready to Close": THEME.GREEN,
    "Closed": THEME.TEXT_DIM,
  };

  return (
    <div style={{ animation: "fadeIn 0.4s ease-out" }}>
      {/* Welcome Banner */}
      <div style={{
        ...glassCard({
          padding: "28px 32px", marginBottom: 28, position: "relative", overflow: "hidden",
          border: `1px solid ${THEME.PURPLE}25`,
        }),
      }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${THEME.PURPLE}, ${THEME.GOLD}, ${THEME.PURPLE})` }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 10, color: THEME.PURPLE, fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, marginBottom: 6 }}>Transaction Coordinator</div>
            <h2 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: THEME.WHITE, fontFamily: "'Space Grotesk'", letterSpacing: -0.5 }}>
              Amber
            </h2>
            <div style={{ fontSize: 13, color: THEME.TEXT_DIM, marginTop: 4 }}>
              TC & Compliance — Burley Sells Florida
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: `linear-gradient(135deg, ${THEME.PURPLE}30, ${THEME.GOLD}20)`, border: `1px solid ${THEME.PURPLE}40`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Shield size={24} color={THEME.PURPLE} />
            </div>
          </div>
        </div>
      </div>

      {/* KPI Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        <StatCard icon={<FileText size={18} color={THEME.PURPLE} />} label="Active Files" value={amberClients.length} color={THEME.WHITE} accent={THEME.PURPLE} />
        <StatCard icon={<Shield size={18} color={THEME.ORANGE} />} label="In Compliance" value={stageGroups["Compliance"].length} color={THEME.ORANGE} accent={THEME.ORANGE} />
        <StatCard icon={<CheckCircle2 size={18} color={THEME.GREEN} />} label="Ready to Close" value={stageGroups["Ready to Close"].length} color={THEME.GREEN} accent={THEME.GREEN} />
        <StatCard icon={<AlertCircle size={18} color={urgentTasks.length > 0 ? THEME.RED : THEME.GREEN} />} label="Urgent Tasks" value={urgentTasks.length} color={urgentTasks.length > 0 ? THEME.RED : THEME.GREEN} accent={urgentTasks.length > 0 ? THEME.RED : THEME.GREEN} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 24 }}>
        {/* Left: Compliance Pipeline */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: THEME.WHITE, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <Shield size={14} color={THEME.PURPLE} />
            Compliance Pipeline
          </div>

          {Object.entries(stageGroups).map(([groupName, groupClients]) => {
            if (groupClients.length === 0 && groupName === "Closed") return null;
            const gc = stageColors[groupName];
            return (
              <div key={groupName} style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 4, background: gc, boxShadow: `0 0 6px ${gc}` }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: gc, textTransform: "uppercase", letterSpacing: 1 }}>{groupName}</span>
                  <span style={{ fontSize: 11, color: THEME.TEXT_DIM, marginLeft: "auto" }}>{groupClients.length}</span>
                </div>
                {groupClients.length === 0 ? (
                  <div style={{ padding: "10px 16px", fontSize: 12, color: THEME.TEXT_DIM, fontStyle: "italic", background: "rgba(255,255,255,0.02)", borderRadius: 8 }}>
                    No files in this stage
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {groupClients.map((c) => (
                      <MiniClientRow key={c.id} client={c} accent={gc} tasks={tasks} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Non-TC clients */}
          {otherClients.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: THEME.TEXT_DIM, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 12 }}>Other Files</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {otherClients.map((c) => <MiniClientRow key={c.id} client={c} accent={THEME.PURPLE} tasks={tasks} />)}
              </div>
            </div>
          )}

          {amberClients.length === 0 && (
            <div style={{ ...glassCard({ padding: 40, textAlign: "center" }) }}>
              <Shield size={36} color={THEME.TEXT_DIM} style={{ opacity: 0.3, marginBottom: 12 }} />
              <div style={{ color: THEME.TEXT_DIM, fontSize: 14 }}>No files assigned yet</div>
            </div>
          )}
        </div>

        {/* Right: Tasks + Upcoming Closings */}
        <div>
          {/* Upcoming Closings */}
          {upcomingClosings.length > 0 && (
            <div style={{ ...glassCard({ padding: "20px 24px", marginBottom: 20, border: `1px solid ${THEME.ORANGE}20` }) }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, paddingBottom: 10, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <Calendar size={14} color={THEME.ORANGE} />
                <span style={{ fontSize: 12, fontWeight: 700, color: THEME.ORANGE, textTransform: "uppercase", letterSpacing: 1.2 }}>Closing in 14 Days</span>
              </div>
              {upcomingClosings.map((c) => (
                <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                  <Calendar size={12} color={THEME.ORANGE} />
                  <span style={{ flex: 1, fontSize: 13, color: THEME.WHITE, fontWeight: 500 }}>{c.name}</span>
                  <span style={{ fontSize: 12, color: THEME.ORANGE, fontWeight: 600 }}>
                    {new Date(c.closing_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Tasks */}
          <div style={{ ...glassCard({ padding: "20px 24px" }) }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <Flag size={14} color={THEME.PURPLE} />
              <span style={{ fontSize: 13, fontWeight: 700, color: THEME.WHITE, textTransform: "uppercase", letterSpacing: 1.2 }}>My Tasks</span>
              <span style={{ fontSize: 11, color: THEME.TEXT_DIM, marginLeft: "auto" }}>{activeTasks.length} active</span>
            </div>
            {amberTasks.length === 0 ? (
              <div style={{ padding: 24, textAlign: "center", color: THEME.TEXT_DIM, fontSize: 13 }}>No tasks yet</div>
            ) : (
              <div>
                {amberTasks.slice(0, 15).map((t) => (
                  <TaskRow key={t.id} task={t} clientName={t.client_id ? clientMap[t.client_id] : null} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════
// SHEBA'S OWNER BOARD
// ═══════════════════════════════════════════════════
export const ShebaBoard = ({ clients, tasks }) => {
  const shebaClients = useMemo(() => (clients || []).filter((c) => c.agent === "sheba"), [clients]);
  const shebaTasks = useMemo(() => (tasks || []).filter((t) => t.assigned_to === "sheba"), [tasks]);

  const clientMap = useMemo(() => {
    const m = {};
    (clients || []).forEach((c) => { m[c.id] = c.name; });
    return m;
  }, [clients]);

  const totalValue = useMemo(() =>
    shebaClients.reduce((sum, c) => sum + (Number(c.offer_price) || Number(c.loan_amt) || 0), 0)
  , [shebaClients]);

  const buyers = shebaClients.filter((c) => c.type === "Buyer");
  const sellers = shebaClients.filter((c) => c.type === "Seller");
  const investors = shebaClients.filter((c) => c.type === "Investor");
  const tcFiles = shebaClients.filter((c) => c.type === "TC");
  const underContract = shebaClients.filter((c) => c.stage === "Under Contract" || c.stage === "Due Diligence" || c.stage === "Clear to Close");
  const activeTasks = shebaTasks.filter((t) => t.status !== "completed");
  const overdueTasks = shebaTasks.filter((t) => {
    if (!t.due_date || t.status === "completed") return false;
    return new Date(t.due_date + "T00:00:00") < new Date(new Date().toDateString());
  });

  const sections = [
    { label: "Buyers", items: buyers, icon: <Home size={14} color={THEME.BLUE} />, accent: THEME.BLUE },
    { label: "Sellers", items: sellers, icon: <TrendingUp size={14} color={THEME.GOLD} />, accent: THEME.GOLD },
    { label: "Investors", items: investors, icon: <Star size={14} color={THEME.GREEN} />, accent: THEME.GREEN },
    { label: "TC Files", items: tcFiles, icon: <FileText size={14} color={THEME.PURPLE} />, accent: THEME.PURPLE },
  ];

  return (
    <div style={{ animation: "fadeIn 0.4s ease-out" }}>
      <div style={{ ...glassCard({ padding: "28px 32px", marginBottom: 28, position: "relative", overflow: "hidden", border: `1px solid ${THEME.GOLD}25` }) }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${THEME.GOLD}, ${THEME.CYAN}, ${THEME.GOLD})` }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 10, color: THEME.GOLD, fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, marginBottom: 6 }}>Owner Dashboard</div>
            <h2 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: THEME.WHITE, fontFamily: "'Space Grotesk'", letterSpacing: -0.5 }}>Sheba</h2>
            <div style={{ fontSize: 13, color: THEME.TEXT_DIM, marginTop: 4 }}>Broker & Lead Agent — Burley Sells Florida</div>
          </div>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: `linear-gradient(135deg, ${THEME.GOLD}30, ${THEME.CYAN}20)`, border: `1px solid ${THEME.GOLD}40`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Crown size={24} color={THEME.GOLD} />
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        <StatCard icon={<Target size={18} color={THEME.GREEN} />} label="My Deals" value={shebaClients.length} color={THEME.WHITE} accent={THEME.GREEN} />
        <StatCard icon={<DollarSign size={18} color={THEME.GOLD} />} label="Pipeline Value" value={formatCurrency(totalValue)} color={THEME.GOLD} accent={THEME.GOLD} />
        <StatCard icon={<FileText size={18} color={THEME.CYAN} />} label="Under Contract" value={underContract.length} color={THEME.CYAN} accent={THEME.CYAN} />
        <StatCard icon={<AlertCircle size={18} color={overdueTasks.length > 0 ? THEME.RED : THEME.GREEN} />} label="Overdue Tasks" value={overdueTasks.length} color={overdueTasks.length > 0 ? THEME.RED : THEME.GREEN} accent={overdueTasks.length > 0 ? THEME.RED : THEME.GREEN} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div>
          {sections.map(({ label, items, icon, accent }) =>
            items.length > 0 ? (
              <div key={label} style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  {icon}
                  <span style={{ fontSize: 13, fontWeight: 700, color: THEME.WHITE, textTransform: "uppercase", letterSpacing: 1.2 }}>{label}</span>
                  <span style={{ fontSize: 11, color: THEME.TEXT_DIM, marginLeft: "auto" }}>{items.length}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {items.map((c) => <MiniClientRow key={c.id} client={c} accent={accent} tasks={tasks} />)}
                </div>
              </div>
            ) : null
          )}
          {shebaClients.length === 0 && (
            <div style={{ ...glassCard({ padding: 40, textAlign: "center" }) }}>
              <Crown size={36} color={THEME.TEXT_DIM} style={{ opacity: 0.3, marginBottom: 12 }} />
              <div style={{ color: THEME.TEXT_DIM, fontSize: 14 }}>No clients assigned yet</div>
            </div>
          )}
        </div>
        <div>
          <div style={{ ...glassCard({ padding: "20px 24px" }) }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <Flag size={14} color={THEME.GOLD} />
              <span style={{ fontSize: 13, fontWeight: 700, color: THEME.WHITE, textTransform: "uppercase", letterSpacing: 1.2 }}>My Tasks</span>
              <span style={{ fontSize: 11, color: THEME.TEXT_DIM, marginLeft: "auto" }}>{activeTasks.length} active</span>
            </div>
            {shebaTasks.length === 0 ? (
              <div style={{ padding: 24, textAlign: "center", color: THEME.TEXT_DIM, fontSize: 13 }}>No tasks yet</div>
            ) : (
              <div>
                {shebaTasks.slice(0, 15).map((t) => (
                  <TaskRow key={t.id} task={t} clientName={t.client_id ? clientMap[t.client_id] : null} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
