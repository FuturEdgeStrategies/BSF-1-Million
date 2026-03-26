import React, { useState } from "react";
import { supabase } from "./supabaseClient";
import { THEME, glassCard } from "./theme";
import { Lock, Mail, User, Shield, ArrowRight } from "lucide-react";

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState(null);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    let result;
    if (isSignUp) {
      result = await supabase.auth.signUp({
        email,
        password,
      });
      if (!result.error) {
        setMessage({ type: "success", text: "Check your email for the confirmation link." });
      }
    } else {
      result = await supabase.auth.signInWithPassword({
        email,
        password,
      });
    }

    if (result.error) {
      setMessage({ type: "error", text: result.error.message });
    }
    setLoading(false);
  };

  const inputStyle = {
    width: "100%",
    padding: "12px 14px 12px 38px",
    background: "rgba(255,255,255,0.03)",
    border: `1px solid ${THEME.GLASS_BORDER}`,
    borderRadius: 8,
    color: THEME.WHITE,
    fontSize: 14,
    fontFamily: "'Inter', sans-serif",
    outline: "none",
    transition: "border-color 0.2s",
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
      position: "relative"
    }}>
      <div style={{
        ...glassCard(),
        width: "100%",
        maxWidth: 400,
        padding: 40,
        position: "relative",
        overflow: "hidden"
      }}>
        {/* Decorative background glow */}
        <div style={{ position: "absolute", top: -100, left: -100, width: 250, height: 250, background: THEME.GOLD, filter: "blur(120px)", opacity: 0.15, pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -100, right: -100, width: 250, height: 250, background: THEME.BLUE, filter: "blur(120px)", opacity: 0.1, pointerEvents: "none" }} />

        <div style={{ textAlign: "center", marginBottom: 32, position: "relative" }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%", background: `linear-gradient(135deg, ${THEME.GOLD}, ${THEME.GOLD_DIM})`,
            display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px",
            boxShadow: `0 0 24px ${THEME.GOLD_GLOW}`
          }}>
            <Shield size={28} color={THEME.NAVY_DEEP} />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: THEME.WHITE, margin: "0 0 8px", fontFamily: "'Space Grotesk'" }}>
            {isSignUp ? "Create Account" : "Welcome Back"}
          </h1>
          <p style={{ fontSize: 13, color: THEME.TEXT_DIM, margin: 0 }}>
            BSF Deal Command Center
          </p>
        </div>

        {message && (
          <div style={{
            padding: "12px 16px", borderRadius: 8, marginBottom: 20, fontSize: 12,
            background: message.type === "error" ? "rgba(255,59,48,0.1)" : "rgba(62,207,142,0.1)",
            border: `1px solid ${message.type === "error" ? "rgba(255,59,48,0.2)" : "rgba(62,207,142,0.2)"}`,
            color: message.type === "error" ? THEME.RED : THEME.GREEN
          }}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleAuth} style={{ display: "flex", flexDirection: "column", gap: 16, position: "relative" }}>
          <div style={{ position: "relative" }}>
            <Mail size={16} color={THEME.TEXT_DIM} style={{ position: "absolute", left: 14, top: 14 }} />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = `${THEME.GOLD}60`}
              onBlur={(e) => e.target.style.borderColor = THEME.GLASS_BORDER}
            />
          </div>
          
          <div style={{ position: "relative" }}>
            <Lock size={16} color={THEME.TEXT_DIM} style={{ position: "absolute", left: 14, top: 14 }} />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = `${THEME.GOLD}60`}
              onBlur={(e) => e.target.style.borderColor = THEME.GLASS_BORDER}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              background: `linear-gradient(135deg, ${THEME.GOLD}, ${THEME.GOLD_DIM})`,
              color: THEME.NAVY_DEEP,
              border: "none",
              padding: "14px 20px",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 700,
              fontFamily: "'Space Grotesk'",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "transform 0.1s, filter 0.2s",
              marginTop: 8,
              opacity: loading ? 0.7 : 1,
              boxShadow: `0 4px 16px ${THEME.GOLD_GLOW}`
            }}
            onMouseOver={(e) => !loading && (e.currentTarget.style.filter = "brightness(1.1)")}
            onMouseOut={(e) => !loading && (e.currentTarget.style.filter = "none")}
            onMouseDown={(e) => !loading && (e.currentTarget.style.transform = "scale(0.98)")}
            onMouseUp={(e) => !loading && (e.currentTarget.style.transform = "none")}
          >
            {loading ? "Processing..." : isSignUp ? "Sign Up" : "Sign In"}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: "center" }}>
          <button
            onClick={() => { setIsSignUp(!isSignUp); setMessage(null); }}
            style={{
              background: "none", border: "none", color: THEME.TEXT_DIM, fontSize: 13,
              cursor: "pointer", textDecoration: "underline", textDecorationColor: "rgba(255,255,255,0.1)",
              textUnderlineOffset: 4, fontFamily: "'Inter', sans-serif"
            }}
          >
            {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
}
