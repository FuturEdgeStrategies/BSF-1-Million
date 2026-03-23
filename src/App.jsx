import { useState, useEffect, useRef } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import { MessageSquare, X, Send, User, ChevronRight, Activity, DollarSign, Calendar, Target, CheckCircle2, Circle } from "lucide-react";

// --- THEME CONSTANTS ---
const THEME = {
  NAVY: "#0A1628",
  NAVY_LIGHT: "#1A2A42",
  NAVY_MID: "#122238",
  GOLD: "#C9A84C",
  GOLD_DIM: "#8B7535",
  GOLD_GLOW: "rgba(201,168,76,0.12)",
  WHITE: "#F5F3EE",
  TEXT_DIM: "#8A95A8",
  GREEN: "#3ECF8E",
  ORANGE: "#F0A050",
  BLUE: "#3B82F6",
  PURPLE: "#A78BFA",
};

// --- SOP DATA ---
const BUYER_STAGES = ["Lead","Pre-Qualified","Active Search","Under Contract","Due Diligence","Clear to Close","Closed"];
const SELLER_STAGES = ["Lead","Pre-Qualified","Active Marketing","Under Contract","Due Diligence","Clear to Close","Closed"];
const TC_STAGES = ["Received","Docs In Review","Pending Sigs","Compliance","Clear to Close","Closed"];
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

const getSOP = (type) => type === "Buyer" ? BUYER_SOP : type === "Seller" ? SELLER_SOP : type === "TC" ? TC_SOP : BUYER_SOP;

// --- MOCK DATA ---
const SAMPLE_CLIENTS = [
  { id: 1, name: "Sheryl Wojciechowski", type: "Buyer", agent: "bob", stage: "Active Search", preApproval: "Approved", lender: "Wells Fargo", loanAmt: "$385,000", offerPrice: null, closingDate: null, sopProgress: 4, notes: "Focused west of 49th St — Tyrone/Seminole/Largo area." },
  { id: 2, name: "Patience Williams", type: "Buyer", agent: "bob", stage: "Pre-Qualified", preApproval: "Approved", lender: "Rocket Mortgage", loanAmt: "$290,000", offerPrice: null, closingDate: null, sopProgress: 2, notes: "First-time buyer. Check DARE & CRA programs." },
  { id: 3, name: "Ryan & Angie", type: "Investor", agent: "bob", stage: "Under Contract", preApproval: "Cash", lender: "N/A", loanAmt: "N/A", offerPrice: "$215,000", closingDate: "04/15/2026", sopProgress: 7, notes: "Fix-and-flip. Pinellas County. Rehab budget ~$40K." },
  { id: 4, name: "Surfside Tower Unit", type: "Seller", agent: "bob", stage: "Active Marketing", preApproval: "N/A", lender: "N/A", loanAmt: "N/A", offerPrice: null, closingDate: null, sopProgress: 6, notes: "15462 Gulf Blvd, Madeira Beach. Social campaign active." },
  { id: 5, name: "Henderson Condo", type: "TC", agent: "amber", stage: "Compliance", preApproval: "N/A", lender: "Navy Federal", loanAmt: "$250,000", offerPrice: "$250,000", closingDate: "05/01/2026", sopProgress: 4, notes: "Needs final sig on Lead Paint disclosure." },
  { id: 6, name: "Smith Residence", type: "TC", agent: "amber", stage: "Docs In Review", preApproval: "N/A", lender: "Suncoast CU", loanAmt: "$410,000", offerPrice: "$420,000", closingDate: "05/10/2026", sopProgress: 2, notes: "Earnest money deposit receipt missing." },
];

const AGENTS = [
  { id: 'all', name: 'All Agents Portfolio' },
  { id: 'bob', name: 'Bob Dean (Active Deals)' },
  { id: 'amber', name: 'Amber (Transaction Coordination)' }
];

// --- COMPONENTS ---

const AI_CHAT_PROMPT = `
You are an expert real estate AI assistant for Burley Sells Florida. 
Your goal is to answer questions about the current clients in the deal command center.
Here is the JSON of current clients:
`;

