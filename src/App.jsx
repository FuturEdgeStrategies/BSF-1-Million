import { useState, useEffect, useCallback, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import {
  Activity, DollarSign, Zap, Calendar as CalendarIcon, User, ChevronRight,
  CheckCircle2, Circle, Plus, LayoutDashboard, ListTodo,
  Briefcase, Shield, Bot, Pencil,
} from "lucide-react";
import { THEME, AGENTS, getSOP, getProgress, glassCard, formatCurrency, agentName, calculateCommission, TIMELINE_FIELDS, UNDER_CONTRACT_STAGES, getDateStatus } from "./theme";
import { supabase } from "./supabaseClient";
import { AddClientModal, AddTaskModal, EditClientModal, EditTaskModal } from "./Modals";
import TaskHub from "./TaskHub";
import AIChatWindow from "./AIChatWindow";
import { BobBoard, AmberBoard, ClientAvatar } from "./TeamBoards";
import AdminChat from "./AdminChat";
import CalendarView from "./Calendar";

// ═══════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════

const TypeBadge = ({ type }) => {
  const colors = { Buyer: THEME.BLUE, Seller: THEME.GOLD, TC: THEME.PURPLE, Investor: THEME.GREEN };
  const c = colors[type] ?? THEME.TEXT_DIM;
  return (
    <div style={{ display: "inline-flex", padding: "4px 12px", borderRadius: 20, fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", background: `${c}18`, color: c, border: `1px solid ${c}35`, alignItems: "center", gap: 6 }}>
      <div style={{ width: 6, height: 6, borderRadius: 3, background: c, boxShadow: `0 0 6px ${c}` }} />
      {type}
    </div>
  );
};

const KpiCard = ({ icon, label, value, valueColor, accentColor, delay = 0 }) => (
  <div style={{ ...glassCard({ padding: 28, boxShadow: `0 10px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06), 0 0 24px ${accentColor ?? THEME.GOLD}08`, position: "relative", overflow: "hidden", animation: `cardEntrance 0.4s ease-out ${delay}s both` }) }}>
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, transparent, ${accentColor ?? THEME.GOLD}CC, transparent)`, animation: "borderGlow 3s ease-in-out infinite" }} />
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: `${accentColor ?? THEME.GOLD}18`, border: `1px solid ${accentColor ?? THEME.GOLD}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {icon}
      </div>
      <span style={{ fontSize: 11, color: THEME.TEXT_DIM, textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 600 }}>{label}</span>
    </div>
    <div style={{ fontSize: 40, fontWeight: 700, color: valueColor ?? THEME.WHITE, lineHeight: 1, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: -1, textShadow: `0 0 24px ${valueColor ?? THEME.GOLD_GLOW}` }}>
      {value}
    </div>
  </div>
);

const LoadingSkeleton = () => (
  <div style={{ padding: 40, maxWidth: 1440, margin: "0 auto" }}>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginBottom: 32 }}>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} style={{ ...glassCard({ padding: 28, height: 120 }) }}>
          <div style={{ width: 120, height: 12, borderRadius: 6, background: "rgba(255,255,255,0.06)", marginBottom: 16, animation: "skeletonPulse 1.5s ease-in-out infinite" }} />
          <div style={{ width: 80, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.04)", animation: "skeletonPulse 1.5s ease-in-out 0.2s infinite" }} />
        </div>
      ))}
    </div>
    {[0, 1, 2].map((i) => (
      <div key={i} style={{ ...glassCard({ padding: 22, marginBottom: 12, height: 72 }) }}>
        <div style={{ width: "40%", height: 14, borderRadius: 6, background: "rgba(255,255,255,0.05)", animation: "skeletonPulse 1.5s ease-in-out infinite" }} />
      </div>
    ))}
  </div>
);

