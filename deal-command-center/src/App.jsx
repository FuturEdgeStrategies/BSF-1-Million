import { useState, useEffect, useRef } from "react";

const NAVY = "#0A1628";
const NAVY_LIGHT = "#1A2A42";
const NAVY_MID = "#122238";
const GOLD = "#C9A84C";
const GOLD_DIM = "#8B7535";
const GOLD_GLOW = "rgba(201,168,76,0.12)";
const WHITE = "#F5F3EE";
const WARM_WHITE = "#FAF8F3";
const TEXT_DIM = "#8A95A8";
const GREEN = "#3ECF8E";
const ORANGE = "#F0A050";
const RED = "#E85D5D";

const BUYER_STAGES = ["Lead","Pre-Qualified","Active Search","Under Contract","Due Diligence","Clear to Close","Closed"];
const SELLER_STAGES = ["Lead","Pre-Qualified","Active Marketing","Under Contract","Due Diligence","Clear to Close","Closed"];
const TC_STAGES = ["Received","Docs In Review","Pending Sigs","Compliance","Clear to Close","Closed"];
const INVESTOR_STAGES = ["Lead","Property Analysis","Under Contract","Renovation","Listing Prep","Active Marketing","Closed"];

const STAGE_MAP = { Buyer: BUYER_STAGES, Seller: SELLER_STAGES, TC: TC_STAGES, Investor: INVESTOR_STAGES };

const BUYER_SOP = [
  { step: "Initial Client Intake", stage: "Lead", desc: "Collect contact info, timeline, budget, location preferences, must-haves." },
  { step: "Pre-Approval Referral", stage: "Lead", desc: "Refer to lender. Confirm pre-approval letter, loan type, amount." },
  { step: "Buyer Consultation", stage: "Pre-Qualified", desc: "Review process, sign Buyer Broker Agreement in Dotloop. Set MLS search." },
  { step: "Property Search Setup", stage: "Active Search", desc: "Set up MLS auto-search. Identify initial properties. Schedule showings." },
  { step: "Showings & Feedback", stage: "Active Search", desc: "Conduct showings. Record feedback. Adjust criteria as needed." },
  { step: "Offer Preparation", stage: "Active Search", desc: "Pull comps, draft purchase offer in Dotloop. Submit to listing agent." },
  { step: "Negotiation & Acceptance", stage: "Under Contract", desc: "Track counteroffers. Execute signed contract via Dotloop." },
  { step: "Earnest Money Deposit", stage: "Under Contract", desc: "Confirm EMD amount, deadline, and deposit receipt." },
  { step: "Title Coordination", stage: "Under Contract", desc: "Open title/escrow. Provide contract and buyer info." },
  { step: "Inspection Scheduling", stage: "Due Diligence", desc: "Schedule home, pest, wind mit, 4-point inspections." },
  { step: "Inspection Negotiation", stage: "Due Diligence", desc: "Review report. Prepare repair/credit request if needed." },
  { step: "Appraisal Coordination", stage: "Due Diligence", desc: "Confirm lender ordered appraisal. Review result." },
  { step: "Loan Processing", stage: "Due Diligence", desc: "Stay in contact with lender. Track clear-to-close status." },
  { step: "Insurance & Utilities", stage: "Clear to Close", desc: "Remind buyer to bind insurance. Coordinate utility transfers." },
  { step: "Final Walkthrough", stage: "Clear to Close", desc: "Schedule 24-48 hrs before closing. Confirm repairs complete." },
  { step: "Closing Prep", stage: "Clear to Close", desc: "Confirm date/time/location. Review closing disclosure." },
  { step: "Closing Day", stage: "Closed", desc: "Attend closing. Confirm funding and recording. Hand over keys." },
  { step: "Post-Closing Follow-Up", stage: "Closed", desc: "Thank-you gift, request review, add to past client DB." },
];

