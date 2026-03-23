import { useState, useEffect, useRef } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { MessageSquare, X, Send, User, ChevronRight, Activity, DollarSign, Calendar, Target, CheckCircle2, Circle, Zap } from "lucide-react";

// --- THEME CONSTANTS ---
const THEME = {
  NAVY: "#050A12",
  NAVY_LIGHT: "#0F1E35",
  NAVY_MID: "#091728",
  GOLD: "#C9A84C",
  GOLD_DIM: "#8B7535",
  GOLD_GLOW: "rgba(201,168,76,0.15)",
  GOLD_NEON: "rgba(201,168,76,0.6)",
  WHITE: "#F0EDE8",
  TEXT_DIM: "#6B7A8D",
  GREEN: "#3ECF8E",
  ORANGE: "#F0A050",
  BLUE: "#3B82F6",
  PURPLE: "#A78BFA",
  CYAN: "#00D4FF",
  GLASS: "rgba(255,255,255,0.03)",
  GLASS_BORDER: "rgba(255,255,255,0.07)",
};

// --- GLASSMORPHISM CARD STYLE ---
const glassCard = (extra = {}) => ({
  background: "linear-gradient(135deg, rgba(15,30,53,0.8) 0%, rgba(9,23,40,0.9) 100%)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: `1px solid ${THEME.GLASS_BORDER}`,
  borderRadius: 16,
  ...extra,
});

// --- SOP DATA ---
const BUYER_STAGES  = ["Lead","Pre-Qualified","Active Search","Under Contract","Due Diligence","Clear to Close","Closed"];
const SELLER_STAGES = ["Lead","Pre-Qualified","Active Marketing","Under Contract","Due Diligence","Clear to Close","Closed"];
const TC_STAGES     = ["Received","Docs In Review","Pending Sigs","Compliance","Clear to Close","Closed"];
const INVESTOR_STAGES = ["Lead","Property Analysis","Under Contract","Renovation","Listing Prep","Active Marketing","Closed"];

const BUYER_SOP = [
  { step: "Initial Client Intake", stage: "Lead" },
  { step: "Pre-Approval Referral", stage: "Lead" },
  { step: "Buyer Consultation", stage: "Pre-Qualified" },
  { step: "Property Search Setup", stage: "Active Search" },
  { step: "Showings & Feedback", stage: "Active Search" },
  { step: "Offer Preparation", stage: "Active Search" },
  { step: "Negotiation & Acceptance", stage: "Under Contract" },
  { step: "Earnest Money Deposit", stage: "Under Contract" },
  { step: "Title Coordination", stage: "Under Contract" },
  { step: "Inspection Scheduling", stage: "Due Diligence" },
  { step: "Inspection Negotiation", stage: "Due Diligence" },
  { step: "Appraisal Coordination", stage: "Due Diligence" },
  { step: "Loan Processing", stage: "Due Diligence" },
  { step: "Insurance & Utilities", stage: "Clear to Close" },
  { step: "Final Walkthrough", stage: "Clear to Close" },
  { step: "Closing Prep", stage: "Clear to Close" },
  { step: "Closing Day", stage: "Closed" },
];

const SELLER_SOP = [
  { step: "Initial Seller Inquiry", stage: "Lead" },
  { step: "Pre-Listing CMA", stage: "Lead" },
  { step: "Listing Consultation", stage: "Pre-Qualified" },
  { step: "Property Preparation", stage: "Pre-Qualified" },
  { step: "MLS & Marketing Launch", stage: "Active Marketing" },
  { step: "Social Media Campaign", stage: "Active Marketing" },
  { step: "Open House Execution", stage: "Active Marketing" },
  { step: "Showing Management", stage: "Active Marketing" },
  { step: "Offer Review", stage: "Active Marketing" },
  { step: "Negotiation & Acceptance", stage: "Under Contract" },
  { step: "Title & Escrow", stage: "Under Contract" },
  { step: "Buyer Inspection Period", stage: "Due Diligence" },
  { step: "Appraisal Coordination", stage: "Due Diligence" },
  { step: "Seller Document Prep", stage: "Due Diligence" },
  { step: "Closing Coordination", stage: "Clear to Close" },
  { step: "Closing Day", stage: "Closed" },
];