const Toast = ({ message, type, onDone }) => {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);
  const bg = type === "error" ? "rgba(255,59,48,0.15)" : "rgba(62,207,142,0.15)";
  const border = type === "error" ? "rgba(255,59,48,0.4)" : "rgba(62,207,142,0.4)";
  const color = type === "error" ? THEME.RED : THEME.GREEN;
  return (
    <div style={{
      position: "fixed", top: 20, right: 20, zIndex: 3000,
      padding: "14px 22px", borderRadius: 12,
      background: bg, border: `1px solid ${border}`, color,
      fontSize: 13, fontWeight: 600, fontFamily: "'Space Grotesk'",
      backdropFilter: "blur(20px)", boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      animation: "toastIn 0.3s ease-out",
      display: "flex", alignItems: "center", gap: 8,
    }}>
      {type === "error" ? "✕" : "✓"} {message}
    </div>
  );
};

// ═══════════════════════════════════════════════════
// TABS
// ═══════════════════════════════════════════════════
const TABS = [
  { id: "dashboard", label: "Dashboard",  icon: <LayoutDashboard size={15} /> },
  { id: "tasks",     label: "Task Hub",   icon: <ListTodo size={15} /> },
  { id: "bob",       label: "Bob Dean",   icon: <Briefcase size={15} /> },
  { id: "amber",     label: "Amber — TC", icon: <Shield size={15} /> },
  { id: "calendar",  label: "Calendar",   icon: <CalendarIcon size={15} /> },
  { id: "command",   label: "Command",    icon: <Bot size={15} /> },
];