const SELLER_SOP = [
  { step: "Initial Seller Inquiry", stage: "Lead", desc: "Collect contact info, property address, reason for selling, timeline." },
  { step: "Pre-Listing CMA", stage: "Lead", desc: "Pull comps. Prepare CMA report. Analyze market conditions." },
  { step: "Listing Consultation", stage: "Pre-Qualified", desc: "Present CMA, pricing strategy, marketing plan. Sign Listing Agreement." },
  { step: "Property Preparation", stage: "Pre-Qualified", desc: "Coordinate staging, cleaning, repairs, professional photography." },
  { step: "MLS & Marketing Launch", stage: "Active Marketing", desc: "Enter listing in MLS. Create flyer. Schedule social media posts." },
  { step: "Social Media Campaign", stage: "Active Marketing", desc: "Execute posting schedule. Track engagement per platform." },
  { step: "Open House Execution", stage: "Active Marketing", desc: "Schedule, promote, host open house. Send visitor report to seller." },
  { step: "Showing Management", stage: "Active Marketing", desc: "Coordinate showings. Collect agent feedback. Weekly seller report." },
  { step: "Offer Review", stage: "Active Marketing", desc: "Receive offers. Prepare net sheets. Present to seller." },
  { step: "Negotiation & Acceptance", stage: "Under Contract", desc: "Negotiate terms. Execute accepted contract in Dotloop." },
  { step: "Title & Escrow", stage: "Under Contract", desc: "Provide contract to title company. Resolve title issues." },
  { step: "Buyer Inspection Period", stage: "Due Diligence", desc: "Coordinate access. Negotiate repair/credit terms." },
  { step: "Appraisal Coordination", stage: "Due Diligence", desc: "Provide comps if requested. Monitor appraisal timeline." },
  { step: "Seller Document Prep", stage: "Due Diligence", desc: "Gather disclosures, HOA docs, survey, permits. Upload to Dotloop." },
  { step: "Closing Coordination", stage: "Clear to Close", desc: "Confirm date/time/location. Review seller closing disclosure." },
  { step: "Closing Day", stage: "Closed", desc: "Attend closing. Confirm proceeds disbursement. Hand off keys." },
  { step: "Post-Closing Follow-Up", stage: "Closed", desc: "Thank-you, request review, remove lockbox/signage, update MLS." },
];

const getSOP = (type) => type === "Buyer" ? BUYER_SOP : type === "Seller" ? SELLER_SOP : BUYER_SOP;

const SAMPLE_CLIENTS = [
  { id: 1, name: "Sheryl Wojciechowski", type: "Buyer", stage: "Active Search", preApproval: "Approved", lender: "Wells Fargo", loanAmt: "$385,000", offerPrice: null, offerDate: null, inspectionDate: null, appraisalDate: null, closingDate: null, sopProgress: 4, notes: "Focused west of 49th St — Tyrone/Seminole/Largo area. Buying for daughter." },
  { id: 2, name: "Patience Williams", type: "Buyer", stage: "Pre-Qualified", preApproval: "Approved", lender: "Rocket Mortgage", loanAmt: "$290,000", offerPrice: null, offerDate: null, inspectionDate: null, appraisalDate: null, closingDate: null, sopProgress: 2, notes: "First-time buyer. Check DARE & CRA programs." },
  { id: 3, name: "Ryan & Angie (Investor)", type: "Investor", stage: "Under Contract", preApproval: "Cash", lender: "N/A", loanAmt: "N/A", offerPrice: "$215,000", offerDate: "03/10/2026", inspectionDate: "03/25/2026", appraisalDate: "N/A", closingDate: "04/15/2026", sopProgress: 5, notes: "Fix-and-flip. Pinellas County. Rehab budget ~$40K." },
  { id: 4, name: "Surfside Tower Unit", type: "Seller", stage: "Active Marketing", preApproval: "N/A", lender: "N/A", loanAmt: "N/A", offerPrice: null, offerDate: null, inspectionDate: null, appraisalDate: null, closingDate: null, sopProgress: 6, notes: "15462 Gulf Blvd, Madeira Beach. Bob Dean listing. Social campaign active." },
  { id: 5, name: "Doug (CA Relocation)", type: "Buyer", stage: "Lead", preApproval: "Pending", lender: "TBD", loanAmt: "TBD", offerPrice: null, offerDate: null, inspectionDate: null, appraisalDate: null, closingDate: null, sopProgress: 0, notes: "Relocating from California. Initial outreach sent." },
  { id: 6, name: "Russel Henderson", type: "Buyer", stage: "Active Search", preApproval: "Approved", lender: "Navy Federal", loanAmt: "$250,000", offerPrice: null, offerDate: null, inspectionDate: null, appraisalDate: null, closingDate: null, sopProgress: 4, notes: "55+ community condo search. Clearwater/Largo area." },
];

