import { useState } from "react";
import { X, Trash2, CheckCircle2, Circle, Camera, Loader } from "lucide-react";
import { THEME, glassCard, getSOP, TIMELINE_FIELDS } from "./theme";
import { supabase } from "./supabaseClient";

const modalOverlay = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)",
  display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000,
  animation: "fadeIn 0.2s ease-out",
};

const inputStyle = {
  width: "100%", padding: "11px 16px", borderRadius: 10, fontSize: 14,
  background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
  color: THEME.WHITE, outline: "none", fontFamily: "'Space Grotesk', sans-serif",
  boxSizing: "border-box", transition: "border-color 0.2s, box-shadow 0.2s",
};

const selectStyle = {
  ...inputStyle, appearance: "none", cursor: "pointer",
  backgroundColor: THEME.NAVY_MID,
};

const labelStyle = {
  fontSize: 10, color: THEME.TEXT_DIM, textTransform: "uppercase",
  letterSpacing: 1.8, fontWeight: 700, marginBottom: 6, display: "block",
};

const btnStyle = {
  padding: "14px 28px", borderRadius: 12, border: "none", cursor: "pointer", fontWeight: 700,
  fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, letterSpacing: 0.5,
  background: `linear-gradient(135deg, ${THEME.GOLD}, ${THEME.GOLD_DIM})`,
  color: THEME.NAVY, boxShadow: `0 4px 20px ${THEME.GOLD_NEON}`,
  transition: "transform 0.15s, box-shadow 0.15s",
};

const deleteBtnStyle = {
  padding: "10px 18px", borderRadius: 10, border: `1px solid ${THEME.RED}40`,
  background: `rgba(255,59,48,0.1)`, color: THEME.RED, cursor: "pointer",
  fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, fontWeight: 600,
  display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s",
};

const modalCard = (width = 520) => ({
  ...glassCard({
    padding: 36, width, maxHeight: "88vh", overflowY: "auto",
    border: `1px solid ${THEME.GOLD}30`,
    boxShadow: `0 32px 80px rgba(0,0,0,0.6), 0 0 60px ${THEME.GOLD_GLOW}`,
  }),
});

const modalHeader = (title) => (onClose) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28, paddingBottom: 16, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
    <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: THEME.GOLD, fontFamily: "'Space Grotesk'", letterSpacing: -0.3 }}>
      {title}
    </h2>
    <button type="button" onClick={onClose} style={{ background: "rgba(255,255,255,0.05)", border: "none", color: THEME.TEXT_DIM, cursor: "pointer", width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}>
      <X size={18} />
    </button>
  </div>
);

const ErrorBanner = ({ error }) =>
  error ? (
    <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(255,59,48,0.12)", border: "1px solid rgba(255,59,48,0.3)", color: THEME.RED, fontSize: 13, marginBottom: 16 }}>
      {error}
    </div>
  ) : null;

const AgentSelect = ({ value, onChange }) => (
  <select style={selectStyle} value={value} onChange={onChange}>
    <option value="sheba">Sheba</option>
    <option value="bob">Bob Dean</option>
    <option value="amber">Amber</option>
  </select>
);