const TC_SOP = [
  { step: "Contract Received", stage: "Received" },
  { step: "Initial Document Review", stage: "Docs In Review" },
  { step: "Missing Signatures Request", stage: "Pending Sigs" },
  { step: "Brokerage Compliance Submit", stage: "Compliance" },
  { step: "Clear to Close Verification", stage: "Clear to Close" },
  { step: "Closing Day Support", stage: "Closed" },
];

const getSOP = (type) =>
  type === "Buyer" ? BUYER_SOP : type === "Seller" ? SELLER_SOP : type === "TC" ? TC_SOP : BUYER_SOP;

// --- MOCK DATA ---
const SAMPLE_CLIENTS = [
  { id: 1, name: "Sheryl Wojciechowski", type: "Buyer",    agent: "bob",   stage: "Active Search",    preApproval: "Approved", lender: "Wells Fargo",    loanAmt: "$385,000", offerPrice: null,       closingDate: null,        sopProgress: 4, notes: "Focused west of 49th St — Tyrone/Seminole/Largo area." },
  { id: 2, name: "Patience Williams",    type: "Buyer",    agent: "bob",   stage: "Pre-Qualified",    preApproval: "Approved", lender: "Rocket Mortgage",loanAmt: "$290,000", offerPrice: null,       closingDate: null,        sopProgress: 2, notes: "First-time buyer. Check DARE & CRA programs." },
  { id: 3, name: "Ryan & Angie",         type: "Investor", agent: "bob",   stage: "Under Contract",   preApproval: "Cash",     lender: "N/A",            loanAmt: "N/A",      offerPrice: "$215,000", closingDate: "04/15/2026",sopProgress: 7, notes: "Fix-and-flip. Pinellas County. Rehab budget ~$40K." },
  { id: 4, name: "Surfside Tower Unit",  type: "Seller",   agent: "bob",   stage: "Active Marketing", preApproval: "N/A",      lender: "N/A",            loanAmt: "N/A",      offerPrice: null,       closingDate: null,        sopProgress: 6, notes: "15462 Gulf Blvd, Madeira Beach. Social campaign active." },
  { id: 5, name: "Henderson Condo",      type: "TC",       agent: "amber", stage: "Compliance",       preApproval: "N/A",      lender: "Navy Federal",   loanAmt: "$250,000", offerPrice: "$250,000", closingDate: "05/01/2026",sopProgress: 4, notes: "Needs final sig on Lead Paint disclosure." },
  { id: 6, name: "Smith Residence",      type: "TC",       agent: "amber", stage: "Docs In Review",   preApproval: "N/A",      lender: "Suncoast CU",    loanAmt: "$410,000", offerPrice: "$420,000", closingDate: "05/10/2026",sopProgress: 2, notes: "Earnest money deposit receipt missing." },
];

const AGENTS = [
  { id: 'all',   name: 'All Agents' },
  { id: 'bob',   name: 'Bob Dean' },
  { id: 'amber', name: 'Amber — TC' },
];

// ─────────────────────────────────────────────
// AI CHAT
// ─────────────────────────────────────────────
const AI_CHAT_PROMPT = `You are an expert real estate AI assistant for Burley Sells Florida. Answer questions about current clients in the deal command center. Here is the client JSON:\n`;