const AIChatWindow = ({ clients }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: "assistant", content: "Hello! I am your Burley Sells Florida AI assistant. How can I help you analyze our current deals and clients?" }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      setMessages(prev => [...prev, { role: "assistant", content: "Error: VITE_OPENAI_API_KEY environment variable is missing. Please configure it to use the AI Chat." }]);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "gpt-4o-mini", // Using an efficient model
          messages: [
            { role: "system", content: AI_CHAT_PROMPT + JSON.stringify(clients, null, 2) },
            ...messages,
            userMessage
          ]
        })
      });
      const data = await response.json();
      if (data.choices && data.choices[0]) {
        setMessages(prev => [...prev, { role: "assistant", content: data.choices[0].message.content }]);
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I received an invalid response from the API." }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", content: `Error: ${err.message}` }]);
    }
    setLoading(false);
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        style={{
          position: "fixed", bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28,
          background: `linear-gradient(135deg, ${THEME.GOLD}, ${THEME.GOLD_DIM})`,
          color: THEME.NAVY, border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 8px 24px rgba(0,0,0,0.4), 0 0 0 2px ${THEME.GOLD_GLOW}`,
          zIndex: 1000, transition: "transform 0.2s"
        }}
        onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"}
        onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
      >
        <MessageSquare size={24} />
      </button>
    );
  }

  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, width: 380, height: 500, borderRadius: 16,
      background: THEME.NAVY_MID, border: `1px solid ${THEME.GOLD}30`, overflow: "hidden",
      display: "flex", flexDirection: "column", boxShadow: "-8px 8px 40px rgba(0,0,0,0.6)",
      zIndex: 1000, animation: "slideUp 0.3s ease-out"
    }}>
      <div style={{
        padding: "16px 20px", background: THEME.NAVY, borderBottom: `1px solid rgba(255,255,255,0.06)`,
        display: "flex", justifyContent: "space-between", alignItems: "center"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: 4, background: THEME.GOLD, boxShadow: `0 0 8px ${THEME.GOLD}` }} />
          <span style={{ fontWeight: 600, color: THEME.WHITE }}>BSF Deal Assistant</span>
        </div>
        <button onClick={() => setIsOpen(false)} style={{ background: "none", border: "none", color: THEME.TEXT_DIM, cursor: "pointer" }}>
          <X size={20} />
        </button>
      </div>
      <div style={{ flex: 1, padding: 16, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ 
            alignSelf: m.role === "assistant" ? "flex-start" : "flex-end",
            background: m.role === "assistant" ? THEME.NAVY_LIGHT : `linear-gradient(135deg, ${THEME.GOLD}, ${THEME.GOLD_DIM})`,
            color: m.role === "assistant" ? THEME.WHITE : THEME.NAVY,
            padding: "10px 14px", borderRadius: 12, maxWidth: "85%", fontSize: 14, lineHeight: 1.4
          }}>
            {m.content}
          </div>
        ))}
        {loading && <div style={{ color: THEME.TEXT_DIM, fontSize: 12, fontStyle: "italic" }}>Assistant is typing...</div>}
        <div ref={endRef} />
      </div>
      <div style={{ padding: 16, background: THEME.NAVY, borderTop: `1px solid rgba(255,255,255,0.06)`, display: "flex", gap: 10 }}>
        <input 
          type="text" value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSend()}
          placeholder="Ask about active deals..."
          style={{
            flex: 1, padding: "10px 14px", borderRadius: 8, background: THEME.NAVY_LIGHT, border: "none",
            color: THEME.WHITE, outline: "none"
          }}
        />
        <button onClick={handleSend} disabled={loading} style={{
          background: THEME.GOLD, color: THEME.NAVY, border: "none", width: 40, height: 40,
          borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
          opacity: loading ? 0.5 : 1
        }}>
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};

const TypeBadge = ({ type }) => {
  const colors = { Buyer: THEME.BLUE, Seller: THEME.GOLD, TC: THEME.PURPLE, Investor: THEME.GREEN };
  const c = colors[type];
  return (
    <div style={{
      display: "inline-flex", padding: "4px 12px", borderRadius: 20,
      fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase",
      background: `${c}15`, color: c, border: `1px solid ${c}30`, alignItems: "center", gap: 6
    }}>
      <div style={{ width: 6, height: 6, borderRadius: 3, background: c }} />
      {type}
    </div>
  );
};

export default function DealCommandCenter() {
  const [clients] = useState(SAMPLE_CLIENTS);
  const [activeAgent, setActiveAgent] = useState('all');
  const [selectedClient, setSelectedClient] = useState(null);

  const filteredClients = activeAgent === 'all' 
    ? clients 
    : clients.filter(c => c.agent === activeAgent);

  // Group by stage for the charts
  const stageStats = filteredClients.reduce((acc, c) => {
    acc[c.stage] = (acc[c.stage] || 0) + 1;
    return acc;
  }, {});
  const chartData = Object.keys(stageStats).map(key => ({ name: key, count: stageStats[key] }));

  // Value aggregation (basic calculation, stripping non-numeric for demonstration)
  let totalPipelineValue = 0;
  filteredClients.forEach(c => {
    if (c.offerPrice && typeof c.offerPrice === 'string' && c.offerPrice.includes('$')) {
      const val = parseInt(c.offerPrice.replace(/\D/g, ''));
      if (!isNaN(val)) totalPipelineValue += val;
    } else if (c.loanAmt && typeof c.loanAmt === 'string' && c.loanAmt.includes('$')) {
      const val = parseInt(c.loanAmt.replace(/\D/g, ''));
      if (!isNaN(val)) totalPipelineValue += val;
    }
  });

  return (
    <div style={{ minHeight: "100vh", background: THEME.NAVY, color: THEME.WHITE }}>
      {/* HEADER */}
      <header style={{
        padding: "20px 40px", borderBottom: `1px solid rgba(255,255,255,0.06)`,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        background: `linear-gradient(180deg, ${THEME.NAVY} 0%, ${THEME.NAVY}F0 100%)`,
        position: "sticky", top: 0, zIndex: 50, backdropFilter: "blur(12px)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* Logo Placeholder (assuming logo.png is in public folder as requested) */}
          <img src="/logo.png" alt="Burley Sells Florida Logo" style={{ height: 48, objectFit: "contain" }} onError={(e) => {
            e.target.style.display = 'none'; // Fallback if no logo
            e.target.nextSibling.style.display = 'flex';
          }} />
          <div style={{ display: "none", width: 48, height: 48, borderRadius: 12, background: `linear-gradient(135deg, ${THEME.GOLD}, ${THEME.GOLD_DIM})`, alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 900, color: THEME.NAVY }}>BSF</div>
          
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: -0.5, color: THEME.WHITE }}>Deal Command Center</h1>
            <span style={{ fontSize: 13, color: THEME.GOLD, fontWeight: 500, letterSpacing: 1, textTransform: "uppercase" }}>Executive Dashboard</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {AGENTS.map(agent => (
            <button
              key={agent.id}
              onClick={() => setActiveAgent(agent.id)}
              style={{
                padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer",
                background: activeAgent === agent.id ? THEME.NAVY_LIGHT : "transparent",
                color: activeAgent === agent.id ? THEME.WHITE : THEME.TEXT_DIM,
                fontWeight: activeAgent === agent.id ? 600 : 400,
                transition: "all 0.2s"
              }}
            >
              {agent.name}
            </button>
          ))}
        </div>
      </header>

      {/* DASHBOARD SUMMARY */}
      <div style={{ padding: "40px", display: "grid", gridTemplateColumns: "300px 1fr", gap: 40, maxWidth: 1400, margin: "0 auto" }}>
        
        {/* KPI Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ background: THEME.NAVY_MID, padding: 24, borderRadius: 16, border: `1px solid rgba(255,255,255,0.05)`, boxShadow: "0 10px 30px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <Activity size={20} color={THEME.GREEN} />
              <h3 style={{ margin: 0, fontSize: 14, color: THEME.TEXT_DIM, textTransform: "uppercase", letterSpacing: 1 }}>Active Deals</h3>
            </div>
            <div style={{ fontSize: 48, fontWeight: 700, color: THEME.WHITE, lineHeight: 1 }}>{filteredClients.length}</div>
          </div>

          <div style={{ background: THEME.NAVY_MID, padding: 24, borderRadius: 16, border: `1px solid rgba(255,255,255,0.05)`, boxShadow: "0 10px 30px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <DollarSign size={20} color={THEME.GOLD} />
              <h3 style={{ margin: 0, fontSize: 14, color: THEME.TEXT_DIM, textTransform: "uppercase", letterSpacing: 1 }}>Est. Pipeline Volume</h3>
            </div>
            <div style={{ fontSize: 36, fontWeight: 700, color: THEME.GOLD, lineHeight: 1 }}>
              ${totalPipelineValue > 0 ? totalPipelineValue.toLocaleString() : "---"}
            </div>
          </div>
        </div>

        {/* Charts Column */}
        <div style={{ background: THEME.NAVY_MID, padding: 32, borderRadius: 16, border: `1px solid rgba(255,255,255,0.05)`, boxShadow: "0 10px 30px rgba(0,0,0,0.2)", display: "flex", flexDirection: "column" }}>
          <h3 style={{ margin: "0 0 24px 0", fontSize: 16, color: THEME.WHITE, fontWeight: 600 }}>Deals by Stage Representation</h3>
          <div style={{ flex: 1, minHeight: 250 }}>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" stroke={THEME.TEXT_DIM} fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke={THEME.TEXT_DIM} fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} contentStyle={{ backgroundColor: THEME.NAVY, border: `1px solid ${THEME.GOLD}30`, borderRadius: 8, color: THEME.WHITE }} />
                  <Bar dataKey="count" fill={THEME.GOLD} radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? THEME.GOLD : THEME.GOLD_DIM} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center", color: THEME.TEXT_DIM }}>No Active Deals in this View</div>
            )}
          </div>
        </div>
      </div>

      {/* FEED (CLIENT LIST) */}
      <div style={{ padding: "0 40px 100px", maxWidth: 1400, margin: "0 auto" }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: THEME.WHITE, borderBottom: `1px solid rgba(255,255,255,0.1)`, paddingBottom: 16, marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>Client Portfolio Flow</span>
          <span style={{ fontSize: 13, fontWeight: 400, color: THEME.TEXT_DIM }}>{filteredClients.length} records found</span>
        </h2>
        
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {filteredClients.map(client => {
            const sop = getSOP(client.type);
            const isSelected = selectedClient?.id === client.id;
            
            return (
              <div key={client.id}>
                {/* LIST CARD ITEM */}
                <div 
                  onClick={() => setSelectedClient(isSelected ? null : client)}
                  style={{
                    background: isSelected ? THEME.NAVY_LIGHT : THEME.NAVY_MID, 
                    borderRadius: isSelected ? "16px 16px 0 0" : 16, 
                    padding: "24px 32px", cursor: "pointer",
                    border: `1px solid ${isSelected ? THEME.GOLD : "rgba(255,255,255,0.04)"}`,
                    transition: "all 0.3s ease", display: "flex", alignItems: "center", gap: 24,
                    boxShadow: isSelected ? `0 10px 40px rgba(0,0,0,0.4)` : 'none'
                  }}
                >
                  <div style={{ flex: "0 0 250px" }}>
                    <div style={{ fontSize: 18, fontWeight: 600, color: THEME.WHITE, marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
                      <User size={18} color={THEME.GOLD} /> {client.name}
                    </div>
                    <TypeBadge type={client.type} />
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: THEME.TEXT_DIM, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Current Stage</div>
                    <div style={{ fontSize: 16, fontWeight: 500, color: THEME.WHITE }}>{client.stage}</div>
                  </div>

                  <div style={{ flex: "0 0 200px" }}>
                    {client.offerPrice || client.loanAmt !== "N/A" ? (
                      <>
                        <div style={{ fontSize: 12, color: THEME.TEXT_DIM, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Value Focus</div>
                        <div style={{ fontSize: 16, fontWeight: 500, color: THEME.GOLD }}>{client.offerPrice || client.loanAmt}</div>
                      </>
                    ) : (
                      <div style={{ color: THEME.TEXT_DIM, fontStyle: "italic", fontSize: 14 }}>Valuation Pending</div>
                    )}
                  </div>

                  <div style={{ width: 150 }}>
                     <div style={{ fontSize: 11, color: THEME.TEXT_DIM, marginBottom: 6, display: "flex", justifyContent: "space-between" }}>
                       <span>Progress</span>
                       <span>{Math.round((client.sopProgress / sop.length) * 100)}%</span>
                     </div>
                     <div style={{ height: 6, background: "rgba(255,255,255,0.1)", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${(client.sopProgress / sop.length) * 100}%`, background: THEME.GREEN, borderRadius: 3 }} />
                     </div>
                  </div>

                  <div>
                    <ChevronRight size={24} color={isSelected ? THEME.GOLD : THEME.TEXT_DIM} style={{ transform: isSelected ? 'rotate(90deg)' : 'none', transition: 'transform 0.3s' }} />
                  </div>
                </div>

                {/* EXPANDED PROFILE TAB */}
                {isSelected && (
                  <div style={{
                    background: THEME.NAVY_LIGHT, border: `1px solid ${THEME.GOLD}`, borderTop: "none",
                    borderRadius: "0 0 16px 16px", padding: 32, display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 40,
                    animation: "fadeIn 0.3s ease-out"
                  }}>
                    {/* LEFT PANEL: Details */}
                    <div>
                      <h4 style={{ fontSize: 16, fontWeight: 600, color: THEME.WHITE, borderBottom: `1px solid rgba(255,255,255,0.1)`, paddingBottom: 12, marginBottom: 20 }}>Client Dossier</h4>
                      
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
                        <div>
                           <div style={{ fontSize: 11, color: THEME.TEXT_DIM, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Pre-Approval</div>
                           <div style={{ color: THEME.WHITE, fontSize: 14, fontWeight: 500 }}>{client.preApproval || "N/A"}</div>
                        </div>
                        <div>
                           <div style={{ fontSize: 11, color: THEME.TEXT_DIM, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Lender</div>
                           <div style={{ color: THEME.WHITE, fontSize: 14, fontWeight: 500 }}>{client.lender || "N/A"}</div>
                        </div>
                        <div>
                           <div style={{ fontSize: 11, color: THEME.TEXT_DIM, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}><Calendar size={12} style={{marginRight: 4, display: 'inline'}}/> Target Close</div>
                           <div style={{ color: THEME.WHITE, fontSize: 14, fontWeight: 500 }}>{client.closingDate || "TBD"}</div>
                        </div>
                        <div>
                           <div style={{ fontSize: 11, color: THEME.TEXT_DIM, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}><Target size={12} style={{marginRight: 4, display: 'inline'}}/> Representation</div>
                           <div style={{ color: THEME.WHITE, fontSize: 14, fontWeight: 500 }}>{client.agent === 'bob' ? "Bob Dean" : "Amber"}</div>
                        </div>
                      </div>

                      <div style={{ background: "rgba(0,0,0,0.2)", padding: 16, borderRadius: 8, borderLeft: `4px solid ${THEME.GOLD}` }}>
                        <div style={{ fontSize: 11, color: THEME.TEXT_DIM, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Strategic Notes</div>
                        <div style={{ fontSize: 14, color: THEME.WHITE, lineHeight: 1.6 }}>{client.notes || "No standard operational notes documented yet."}</div>
                      </div>
                    </div>

                    {/* RIGHT PANEL: SOP Pipeline */}
                    <div>
                      <h4 style={{ fontSize: 16, fontWeight: 600, color: THEME.WHITE, borderBottom: `1px solid rgba(255,255,255,0.1)`, paddingBottom: 12, marginBottom: 20 }}>Action Trajectory</h4>
                      <div style={{ maxHeight: 300, overflowY: "auto", paddingRight: 10 }}>
                        {sop.map((step, idx) => {
                          const isComplete = idx < client.sopProgress;
                          const isCurrent = idx === client.sopProgress;
                          return (
                            <div key={idx} style={{ display: "flex", gap: 16, marginBottom: 16, opacity: isComplete ? 0.6 : 1 }}>
                              <div style={{ paddingTop: 2 }}>
                                {isComplete ? <CheckCircle2 size={20} color={THEME.GREEN} /> : isCurrent ? <Circle size={20} color={THEME.GOLD} fill={THEME.GOLD_GLOW} /> : <Circle size={20} color={THEME.TEXT_DIM} />}
                              </div>
                              <div>
                                <div style={{ fontSize: 14, fontWeight: isCurrent ? 600 : 400, color: isCurrent ? THEME.WHITE : isComplete ? THEME.TEXT_DIM : "rgba(255,255,255,0.5)" }}>{step.step}</div>
                                <div style={{ fontSize: 11, color: isCurrent ? THEME.GOLD : THEME.TEXT_DIM, marginTop: 2 }}>Phase: {step.stage}</div>
                              </div>
                            </div>
                          )
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