// ═══════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════
export default function DealCommandCenter() {
  const [clients, setClients] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [activeAgent, setActiveAgent] = useState("all");
  const [selectedClient, setSelectedClient] = useState(null);
  const [showAddClient, setShowAddClient] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [toast, setToast] = useState(null);
  const [now, setNow] = useState(new Date());

  // ── Fetch Data ──
  const fetchClients = useCallback(async () => {
    const { data, error } = await supabase.from("clients").select("*").order("created_at", { ascending: false });
    if (!error && data) setClients(data);
    if (error) setToast({ message: "Failed to load clients", type: "error" });
  }, []);

  const fetchTasks = useCallback(async () => {
    const { data, error } = await supabase.from("tasks").select("*").order("created_at", { ascending: false });
    if (!error && data) setTasks(data);
  }, []);

  const fetchEvents = useCallback(async () => {
    const { data, error } = await supabase.from("events").select("*").order("event_date", { ascending: true });
    if (!error && data) setEvents(data);
  }, []);

  const refreshAll = useCallback(() => {
    fetchClients();
    fetchTasks();
    fetchEvents();
  }, [fetchClients, fetchTasks, fetchEvents]);

  // ── Initial Load + Realtime ──
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchClients(), fetchTasks(), fetchEvents()]);
      setLoading(false);
    };
    load();
  }, [fetchClients, fetchTasks, fetchEvents]);

  useEffect(() => {
    const channel = supabase
      .channel("realtime-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "clients" }, () => fetchClients())
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, () => fetchTasks())
      .on("postgres_changes", { event: "*", schema: "public", table: "events" }, () => fetchEvents())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchClients, fetchTasks, fetchEvents]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // ── Computed ──
  const filteredClients = useMemo(() =>
    activeAgent === "all" ? clients : clients.filter((c) => c.agent === activeAgent)
  , [clients, activeAgent]);

  const chartData = useMemo(() => {
    const stats = filteredClients.reduce((acc, c) => { acc[c.stage] = (acc[c.stage] || 0) + 1; return acc; }, {});
    return Object.keys(stats).map((k) => ({ name: k, count: stats[k] }));
  }, [filteredClients]);

  const totalPipelineValue = useMemo(() => {
    return filteredClients.reduce((sum, c) => {
      const v = Number(c.offer_price) || Number(c.loan_amt) || 0;
      return sum + v;
    }, 0);
  }, [filteredClients]);

  const closingSoonCount = useMemo(() => {
    return filteredClients.filter((c) => {
      if (!c.closing_date) return false;
      const d = new Date(c.closing_date + "T00:00:00");
      const diff = (d - new Date()) / 86400000;
      return diff >= 0 && diff <= 30;
    }).length;
  }, [filteredClients]);

  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });

  // ── Handlers ──
  const handleClientAdded = () => {
    fetchClients();
    setToast({ message: "Client added successfully", type: "success" });
  };

  const handleTaskAdded = () => {
    fetchTasks();
    setToast({ message: "Task created successfully", type: "success" });
  };

  const handleClientUpdated = () => {
    fetchClients();
    setEditingClient(null);
    setToast({ message: "Client updated", type: "success" });
  };

  const handleClientDeleted = () => {
    fetchClients();
    fetchTasks();
    setEditingClient(null);
    setToast({ message: "Client deleted", type: "success" });
  };

  const handleTaskUpdated = () => {
    fetchTasks();
    setEditingTask(null);
    setToast({ message: "Task updated", type: "success" });
  };

  const handleTaskDeleted = () => {
    fetchTasks();
    setEditingTask(null);
    setToast({ message: "Task deleted", type: "success" });
  };

  return (
    <div style={{ minHeight: "100vh", color: THEME.WHITE }}>
      {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}

      {/* ══════════ HEADER ══════════ */}
      <header className="bsf-header" style={{
        padding: "0 40px", height: 80,
        borderBottom: `1px solid ${THEME.GLASS_BORDER}`,
        background: "linear-gradient(180deg, rgba(5,10,18,0.97) 0%, rgba(5,10,18,0.88) 100%)",
        backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
        position: "sticky", top: 0, zIndex: 50,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        boxShadow: `0 1px 0 ${THEME.GOLD}20, 0 4px 32px rgba(0,0,0,0.5)`,
      }}>
        {/* LEFT: Logo */}
        <div className="bsf-logo-section" style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <img
            src="/logo.png.png"
            alt="Burley Sells Florida"
            className="bsf-logo-img"
            style={{ height: 68, objectFit: "contain", filter: "drop-shadow(0 0 14px rgba(201,168,76,0.5)) drop-shadow(0 0 30px rgba(201,168,76,0.2))", animation: "logoGlow 4s ease-in-out infinite" }}
          />
          <div>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: -0.3, color: THEME.WHITE, fontFamily: "'Space Grotesk'", animation: "neonFlicker 10s infinite" }}>
              Deal Command Center
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
              <div style={{ width: 6, height: 6, borderRadius: 3, background: THEME.RED, boxShadow: `0 0 8px ${THEME.RED}`, animation: "livePulse 1.5s infinite" }} />
              <span style={{ fontSize: 10, color: THEME.GOLD, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase" }}>Live · {timeStr}</span>
            </div>
            <div style={{ fontSize: 8, color: THEME.GOLD_DIM, textTransform: "uppercase", letterSpacing: 3, marginTop: 2, fontWeight: 600 }}>Burley Sells Florida</div>
          </div>
        </div>

        {/* CENTER: Tabs */}
        <div className="bsf-tabs" style={{ display: "flex", gap: 2, background: "rgba(255,255,255,0.03)", padding: "5px 6px", borderRadius: 12, border: `1px solid ${THEME.GLASS_BORDER}` }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className="bsf-tab-btn"
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "7px 18px", borderRadius: 8,
                border: activeTab === tab.id ? `1px solid ${THEME.GOLD}40` : "1px solid transparent",
                cursor: "pointer", fontFamily: "'Space Grotesk'", fontSize: 12, fontWeight: 600,
                background: activeTab === tab.id ? `linear-gradient(135deg, ${THEME.GOLD}20, ${THEME.GOLD}08)` : "transparent",
                color: activeTab === tab.id ? THEME.GOLD : THEME.TEXT_DIM,
                transition: "all 0.2s",
                boxShadow: activeTab === tab.id ? `0 0 12px ${THEME.GOLD_GLOW}` : "none",
                display: "flex", alignItems: "center", gap: 6,
              }}
            >
              {tab.icon}
              <span className="bsf-tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* RIGHT: Actions */}
        <div className="bsf-header-actions" style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setShowAddClient(true)}
            style={{
              padding: "8px 16px", borderRadius: 10, border: `1px solid ${THEME.GOLD}40`,
              background: `linear-gradient(135deg, ${THEME.GOLD}15, transparent)`,
              color: THEME.GOLD, cursor: "pointer", fontFamily: "'Space Grotesk'",
              fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 5,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = `linear-gradient(135deg, ${THEME.GOLD}25, ${THEME.GOLD}10)`; e.currentTarget.style.boxShadow = `0 0 16px ${THEME.GOLD_GLOW}`; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = `linear-gradient(135deg, ${THEME.GOLD}15, transparent)`; e.currentTarget.style.boxShadow = "none"; }}
          >
            <Plus size={14} /> Client
          </button>
          <button
            onClick={() => setShowAddTask(true)}
            style={{
              padding: "8px 16px", borderRadius: 10, border: `1px solid ${THEME.BLUE}40`,
              background: `linear-gradient(135deg, ${THEME.BLUE}15, transparent)`,
              color: THEME.BLUE, cursor: "pointer", fontFamily: "'Space Grotesk'",
              fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 5,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = `linear-gradient(135deg, ${THEME.BLUE}25, ${THEME.BLUE}10)`; e.currentTarget.style.boxShadow = `0 0 16px rgba(59,130,246,0.15)`; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = `linear-gradient(135deg, ${THEME.BLUE}15, transparent)`; e.currentTarget.style.boxShadow = "none"; }}
          >
            <Plus size={14} /> Task
          </button>
        </div>
      </header>

      {/* ══════════ CONTENT ══════════ */}
      {loading ? (
        <LoadingSkeleton />
      ) : (
        <div className="bsf-content" style={{ padding: "32px 40px 120px", maxWidth: 1440, margin: "0 auto" }}>

          {/* ── DASHBOARD TAB ── */}
          {activeTab === "dashboard" && (
            <div style={{ animation: "fadeIn 0.35s ease-out" }}>
              {/* Agent filter (dashboard only) */}
              <div style={{ display: "flex", gap: 6, marginBottom: 28 }}>
                {AGENTS.map((agent) => (
                  <button key={agent.id} onClick={() => setActiveAgent(agent.id)} style={{
                    padding: "7px 18px", borderRadius: 8,
                    border: activeAgent === agent.id ? `1px solid ${THEME.GOLD}50` : `1px solid ${THEME.GLASS_BORDER}`,
                    cursor: "pointer", fontFamily: "'Space Grotesk'", fontSize: 12, fontWeight: 600,
                    background: activeAgent === agent.id ? `linear-gradient(135deg, ${THEME.GOLD}20, ${THEME.GOLD}08)` : "rgba(255,255,255,0.03)",
                    color: activeAgent === agent.id ? THEME.GOLD : THEME.TEXT_DIM,
                    transition: "all 0.2s",
                  }}>
                    {agent.name}
                  </button>
                ))}
              </div>

              {/* KPI Row */}
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "80%", height: "150%", background: `radial-gradient(ellipse at center, ${THEME.GOLD}08 0%, transparent 70%)`, pointerEvents: "none", zIndex: 0 }} />
              <div className="bsf-kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginBottom: 28, position: "relative", zIndex: 1 }}>
                <KpiCard icon={<Activity size={20} color={THEME.GREEN} />} label="Active Deals" value={filteredClients.length} valueColor={THEME.WHITE} accentColor={THEME.GREEN} delay={0} />
                <KpiCard icon={<DollarSign size={20} color={THEME.GOLD} />} label="Pipeline Volume" value={totalPipelineValue > 0 ? formatCurrency(totalPipelineValue) : "—"} valueColor={THEME.GOLD} accentColor={THEME.GOLD} delay={0.05} />
                <KpiCard icon={<Zap size={20} color={THEME.CYAN} />} label="Under Contract" value={filteredClients.filter((c) => c.stage === "Under Contract").length} valueColor={THEME.CYAN} accentColor={THEME.CYAN} delay={0.1} />
                <KpiCard icon={<CalendarIcon size={20} color={THEME.ORANGE} />} label="Closing Soon" value={closingSoonCount} valueColor={THEME.ORANGE} accentColor={THEME.ORANGE} delay={0.15} />
              </div>
              </div>

              {/* Chart */}
              <div style={{ ...glassCard({ padding: 32, marginBottom: 32, boxShadow: "0 10px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)", position: "relative", overflow: "hidden" }) }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${THEME.BLUE}, transparent)`, animation: "borderGlow 4s ease-in-out infinite" }} />
                <h3 style={{ margin: "0 0 24px 0", fontSize: 14, color: THEME.WHITE, fontWeight: 700, fontFamily: "'Space Grotesk'", display: "flex", alignItems: "center", gap: 10, textTransform: "uppercase", letterSpacing: 1.2 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 4, background: THEME.BLUE, boxShadow: `0 0 8px ${THEME.BLUE}` }} />
                  Pipeline Distribution
                </h3>
                <div style={{ minHeight: 260 }}>
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={chartData} barSize={32}>
                        <XAxis dataKey="name" stroke={THEME.TEXT_DIM} fontSize={11} tickLine={false} axisLine={false} fontFamily="Space Grotesk" />
                        <YAxis stroke={THEME.TEXT_DIM} fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} fontFamily="Space Grotesk" />
                        <Tooltip cursor={{ fill: "rgba(201,168,76,0.04)" }} contentStyle={{ backgroundColor: "rgba(9,23,40,0.95)", border: `1px solid ${THEME.GOLD}40`, borderRadius: 10, color: THEME.WHITE, fontFamily: "Space Grotesk", backdropFilter: "blur(20px)" }} />
                        <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                          {chartData.map((_, i) => (
                            <Cell key={i} fill={[THEME.GOLD, THEME.BLUE, THEME.GREEN, THEME.PURPLE, THEME.CYAN, THEME.ORANGE][i % 6]} fillOpacity={0.85} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ display: "flex", height: 260, alignItems: "center", justifyContent: "center", color: THEME.TEXT_DIM, flexDirection: "column", gap: 8 }}>
                      <Activity size={32} style={{ opacity: 0.3 }} />
                      <span>No active deals in this view</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Client Portfolio */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, paddingBottom: 14, borderBottom: `1px solid ${THEME.GLASS_BORDER}` }}>
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: THEME.WHITE, fontFamily: "'Space Grotesk'", textTransform: "uppercase", letterSpacing: -0.5 }}>Client Portfolio</h2>
                  <span style={{ fontSize: 11, fontWeight: 600, color: THEME.TEXT_DIM, background: "rgba(255,255,255,0.05)", padding: "4px 12px", borderRadius: 20, border: `1px solid ${THEME.GLASS_BORDER}` }}>
                    {filteredClients.length} records
                  </span>
                </div>

                {filteredClients.length === 0 ? (
                  <div style={{ ...glassCard({ padding: 60, textAlign: "center" }) }}>
                    <User size={40} color={THEME.TEXT_DIM} style={{ opacity: 0.3, marginBottom: 12 }} />
                    <div style={{ fontSize: 15, color: THEME.TEXT_DIM, fontWeight: 500 }}>No clients yet</div>
                    <div style={{ fontSize: 13, color: THEME.TEXT_DIM, marginTop: 6, opacity: 0.7 }}>Add your first client to get started</div>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {filteredClients.map((client, idx) => {
                      const sop = getSOP(client.type);
                      const isSelected = selectedClient?.id === client.id;
                      const progress = getProgress(client);
                      const pct = sop.length > 0 ? (progress / sop.length) * 100 : 0;

                      return (
                        <div key={client.id} style={{ animation: `cardEntrance 0.35s ease-out ${idx * 0.04}s both` }}>
                          {/* Row */}
                          <div
                            onClick={() => setSelectedClient(isSelected ? null : client)}
                            onMouseEnter={(e) => { if (!isSelected) { e.currentTarget.style.borderColor = `${THEME.GOLD}50`; e.currentTarget.style.boxShadow = `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px ${THEME.GOLD}20`; } }}
                            onMouseLeave={(e) => { if (!isSelected) { e.currentTarget.style.borderColor = THEME.GLASS_BORDER; e.currentTarget.style.boxShadow = "none"; } }}
                            style={{
                              ...glassCard({
                                padding: "20px 26px",
                                borderRadius: isSelected ? "16px 16px 0 0" : 16,
                                border: `1px solid ${isSelected ? THEME.GOLD + "60" : THEME.GLASS_BORDER}`,
                                boxShadow: isSelected ? `0 0 0 1px ${THEME.GOLD}30, 0 12px 48px rgba(0,0,0,0.5)` : "none",
                                cursor: "pointer", display: "flex", alignItems: "center", gap: 20,
                                transition: "all 0.25s ease",
                              }),
                            }}
                            className="bsf-client-row"
                          >
                            <div style={{ flex: "0 0 220px" }}>
                              <div style={{ fontSize: 15, fontWeight: 600, color: THEME.WHITE, marginBottom: 8, display: "flex", alignItems: "center", gap: 8, fontFamily: "'Space Grotesk'" }}>
                                <ClientAvatar client={client} size={30} accent={THEME.GOLD} />
                                {client.name}
                              </div>
                              <TypeBadge type={client.type} />
                            </div>

                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 10, color: THEME.TEXT_DIM, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 3, fontWeight: 700 }}>Stage</div>
                              <div style={{ fontSize: 14, fontWeight: 500, color: THEME.WHITE }}>{client.stage}</div>
                            </div>

                            <div style={{ flex: "0 0 160px" }}>
                              <div style={{ fontSize: 10, color: THEME.TEXT_DIM, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 3, fontWeight: 700 }}>Value</div>
                              <div style={{ fontSize: 14, fontWeight: 600, color: THEME.GOLD, textShadow: `0 0 16px ${THEME.GOLD_GLOW}` }}>
                                {formatCurrency(client.offer_price || client.loan_amt)}
                              </div>
                            </div>

                            <div style={{ width: 140 }}>
                              <div style={{ fontSize: 10, color: THEME.TEXT_DIM, marginBottom: 6, display: "flex", justifyContent: "space-between", fontWeight: 700, letterSpacing: 0.5 }}>
                                <span>Progress</span>
                                <span style={{ color: THEME.GREEN }}>{Math.round(pct)}%</span>
                              </div>
                              <div style={{ height: 5, background: "rgba(255,255,255,0.07)", borderRadius: 3, overflow: "hidden" }}>
                                <div style={{
                                  height: "100%", width: `${pct}%`, borderRadius: 3,
                                  background: `linear-gradient(90deg, ${THEME.GREEN}, ${THEME.GOLD})`,
                                  backgroundSize: "200% 100%",
                                  animation: "progressShimmer 2.5s linear infinite",
                                  boxShadow: `0 0 8px ${THEME.GREEN}60`,
                                  transition: "width 0.5s",
                                }} />
                              </div>
                            </div>

                            <ChevronRight size={20} color={isSelected ? THEME.GOLD : THEME.TEXT_DIM} style={{ transform: isSelected ? "rotate(90deg)" : "none", transition: "transform 0.3s", flexShrink: 0 }} />
                          </div>

                          {/* Expanded Detail */}
                          {isSelected && (
                            <div className="bsf-client-detail" style={{
                              ...glassCard({
                                border: `1px solid ${THEME.GOLD}50`, borderTop: "none",
                                borderRadius: "0 0 16px 16px", padding: 32,
                                display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 40,
                                animation: "fadeIn 0.3s ease-out",
                              }),
                            }}>
                              {/* Left: Dossier */}
                              <div>
                                <h4 style={{ fontSize: 12, fontWeight: 700, color: THEME.GOLD, borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: 12, marginBottom: 20, textTransform: "uppercase", letterSpacing: 1.5, fontFamily: "'Space Grotesk'" }}>Client Dossier</h4>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 22 }}>
                                  {[
                                    { label: "Pre-Approval", value: client.pre_approval || "N/A" },
                                    { label: "Lender", value: client.lender || "N/A" },
                                    { label: "Target Close", value: client.closing_date ? new Date(client.closing_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "TBD" },
                                    { label: "Agent", value: agentName(client.agent) },
                                    { label: "Loan Amount", value: formatCurrency(client.loan_amt) },
                                    { label: "Offer Price", value: formatCurrency(client.offer_price) },
                                  ].map(({ label, value }) => (
                                    <div key={label}>
                                      <div style={{ fontSize: 10, color: THEME.TEXT_DIM, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 5, fontWeight: 700 }}>{label}</div>
                                      <div style={{ color: THEME.WHITE, fontSize: 13, fontWeight: 500 }}>{value}</div>
                                    </div>
                                  ))}
                                </div>
                                <div style={{ background: "rgba(0,0,0,0.3)", padding: "14px 16px", borderRadius: 10, borderLeft: `3px solid ${THEME.GOLD}` }}>
                                  <div style={{ fontSize: 10, color: THEME.TEXT_DIM, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6, fontWeight: 700 }}>Strategic Notes</div>
                                  <div style={{ fontSize: 13, color: THEME.WHITE, lineHeight: 1.65 }}>{client.notes || "No notes documented yet."}</div>
                                </div>
                                {UNDER_CONTRACT_STAGES.includes(client.stage) && (
                                  <div style={{ marginTop: 18, padding: "14px 16px", borderRadius: 10, background: "rgba(0,0,0,0.3)", borderLeft: `3px solid ${THEME.CYAN}` }}>
                                    <div style={{ fontSize: 10, color: THEME.CYAN, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                                      <CalendarIcon size={11} color={THEME.CYAN} />
                                      Transaction Timeline
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                      {TIMELINE_FIELDS.map(({ key, label }) => {
                                        const status = getDateStatus(client[key]);
                                        return (
                                          <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                                            <span style={{ fontSize: 12, color: THEME.TEXT_DIM, fontWeight: 500 }}>{label}</span>
                                            <span style={{ fontSize: 12, color: status.color, fontWeight: status.urgent ? 700 : 500, fontFamily: "'Space Grotesk'" }}>{status.text}</span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                                {(() => {
                                  const comm = calculateCommission(client);
                                  if (!comm) return null;
                                  return (
                                    <div style={{ marginTop: 18, padding: "14px 16px", borderRadius: 10, background: "rgba(0,0,0,0.3)", borderLeft: `3px solid ${THEME.GOLD}` }}>
                                      <div style={{ fontSize: 10, color: THEME.GOLD, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10, fontWeight: 700 }}>Commission Breakdown</div>
                                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px" }}>
                                        <div>
                                          <div style={{ fontSize: 10, color: THEME.TEXT_DIM, fontWeight: 600 }}>Gross ({(comm.rate * 100).toFixed(1)}%)</div>
                                          <div style={{ fontSize: 13, color: THEME.WHITE, fontWeight: 600 }}>{formatCurrency(comm.grossCommission)}</div>
                                        </div>
                                        <div>
                                          <div style={{ fontSize: 10, color: THEME.TEXT_DIM, fontWeight: 600 }}>Brokerage (10%)</div>
                                          <div style={{ fontSize: 13, color: THEME.RED, fontWeight: 600 }}>-{formatCurrency(comm.brokerageCut)}</div>
                                        </div>
                                        <div>
                                          <div style={{ fontSize: 10, color: THEME.TEXT_DIM, fontWeight: 600 }}>Split</div>
                                          <div style={{ fontSize: 13, color: THEME.WHITE, fontWeight: 500 }}>{comm.splitLabel}</div>
                                        </div>
                                        <div>
                                          <div style={{ fontSize: 10, color: THEME.GOLD, fontWeight: 700 }}>My Take-Home</div>
                                          <div style={{ fontSize: 15, color: THEME.GOLD, fontWeight: 700, textShadow: `0 0 12px ${THEME.GOLD_GLOW}` }}>{formatCurrency(comm.myTakeHome)}</div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })()}
                                <button
                                  onClick={(e) => { e.stopPropagation(); setEditingClient(client); }}
                                  style={{
                                    marginTop: 18, padding: "9px 20px", borderRadius: 10,
                                    border: `1px solid ${THEME.GOLD}40`,
                                    background: `linear-gradient(135deg, ${THEME.GOLD}15, transparent)`,
                                    color: THEME.GOLD, cursor: "pointer", fontFamily: "'Space Grotesk'",
                                    fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 6,
                                    transition: "all 0.2s",
                                  }}
                                  onMouseEnter={(e) => { e.currentTarget.style.background = `linear-gradient(135deg, ${THEME.GOLD}25, ${THEME.GOLD}10)`; e.currentTarget.style.boxShadow = `0 0 16px ${THEME.GOLD_GLOW}`; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.background = `linear-gradient(135deg, ${THEME.GOLD}15, transparent)`; e.currentTarget.style.boxShadow = "none"; }}
                                >
                                  <Pencil size={13} /> Edit Client
                                </button>
                              </div>

                              {/* Right: SOP */}
                              <div>
                                <h4 style={{ fontSize: 12, fontWeight: 700, color: THEME.GOLD, borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: 12, marginBottom: 20, textTransform: "uppercase", letterSpacing: 1.5, fontFamily: "'Space Grotesk'" }}>Action Trajectory</h4>
                                <div style={{ maxHeight: 300, overflowY: "auto", paddingRight: 8 }}>
                                  {sop.map((step, stepIdx) => {
                                    const isComplete = stepIdx < progress;
                                    const isCurrent = stepIdx === progress;
                                    return (
                                      <div key={stepIdx} style={{ display: "flex", gap: 12, marginBottom: 12, opacity: isComplete ? 0.45 : 1, transition: "opacity 0.2s" }}>
                                        <div style={{ paddingTop: 2, flexShrink: 0 }}>
                                          {isComplete
                                            ? <CheckCircle2 size={16} color={THEME.GREEN} style={{ filter: `drop-shadow(0 0 4px ${THEME.GREEN})` }} />
                                            : isCurrent
                                              ? <Circle size={16} color={THEME.GOLD} style={{ filter: `drop-shadow(0 0 6px ${THEME.GOLD})` }} />
                                              : <Circle size={16} color={THEME.TEXT_DIM} />}
                                        </div>
                                        <div>
                                          <div style={{ fontSize: 13, fontWeight: isCurrent ? 600 : 400, color: isCurrent ? THEME.WHITE : isComplete ? THEME.TEXT_DIM : "rgba(255,255,255,0.4)" }}>{step.step}</div>
                                          <div style={{ fontSize: 10, color: isCurrent ? THEME.GOLD : THEME.TEXT_DIM, marginTop: 2, letterSpacing: 0.3 }}>Phase: {step.stage}</div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── TASK HUB TAB ── */}
          {activeTab === "tasks" && <TaskHub tasks={tasks} clients={clients} onRefresh={fetchTasks} onEditTask={setEditingTask} />}

          {/* ── BOB TAB ── */}
          {activeTab === "bob" && <BobBoard clients={clients} tasks={tasks} />}

          {/* ── AMBER TAB ── */}
          {activeTab === "amber" && <AmberBoard clients={clients} tasks={tasks} />}

          {/* ── CALENDAR TAB ── */}
          {activeTab === "calendar" && <CalendarView events={events} clients={clients} />}

          {/* ── COMMAND CENTER TAB ── */}
          {activeTab === "command" && <AdminChat clients={clients} tasks={tasks} onRefresh={refreshAll} />}
        </div>
      )}

      {/* ── AI CHAT ── */}
      <AIChatWindow clients={clients} tasks={tasks} onRefresh={refreshAll} />

      {/* ── MODALS ── */}
      {showAddClient && <AddClientModal onClose={() => setShowAddClient(false)} onAdded={handleClientAdded} />}
      {showAddTask && <AddTaskModal onClose={() => setShowAddTask(false)} onAdded={handleTaskAdded} clients={clients} />}
      {editingClient && <EditClientModal client={editingClient} onClose={() => setEditingClient(null)} onUpdated={handleClientUpdated} onDeleted={handleClientDeleted} />}
      {editingTask && <EditTaskModal task={editingTask} onClose={() => setEditingTask(null)} onUpdated={handleTaskUpdated} onDeleted={handleTaskDeleted} clients={clients} />}
    </div>
  );
}
