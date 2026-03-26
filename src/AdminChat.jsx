import { useState, useEffect, useRef, useCallback } from "react";
import { Send, Mic, MicOff, Zap, Bot, Trash2 } from "lucide-react";
import { THEME, glassCard, agentName } from "./theme";
import { supabase } from "./supabaseClient";

// ═══════════════════════════════════════════════════
// ENHANCED AI TOOLS (full CRUD)
// ═══════════════════════════════════════════════════
const ADMIN_TOOLS = [
  {
    type: "function",
    function: {
      name: "add_client",
      description: "Add a new client to the BSF deal pipeline.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Client name" },
          type: { type: "string", enum: ["Buyer", "Seller", "TC", "Investor"] },
          agent: { type: "string", enum: ["sheba", "bob", "amber"] },
          stage: { type: "string", description: "Pipeline stage" },
          notes: { type: "string" },
          lender: { type: "string" },
          loan_amt: { type: "number" },
          offer_price: { type: "number" },
        },
        required: ["name", "type", "agent"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_task",
      description: "Create a new task.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          assigned_to: { type: "string", enum: ["sheba", "bob", "amber"] },
          priority: { type: "string", enum: ["high", "medium", "low"] },
          due_date: { type: "string", description: "YYYY-MM-DD" },
          client_id: { type: "string", description: "Client UUID if known" },
        },
        required: ["title", "assigned_to"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_client",
      description: "Update any field(s) on an existing client. Use when user asks to change client info.",
      parameters: {
        type: "object",
        properties: {
          client_name: { type: "string", description: "Client name to search for" },
          updates: {
            type: "object",
            description: "Fields to update",
            properties: {
              name: { type: "string" },
              type: { type: "string", enum: ["Buyer", "Seller", "TC", "Investor"] },
              agent: { type: "string", enum: ["sheba", "bob", "amber"] },
              stage: { type: "string" },
              pre_approval: { type: "string" },
              lender: { type: "string" },
              loan_type: { type: "string" },
              loan_amt: { type: "number" },
              offer_price: { type: "number" },
              closing_date: { type: "string" },
              sop_progress: { type: "number" },
              notes: { type: "string" },
            },
          },
        },
        required: ["client_name", "updates"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_task",
      description: "Update any field(s) on an existing task.",
      parameters: {
        type: "object",
        properties: {
          task_title: { type: "string", description: "Task title to search for" },
          updates: {
            type: "object",
            properties: {
              title: { type: "string" },
              assigned_to: { type: "string", enum: ["sheba", "bob", "amber"] },
              priority: { type: "string", enum: ["high", "medium", "low"] },
              due_date: { type: "string" },
              status: { type: "string", enum: ["pending", "in_progress", "completed"] },
              client_id: { type: "string" },
            },
          },
        },
        required: ["task_title", "updates"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_client_stage",
      description: "Move a client to a new pipeline stage.",
      parameters: {
        type: "object",
        properties: {
          client_name: { type: "string" },
          new_stage: { type: "string" },
        },
        required: ["client_name", "new_stage"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_client",
      description: "Delete a client and their associated tasks. Use with caution.",
      parameters: {
        type: "object",
        properties: {
          client_name: { type: "string", description: "Client name to delete" },
        },
        required: ["client_name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_task",
      description: "Delete a task.",
      parameters: {
        type: "object",
        properties: {
          task_title: { type: "string", description: "Task title to delete" },
        },
        required: ["task_title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_clients",
      description: "Search for clients by name, type, stage, or agent.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search term" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_pipeline_summary",
      description: "Get a summary of the current deal pipeline.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "create_event",
      description: "Create a calendar event. Use when user mentions scheduling, open houses, showings, meetings, deadlines, etc.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Event title" },
          event_date: { type: "string", description: "Date in YYYY-MM-DD format" },
          time_start: { type: "string", description: "Start time like '11:00 AM'" },
          time_end: { type: "string", description: "End time like '2:00 PM'" },
          location: { type: "string", description: "Event location/address" },
          notes: { type: "string" },
          client_id: { type: "string", description: "Client UUID if event is linked to a client" },
        },
        required: ["title", "event_date"],
      },
    },
  },
];

const SYSTEM_PROMPT = `You are BSF Command Center AI — Sheba's personal real estate operations assistant for Burley Sells Florida.

You have FULL CONTROL over the deal pipeline. You can:
1. Add, edit, and delete clients
2. Add, edit, and delete tasks
3. Update any client field (name, type, agent, stage, lender, loan amounts, closing dates, notes, SOP progress)
4. Update any task field (title, assignee, priority, due date, status)
5. Search clients by name, type, stage, or agent
6. Provide pipeline summaries and strategic advice
7. Create calendar events (open houses, showings, meetings, deadlines)

TEAM:
- Sheba (owner/broker/lead agent) — ALL tasks default to Sheba unless specified otherwise
- Bob Dean (agent)
- Amber (transaction coordinator)

BRAIN DUMP / NOTE PROCESSING:
When Sheba types a long message or brain dump:
1. Identify which client(s) are mentioned. Match names against the pipeline data below.
2. Extract every action item as a separate task. Assign to Sheba by default.
3. If a task involves Bob or Amber doing something, create a FOLLOW-UP/REMINDER task for Sheba (e.g. "Follow up with Bob re: [topic]") and assign it to Sheba.
4. If a date or deadline is mentioned (e.g. "by Friday", "March 30", "next week"), attach it as due_date in YYYY-MM-DD format. Today is ${new Date().toISOString().slice(0, 10)}.
5. If NO date is mentioned for a task, ask Sheba: "When do you want to be reminded about [task]?"
6. After extracting tasks, update_client notes with a 2-3 sentence summary of the brain dump content for that client.
7. Always use the function tools to actually create the tasks and update notes — never just describe what you would do.

IMPORTANT:
- When asked to update or delete, ALWAYS use the function tools — never just describe the action
- Be concise and professional
- Proactively suggest follow-up actions after completing operations
- This chat persists across sessions — reference prior conversation when relevant
- When creating tasks from brain dumps, group your summary by client so Sheba can see what was captured

CURRENT PIPELINE DATA:
`;

// ═══════════════════════════════════════════════════
// FUNCTION EXECUTOR
// ═══════════════════════════════════════════════════
async function execAdminFn(name, args, clients, tasks) {
  switch (name) {
    case "add_client": {
      const { error } = await supabase.from("clients").insert({
        name: args.name, type: args.type || "Buyer", agent: args.agent || "sheba",
        stage: args.stage || "Lead", notes: args.notes || "", lender: args.lender || "",
        loan_amt: args.loan_amt || 0, offer_price: args.offer_price || 0,
        pre_approval: "N/A", loan_type: "Conventional", sop_progress: 0,
      });
      if (error) return `Error: ${error.message}`;
      return `Client "${args.name}" added as ${args.type} for ${agentName(args.agent || "sheba")}.`;
    }
    case "add_task": {
      const { error } = await supabase.from("tasks").insert({
        title: args.title, assigned_to: args.assigned_to || "sheba",
        priority: args.priority || "medium", due_date: args.due_date || null,
        client_id: args.client_id || null, status: "pending",
      });
      if (error) return `Error: ${error.message}`;
      return `Task "${args.title}" created for ${agentName(args.assigned_to || "sheba")} (${args.priority || "medium"} priority).`;
    }
    case "update_client": {
      const match = (clients || []).find((c) => c.name.toLowerCase().includes(args.client_name.toLowerCase()));
      if (!match) return `No client found matching "${args.client_name}".`;
      const { error } = await supabase.from("clients").update(args.updates).eq("id", match.id);
      if (error) return `Error: ${error.message}`;
      return `Updated ${match.name}: changed ${Object.keys(args.updates).join(", ")}.`;
    }
    case "update_task": {
      const match = (tasks || []).find((t) => t.title.toLowerCase().includes(args.task_title.toLowerCase()));
      if (!match) return `No task found matching "${args.task_title}".`;
      const { error } = await supabase.from("tasks").update(args.updates).eq("id", match.id);
      if (error) return `Error: ${error.message}`;
      return `Updated task "${match.title}": changed ${Object.keys(args.updates).join(", ")}.`;
    }
    case "update_client_stage": {
      const match = (clients || []).find((c) => c.name.toLowerCase().includes(args.client_name.toLowerCase()));
      if (!match) return `No client found matching "${args.client_name}".`;
      const { error } = await supabase.from("clients").update({ stage: args.new_stage }).eq("id", match.id);
      if (error) return `Error: ${error.message}`;
      return `${match.name} moved from "${match.stage}" to "${args.new_stage}".`;
    }
    case "delete_client": {
      const match = (clients || []).find((c) => c.name.toLowerCase().includes(args.client_name.toLowerCase()));
      if (!match) return `No client found matching "${args.client_name}".`;
      await supabase.from("tasks").delete().eq("client_id", match.id);
      const { error } = await supabase.from("clients").delete().eq("id", match.id);
      if (error) return `Error: ${error.message}`;
      return `Deleted client "${match.name}" and associated tasks.`;
    }
    case "delete_task": {
      const match = (tasks || []).find((t) => t.title.toLowerCase().includes(args.task_title.toLowerCase()));
      if (!match) return `No task found matching "${args.task_title}".`;
      const { error } = await supabase.from("tasks").delete().eq("id", match.id);
      if (error) return `Error: ${error.message}`;
      return `Deleted task "${match.title}".`;
    }
    case "search_clients": {
      const q = args.query.toLowerCase();
      const matches = (clients || []).filter((c) =>
        c.name.toLowerCase().includes(q) || (c.type || "").toLowerCase().includes(q) ||
        (c.stage || "").toLowerCase().includes(q) || (c.agent || "").toLowerCase().includes(q)
      );
      if (matches.length === 0) return `No clients matching "${args.query}".`;
      return matches.map((c) =>
        `- ${c.name} | ${c.type} | ${c.stage} | ${agentName(c.agent)} | $${(c.offer_price || c.loan_amt || 0).toLocaleString()}`
      ).join("\n");
    }
    case "get_pipeline_summary": {
      const c = clients || [];
      const byType = {}, byAgent = {};
      c.forEach((cl) => {
        byType[cl.type] = (byType[cl.type] || 0) + 1;
        byAgent[agentName(cl.agent)] = (byAgent[agentName(cl.agent)] || 0) + 1;
      });
      return [
        `Total Active Deals: ${c.length}`,
        `By Type: ${Object.entries(byType).map(([k, v]) => `${k}: ${v}`).join(", ") || "none"}`,
        `By Agent: ${Object.entries(byAgent).map(([k, v]) => `${k}: ${v}`).join(", ") || "none"}`,
        `Under Contract: ${c.filter((x) => x.stage === "Under Contract").length}`,
      ].join("\n");
    }
    case "create_event": {
      const { title, event_date, time_start, time_end, location, notes, client_id } = args;
      const { error } = await supabase.from("events").insert({
        title, event_date, time_start: time_start || null, time_end: time_end || null,
        location: location || null, notes: notes || null, client_id: client_id || null,
      });
      return error ? `Error: ${error.message}` : `Event "${title}" created for ${event_date}${time_start ? ` at ${time_start}` : ""}${location ? ` — ${location}` : ""}.`;
    }
    default:
      return "Unknown function.";
  }
}

// ═══════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════
const AdminChat = ({ clients, tasks, onRefresh }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const endRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // ── Load chat history ──
  useEffect(() => {
    const load = async () => {
      setLoadingHistory(true);
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(200);
      if (data && data.length > 0) {
        setMessages(data.filter((m) => m.role === "user" || m.role === "assistant").map((m) => ({ role: m.role, content: m.content })));
      } else {
        const welcome = { role: "assistant", content: "Welcome to the BSF Command Center. I have full access to your pipeline — I can add, edit, delete, and search clients and tasks. What would you like to do?" };
        setMessages([welcome]);
        const { error: insertErr } = await supabase.from("chat_messages").insert({ role: welcome.role, content: welcome.content });
        if (insertErr) console.error("[AdminChat] welcome insert error:", insertErr.message);
      }
      setLoadingHistory(false);
    };
    load();
  }, []);

  const persistMsg = async (msg) => {
    const { error } = await supabase.from("chat_messages").insert({ role: msg.role, content: msg.content });
    if (error) console.error("[AdminChat] persistMsg error:", error.message);
  };

  // ── Voice ──
  const startVoice = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR();
    r.continuous = false; r.interimResults = false; r.lang = "en-US";
    r.onresult = (e) => { setInput(e.results[0][0].transcript); setIsRecording(false); };
    r.onerror = () => setIsRecording(false);
    r.onend = () => setIsRecording(false);
    recognitionRef.current = r;
    r.start();
    setIsRecording(true);
  }, []);
  const stopVoice = useCallback(() => { recognitionRef.current?.stop(); setIsRecording(false); }, []);

  // ── Send ──
  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setLoading(true);
    const userMsg = { role: "user", content: text };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    persistMsg(userMsg);

    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    // For local dev without vercel dev, we fallback to client-side key if available.
    // In production, /api/chat handles it and protects the key.
    const endpoint = import.meta.env.DEV && apiKey
      ? "https://api.openai.com/v1/chat/completions"
      : "/api/chat";
    const headers = { "Content-Type": "application/json" };
    if (import.meta.env.DEV && apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }

    try {
      // Build context — keep payload small
      const ctx = {
        clients: (clients || []).slice(0, 50).map((c) => ({ id: c.id, name: c.name, type: c.type, agent: c.agent, stage: c.stage })),
        tasks: (tasks || []).slice(0, 30).map((t) => ({ id: t.id, title: t.title, assigned_to: t.assigned_to, priority: t.priority, status: t.status })),
      };
      const apiMsgs = newMsgs
        .filter((m) => m.role === "user" || m.role === "assistant")
        .filter((m) => m.content)
        .map((m) => ({ role: m.role, content: String(m.content) }));

      let convMsgs = [
        { role: "system", content: SYSTEM_PROMPT + JSON.stringify(ctx) },
        ...apiMsgs,
      ];

      let gotReply = false;
      for (let i = 0; i < 4; i++) {
        const body = { model: "gpt-4o-mini", messages: convMsgs, tools: ADMIN_TOOLS, tool_choice: "auto" };
        console.log("[AdminChat] API call #" + (i + 1), "messages:", convMsgs.length);

        let res;
        try {
          res = await fetch(endpoint, {
            method: "POST",
            headers,
            body: JSON.stringify(body),
          });
        } catch (fetchErr) {
          console.error("[AdminChat] Fetch error:", fetchErr);
          setMessages((p) => [...p, { role: "assistant", content: `Network error: ${fetchErr.message}. Check browser console for details.` }]);
          gotReply = true;
          break;
        }

        if (!res.ok) {
          const errText = await res.text().catch(() => "unknown");
          console.error("[AdminChat] API error:", res.status, errText);
          setMessages((p) => [...p, { role: "assistant", content: `API error ${res.status}: ${errText.slice(0, 300)}` }]);
          gotReply = true;
          break;
        }

        const data = await res.json();
        console.log("[AdminChat] Response:", JSON.stringify(data.choices?.[0]?.message).slice(0, 200));

        const choice = data.choices?.[0];
        if (!choice) {
          setMessages((p) => [...p, { role: "assistant", content: "Unexpected API response — no choices returned." }]);
          gotReply = true;
          break;
        }

        const am = choice.message;
        if (am.tool_calls && am.tool_calls.length > 0) {
          convMsgs.push({ role: "assistant", content: am.content || null, tool_calls: am.tool_calls });
          for (const tc of am.tool_calls) {
            let fnResult;
            try {
              fnResult = await execAdminFn(tc.function.name, JSON.parse(tc.function.arguments), clients, tasks);
            } catch (fnErr) {
              fnResult = `Function error: ${fnErr.message}`;
            }
            convMsgs.push({ role: "tool", tool_call_id: tc.id, content: String(fnResult) });
          }
          onRefresh?.();
        } else {
          const reply = { role: "assistant", content: am.content || "Done." };
          setMessages((p) => [...p, reply]);
          persistMsg(reply);
          gotReply = true;
          break;
        }
      }

      // Safety net: if loop finished without producing a visible reply
      if (!gotReply) {
        setMessages((p) => [...p, { role: "assistant", content: "Operations completed successfully." }]);
      }
    } catch (err) {
      console.error("[AdminChat] Unexpected error:", err);
      setMessages((p) => [...p, { role: "assistant", content: `Error: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    if (!window.confirm("Clear all chat history? This cannot be undone.")) return;
    await supabase.from("chat_messages").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    const welcome = { role: "assistant", content: "Chat history cleared. Ready for new commands." };
    setMessages([welcome]);
    await persistMsg(welcome);
  };

  return (
    <div style={{ animation: "fadeIn 0.4s ease-out" }}>
      {/* Header Banner — Terminal Style */}
      <div style={{ ...glassCard({ padding: "20px 28px", marginBottom: 16, position: "relative", overflow: "hidden", border: `1px solid ${THEME.GOLD}20` }) }}>
        <div style={{ position: "absolute", top: 0, left: 0, width: 3, bottom: 0, background: THEME.GOLD }} />
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, ${THEME.GOLD}80, ${THEME.CYAN}40, transparent)` }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: `${THEME.GOLD}12`, border: `1px solid ${THEME.GOLD}25`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Zap size={18} color={THEME.GOLD} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: THEME.WHITE, fontFamily: "'Space Grotesk'", letterSpacing: -0.3 }}>
                AI Command Center
              </h2>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                <div style={{ width: 6, height: 6, borderRadius: 3, background: THEME.GREEN, boxShadow: `0 0 8px ${THEME.GREEN}`, animation: "livePulse 2s infinite" }} />
                <span style={{ fontSize: 10, color: THEME.GREEN, fontWeight: 600, letterSpacing: 0.5, fontFamily: "'JetBrains Mono'" }}>CONNECTED</span>
              </div>
            </div>
          </div>
          <button
            onClick={handleClear}
            style={{
              padding: "7px 12px", borderRadius: 8, border: `1px solid ${THEME.RED}25`,
              background: "rgba(255,59,48,0.06)", color: THEME.RED, cursor: "pointer",
              fontFamily: "'JetBrains Mono'", fontSize: 10, fontWeight: 600,
              display: "flex", alignItems: "center", gap: 5, transition: "all 0.2s",
            }}
          >
            <Trash2 size={11} /> CLEAR
          </button>
        </div>
      </div>

      {/* Chat Area — Terminal Style */}
      <div style={{ ...glassCard({ padding: 0, height: "calc(100vh - 240px)", display: "flex", flexDirection: "column", overflow: "hidden", border: `1px solid ${THEME.GOLD}15` }) }}>
        {/* Messages */}
        <div style={{ flex: 1, padding: "20px 28px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 12, background: "rgba(2,6,16,0.5)" }}>
          {loadingHistory ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: THEME.TEXT_DIM, fontSize: 13, fontFamily: "'JetBrains Mono'" }}>
              Loading history...
            </div>
          ) : (
            messages.map((m, i) => (
              <div key={i} style={{ alignSelf: m.role === "user" ? "flex-end" : "flex-start", maxWidth: "78%", animation: "fadeIn 0.2s ease-out" }}>
                {m.role === "assistant" && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <Bot size={11} color={THEME.GOLD} />
                    <span style={{ fontSize: 9, color: THEME.GOLD, fontWeight: 700, fontFamily: "'JetBrains Mono'", letterSpacing: 1, textTransform: "uppercase" }}>BSF-AI</span>
                  </div>
                )}
                <div style={{
                  background: m.role === "user"
                    ? `linear-gradient(135deg, ${THEME.GOLD}, ${THEME.GOLD_DIM})`
                    : "rgba(255,255,255,0.04)",
                  color: m.role === "user" ? THEME.NAVY : THEME.WHITE,
                  padding: "11px 16px", borderRadius: m.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                  fontSize: 13.5, lineHeight: 1.65,
                  border: m.role === "assistant" ? `1px solid rgba(201,168,76,0.08)` : "none",
                  borderLeft: m.role === "assistant" ? `2px solid ${THEME.GOLD}40` : "none",
                  whiteSpace: "pre-wrap", fontFamily: m.role === "assistant" ? "'JetBrains Mono', monospace" : "'Space Grotesk'",
                }}>
                  {m.content}
                </div>
              </div>
            ))
          )}
          {loading && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0" }}>
              <Bot size={11} color={THEME.GOLD} />
              <span style={{ fontSize: 11, color: THEME.GOLD, fontFamily: "'JetBrains Mono'", fontWeight: 600 }}>Processing</span>
              <div style={{ display: "flex", gap: 3 }}>
                {[0, 1, 2].map((d) => (
                  <div key={d} style={{ width: 6, height: 6, borderRadius: 3, background: THEME.GOLD, animation: `typing 1.4s ease-in-out ${d * 0.2}s infinite` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Input Bar — Terminal Style */}
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          style={{
            padding: "14px 24px", borderTop: `1px solid ${THEME.GOLD}15`,
            background: "rgba(4,10,20,0.95)", display: "flex", gap: 10, alignItems: "flex-end",
          }}
        >
          <button
            type="button"
            onClick={isRecording ? stopVoice : startVoice}
            style={{
              width: 40, height: 40, borderRadius: 10,
              background: isRecording ? "rgba(255,59,48,0.15)" : "rgba(255,255,255,0.04)",
              border: isRecording ? `1px solid ${THEME.RED}40` : `1px solid ${THEME.GLASS_BORDER}`,
              color: isRecording ? THEME.RED : THEME.TEXT_DIM,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.2s", flexShrink: 0,
              animation: isRecording ? "recording 1.5s ease-in-out infinite" : "none",
            }}
          >
            {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
          </button>
          <textarea
            value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder={isRecording ? "Listening..." : "Enter command... (Shift+Enter to send)"}
            rows={2}
            style={{
              flex: 1, padding: "10px 16px", borderRadius: 10,
              background: "rgba(255,255,255,0.03)", border: `1px solid ${THEME.GLASS_BORDER}`,
              color: THEME.GREEN, outline: "none", fontFamily: "'JetBrains Mono', monospace", fontSize: 13,
              transition: "border-color 0.2s", resize: "none", lineHeight: 1.5,
              minHeight: 42, maxHeight: 160, overflowY: "auto",
            }}
            onFocus={(e) => { e.target.style.borderColor = `${THEME.GOLD}40`; }}
            onBlur={(e) => { e.target.style.borderColor = THEME.GLASS_BORDER; }}
            onInput={(e) => { e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px"; }}
          />
          <button
            type="submit"
            style={{
              background: `linear-gradient(135deg, ${THEME.GOLD}, ${THEME.GOLD_DIM})`,
              color: THEME.NAVY, border: "none", width: 40, height: 40, borderRadius: 10,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading || !input.trim() ? 0.4 : 1,
              boxShadow: loading ? "none" : `0 4px 16px ${THEME.GOLD_NEON}`,
              transition: "all 0.2s", flexShrink: 0,
            }}
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminChat;
