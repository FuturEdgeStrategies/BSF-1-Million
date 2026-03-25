import { useState, useEffect, useRef, useCallback } from "react";
import { MessageSquare, X, Send, Mic, MicOff, Zap, Bot, UserIcon } from "lucide-react";
import { THEME, glassCard } from "./theme";
import { supabase } from "./supabaseClient";

// ═══════════════════════════════════════════════════
// OPENAI FUNCTION DEFINITIONS
// ═══════════════════════════════════════════════════
const AI_TOOLS = [
  {
    type: "function",
    function: {
      name: "add_client",
      description: "Add a new client to the BSF deal pipeline. Use when the user asks to create/add a client.",
      parameters: {
        type: "object",
        properties: {
          name:  { type: "string", description: "Client name" },
          type:  { type: "string", enum: ["Buyer", "Seller", "TC", "Investor"], description: "Client type" },
          agent: { type: "string", enum: ["sheba", "bob", "amber"], description: "Assigned agent" },
          stage: { type: "string", description: "Pipeline stage (e.g. Lead, Pre-Qualified, Active Search)" },
          notes: { type: "string", description: "Any notes about the client" },
          lender: { type: "string", description: "Lender name" },
          loan_amt: { type: "number", description: "Loan amount in dollars" },
          offer_price: { type: "number", description: "Offer price in dollars" },
        },
        required: ["name", "type", "agent"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_task",
      description: "Create a new task. Use when the user asks to add a task/reminder/to-do.",
      parameters: {
        type: "object",
        properties: {
          title:       { type: "string", description: "Task description" },
          assigned_to: { type: "string", enum: ["sheba", "bob", "amber"], description: "Who to assign it to" },
          priority:    { type: "string", enum: ["high", "medium", "low"] },
          due_date:    { type: "string", description: "Due date in YYYY-MM-DD format" },
          client_id:   { type: "string", description: "UUID of the related client (if known)" },
        },
        required: ["title", "assigned_to"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_client_stage",
      description: "Move a client to a new pipeline stage. Use when user asks to update/advance a client's stage.",
      parameters: {
        type: "object",
        properties: {
          client_name: { type: "string", description: "Client name to search for" },
          new_stage:   { type: "string", description: "New pipeline stage" },
        },
        required: ["client_name", "new_stage"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_pipeline_summary",
      description: "Get a summary of the current deal pipeline including counts by type, stage, and agent.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "create_event",
      description: "Create a calendar event. Use for scheduling open houses, showings, meetings, closings, etc.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Event title" },
          event_date: { type: "string", description: "Date in YYYY-MM-DD format" },
          time_start: { type: "string", description: "Start time like '11:00 AM'" },
          time_end: { type: "string", description: "End time like '2:00 PM'" },
          location: { type: "string", description: "Event location/address" },
          notes: { type: "string" },
          client_id: { type: "string", description: "Client UUID if linked to a client" },
        },
        required: ["title", "event_date"],
      },
    },
  },
];

const SYSTEM_PROMPT = `You are BSF Deal Assistant — an expert real estate AI for Burley Sells Florida's Deal Command Center.

You have access to the live deal pipeline. You can:
1. Answer questions about clients, tasks, pipeline status
2. Add new clients and tasks (use the function tools)
3. Update client stages
4. Provide pipeline summaries and strategic advice

Be concise, professional, and proactive. Use data from the current pipeline context provided below.
When asked to add a client or task, ALWAYS use the appropriate function tool — never just describe it.
Format responses with clear structure when listing data. Use bullet points for lists.

CURRENT PIPELINE DATA:
`;

// ═══════════════════════════════════════════════════
// FUNCTION EXECUTORS
// ═══════════════════════════════════════════════════
async function execFunction(name, args, clients) {
  switch (name) {
    case "add_client": {
      const { error } = await supabase.from("clients").insert({
        name: args.name,
        type: args.type || "Buyer",
        agent: args.agent || "sheba",
        stage: args.stage || "Lead",
        notes: args.notes || "",
        lender: args.lender || "",
        loan_amt: args.loan_amt || 0,
        offer_price: args.offer_price || 0,
        pre_approval: "N/A",
        loan_type: "Conventional",
        sop_progress: 0,
      });
      if (error) return `Error adding client: ${error.message}`;
      return `Client "${args.name}" added successfully as a ${args.type} assigned to ${args.agent === "bob" ? "Bob Dean" : args.agent === "amber" ? "Amber" : "Sheba"}.`;
    }
    case "add_task": {
      const { error } = await supabase.from("tasks").insert({
        title: args.title,
        assigned_to: args.assigned_to || "sheba",
        priority: args.priority || "medium",
        due_date: args.due_date || null,
        client_id: args.client_id || null,
        status: "pending",
      });
      if (error) return `Error adding task: ${error.message}`;
      return `Task "${args.title}" created and assigned to ${args.assigned_to === "bob" ? "Bob Dean" : args.assigned_to === "amber" ? "Amber" : "Sheba"} with ${args.priority || "medium"} priority.`;
    }
    case "update_client_stage": {
      const match = (clients || []).find((c) =>
        c.name.toLowerCase().includes(args.client_name.toLowerCase())
      );
      if (!match) return `No client found matching "${args.client_name}".`;
      const { error } = await supabase
        .from("clients")
        .update({ stage: args.new_stage })
        .eq("id", match.id);
      if (error) return `Error updating: ${error.message}`;
      return `${match.name} moved from "${match.stage}" to "${args.new_stage}".`;
    }
    case "get_pipeline_summary": {
      const c = clients || [];
      const byType = {};
      const byAgent = {};
      c.forEach((cl) => {
        byType[cl.type] = (byType[cl.type] || 0) + 1;
        const a = cl.agent === "bob" ? "Bob" : cl.agent === "amber" ? "Amber" : "Sheba";
        byAgent[a] = (byAgent[a] || 0) + 1;
      });
      const summary = [
        `Total Active Deals: ${c.length}`,
        `By Type: ${Object.entries(byType).map(([k, v]) => `${k}: ${v}`).join(", ")}`,
        `By Agent: ${Object.entries(byAgent).map(([k, v]) => `${k}: ${v}`).join(", ")}`,
        `Under Contract: ${c.filter((x) => x.stage === "Under Contract").length}`,
      ].join("\n");
      return summary;
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
const AIChatWindow = ({ clients, tasks, onRefresh }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hello! I'm your BSF Deal Assistant. I can answer questions, add clients, create tasks, and update your pipeline. How can I help?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const endRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Voice Setup ──
  const startVoice = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setMessages((p) => [...p, { role: "assistant", content: "Voice input is not supported in this browser. Please try Chrome." }]);
      return;
    }
    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setIsRecording(false);
    };
    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  }, []);

  const stopVoice = useCallback(() => {
    recognitionRef.current?.stop();
    setIsRecording(false);
  }, []);

  // ── Send Message ──
  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const userMessage = { role: "user", content: text };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      setMessages((p) => [...p, { role: "assistant", content: "Error: VITE_OPENAI_API_KEY is not configured." }]);
      setLoading(false);
      return;
    }

    try {
      const contextData = {
        clients: (clients || []).slice(0, 50).map((c) => ({ id: c.id, name: c.name, type: c.type, agent: c.agent, stage: c.stage })),
        tasks: (tasks || []).slice(0, 20).map((t) => ({ id: t.id, title: t.title, assigned_to: t.assigned_to, priority: t.priority, status: t.status })),
      };
      const apiMsgs = newMessages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .filter((m) => m.content)
        .map((m) => ({ role: m.role, content: String(m.content) }));
      let conversationMessages = [
        { role: "system", content: SYSTEM_PROMPT + JSON.stringify(contextData) },
        ...apiMsgs,
      ];

      let gotReply = false;
      for (let i = 0; i < 3; i++) {
        let res;
        try {
          res = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
            body: JSON.stringify({ model: "gpt-4o-mini", messages: conversationMessages, tools: AI_TOOLS, tool_choice: "auto" }),
          });
        } catch (fetchErr) {
          setMessages((p) => [...p, { role: "assistant", content: `Network error: ${fetchErr.message}` }]);
          gotReply = true;
          break;
        }

        if (!res.ok) {
          const errText = await res.text().catch(() => "unknown");
          setMessages((p) => [...p, { role: "assistant", content: `API error ${res.status}: ${errText.slice(0, 200)}` }]);
          gotReply = true;
          break;
        }

        const data = await res.json();
        const choice = data.choices?.[0];
        if (!choice) {
          setMessages((p) => [...p, { role: "assistant", content: "Unexpected API response." }]);
          gotReply = true;
          break;
        }

        const assistantMsg = choice.message;

        if (assistantMsg.tool_calls && assistantMsg.tool_calls.length > 0) {
          conversationMessages.push(assistantMsg);
          for (const tc of assistantMsg.tool_calls) {
            let fnResult;
            try {
              fnResult = await execFunction(tc.function.name, JSON.parse(tc.function.arguments), clients);
            } catch (fnErr) {
              fnResult = `Function error: ${fnErr.message}`;
            }
            conversationMessages.push({ role: "tool", tool_call_id: tc.id, content: String(fnResult) });
          }
          onRefresh?.();
        } else {
          setMessages((p) => [...p, { role: "assistant", content: assistantMsg.content || "Done." }]);
          gotReply = true;
          break;
        }
      }

      if (!gotReply) {
        setMessages((p) => [...p, { role: "assistant", content: "Operations completed successfully." }]);
      }
    } catch (err) {
      setMessages((p) => [...p, { role: "assistant", content: `Error: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  // ── Closed State: Floating Button ──
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: "fixed", bottom: 28, right: 28, width: 62, height: 62, borderRadius: 31,
          background: `linear-gradient(135deg, ${THEME.GOLD}, ${THEME.GOLD_DIM})`,
          color: THEME.NAVY, border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 8px 32px rgba(0,0,0,0.6), 0 0 24px ${THEME.GOLD_NEON}`,
          zIndex: 1000, transition: "transform 0.2s, box-shadow 0.2s",
          animation: "glowPulse 2.5s ease-in-out infinite",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.1)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
      >
        <MessageSquare size={26} />
      </button>
    );
  }

  // ── Open State: Chat Window ──
  return (
    <div
      className="bsf-floating-chat"
      style={{
        position: "fixed", bottom: 28, right: 28, width: 420, height: 560,
        borderRadius: 20, overflow: "hidden",
        display: "flex", flexDirection: "column",
        boxShadow: `0 24px 80px rgba(0,0,0,0.7), 0 0 40px ${THEME.GOLD_GLOW}`,
        zIndex: 1000, animation: "slideUp 0.35s ease-out",
        ...glassCard({ border: `1px solid ${THEME.GOLD}35` }),
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px 20px",
          background: "rgba(5,10,18,0.95)",
          borderBottom: `1px solid ${THEME.GOLD}20`,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: `linear-gradient(135deg, ${THEME.GOLD}25, ${THEME.GOLD}10)`,
            border: `1px solid ${THEME.GOLD}30`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Zap size={16} color={THEME.GOLD} />
          </div>
          <div>
            <div style={{ fontWeight: 700, color: THEME.WHITE, fontFamily: "'Space Grotesk'", fontSize: 14, letterSpacing: -0.2 }}>
              BSF Deal Assistant
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 1 }}>
              <div style={{ width: 6, height: 6, borderRadius: 3, background: THEME.GREEN, boxShadow: `0 0 8px ${THEME.GREEN}`, animation: "livePulse 2s infinite" }} />
              <span style={{ fontSize: 10, color: THEME.GREEN, fontWeight: 600, letterSpacing: 0.5 }}>AI + Functions</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          style={{
            background: "rgba(255,255,255,0.05)", border: "none", color: THEME.TEXT_DIM,
            cursor: "pointer", width: 30, height: 30, borderRadius: 8,
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = THEME.WHITE; e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = THEME.TEXT_DIM; e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, padding: 16, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.role === "user" ? "flex-end" : "flex-start",
              maxWidth: "85%",
              animation: `fadeIn 0.25s ease-out`,
            }}
          >
            {m.role === "assistant" && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <Bot size={12} color={THEME.GOLD} />
                <span style={{ fontSize: 10, color: THEME.GOLD, fontWeight: 600 }}>AI</span>
              </div>
            )}
            <div
              style={{
                background: m.role === "user"
                  ? `linear-gradient(135deg, ${THEME.GOLD}, ${THEME.GOLD_DIM})`
                  : "rgba(255,255,255,0.05)",
                color: m.role === "user" ? THEME.NAVY : THEME.WHITE,
                padding: "10px 14px", borderRadius: 14, fontSize: 13.5, lineHeight: 1.55,
                border: m.role === "assistant" ? "1px solid rgba(255,255,255,0.06)" : "none",
                whiteSpace: "pre-wrap",
              }}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 0" }}>
            <Bot size={12} color={THEME.GOLD} />
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              {[0, 1, 2].map((d) => (
                <div
                  key={d}
                  style={{
                    width: 6, height: 6, borderRadius: 3, background: THEME.GOLD,
                    animation: `typing 1.4s ease-in-out ${d * 0.2}s infinite`,
                  }}
                />
              ))}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input Bar */}
      <form
        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
        style={{
          padding: "14px 16px",
          background: "rgba(5,10,18,0.95)",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          display: "flex", gap: 8, alignItems: "center",
        }}
      >
        {/* Voice button */}
        <button
          type="button"
          onClick={isRecording ? stopVoice : startVoice}
          style={{
            width: 38, height: 38, borderRadius: 10,
            background: isRecording ? "rgba(255,59,48,0.2)" : "rgba(255,255,255,0.05)",
            border: isRecording ? "1px solid rgba(255,59,48,0.5)" : "1px solid rgba(255,255,255,0.1)",
            color: isRecording ? THEME.RED : THEME.TEXT_DIM,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.2s", flexShrink: 0,
            animation: isRecording ? "recording 1.5s ease-in-out infinite" : "none",
          }}
          title={isRecording ? "Stop recording" : "Voice input"}
        >
          {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
        </button>

        {/* Text input */}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSend(); } }}
          placeholder={isRecording ? "Listening..." : "Ask anything or give a command..."}
          style={{
            flex: 1, padding: "10px 16px", borderRadius: 10,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: THEME.WHITE, outline: "none",
            fontFamily: "'Space Grotesk', sans-serif", fontSize: 13.5,
            transition: "border-color 0.2s",
          }}
          onFocus={(e) => { e.target.style.borderColor = `${THEME.GOLD}40`; }}
          onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; }}
        />

        {/* Send button */}
        <button
          type="submit"
          style={{
            background: `linear-gradient(135deg, ${THEME.GOLD}, ${THEME.GOLD_DIM})`,
            color: THEME.NAVY, border: "none",
            width: 38, height: 38, borderRadius: 10,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading || !input.trim() ? 0.4 : 1,
            boxShadow: loading ? "none" : `0 4px 12px ${THEME.GOLD_NEON}`,
            transition: "all 0.2s", flexShrink: 0,
          }}
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};

export default AIChatWindow;
