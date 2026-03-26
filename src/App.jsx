import { useState, useEffect, useCallback, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import {
  Activity, DollarSign, Zap, Calendar as CalendarIcon, User, ChevronRight,
  CheckCircle2, Circle, Plus, LayoutDashboard, ListTodo,
  Briefcase, Shield, Bot, Pencil, TrendingUp, Target, LogOut
} from "lucide-react";
import { THEME, AGENTS, getSOP, getProgress, glassCard, formatCurrency, agentName, calculateCommission, TIMELINE_FIELDS, UNDER_CONTRACT_STAGES, getDateStatus, getStageColor } from "./theme";
import { supabase } from "./supabaseClient";
import { AddClientModal, AddTaskModal, EditClientModal, EditTaskModal } from "./Modals";
import TaskHub from "./TaskHub";
import AIChatWindow from "./AIChatWindow";
import { BobBoard, AmberBoard, ClientAvatar } from "./TeamBoards";
import AdminChat from "./AdminChat";
import CalendarView from "./Calendar";
import { useToast } from "./ToastContext";
import CommissionWidget from "./CommissionWidget";
import Auth from "./Auth";

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
  <div style={{ ...glassCard({ padding: "24px 26px", position: "relative", overflow: "hidden", animation: `cardEntrance 0.4s ease-out ${delay}s both`, border: `1px solid ${accentColor ?? THEME.GOLD}15` }) }}>
    <div style={{ position: "absolute", top: 0, left: 0, width: 3, bottom: 0, background: accentColor ?? THEME.GOLD, borderRadius: "3px 0 0 3px" }} />
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, ${accentColor ?? THEME.GOLD}60, transparent 60%)` }} />
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: `${accentColor ?? THEME.GOLD}12`, border: `1px solid ${accentColor ?? THEME.GOLD}25`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {icon}
      </div>
      <span style={{ fontSize: 10, color: THEME.TEXT_DIM, textTransform: "uppercase", letterSpacing: 1.8, fontWeight: 700 }}>{label}</span>
    </div>
    <div style={{ fontSize: 38, fontWeight: 700, color: valueColor ?? THEME.WHITE, lineHeight: 1, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: -1.5, textShadow: `0 0 30px ${accentColor ?? THEME.GOLD}30` }}>
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
function DealCommandCenter({ session }) {
  const [clients, setClients] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [activeAgent, setActiveAgent] = useState("all");
  const [selectedClient, setSelectedClient] = useState(null);
  const [showAddClient, setShowAddClient] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [activities, setActivities] = useState([]);
  const [now, setNow] = useState(new Date());
  const addToast = useToast();

  // ── Fetch Data ──
  const fetchClients = useCallback(async () => {
    const { data, error } = await supabase.from("clients").select("*").order("created_at", { ascending: false });
    if (!error && data) setClients(data);
    if (error) addToast("Failed to load clients", "error");
  }, [addToast]);

  const fetchTasks = useCallback(async () => {
    const { data, error } = await supabase.from("tasks").select("*").order("created_at", { ascending: false });
    if (!error && data) setTasks(data);
  }, []);

  const fetchEvents = useCallback(async () => {
    const { data, error } = await supabase.from("events").select("*").order("event_date", { ascending: true });
    if (!error && data) setEvents(data);
  }, []);

  const fetchActivities = useCallback(async () => {
    const { data, error } = await supabase.from("activities").select("*").order("created_at", { ascending: false });
    if (!error && data) setActivities(data);
  }, []);

  const refreshAll = useCallback(() => {
    fetchClients();
    fetchTasks();
    fetchEvents();
    fetchActivities();
  }, [fetchClients, fetchTasks, fetchEvents, fetchActivities]);

  // ── Initial Load + Realtime ──
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchClients(), fetchTasks(), fetchEvents(), fetchActivities()]);
      setLoading(false);
    };
    load();
  }, [fetchClients, fetchTasks, fetchEvents, fetchActivities]);

  useEffect(() => {
    const channel = supabase
      .channel("realtime-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "clients" }, () => fetchClients())
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, () => fetchTasks())
      .on("postgres_changes", { event: "*", schema: "public", table: "events" }, () => fetchEvents())
      .on("postgres_changes", { event: "*", schema: "public", table: "activities" }, () => fetchActivities())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchClients, fetchTasks, fetchEvents, fetchActivities]);

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
    addToast("Client Added", "success");
  };

  const handleTaskAdded = () => {
    fetchTasks();
    addToast("Task Created", "success");
  };

  const handleClientUpdated = () => {
    fetchClients();
    setEditingClient(null);
    addToast("Client Updated", "info");
  };

  const handleClientDeleted = () => {
    fetchClients();
    fetchTasks();
    setEditingClient(null);
    addToast("Client Deleted", "delete");
  };

  const handleTaskUpdated = () => {
    fetchTasks();
    setEditingTask(null);
    addToast("Task Updated", "info");
  };

  const handleTaskDeleted = () => {
    fetchTasks();
    setEditingTask(null);
    addToast("Task Deleted", "delete");
  };

  const sidebarQuickStats = useMemo(() => {
    const uc = filteredClients.filter((c) => c.stage === "Under Contract" || c.stage === "Due Diligence" || c.stage === "Clear to Close").length;
    const closed = filteredClients.filter((c) => c.stage === "Closed").length;
    return { activeDeals: filteredClients.length, underContract: uc, closingSoon: closingSoonCount, closed };
  }, [filteredClients, closingSoonCount]);

  return (
    <div style={{ minHeight: "100vh", color: THEME.WHITE }}>

      {/* ══════════ LEFT SIDEBAR (desktop only) ══════════ */}
      <aside className="bsf-sidebar" style={{
        background: "linear-gradient(180deg, rgba(4,10,20,0.98) 0%, rgba(2,6,16,0.99) 100%)",
        borderRight: `1px solid ${THEME.GLASS_BORDER}`,
        backdropFilter: "blur(24px)",
        animation: "sidebarSlideIn 0.4s ease-out",
      }}>
        {/* Logo */}
        <div style={{ padding: "24px 20px 16px", borderBottom: `1px solid ${THEME.GLASS_BORDER}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <img src="/logo.png.png" alt="BSF" className="bsf-logo-img" style={{ height: 52, objectFit: "contain", animation: "logoGlow 4s ease-in-out infinite" }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: THEME.WHITE, fontFamily: "'Space Grotesk'", letterSpacing: -0.3 }}>Deal Command</div>
              <div style={{ fontSize: 8, color: THEME.GOLD_DIM, textTransform: "uppercase", letterSpacing: 2.5, fontWeight: 600 }}>Burley Sells Florida</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 12 }}>
            <div style={{ width: 6, height: 6, borderRadius: 3, background: THEME.RED, boxShadow: `0 0 8px ${THEME.RED}`, animation: "livePulse 1.5s infinite" }} />
            <span style={{ fontSize: 10, color: THEME.GOLD, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", fontFamily: "'JetBrains Mono'" }}>{timeStr}</span>
          </div>
        </div>

        {/* Nav Tabs */}
        <nav style={{ flex: 1, padding: "12px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
                  borderRadius: 10, border: "none", cursor: "pointer",
                  fontFamily: "'Space Grotesk'", fontSize: 13, fontWeight: isActive ? 700 : 500,
                  background: isActive ? `linear-gradient(135deg, ${THEME.GOLD}18, ${THEME.GOLD}06)` : "transparent",
                  color: isActive ? THEME.GOLD : THEME.TEXT_DIM,
                  borderLeft: isActive ? `3px solid ${THEME.GOLD}` : "3px solid transparent",
                  transition: "all 0.2s",
                  position: "relative",
                }}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
              >
                {tab.icon}
                {tab.label}
                {isActive && <div style={{ position: "absolute", right: 10, width: 5, height: 5, borderRadius: 3, background: THEME.GOLD, boxShadow: `0 0 8px ${THEME.GOLD}` }} />}
              </button>
            );
          })}
        </nav>

        {/* Quick Stats */}
        <div style={{ padding: "16px 14px", borderTop: `1px solid ${THEME.GLASS_BORDER}` }}>
          <div style={{ fontSize: 9, color: THEME.TEXT_DIM, textTransform: "uppercase", letterSpacing: 2, fontWeight: 700, marginBottom: 12 }}>Quick Stats</div>
          {[
            { label: "Active Deals", value: sidebarQuickStats.activeDeals, color: THEME.GREEN },
            { label: "Under Contract", value: sidebarQuickStats.underContract, color: THEME.GOLD },
            { label: "Closing Soon", value: sidebarQuickStats.closingSoon, color: THEME.ORANGE },
          ].map((s) => (
            <div key={s.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0" }}>
              <span style={{ fontSize: 11, color: THEME.TEXT_DIM, fontWeight: 500 }}>{s.label}</span>
              <span style={{ fontSize: 14, color: s.color, fontWeight: 700, fontFamily: "'Space Grotesk'", textShadow: `0 0 12px ${s.color}30` }}>{s.value}</span>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div style={{ padding: "12px 14px 20px", display: "flex", flexDirection: "column", gap: 6 }}>
          <button
            onClick={() => setShowAddClient(true)}
            style={{
              padding: "10px 14px", borderRadius: 10, border: "none", cursor: "pointer",
              background: `linear-gradient(135deg, ${THEME.GOLD}, ${THEME.GOLD_DIM})`,
              color: THEME.NAVY, fontFamily: "'Space Grotesk'", fontSize: 12, fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              boxShadow: `0 4px 16px ${THEME.GOLD_NEON}`, transition: "all 0.2s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = `0 6px 24px ${THEME.GOLD_NEON}`; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = `0 4px 16px ${THEME.GOLD_NEON}`; }}
          >
            <Plus size={14} /> New Client
          </button>
          <button
            onClick={() => setShowAddTask(true)}
            style={{
              padding: "10px 14px", borderRadius: 10, cursor: "pointer",
              background: "rgba(255,255,255,0.04)", border: `1px solid ${THEME.GLASS_BORDER}`,
              color: THEME.TEXT_DIM, fontFamily: "'Space Grotesk'", fontSize: 12, fontWeight: 600,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${THEME.BLUE}40`; e.currentTarget.style.color = THEME.BLUE; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = THEME.GLASS_BORDER; e.currentTarget.style.color = THEME.TEXT_DIM; }}
          >
            <Plus size={14} /> New Task
          </button>
          <button
            onClick={() => supabase.auth.signOut()}
            style={{
              padding: "10px 14px", borderRadius: 10, cursor: "pointer",
              background: "transparent", border: "none",
              color: THEME.RED, fontFamily: "'Space Grotesk'", fontSize: 12, fontWeight: 600,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              transition: "all 0.2s", marginTop: 12,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,59,48,0.1)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      {/* ══════════ MOBILE/TABLET HEADER (hidden on desktop) ══════════ */}
      <header className="bsf-desktop-header" style={{
        padding: "0 24px", height: 72,
        borderBottom: `1px solid ${THEME.GLASS_BORDER}`,
        background: "linear-gradient(180deg, rgba(2,6,16,0.97) 0%, rgba(2,6,16,0.92) 100%)",
        backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
        position: "sticky", top: 0, zIndex: 50,
        display: "none", justifyContent: "space-between", alignItems: "center",
        boxShadow: `0 1px 0 ${THEME.GOLD}15, 0 4px 32px rgba(0,0,0,0.5)`,
      }}>
        <div className="bsf-logo-section" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img src="/logo.png.png" alt="BSF" className="bsf-logo-img" style={{ height: 48, objectFit: "contain", animation: "logoGlow 4s ease-in-out infinite" }} />
          <div>
            <h1 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: THEME.WHITE, fontFamily: "'Space Grotesk'" }}>Deal Command</h1>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
              <div style={{ width: 5, height: 5, borderRadius: 3, background: THEME.RED, boxShadow: `0 0 6px ${THEME.RED}`, animation: "livePulse 1.5s infinite" }} />
              <span style={{ fontSize: 9, color: THEME.GOLD, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase" }}>Live · {timeStr}</span>
            </div>
          </div>
        </div>
        {/* Desktop tabs (hidden on mobile, shown on tablet) */}
        <div className="bsf-desktop-tabs" style={{ display: "flex", gap: 2, background: "rgba(255,255,255,0.03)", padding: "4px 5px", borderRadius: 10, border: `1px solid ${THEME.GLASS_BORDER}` }}>
          {TABS.map((tab) => (
            <button key={tab.id} className="bsf-tab-btn" onClick={() => setActiveTab(tab.id)} style={{
              padding: "6px 14px", borderRadius: 7, border: activeTab === tab.id ? `1px solid ${THEME.GOLD}40` : "1px solid transparent",
              cursor: "pointer", fontFamily: "'Space Grotesk'", fontSize: 11, fontWeight: 600,
              background: activeTab === tab.id ? `${THEME.GOLD}15` : "transparent",
              color: activeTab === tab.id ? THEME.GOLD : THEME.TEXT_DIM,
              transition: "all 0.2s", display: "flex", alignItems: "center", gap: 5,
            }}>
              {tab.icon}
              <span className="bsf-tab-label">{tab.label}</span>
            </button>
          ))}
        </div>
        <div className="bsf-header-actions" style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setShowAddClient(true)} style={{
            padding: "7px 14px", borderRadius: 8, border: "none", cursor: "pointer",
            background: `linear-gradient(135deg, ${THEME.GOLD}, ${THEME.GOLD_DIM})`,
            color: THEME.NAVY, fontFamily: "'Space Grotesk'", fontSize: 11, fontWeight: 700,
            display: "flex", alignItems: "center", gap: 4,
          }}>
            <Plus size={13} /> Client
          </button>
          <button onClick={() => setShowAddTask(true)} style={{
            padding: "7px 14px", borderRadius: 8, cursor: "pointer",
            background: "rgba(255,255,255,0.05)", border: `1px solid ${THEME.GLASS_BORDER}`,
            color: THEME.TEXT_DIM, fontFamily: "'Space Grotesk'", fontSize: 11, fontWeight: 600,
            display: "flex", alignItems: "center", gap: 4,
          }}>
            <Plus size={13} /> Task
          </button>
          <button onClick={() => supabase.auth.signOut()} style={{
            padding: "7px 10px", borderRadius: 8, cursor: "pointer",
            background: "rgba(255,59,48,0.1)", border: `1px solid rgba(255,59,48,0.2)`,
            color: THEME.RED, display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <LogOut size={13} />
          </button>
        </div>
      </header>

      {/* ══════════ MOBILE BOTTOM NAV ══════════ */}
      <nav className="bsf-bottom-nav">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                padding: "8px 6px", borderRadius: 10, border: "none", cursor: "pointer",
                background: isActive ? `${THEME.GOLD}12` : "transparent",
                color: isActive ? THEME.GOLD : THEME.TEXT_DIM,
                fontFamily: "'Space Grotesk'", fontSize: 9, fontWeight: isActive ? 700 : 500,
                minWidth: 52, transition: "all 0.2s", position: "relative",
              }}
            >
              {isActive && <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 20, height: 2, borderRadius: 1, background: THEME.GOLD, boxShadow: `0 0 8px ${THEME.GOLD}` }} />}
              {tab.icon}
              {tab.label.split(" ")[0]}
            </button>
          );
        })}
      </nav>

      {/* ══════════ CONTENT ══════════ */}
      <div className="bsf-main-area">
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
              <div className="bsf-kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
                <KpiCard icon={<Activity size={18} color={THEME.GREEN} />} label="Active Deals" value={filteredClients.length} valueColor={THEME.WHITE} accentColor={THEME.GREEN} delay={0} />
                <KpiCard icon={<DollarSign size={18} color={THEME.GOLD} />} label="Pipeline Volume" value={totalPipelineValue > 0 ? formatCurrency(totalPipelineValue) : "—"} valueColor={THEME.GOLD} accentColor={THEME.GOLD} delay={0.05} />
                <KpiCard icon={<Zap size={18} color={THEME.CYAN} />} label="Under Contract" value={filteredClients.filter((c) => c.stage === "Under Contract").length} valueColor={THEME.CYAN} accentColor={THEME.CYAN} delay={0.1} />
                <KpiCard icon={<CalendarIcon size={18} color={THEME.ORANGE} />} label="Closing Soon" value={closingSoonCount} valueColor={THEME.ORANGE} accentColor={THEME.ORANGE} delay={0.15} />
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
                                borderLeft: `4px solid ${getStageColor(client.stage)}`,
                                position: "relative", overflow: "hidden",
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
                                {/* Commission Widget */}
                                <CommissionWidget client={client} />
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
          {activeTab === "bob" && <BobBoard clients={clients} tasks={tasks} activities={activities} />}

          {/* ── AMBER TAB ── */}
          {activeTab === "amber" && <AmberBoard clients={clients} tasks={tasks} activities={activities} />}

          {/* ── CALENDAR TAB ── */}
          {activeTab === "calendar" && <CalendarView events={events} clients={clients} />}

          {/* ── COMMAND CENTER TAB ── */}
          {activeTab === "command" && <AdminChat clients={clients} tasks={tasks} onRefresh={refreshAll} />}
        </div>
      )}

      {/* ── AI CHAT ── */}
      <AIChatWindow clients={clients} tasks={tasks} onRefresh={refreshAll} />
      </div>{/* end bsf-main-area */}

      {/* ── MODALS ── */}
      {showAddClient && <AddClientModal onClose={() => setShowAddClient(false)} onAdded={handleClientAdded} />}
      {showAddTask && <AddTaskModal onClose={() => setShowAddTask(false)} onAdded={handleTaskAdded} clients={clients} />}
      {editingClient && <EditClientModal client={editingClient} onClose={() => setEditingClient(null)} onUpdated={handleClientUpdated} onDeleted={handleClientDeleted} />}
      {editingTask && <EditTaskModal task={editingTask} onClose={() => setEditingTask(null)} onUpdated={handleTaskUpdated} onDeleted={handleTaskDeleted} clients={clients} />}
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div style={{ minHeight: "100vh", background: THEME.NAVY_DEEP }} />;
  if (!session) return <Auth />;
  return <DealCommandCenter session={session} />;
}