const TypeBadge = ({ type }) => {
  const colors = { Buyer: "#3B82F6", Seller: GOLD, TC: "#A78BFA", Investor: GREEN };
  return (
    <span style={{
      display: "inline-block", padding: "2px 10px", borderRadius: 20,
      fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase",
      background: `${colors[type]}18`, color: colors[type], border: `1px solid ${colors[type]}40`
    }}>{type}</span>
  );
};

const ProgressBar = ({ current, total }) => {
  const pct = Math.round((current / total) * 100);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
      <div style={{ flex: 1, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.08)" }}>
        <div style={{
          width: `${pct}%`, height: "100%", borderRadius: 2,
          background: pct === 100 ? GREEN : `linear-gradient(90deg, ${GOLD}, ${GOLD_DIM})`,
          transition: "width 0.6s ease"
        }} />
      </div>
      <span style={{ fontSize: 10, color: TEXT_DIM, fontVariantNumeric: "tabular-nums", minWidth: 32 }}>{pct}%</span>
    </div>
  );
};

const StatusDot = ({ status }) => {
  const c = status === "Approved" ? GREEN : status === "Pending" ? ORANGE : status === "Cash" ? "#3B82F6" : TEXT_DIM;
  return <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: 3, background: c, marginRight: 6 }} />;
};