// ═══════════════════════════════════════════════════
// ADD CLIENT MODAL
// ═══════════════════════════════════════════════════
export const AddClientModal = ({ onClose, onAdded }) => {
  const [form, setForm] = useState({
    name: "", type: "Buyer", agent: "sheba", stage: "Lead", pre_approval: "N/A",
    lender: "", loan_type: "Conventional", loan_amt: "", offer_price: "",
    closing_date: "", sop_progress: 0, notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    setError(null);
    const { error: err } = await supabase.from("clients").insert({
      ...form,
      loan_amt: parseFloat(form.loan_amt) || 0,
      offer_price: parseFloat(form.offer_price) || 0,
      sop_progress: parseInt(form.sop_progress) || 0,
      closing_date: form.closing_date || null,
    });
    setSaving(false);
    if (err) { setError(err.message); return; }
    onAdded?.();
    onClose();
  };

  return (
    <div style={modalOverlay} onClick={onClose}>
      <form className="bsf-modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit} style={modalCard(520)}>
        {modalHeader("Add New Client")(onClose)}
        <ErrorBanner error={error} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 20 }}>
          <div style={{ gridColumn: "1/-1" }}>
            <label style={labelStyle}>Client Name *</label>
            <input style={inputStyle} value={form.name} onChange={(e) => set("name", e.target.value)} required placeholder="e.g. John & Jane Smith" />
          </div>
          <div>
            <label style={labelStyle}>Type</label>
            <select style={selectStyle} value={form.type} onChange={(e) => set("type", e.target.value)}>
              <option>Buyer</option><option>Seller</option><option>TC</option><option>Investor</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Agent</label>
            <AgentSelect value={form.agent} onChange={(e) => set("agent", e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Stage</label>
            <input style={inputStyle} value={form.stage} onChange={(e) => set("stage", e.target.value)} placeholder="Lead" />
          </div>
          <div>
            <label style={labelStyle}>Pre-Approval</label>
            <select style={selectStyle} value={form.pre_approval} onChange={(e) => set("pre_approval", e.target.value)}>
              <option>Approved</option><option>Cash</option><option>N/A</option><option>Pending</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Loan Type</label>
            <select style={selectStyle} value={form.loan_type} onChange={(e) => set("loan_type", e.target.value)}>
              <option>FHA</option><option>Conventional</option><option>VA</option><option>Cash</option><option>N/A</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Lender</label>
            <input style={inputStyle} value={form.lender} onChange={(e) => set("lender", e.target.value)} placeholder="Wells Fargo" />
          </div>
          <div>
            <label style={labelStyle}>Loan Amount</label>
            <input style={inputStyle} type="number" value={form.loan_amt} onChange={(e) => set("loan_amt", e.target.value)} placeholder="385000" />
          </div>
          <div>
            <label style={labelStyle}>Offer Price</label>
            <input style={inputStyle} type="number" value={form.offer_price} onChange={(e) => set("offer_price", e.target.value)} placeholder="395000" />
          </div>
          <div>
            <label style={labelStyle}>Closing Date</label>
            <input style={inputStyle} type="date" value={form.closing_date} onChange={(e) => set("closing_date", e.target.value)} />
          </div>
          <div style={{ gridColumn: "1/-1" }}>
            <label style={labelStyle}>Notes</label>
            <textarea style={{ ...inputStyle, minHeight: 72, resize: "vertical" }} value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Strategic notes, special circumstances, etc." />
          </div>
        </div>
        <button type="submit" disabled={saving} style={{ ...btnStyle, width: "100%", opacity: saving ? 0.6 : 1 }}>
          {saving ? "Saving..." : "Add Client"}
        </button>
      </form>
    </div>
  );
};

// ═══════════════════════════════════════════════════
// ADD TASK MODAL
// ═══════════════════════════════════════════════════
export const AddTaskModal = ({ onClose, onAdded, clients }) => {
  const [form, setForm] = useState({
    title: "", client_id: "", assigned_to: "sheba", priority: "medium", due_date: "", status: "pending",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    setError(null);
    const payload = { ...form, client_id: form.client_id || null };
    const { error: err } = await supabase.from("tasks").insert(payload);
    setSaving(false);
    if (err) { setError(err.message); return; }
    onAdded?.();
    onClose();
  };

  return (
    <div style={modalOverlay} onClick={onClose}>
      <form className="bsf-modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit} style={modalCard(480)}>
        {modalHeader("Add New Task")(onClose)}
        <ErrorBanner error={error} />
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
          <div>
            <label style={labelStyle}>Task Title *</label>
            <input style={inputStyle} value={form.title} onChange={(e) => set("title", e.target.value)} required placeholder="e.g. Follow up on inspection report" />
          </div>
          <div>
            <label style={labelStyle}>Client</label>
            <select style={selectStyle} value={form.client_id} onChange={(e) => set("client_id", e.target.value)}>
              <option value="">— General (No Client) —</option>
              {clients?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={labelStyle}>Assigned To</label>
              <AgentSelect value={form.assigned_to} onChange={(e) => set("assigned_to", e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Priority</label>
              <select style={selectStyle} value={form.priority} onChange={(e) => set("priority", e.target.value)}>
                <option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
              </select>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Due Date</label>
            <input style={inputStyle} type="date" value={form.due_date} onChange={(e) => set("due_date", e.target.value)} />
          </div>
        </div>
        <button type="submit" disabled={saving} style={{ ...btnStyle, width: "100%", opacity: saving ? 0.6 : 1 }}>
          {saving ? "Saving..." : "Add Task"}
        </button>
      </form>
    </div>
  );
};

// ═══════════════════════════════════════════════════
// EDIT CLIENT MODAL
// ═══════════════════════════════════════════════════
export const EditClientModal = ({ client, onClose, onUpdated, onDeleted }) => {
  const [form, setForm] = useState({
    name: client.name || "",
    type: client.type || "Buyer",
    agent: client.agent || "sheba",
    stage: client.stage || "Lead",
    pre_approval: client.pre_approval || "N/A",
    lender: client.lender || "",
    loan_type: client.loan_type || "Conventional",
    loan_amt: client.loan_amt || "",
    offer_price: client.offer_price || "",
    closing_date: client.closing_date || "",
    sop_progress: client.sop_progress || 0,
    notes: client.notes || "",
    commission_rate: client.commission_rate || 0.03,
    commission_split: client.commission_split || "solo",
    avatar_url: client.avatar_url || "",
    effective_date: client.effective_date || "",
    inspection_end_date: client.inspection_end_date || "",
    escrow_deposit_due: client.escrow_deposit_due || "",
    title_evidence_deadline: client.title_evidence_deadline || "",
    survey_deadline: client.survey_deadline || "",
    walkthrough_date: client.walkthrough_date || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    setError(null);
    const { error: err } = await supabase
      .from("clients")
      .update({
        ...form,
        loan_amt: parseFloat(form.loan_amt) || 0,
        offer_price: parseFloat(form.offer_price) || 0,
        sop_progress: parseInt(form.sop_progress) || 0,
        closing_date: form.closing_date || null,
        commission_rate: parseFloat(form.commission_rate) || 0.03,
        commission_split: form.commission_split || "solo",
        avatar_url: form.avatar_url || null,
        effective_date: form.effective_date || null,
        inspection_end_date: form.inspection_end_date || null,
        escrow_deposit_due: form.escrow_deposit_due || null,
        title_evidence_deadline: form.title_evidence_deadline || null,
        survey_deadline: form.survey_deadline || null,
        walkthrough_date: form.walkthrough_date || null,
      })
      .eq("id", client.id);
    setSaving(false);
    if (err) { setError(err.message); return; }
    onUpdated?.();
    onClose();
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${client.name}"? This cannot be undone.`)) return;
    setSaving(true);
    await supabase.from("tasks").delete().eq("client_id", client.id);
    const { error: err } = await supabase.from("clients").delete().eq("id", client.id);
    setSaving(false);
    if (err) { setError(err.message); return; }
    (onDeleted || onUpdated)?.();
    onClose();
  };

  return (
    <div style={modalOverlay} onClick={onClose}>
      <form className="bsf-modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit} style={modalCard(520)}>
        {modalHeader("Edit Client")(onClose)}
        <ErrorBanner error={error} />

        {/* Avatar Upload */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24, paddingBottom: 20, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ position: "relative" }}>
            {form.avatar_url ? (
              <img src={form.avatar_url} alt="Avatar" style={{ width: 64, height: 64, borderRadius: 18, objectFit: "cover", border: `2px solid ${THEME.GOLD}40` }} />
            ) : (
              <div style={{ width: 64, height: 64, borderRadius: 18, background: `${THEME.GOLD}15`, border: `2px dashed ${THEME.GOLD}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Camera size={22} color={THEME.TEXT_DIM} />
              </div>
            )}
          </div>
          <div>
            <label style={{ ...labelStyle, marginBottom: 8 }}>Client Photo</label>
            <label style={{
              display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px",
              borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: uploading ? "wait" : "pointer",
              background: `${THEME.GOLD}15`, border: `1px solid ${THEME.GOLD}30`, color: THEME.GOLD,
              fontFamily: "'Space Grotesk'", transition: "all 0.2s",
            }}>
              {uploading ? <Loader size={14} style={{ animation: "spinIn 0.6s linear infinite" }} /> : <Camera size={14} />}
              {uploading ? "Uploading..." : "Upload Photo"}
              <input type="file" accept="image/*" style={{ display: "none" }} disabled={uploading} onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setUploading(true);
                const ext = file.name.split(".").pop();
                const path = `${client.id}-${Date.now()}.${ext}`;
                const { error: uploadErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
                if (uploadErr) { setError(uploadErr.message); setUploading(false); return; }
                const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
                set("avatar_url", urlData.publicUrl);
                setUploading(false);
              }} />
            </label>
            {form.avatar_url && (
              <button type="button" onClick={() => set("avatar_url", "")} style={{ marginLeft: 8, background: "none", border: "none", color: THEME.RED, fontSize: 11, cursor: "pointer", fontFamily: "'Space Grotesk'" }}>
                Remove
              </button>
            )}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 20 }}>
          <div style={{ gridColumn: "1/-1" }}>
            <label style={labelStyle}>Client Name *</label>
            <input style={inputStyle} value={form.name} onChange={(e) => set("name", e.target.value)} required />
          </div>
          <div>
            <label style={labelStyle}>Type</label>
            <select style={selectStyle} value={form.type} onChange={(e) => set("type", e.target.value)}>
              <option>Buyer</option><option>Seller</option><option>TC</option><option>Investor</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Agent</label>
            <AgentSelect value={form.agent} onChange={(e) => set("agent", e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Stage</label>
            <input style={inputStyle} value={form.stage} onChange={(e) => set("stage", e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Pre-Approval</label>
            <select style={selectStyle} value={form.pre_approval} onChange={(e) => set("pre_approval", e.target.value)}>
              <option>Approved</option><option>Cash</option><option>N/A</option><option>Pending</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Loan Type</label>
            <select style={selectStyle} value={form.loan_type} onChange={(e) => set("loan_type", e.target.value)}>
              <option>FHA</option><option>Conventional</option><option>VA</option><option>Cash</option><option>N/A</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Lender</label>
            <input style={inputStyle} value={form.lender} onChange={(e) => set("lender", e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Loan Amount</label>
            <input style={inputStyle} type="number" value={form.loan_amt} onChange={(e) => set("loan_amt", e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Offer Price</label>
            <input style={inputStyle} type="number" value={form.offer_price} onChange={(e) => set("offer_price", e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Closing Date</label>
            <input style={inputStyle} type="date" value={form.closing_date} onChange={(e) => set("closing_date", e.target.value)} />
          </div>
          <div style={{ gridColumn: "1/-1" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, paddingTop: 4 }}>
              <div style={{ width: 4, height: 14, borderRadius: 2, background: THEME.CYAN }} />
              <span style={{ fontSize: 10, color: THEME.CYAN, textTransform: "uppercase", letterSpacing: 1.8, fontWeight: 700 }}>Transaction Timeline (ASIS-6)</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {TIMELINE_FIELDS.filter((f) => f.key !== "closing_date").map(({ key, label }) => (
                <div key={key}>
                  <label style={labelStyle}>{label}</label>
                  <input style={inputStyle} type="date" value={form[key]} onChange={(e) => set(key, e.target.value)} />
                </div>
              ))}
            </div>
          </div>
          <div style={{ gridColumn: "1/-1" }}>
            <label style={labelStyle}>Action Trajectory</label>
            {(() => {
              const steps = getSOP(form.type);
              const progress = parseInt(form.sop_progress) || 0;
              const pct = steps.length > 0 ? (progress / steps.length) * 100 : 0;
              return (
                <div>
                  <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.06)", marginBottom: 12, overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: 3, width: `${pct}%`, background: `linear-gradient(90deg, ${THEME.GOLD}, ${THEME.CYAN})`, transition: "width 0.3s" }} />
                  </div>
                  <div style={{ maxHeight: 220, overflowY: "auto", display: "flex", flexDirection: "column", gap: 2, paddingRight: 4 }}>
                    {steps.map((s, i) => {
                      const done = i < progress;
                      const current = i === progress;
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => set("sop_progress", done ? i : i + 1)}
                          style={{
                            display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
                            borderRadius: 8, border: "none", cursor: "pointer", textAlign: "left", width: "100%",
                            background: current ? `${THEME.GOLD}12` : "transparent",
                            transition: "background 0.15s",
                          }}
                          onMouseEnter={(e) => { if (!current) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                          onMouseLeave={(e) => { if (!current) e.currentTarget.style.background = "transparent"; }}
                        >
                          {done ? (
                            <CheckCircle2 size={16} color={THEME.GREEN} style={{ flexShrink: 0 }} />
                          ) : current ? (
                            <Circle size={16} color={THEME.GOLD} style={{ flexShrink: 0, filter: `drop-shadow(0 0 4px ${THEME.GOLD})` }} />
                          ) : (
                            <Circle size={16} color={THEME.TEXT_DIM} style={{ flexShrink: 0, opacity: 0.4 }} />
                          )}
                          <span style={{
                            fontSize: 12, fontFamily: "'Space Grotesk'", fontWeight: current ? 700 : done ? 500 : 400,
                            color: done ? THEME.GREEN : current ? THEME.GOLD : THEME.TEXT_DIM,
                            textDecoration: done ? "none" : "none",
                          }}>
                            {s.step}
                          </span>
                          <span style={{ marginLeft: "auto", fontSize: 9, color: THEME.TEXT_DIM, opacity: 0.6, flexShrink: 0 }}>
                            {s.stage}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ fontSize: 10, color: THEME.TEXT_DIM, marginTop: 8 }}>
                    Step {progress} of {steps.length} — Click to advance or revert
                  </div>
                </div>
              );
            })()}
          </div>
          <div>
            <label style={labelStyle}>Commission Rate</label>
            <input style={inputStyle} type="number" step="0.005" min="0" max="0.10" value={form.commission_rate} onChange={(e) => set("commission_rate", e.target.value)} />
            <div style={{ fontSize: 10, color: THEME.TEXT_DIM, marginTop: 3 }}>{(Number(form.commission_rate) * 100).toFixed(1)}%</div>
          </div>
          <div>
            <label style={labelStyle}>Commission Split</label>
            <select style={selectStyle} value={form.commission_split} onChange={(e) => set("commission_split", e.target.value)}>
              <option value="solo">Solo (100%)</option>
              <option value="50-50-bob">50/50 with Bob</option>
              <option value="50-50-amber">50/50 with Amber</option>
            </select>
          </div>
          <div style={{ gridColumn: "1/-1" }}>
            <label style={labelStyle}>Notes</label>
            <textarea style={{ ...inputStyle, minHeight: 72, resize: "vertical" }} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button type="button" onClick={handleDelete} disabled={saving} style={deleteBtnStyle}>
            <Trash2 size={14} /> Delete Client
          </button>
          <button type="submit" disabled={saving} style={{ ...btnStyle, opacity: saving ? 0.6 : 1 }}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
};

// ═══════════════════════════════════════════════════
// EDIT TASK MODAL
// ═══════════════════════════════════════════════════
export const EditTaskModal = ({ task, clients, onClose, onUpdated, onDeleted }) => {
  const [form, setForm] = useState({
    title: task.title || "",
    client_id: task.client_id || "",
    assigned_to: task.assigned_to || "sheba",
    priority: task.priority || "medium",
    due_date: task.due_date || "",
    status: task.status || "pending",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    setError(null);
    const { error: err } = await supabase
      .from("tasks")
      .update({ ...form, client_id: form.client_id || null })
      .eq("id", task.id);
    setSaving(false);
    if (err) { setError(err.message); return; }
    onUpdated?.();
    onClose();
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this task? This cannot be undone.")) return;
    setSaving(true);
    const { error: err } = await supabase.from("tasks").delete().eq("id", task.id);
    setSaving(false);
    if (err) { setError(err.message); return; }
    (onDeleted || onUpdated)?.();
    onClose();
  };

  return (
    <div style={modalOverlay} onClick={onClose}>
      <form className="bsf-modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit} style={modalCard(480)}>
        {modalHeader("Edit Task")(onClose)}
        <ErrorBanner error={error} />
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
          <div>
            <label style={labelStyle}>Task Title *</label>
            <input style={inputStyle} value={form.title} onChange={(e) => set("title", e.target.value)} required />
          </div>
          <div>
            <label style={labelStyle}>Client</label>
            <select style={selectStyle} value={form.client_id} onChange={(e) => set("client_id", e.target.value)}>
              <option value="">— General (No Client) —</option>
              {clients?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={labelStyle}>Assigned To</label>
              <AgentSelect value={form.assigned_to} onChange={(e) => set("assigned_to", e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Priority</label>
              <select style={selectStyle} value={form.priority} onChange={(e) => set("priority", e.target.value)}>
                <option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
              </select>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={labelStyle}>Due Date</label>
              <input style={inputStyle} type="date" value={form.due_date} onChange={(e) => set("due_date", e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select style={selectStyle} value={form.status} onChange={(e) => set("status", e.target.value)}>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button type="button" onClick={handleDelete} disabled={saving} style={deleteBtnStyle}>
            <Trash2 size={14} /> Delete Task
          </button>
          <button type="submit" disabled={saving} style={{ ...btnStyle, opacity: saving ? 0.6 : 1 }}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
};
