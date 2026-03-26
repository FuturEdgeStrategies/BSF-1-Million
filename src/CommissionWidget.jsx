import React, { useState, useEffect } from "react";
import { THEME, formatCurrency, calculateCommission } from "./theme";

export default function CommissionWidget({ client }) {
  const [price, setPrice] = useState(client.offer_price || client.loan_amt || "");
  const [rate, setRate] = useState((client.commission_rate || 0.03) * 100);
  const [split, setSplit] = useState(client.commission_split || "solo");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setPrice(client.offer_price || client.loan_amt || "");
    setRate((client.commission_rate || 0.03) * 100);
    setSplit(client.commission_split || "solo");
  }, [client.offer_price, client.loan_amt, client.commission_rate, client.commission_split]);

  const dummyClient = {
    ...client,
    offer_price: price,
    commission_rate: rate / 100,
    commission_split: split,
  };
  const comm = calculateCommission(dummyClient);

  const handleSave = async () => {
    setSaving(true);
    const updates = { commission_rate: rate / 100, commission_split: split };
    if (client.loan_amt > 0 && !client.offer_price) {
      updates.loan_amt = price || null;
    } else {
      updates.offer_price = price || null;
    }
    await import("./supabaseClient").then(({ supabase }) => 
      supabase.from("clients").update(updates).eq("id", client.id)
    );
    setSaving(false);
  };

  const hasChanges = 
    price != (client.offer_price || client.loan_amt || "") ||
    rate != ((client.commission_rate || 0.03) * 100) ||
    split != (client.commission_split || "solo");

  const inputStyle = {
    background: "rgba(255,255,255,0.05)",
    border: `1px solid ${THEME.GLASS_BORDER}`,
    padding: "6px 10px",
    borderRadius: 6,
    color: THEME.WHITE,
    fontSize: 13,
    fontFamily: "'Space Grotesk'",
    width: "100%",
    boxSizing: "border-box",
    outline: "none"
  };

  return (
    <div style={{ marginTop: 18, padding: "16px", borderRadius: 10, background: "rgba(0,0,0,0.3)", borderLeft: `3px solid ${THEME.GOLD}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 10, color: THEME.GOLD, textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 700 }}>Commission Planner</div>
        {hasChanges && (
          <button onClick={handleSave} disabled={saving} style={{ padding: "4px 10px", background: THEME.GOLD, color: THEME.NAVY, border: "none", borderRadius: 4, cursor: "pointer", fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>
            {saving ? "Saving..." : "Save Config"}
          </button>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
        <div>
          <label style={{ display: "block", fontSize: 10, color: THEME.TEXT_DIM, marginBottom: 4 }}>Price / Loan</label>
          <input type="number" step="1000" value={price} onChange={e => setPrice(e.target.value ? Number(e.target.value) : "")} style={inputStyle} />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 10, color: THEME.TEXT_DIM, marginBottom: 4 }}>Rate (%)</label>
          <input type="number" step="0.1" value={rate} onChange={e => setRate(Number(e.target.value))} style={inputStyle} />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 10, color: THEME.TEXT_DIM, marginBottom: 4 }}>Split</label>
          <select value={split} onChange={e => setSplit(e.target.value)} style={inputStyle}>
            <option value="solo">Solo (100%)</option>
            <option value="50-50-bob">50/50 Bob</option>
            <option value="50-50-amber">50/50 Amber</option>
          </select>
        </div>
      </div>

      {comm ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px 12px", background: "rgba(255,255,255,0.02)", padding: 12, borderRadius: 8, border: `1px solid ${THEME.GLASS_BORDER}` }}>
          <div>
            <div style={{ fontSize: 10, color: THEME.TEXT_DIM, fontWeight: 600 }}>Gross ({(comm.rate * 100).toFixed(1)}%)</div>
            <div style={{ fontSize: 13, color: THEME.WHITE, fontWeight: 600 }}>{formatCurrency(comm.grossCommission)}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: THEME.TEXT_DIM, fontWeight: 600 }}>Brokerage Cut</div>
            <div style={{ fontSize: 13, color: THEME.RED, fontWeight: 600 }}>-{formatCurrency(comm.brokerageCut)}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: THEME.GOLD, fontWeight: 700 }}>My Take-Home</div>
            <div style={{ fontSize: 16, color: THEME.GOLD, fontWeight: 700, textShadow: `0 0 12px ${THEME.GOLD_GLOW}` }}>{formatCurrency(comm.myTakeHome)}</div>
          </div>
        </div>
      ) : (
        <div style={{ fontSize: 12, color: THEME.TEXT_DIM, fontStyle: "italic" }}>Enter a price above to calculate.</div>
      )}
    </div>
  );
}