const ClientCard = ({ client, onClick, isDragging }) => {
  const sop = getSOP(client.type);
  const total = sop.length;
  return (
    <div
      onClick={() => onClick(client)}
      style={{
        background: NAVY_MID, borderRadius: 10, padding: "14px 16px", cursor: "pointer",
        border: `1px solid ${isDragging ? GOLD : "rgba(255,255,255,0.06)"}`,
        transition: "all 0.2s ease", marginBottom: 8,
        boxShadow: isDragging ? `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px ${GOLD}40` : "0 2px 8px rgba(0,0,0,0.2)",
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = `${GOLD}60`; e.currentTarget.style.transform = "translateY(-1px)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.transform = "none"; }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: WHITE, lineHeight: 1.3, flex: 1, marginRight: 8 }}>{client.name}</span>
        <TypeBadge type={client.type} />
      </div>
      {client.preApproval && client.preApproval !== "N/A" && (
        <div style={{ fontSize: 11, color: TEXT_DIM, marginBottom: 4, display: "flex", alignItems: "center" }}>
          <StatusDot status={client.preApproval} />
          {client.preApproval === "Cash" ? "Cash Buyer" : `${client.preApproval} — ${client.lender}`}
          {client.loanAmt && client.loanAmt !== "N/A" && client.loanAmt !== "TBD" && <span style={{ color: GOLD, marginLeft: 6 }}>{client.loanAmt}</span>}
        </div>
      )}
      {client.offerPrice && (
        <div style={{ fontSize: 11, color: TEXT_DIM, marginBottom: 4 }}>
          Offer: <span style={{ color: WHITE }}>{client.offerPrice}</span>
          {client.offerDate && <span style={{ marginLeft: 8, color: TEXT_DIM }}>({client.offerDate})</span>}
        </div>
      )}
      <div style={{ display: "flex", gap: 12, marginTop: 6, flexWrap: "wrap" }}>
        {client.inspectionDate && (
          <span style={{ fontSize: 10, color: ORANGE, background: `${ORANGE}15`, padding: "2px 8px", borderRadius: 4 }}>
            Inspect: {client.inspectionDate}
          </span>
        )}
        {client.closingDate && (
          <span style={{ fontSize: 10, color: GREEN, background: `${GREEN}15`, padding: "2px 8px", borderRadius: 4 }}>
            Close: {client.closingDate}
          </span>
        )}
      </div>
      <ProgressBar current={client.sopProgress} total={total} />
    </div>
  );
};

const SOPPanel = ({ client, onClose }) => {
  const sop = getSOP(client.type);
  const [expandedStep, setExpandedStep] = useState(null);
  return (
    <div style={{
      position: "fixed", top: 0, right: 0, width: 420, height: "100vh", background: NAVY,
      borderLeft: `1px solid ${GOLD}30`, zIndex: 100, display: "flex", flexDirection: "column",
      boxShadow: "-8px 0 40px rgba(0,0,0,0.5)", animation: "slideIn 0.3s ease"
    }}>
      <style>{`@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
      <div style={{ padding: "20px 24px", borderBottom: `1px solid rgba(255,255,255,0.08)` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, color: WHITE, fontWeight: 700 }}>{client.name}</h2>
            <div style={{ marginTop: 6, display: "flex", gap: 8, alignItems: "center" }}>
              <TypeBadge type={client.type} />
              <span style={{ fontSize: 12, color: GOLD }}>{client.stage}</span>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: "rgba(255,255,255,0.06)", border: "none", color: TEXT_DIM,
            width: 32, height: 32, borderRadius: 8, cursor: "pointer", fontSize: 16,
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>✕</button>
        </div>
        {client.notes && (
          <p style={{ margin: "12px 0 0", fontSize: 12, color: TEXT_DIM, lineHeight: 1.5, fontStyle: "italic" }}>
            {client.notes}
          </p>
        )}
        <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {client.preApproval && client.preApproval !== "N/A" && (
            <div style={{ background: NAVY_LIGHT, borderRadius: 8, padding: "8px 12px" }}>
              <div style={{ fontSize: 9, color: TEXT_DIM, textTransform: "uppercase", letterSpacing: 1 }}>Pre-Approval</div>
              <div style={{ fontSize: 13, color: WHITE, marginTop: 2 }}><StatusDot status={client.preApproval} />{client.preApproval}</div>
            </div>
          )}
          {client.lender && client.lender !== "N/A" && client.lender !== "TBD" && (
            <div style={{ background: NAVY_LIGHT, borderRadius: 8, padding: "8px 12px" }}>
              <div style={{ fontSize: 9, color: TEXT_DIM, textTransform: "uppercase", letterSpacing: 1 }}>Lender</div>
              <div style={{ fontSize: 13, color: WHITE, marginTop: 2 }}>{client.lender}</div>
            </div>
          )}
          {client.offerPrice && (
            <div style={{ background: NAVY_LIGHT, borderRadius: 8, padding: "8px 12px" }}>
              <div style={{ fontSize: 9, color: TEXT_DIM, textTransform: "uppercase", letterSpacing: 1 }}>Offer</div>
              <div style={{ fontSize: 13, color: GOLD, marginTop: 2 }}>{client.offerPrice}</div>
            </div>
          )}
          {client.closingDate && (
            <div style={{ background: NAVY_LIGHT, borderRadius: 8, padding: "8px 12px" }}>
              <div style={{ fontSize: 9, color: TEXT_DIM, textTransform: "uppercase", letterSpacing: 1 }}>Closing</div>
              <div style={{ fontSize: 13, color: GREEN, marginTop: 2 }}>{client.closingDate}</div>
            </div>
          )}
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px" }}>
        <div style={{ fontSize: 11, color: TEXT_DIM, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12, fontWeight: 600 }}>
          Transaction Checklist — {client.sopProgress} of {sop.length} complete
        </div>
        <ProgressBar current={client.sopProgress} total={sop.length} />
        <div style={{ marginTop: 16 }}>
          {sop.map((s, i) => {
            const done = i < client.sopProgress;
            const current = i === client.sopProgress;
            const expanded = expandedStep === i;
            return (
              <div
                key={i}
                onClick={() => setExpandedStep(expanded ? null : i)}
                style={{
                  display: "flex", gap: 12, padding: "10px 0", cursor: "pointer",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                  opacity: done ? 0.5 : 1,
                }}
              >
                <div style={{
                  minWidth: 24, height: 24, borderRadius: 12,
                  background: done ? GREEN : current ? GOLD : "transparent",
                  border: done ? "none" : current ? "none" : `1.5px solid rgba(255,255,255,0.15)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700, color: done || current ? NAVY : TEXT_DIM,
                  flexShrink: 0, marginTop: 1,
                  boxShadow: current ? `0 0 12px ${GOLD}40` : "none"
                }}>
                  {done ? "✓" : i + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: current ? WHITE : done ? TEXT_DIM : "rgba(255,255,255,0.7)", fontWeight: current ? 600 : 400 }}>
                    {s.step}
                  </div>
                  <div style={{ fontSize: 10, color: `${GOLD}80`, marginTop: 2 }}>{s.stage}</div>
                  {expanded && (
                    <div style={{
                      fontSize: 12, color: TEXT_DIM, lineHeight: 1.5, marginTop: 8,
                      padding: "10px 12px", background: NAVY_LIGHT, borderRadius: 8,
                      borderLeft: `2px solid ${current ? GOLD : "rgba(255,255,255,0.1)"}`
                    }}>
                      {s.desc}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default function DealCommandCenter() {
  const [clients] = useState(SAMPLE_CLIENTS);
  const [filter, setFilter] = useState("All");
  const [selectedClient, setSelectedClient] = useState(null);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const filtered = filter === "All" ? clients : clients.filter(c => c.type === filter);
  const activeStages = filter === "All" ? BUYER_STAGES : STAGE_MAP[filter] || BUYER_STAGES;

  const stats = {
    active: clients.filter(c => c.stage !== "Closed").length,
    buyers: clients.filter(c => c.type === "Buyer").length,
    sellers: clients.filter(c => c.type === "Seller").length,
    underContract: clients.filter(c => c.stage === "Under Contract").length,
  };

  return (
    <div style={{
      minHeight: "100vh", background: NAVY, fontFamily: "'Inter', -apple-system, sans-serif",
      color: WHITE, position: "relative", overflow: "hidden"
    }}>
      {/* Ambient glow */}
      <div style={{
        position: "fixed", top: -200, right: -200, width: 600, height: 600,
        background: `radial-gradient(circle, ${GOLD}06 0%, transparent 70%)`,
        pointerEvents: "none"
      }} />

      {/* Header */}
      <header style={{
        padding: "20px 32px", borderBottom: `1px solid rgba(255,255,255,0.06)`,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        background: `linear-gradient(180deg, ${NAVY} 0%, ${NAVY}F0 100%)`,
        backdropFilter: "blur(20px)", position: "sticky", top: 0, zIndex: 50
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8, background: `linear-gradient(135deg, ${GOLD}, ${GOLD_DIM})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, fontWeight: 800, color: NAVY
            }}>B</div>
            <div>
              <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: -0.3 }}>Deal Command Center</h1>
              <span style={{ fontSize: 11, color: TEXT_DIM }}>Burley Sells Florida</span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: TEXT_DIM }}>{time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
            <div style={{ fontSize: 11, color: GOLD }}>{stats.active} active deals</div>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <div style={{
        display: "flex", gap: 12, padding: "16px 32px",
        borderBottom: "1px solid rgba(255,255,255,0.04)"
      }}>
        {[
          { label: "Active Deals", value: stats.active, color: WHITE },
          { label: "Buyers", value: stats.buyers, color: "#3B82F6" },
          { label: "Listings", value: stats.sellers, color: GOLD },
          { label: "Under Contract", value: stats.underContract, color: GREEN },
        ].map((s, i) => (
          <div key={i} style={{
            background: NAVY_LIGHT, borderRadius: 10, padding: "12px 20px",
            border: "1px solid rgba(255,255,255,0.04)", minWidth: 120
          }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: s.color, fontVariantNumeric: "tabular-nums" }}>{s.value}</div>
            <div style={{ fontSize: 10, color: TEXT_DIM, textTransform: "uppercase", letterSpacing: 1, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: 4, padding: "12px 32px" }}>
        {["All", "Buyer", "Seller", "TC", "Investor"].map(f => (
          <button
            key={f} onClick={() => setFilter(f)}
            style={{
              padding: "6px 16px", borderRadius: 20, border: "1px solid",
              borderColor: filter === f ? GOLD : "rgba(255,255,255,0.08)",
              background: filter === f ? `${GOLD}15` : "transparent",
              color: filter === f ? GOLD : TEXT_DIM,
              fontSize: 12, fontWeight: 500, cursor: "pointer",
              transition: "all 0.2s ease"
            }}
          >{f}</button>
        ))}
      </div>

      {/* Kanban Board */}
      <div style={{
        display: "flex", gap: 0, padding: "0 32px 32px",
        overflowX: "auto", flex: 1
      }}>
        {activeStages.map((stage, si) => {
          const stageClients = filtered.filter(c => c.stage === stage);
          const isFirst = si === 0;
          const isLast = si === activeStages.length - 1;
          return (
            <div key={stage} style={{
              minWidth: 220, maxWidth: 260, flex: 1,
              borderRight: isLast ? "none" : "1px solid rgba(255,255,255,0.04)",
              padding: "0 12px"
            }}>
              {/* Column Header */}
              <div style={{
                padding: "12px 4px 16px", display: "flex", justifyContent: "space-between", alignItems: "center",
                borderBottom: `2px solid ${stageClients.length > 0 ? GOLD : "rgba(255,255,255,0.06)"}`,
                marginBottom: 12
              }}>
                <span style={{
                  fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1,
                  color: stageClients.length > 0 ? WHITE : TEXT_DIM
                }}>{stage}</span>
                <span style={{
                  fontSize: 11, fontWeight: 700,
                  color: stageClients.length > 0 ? GOLD : "rgba(255,255,255,0.15)",
                  background: stageClients.length > 0 ? `${GOLD}15` : "transparent",
                  padding: "2px 8px", borderRadius: 10
                }}>{stageClients.length}</span>
              </div>
              {/* Cards */}
              <div style={{ display: "flex", flexDirection: "column" }}>
                {stageClients.map(c => (
                  <ClientCard key={c.id} client={c} onClick={setSelectedClient} />
                ))}
                {stageClients.length === 0 && (
                  <div style={{
                    height: 80, borderRadius: 10, border: "1px dashed rgba(255,255,255,0.06)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, color: "rgba(255,255,255,0.1)"
                  }}>
                    No deals
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* SOP Detail Panel */}
      {selectedClient && (
        <>
          <div
            onClick={() => setSelectedClient(null)}
            style={{
              position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(4px)", zIndex: 90
            }}
          />
          <SOPPanel client={selectedClient} onClose={() => setSelectedClient(null)} />
        </>
      )}
    </div>
  );
}