const AIChatWindow = ({ clients }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: "assistant", content: "Hello! I'm your BSF AI assistant. How can I help analyze our active deals?" }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      setMessages(prev => [...prev, { role: "assistant", content: "Error: VITE_OPENAI_API_KEY is missing." }]);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
        body: JSON.stringify({ model: "gpt-4o-mini", messages: [{ role: "system", content: AI_CHAT_PROMPT + JSON.stringify(clients, null, 2) }, ...messages, userMessage] })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.choices?.[0]?.message?.content ?? "Invalid response." }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", content: `Error: ${err.message}` }]);
    }
    setLoading(false);
  };

  if (!isOpen) return (
    <button onClick={() => setIsOpen(true)} style={{
      position: "fixed", bottom: 28, right: 28, width: 60, height: 60, borderRadius: 30,
      background: `linear-gradient(135deg, ${THEME.GOLD}, ${THEME.GOLD_DIM})`,
      color: THEME.NAVY, border: "none", cursor: "pointer",
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: `0 8px 32px rgba(0,0,0,0.6), 0 0 20px ${THEME.GOLD_NEON}`,
      zIndex: 1000, transition: "transform 0.2s, box-shadow 0.2s",
      animation: "glowPulse 2.5s ease-in-out infinite"
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.08)"; e.currentTarget.style.boxShadow = `0 12px 40px rgba(0,0,0,0.7), 0 0 32px ${THEME.GOLD_NEON}`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = `0 8px 32px rgba(0,0,0,0.6), 0 0 20px ${THEME.GOLD_NEON}`; }}
    >
      <MessageSquare size={26} />
    </button>
  );

  return (
    <div style={{ position: "fixed", bottom: 28, right: 28, width: 390, height: 520, borderRadius: 20, overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "-8px 8px 64px rgba(0,0,0,0.8)", zIndex: 1000, animation: "slideUp 0.3s ease-out", ...glassCard({ border: `1px solid ${THEME.GOLD}40` }) }}>
      <div style={{ padding: "18px 22px", background: "rgba(5,10,18,0.9)", borderBottom: `1px solid ${THEME.GOLD}25`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 9, height: 9, borderRadius: 5, background: THEME.GREEN, boxShadow: `0 0 10px ${THEME.GREEN}`, animation: "livePulse 2s infinite" }} />
          <span style={{ fontWeight: 600, color: THEME.WHITE, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: 0.3 }}>BSF Deal Assistant</span>
        </div>
        <button onClick={() => setIsOpen(false)} style={{ background: "none", border: "none", color: THEME.TEXT_DIM, cursor: "pointer", padding: 4, borderRadius: 6, transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = THEME.WHITE} onMouseLeave={e => e.currentTarget.style.color = THEME.TEXT_DIM}><X size={20} /></button>
      </div>
      <div style={{ flex: 1, padding: 16, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ alignSelf: m.role === "assistant" ? "flex-start" : "flex-end", background: m.role === "assistant" ? "rgba(255,255,255,0.06)" : `linear-gradient(135deg, ${THEME.GOLD}, ${THEME.GOLD_DIM})`, color: m.role === "assistant" ? THEME.WHITE : THEME.NAVY, padding: "10px 14px", borderRadius: 12, maxWidth: "85%", fontSize: 14, lineHeight: 1.5, border: m.role === "assistant" ? `1px solid rgba(255,255,255,0.08)` : "none" }}>
            {m.content}
          </div>
        ))}
        {loading && <div style={{ color: THEME.TEXT_DIM, fontSize: 12, fontStyle: "italic", paddingLeft: 4 }}>Assistant is thinking...</div>}
        <div ref={endRef} />
      </div>
      <div style={{ padding: "14px 16px", background: "rgba(5,10,18,0.9)", borderTop: `1px solid rgba(255,255,255,0.06)`, display: "flex", gap: 10 }}>
        <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSend()} placeholder="Ask about active deals..."
          style={{ flex: 1, padding: "10px 16px", borderRadius: 10, background: "rgba(255,255,255,0.06)", border: `1px solid rgba(255,255,255,0.1)`, color: THEME.WHITE, outline: "none", fontFamily: "'Space Grotesk', sans-serif", fontSize: 14 }} />
        <button onClick={handleSend} disabled={loading} style={{ background: `linear-gradient(135deg, ${THEME.GOLD}, ${THEME.GOLD_DIM})`, color: THEME.NAVY, border: "none", width: 42, height: 42, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", opacity: loading ? 0.5 : 1, boxShadow: loading ? "none" : `0 4px 12px ${THEME.GOLD_NEON}` }}>
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// TYPE BADGE
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// KPI CARD
// ─────────────────────────────────────────────
const KpiCard = ({ icon, label, value, valueColor, accentColor }) => (
  <div style={{ ...glassCard({ padding: 28, boxShadow: `0 10px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)`, position: "relative", overflow: "hidden" }) }}>
    {/* top accent line */}
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${accentColor ?? THEME.GOLD}, transparent)`, animation: "borderGlow 3s ease-in-out infinite" }} />
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: `${accentColor ?? THEME.GOLD}18`, border: `1px solid ${accentColor ?? THEME.GOLD}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {icon}
      </div>
      <span style={{ fontSize: 11, color: THEME.TEXT_DIM, textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 600 }}>{label}</span>
    </div>
    <div style={{ fontSize: 44, fontWeight: 700, color: valueColor ?? THEME.WHITE, lineHeight: 1, fontFamily: "'Space Grotesk', sans-serif", textShadow: `0 0 24px ${valueColor ?? THEME.GOLD_GLOW}` }}>
      {value}
    </div>
  </div>
);

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
export default function DealCommandCenter() {
  const [clients] = useState(SAMPLE_CLIENTS);
  const [activeAgent, setActiveAgent] = useState('all');
  const [selectedClient, setSelectedClient] = useState(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);

  const filteredClients = activeAgent === 'all' ? clients : clients.filter(c => c.agent === activeAgent);

  const stageStats = filteredClients.reduce((acc, c) => { acc[c.stage] = (acc[c.stage] || 0) + 1; return acc; }, {});
  const chartData = Object.keys(stageStats).map(key => ({ name: key, count: stageStats[key] }));

  let totalPipelineValue = 0;
  filteredClients.forEach(c => {
    const raw = c.offerPrice && c.offerPrice.includes('$') ? c.offerPrice : c.loanAmt && c.loanAmt.includes('$') ? c.loanAmt : null;
    if (raw) { const v = parseInt(raw.replace(/\D/g, '')); if (!isNaN(v)) totalPipelineValue += v; }
  });

  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

  return (
    <div style={{ minHeight: "100vh", color: THEME.WHITE }}>

      {/* ── HEADER ── */}
      <header style={{
        padding: "0 40px", height: 72,
        borderBottom: `1px solid ${THEME.GLASS_BORDER}`,
        background: "linear-gradient(180deg, rgba(5,10,18,0.97) 0%, rgba(5,10,18,0.88) 100%)",
        backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
        position: "sticky", top: 0, zIndex: 50,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        boxShadow: `0 1px 0 ${THEME.GOLD}20, 0 4px 32px rgba(0,0,0,0.5)`
      }}>
        {/* LEFT: logo + title */}
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <img
            src="/logo.png.png"
            alt="Burley Sells Florida"
            style={{ height: 52, objectFit: "contain", filter: "drop-shadow(0 0 10px rgba(201,168,76,0.4))" }}
          />
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, letterSpacing: -0.3, color: THEME.WHITE, fontFamily: "'Space Grotesk', sans-serif", animation: "neonFlicker 10s infinite" }}>
              Deal Command Center
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
              <div style={{ width: 7, height: 7, borderRadius: 4, background: "#FF3B30", boxShadow: "0 0 8px #FF3B30", animation: "livePulse 1.5s infinite" }} />
              <span style={{ fontSize: 11, color: THEME.GOLD, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase" }}>Live · {timeStr}</span>
            </div>
          </div>
        </div>

        {/* RIGHT: agent filter */}
        <div style={{ display: "flex", gap: 6, background: "rgba(255,255,255,0.04)", padding: "6px 8px", borderRadius: 12, border: `1px solid ${THEME.GLASS_BORDER}` }}>
          {AGENTS.map(agent => (
            <button key={agent.id} onClick={() => setActiveAgent(agent.id)} style={{
              padding: "8px 18px", borderRadius: 8, border: activeAgent === agent.id ? `1px solid ${THEME.GOLD}50` : "1px solid transparent",
              cursor: "pointer", fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 500,
              background: activeAgent === agent.id ? `linear-gradient(135deg, ${THEME.GOLD}20, ${THEME.GOLD}08)` : "transparent",
              color: activeAgent === agent.id ? THEME.GOLD : THEME.TEXT_DIM,
              transition: "all 0.2s", boxShadow: activeAgent === agent.id ? `0 0 12px ${THEME.GOLD_GLOW}` : "none"
            }}>
              {agent.name}
            </button>
          ))}
        </div>
      </header>

      {/* ── DASHBOARD ── */}
      <div style={{ padding: "40px", display: "grid", gridTemplateColumns: "280px 1fr", gap: 32, maxWidth: 1440, margin: "0 auto" }}>

        {/* KPI Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <KpiCard
            icon={<Activity size={20} color={THEME.GREEN} />}
            label="Active Deals"
            value={filteredClients.length}
            valueColor={THEME.WHITE}
            accentColor={THEME.GREEN}
          />
          <KpiCard
            icon={<DollarSign size={20} color={THEME.GOLD} />}
            label="Pipeline Volume"
            value={totalPipelineValue > 0 ? `$${totalPipelineValue.toLocaleString()}` : "—"}
            valueColor={THEME.GOLD}
            accentColor={THEME.GOLD}
          />
          <KpiCard
            icon={<Zap size={20} color={THEME.CYAN} />}
            label="Under Contract"
            value={filteredClients.filter(c => c.stage === "Under Contract").length}
            valueColor={THEME.CYAN}
            accentColor={THEME.CYAN}
          />
        </div>

        {/* Chart Panel */}
        <div style={{ ...glassCard({ padding: 32, boxShadow: "0 10px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)", position: "relative", overflow: "hidden" }) }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${THEME.BLUE}, transparent)`, animation: "borderGlow 4s ease-in-out infinite" }} />
          <h3 style={{ margin: "0 0 28px 0", fontSize: 15, color: THEME.WHITE, fontWeight: 600, fontFamily: "'Space Grotesk', sans-serif", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: 4, background: THEME.BLUE, boxShadow: `0 0 8px ${THEME.BLUE}` }} />
            Pipeline Distribution
          </h3>
          <div style={{ minHeight: 260 }}>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData} barSize={28}>
                  <XAxis dataKey="name" stroke={THEME.TEXT_DIM} fontSize={11} tickLine={false} axisLine={false} fontFamily="Space Grotesk" />
                  <YAxis stroke={THEME.TEXT_DIM} fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} fontFamily="Space Grotesk" />
                  <Tooltip cursor={{ fill: 'rgba(201,168,76,0.04)' }} contentStyle={{ backgroundColor: "rgba(9,23,40,0.95)", border: `1px solid ${THEME.GOLD}40`, borderRadius: 10, color: THEME.WHITE, fontFamily: "Space Grotesk", backdropFilter: "blur(20px)" }} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={i % 2 === 0 ? THEME.GOLD : THEME.BLUE} fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: "flex", height: 260, alignItems: "center", justifyContent: "center", color: THEME.TEXT_DIM }}>No active deals in this view</div>
            )}
          </div>
        </div>
      </div>

      {/* ── CLIENT FEED ── */}
      <div style={{ padding: "0 40px 120px", maxWidth: 1440, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, paddingBottom: 16, borderBottom: `1px solid ${THEME.GLASS_BORDER}` }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: THEME.WHITE, fontFamily: "'Space Grotesk', sans-serif" }}>Client Portfolio</h2>
          <span style={{ fontSize: 12, fontWeight: 500, color: THEME.TEXT_DIM, background: "rgba(255,255,255,0.05)", padding: "4px 12px", borderRadius: 20, border: `1px solid ${THEME.GLASS_BORDER}` }}>
            {filteredClients.length} records
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {filteredClients.map(client => {
            const sop = getSOP(client.type);
            const isSelected = selectedClient?.id === client.id;
            const progress = (client.sopProgress / sop.length) * 100;

            return (
              <div key={client.id}>
                {/* LIST ROW */}
                <div
                  onClick={() => setSelectedClient(isSelected ? null : client)}
                  onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.borderColor = `${THEME.GOLD}50`; e.currentTarget.style.boxShadow = `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px ${THEME.GOLD}20`; } }}
                  onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.borderColor = THEME.GLASS_BORDER; e.currentTarget.style.boxShadow = "none"; } }}
                  style={{
                    ...glassCard({
                      padding: "22px 28px",
                      borderRadius: isSelected ? "16px 16px 0 0" : 16,
                      border: `1px solid ${isSelected ? THEME.GOLD + "60" : THEME.GLASS_BORDER}`,
                      boxShadow: isSelected ? `0 0 0 1px ${THEME.GOLD}30, 0 12px 48px rgba(0,0,0,0.5)` : "none",
                      cursor: "pointer", display: "flex", alignItems: "center", gap: 24,
                      transition: "all 0.25s ease",
                    })
                  }}
                >
                  {/* Name + Badge */}
                  <div style={{ flex: "0 0 240px" }}>
                    <div style={{ fontSize: 16, fontWeight: 600, color: THEME.WHITE, marginBottom: 8, display: "flex", alignItems: "center", gap: 8, fontFamily: "'Space Grotesk', sans-serif" }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: `${THEME.GOLD}18`, border: `1px solid ${THEME.GOLD}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <User size={16} color={THEME.GOLD} />
                      </div>
                      {client.name}
                    </div>
                    <TypeBadge type={client.type} />
                  </div>

                  {/* Stage */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: THEME.TEXT_DIM, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4, fontWeight: 600 }}>Stage</div>
                    <div style={{ fontSize: 15, fontWeight: 500, color: THEME.WHITE }}>{client.stage}</div>
                  </div>

                  {/* Value */}
                  <div style={{ flex: "0 0 180px" }}>
                    <div style={{ fontSize: 11, color: THEME.TEXT_DIM, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4, fontWeight: 600 }}>Value Focus</div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: THEME.GOLD, textShadow: `0 0 16px ${THEME.GOLD_GLOW}` }}>
                      {client.offerPrice || (client.loanAmt !== "N/A" ? client.loanAmt : <span style={{ color: THEME.TEXT_DIM, fontStyle: "italic", fontWeight: 400, fontSize: 13 }}>Pending</span>)}
                    </div>
                  </div>

                  {/* Progress */}
                  <div style={{ width: 160 }}>
                    <div style={{ fontSize: 11, color: THEME.TEXT_DIM, marginBottom: 8, display: "flex", justifyContent: "space-between", fontWeight: 600, letterSpacing: 0.5 }}>
                      <span>Progress</span>
                      <span style={{ color: THEME.GREEN }}>{Math.round(progress)}%</span>
                    </div>
                    <div style={{ height: 6, background: "rgba(255,255,255,0.07)", borderRadius: 3, overflow: "hidden", position: "relative" }}>
                      <div style={{
                        height: "100%", width: `${progress}%`, borderRadius: 3,
                        background: `linear-gradient(90deg, ${THEME.GREEN}, ${THEME.GOLD})`,
                        backgroundSize: "200% 100%",
                        animation: "progressShimmer 2.5s linear infinite",
                        boxShadow: `0 0 8px ${THEME.GREEN}60`
                      }} />
                    </div>
                  </div>

                  {/* Chevron */}
                  <ChevronRight size={22} color={isSelected ? THEME.GOLD : THEME.TEXT_DIM} style={{ transform: isSelected ? 'rotate(90deg)' : 'none', transition: 'transform 0.3s', flexShrink: 0 }} />
                </div>

                {/* EXPANDED PROFILE */}
                {isSelected && (
                  <div style={{
                    ...glassCard({
                      border: `1px solid ${THEME.GOLD}50`, borderTop: "none",
                      borderRadius: "0 0 16px 16px", padding: 32,
                      display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 40,
                      animation: "fadeIn 0.3s ease-out"
                    })
                  }}>
                    {/* Left: Dossier */}
                    <div>
                      <h4 style={{ fontSize: 14, fontWeight: 700, color: THEME.GOLD, borderBottom: `1px solid rgba(255,255,255,0.08)`, paddingBottom: 12, marginBottom: 20, textTransform: "uppercase", letterSpacing: 1.5, fontFamily: "'Space Grotesk', sans-serif" }}>Client Dossier</h4>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
                        {[
                          { label: "Pre-Approval", value: client.preApproval || "N/A" },
                          { label: "Lender", value: client.lender || "N/A" },
                          { label: "Target Close", value: client.closingDate || "TBD", icon: <Calendar size={11} style={{ marginRight: 4, display: 'inline' }} /> },
                          { label: "Agent", value: client.agent === 'bob' ? "Bob Dean" : "Amber", icon: <Target size={11} style={{ marginRight: 4, display: 'inline' }} /> }
                        ].map(({ label, value, icon }) => (
                          <div key={label}>
                            <div style={{ fontSize: 10, color: THEME.TEXT_DIM, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 5, fontWeight: 600 }}>{icon}{label}</div>
                            <div style={{ color: THEME.WHITE, fontSize: 14, fontWeight: 500 }}>{value}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ background: "rgba(0,0,0,0.3)", padding: "16px 18px", borderRadius: 10, borderLeft: `3px solid ${THEME.GOLD}` }}>
                        <div style={{ fontSize: 10, color: THEME.TEXT_DIM, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8, fontWeight: 600 }}>Strategic Notes</div>
                        <div style={{ fontSize: 14, color: THEME.WHITE, lineHeight: 1.65 }}>{client.notes || "No notes documented yet."}</div>
                      </div>
                    </div>

                    {/* Right: SOP Pipeline */}
                    <div>
                      <h4 style={{ fontSize: 14, fontWeight: 700, color: THEME.GOLD, borderBottom: `1px solid rgba(255,255,255,0.08)`, paddingBottom: 12, marginBottom: 20, textTransform: "uppercase", letterSpacing: 1.5, fontFamily: "'Space Grotesk', sans-serif" }}>Action Trajectory</h4>
                      <div style={{ maxHeight: 300, overflowY: "auto", paddingRight: 8 }}>
                        {sop.map((step, idx) => {
                          const isComplete = idx < client.sopProgress;
                          const isCurrent = idx === client.sopProgress;
                          return (
                            <div key={idx} style={{ display: "flex", gap: 14, marginBottom: 14, opacity: isComplete ? 0.5 : 1, transition: "opacity 0.2s" }}>
                              <div style={{ paddingTop: 2, flexShrink: 0 }}>
                                {isComplete
                                  ? <CheckCircle2 size={18} color={THEME.GREEN} style={{ filter: `drop-shadow(0 0 4px ${THEME.GREEN})` }} />
                                  : isCurrent
                                    ? <Circle size={18} color={THEME.GOLD} style={{ filter: `drop-shadow(0 0 6px ${THEME.GOLD})` }} />
                                    : <Circle size={18} color={THEME.TEXT_DIM} />}
                              </div>
                              <div>
                                <div style={{ fontSize: 14, fontWeight: isCurrent ? 600 : 400, color: isCurrent ? THEME.WHITE : isComplete ? THEME.TEXT_DIM : "rgba(255,255,255,0.45)" }}>{step.step}</div>
                                <div style={{ fontSize: 11, color: isCurrent ? THEME.GOLD : THEME.TEXT_DIM, marginTop: 2, letterSpacing: 0.3 }}>Phase: {step.stage}</div>
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
      </div>

      <AIChatWindow clients={clients} />
    </div>
  );
}
