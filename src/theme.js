// ═══════════════════════════════════════════════════
// BSF 1 MILLION — THEME SYSTEM
// ═══════════════════════════════════════════════════

export const THEME = {
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
  RED: "#FF3B30",
  GLASS: "rgba(255,255,255,0.03)",
  GLASS_BORDER: "rgba(255,255,255,0.07)",
};

export const PRIORITY_COLORS = {
  high: "#FF3B30",
  medium: "#F0A050",
  low: "#3ECF8E",
};

export const STATUS_CONFIG = {
  pending:     { label: "Pending",     color: "#F0A050", bg: "rgba(240,160,80,0.12)" },
  in_progress: { label: "In Progress", color: "#3B82F6", bg: "rgba(59,130,246,0.12)" },
  completed:   { label: "Completed",   color: "#3ECF8E", bg: "rgba(62,207,142,0.12)" },
};

// ── SOP DATA ──
export const BUYER_SOP = [
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

export const SELLER_SOP = [
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

export const TC_SOP = [
  { step: "Contract Received", stage: "Received" },
  { step: "Initial Document Review", stage: "Docs In Review" },
  { step: "Missing Signatures Request", stage: "Pending Sigs" },
  { step: "Brokerage Compliance Submit", stage: "Compliance" },
  { step: "Clear to Close Verification", stage: "Clear to Close" },
  { step: "Closing Day Support", stage: "Closed" },
];

export const INVESTOR_SOP = [
  { step: "Initial Investor Meeting", stage: "Lead" },
  { step: "Investment Criteria Setup", stage: "Lead" },
  { step: "Property Analysis & ARV", stage: "Property Analysis" },
  { step: "Offer Preparation", stage: "Property Analysis" },
  { step: "Negotiation & Acceptance", stage: "Under Contract" },
  { step: "Due Diligence & Inspections", stage: "Under Contract" },
  { step: "Renovation Planning", stage: "Renovation" },
  { step: "Contractor Coordination", stage: "Renovation" },
  { step: "Renovation Execution", stage: "Renovation" },
  { step: "Final Inspection & Punch List", stage: "Listing Prep" },
  { step: "Listing Photography & Staging", stage: "Listing Prep" },
  { step: "MLS Launch", stage: "Active Marketing" },
  { step: "Closing Day", stage: "Closed" },
];

export const getSOP = (type) => {
  switch (type) {
    case "Buyer":    return BUYER_SOP;
    case "Seller":   return SELLER_SOP;
    case "TC":       return TC_SOP;
    case "Investor": return INVESTOR_SOP;
    default:         return BUYER_SOP;
  }
};

export const AGENTS = [
  { id: "all",   name: "All Agents" },
  { id: "sheba", name: "Sheba" },
  { id: "bob",   name: "Bob Dean" },
  { id: "amber", name: "Amber — TC" },
];

// ── GLASS CARD STYLE ──
export const glassCard = (extra = {}) => ({
  background: "linear-gradient(135deg, rgba(15,30,53,0.8) 0%, rgba(9,23,40,0.9) 100%)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: `1px solid ${THEME.GLASS_BORDER}`,
  borderRadius: 16,
  ...extra,
});

// ── HELPERS ──
export const formatCurrency = (n) => {
  if (!n || n === 0) return "—";
  return `$${Number(n).toLocaleString()}`;
};

export const getProgress = (client) => {
  const sop = getSOP(client.type);
  if (client.sop_progress != null && client.sop_progress > 0) return client.sop_progress;
  const idx = sop.reduce((last, s, i) => s.stage === client.stage ? i : last, -1);
  return idx >= 0 ? idx + 1 : 0;
};

export const agentName = (id) =>
  id === "sheba" ? "Sheba" :
  id === "bob"   ? "Bob Dean" :
  id === "amber" ? "Amber" :
  id || "—";
