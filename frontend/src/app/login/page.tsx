"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import toast from "react-hot-toast";
import {
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  Lock,
  User,
  MessageCircle,
  Search,
  Rss,
  Clock,
} from "lucide-react";

const FEATURE_QUOTES = [
  {
    quote: "Ask AI parses thousands of pages of complex SEBI, RBI, & FIU-IND regulatory circulars in real-time, instantly resolving compliance gaps and drafting high-quality audit responses.",
    title: "AI Regulatory Copilot",
    subtitle: "Advanced Contextual Semantics",
    icon: MessageCircle,
  },
  {
    quote: "Our policy gap analyzer scans uploaded corporate policies against current compliance standards, automatically flagging missing clauses, legal risks, and contradictions.",
    title: "Automated Gap Analyzer",
    subtitle: "Line-by-Line Policy Scans",
    icon: Search,
  },
  {
    quote: "Every single AI inquiry, regulatory query, and gap analysis is cryptographically logged on an unalterable compliance ledger for bulletproof external audits.",
    title: "Immutable Audit Ledger",
    subtitle: "JWT-Enforced Verifiability",
    icon: Lock,
  },
  {
    quote: "Stay ahead of regulatory change with automated scraping of live SEBI & RBI bulletins, notifying your team of new compliance updates before they take effect.",
    title: "Real-time Regulation Feed",
    subtitle: "Automated Bulletins Scraping",
    icon: Rss,
  },
  {
    quote: "Never miss a regulatory deadline. Receive early warnings on reporting expirations, policy renewals, and compliance calendar timelines customized for Indian finance.",
    title: "Intelligent Expiry Alerts",
    subtitle: "Proactive Deadlines Engine",
    icon: Clock,
  },
];

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ username: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [user, loading, router]);

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * FEATURE_QUOTES.length);
    setSlideIndex(randomIndex);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username || !form.password) {
      toast.error("Please fill in all fields");
      return;
    }
    setSubmitting(true);
    try {
      await login(form.username, form.password);
      toast.success("Welcome back!");
      window.location.href = "/dashboard";
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        "Invalid credentials";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return null;

  const ActiveIcon = FEATURE_QUOTES[slideIndex].icon;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#faf9f6",
        padding: "36px 24px",
        position: "relative",
        overflow: "hidden",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "10%",
          left: "5%",
          width: "500px",
          height: "500px",
          background: "radial-gradient(circle, rgba(232, 184, 75, 0.08) 0%, transparent 70%)",
          filter: "blur(60px)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "10%",
          right: "5%",
          width: "550px",
          height: "550px",
          background: "radial-gradient(circle, rgba(45, 49, 66, 0.04) 0%, transparent 70%)",
          filter: "blur(60px)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(232, 184, 75, 0.02) 1.5px, transparent 1.5px), linear-gradient(90deg, rgba(232, 184, 75, 0.02) 1.5px, transparent 1.5px)",
          backgroundSize: "50px 50px",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <style>{`
        @media (max-width: 900px) {
          .auth-container {
            grid-template-columns: 1fr !important;
            max-width: 480px !important;
          }
          .left-panel {
            display: none !important;
          }
          .right-panel {
            padding: 42px 28px !important;
          }
        }
      `}</style>

      <div
        className="auth-container fade-up"
        style={{
          width: "100%",
          maxWidth: "1020px",
          background: "#ffffff",
          borderRadius: "32px",
          border: "1px solid rgba(232, 184, 75, 0.18)",
          boxShadow:
            "0 25px 60px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02), inset 0 0 0 1px rgba(255, 255, 255, 0.7)",
          display: "grid",
          gridTemplateColumns: "1.1fr 1fr",
          overflow: "hidden",
          position: "relative",
          zIndex: 1,
        }}
      >
        {}
        <div
          className="left-panel"
          style={{
            background: "#f4f5f7",
            padding: "48px 48px 42px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            borderRight: "1px solid rgba(232, 184, 75, 0.12)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <svg width="40" height="40" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="6" y="6" width="116" height="116" rx="28" fill="#2d3142" stroke="#e8b84b" strokeOpacity={0.15} strokeWidth={2}/>
              <path d="M38 90 L64 38 L90 90" stroke="#FFFFFF" strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <path d="M50 74 L68 56 L82 66 L112 36" stroke="#e8b84b" strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            </svg>
            <span style={{ fontSize: "20px", fontWeight: 800, color: "#2d3142", letterSpacing: "-0.03em" }}>
              AuditFlow
            </span>
          </div>

          <div style={{ margin: "32px 0 40px" }}>
            <h2
              style={{
                fontSize: "28px",
                fontWeight: 800,
                color: "#2d3142",
                lineHeight: 1.25,
                letterSpacing: "-0.03em",
                marginBottom: "36px",
              }}
            >
              Complete Compliance Intelligence Platform for Indian Finance
            </h2>

            <div style={{ position: "relative", minHeight: "220px" }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(232, 184, 75, 0.15)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", top: "-18px", left: "-8px", zIndex: 0 }}>
                <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.75-2-2-2H4c-1.25 0-2 .75-2 2v4c0 1.25.75 2 2 2h4l-2 6" />
                <path d="M14 21c3 0 7-1 7-8V5c0-1.25-.75-2-2-2h-4c-1.25 0-2 .75-2 2v4c0 1.25.75 2 2 2h4l-2 6" />
              </svg>

              <div style={{ position: "relative", zIndex: 1 }}>
                <p
                  style={{
                    fontSize: "16px",
                    fontWeight: 500,
                    color: "#475569",
                    lineHeight: 1.6,
                    fontStyle: "italic",
                    marginBottom: "28px",
                    paddingLeft: "8px",
                  }}
                >
                  &ldquo;{FEATURE_QUOTES[slideIndex].quote}&rdquo;
                </p>

                <div style={{ display: "flex", alignItems: "center", gap: "12px", paddingLeft: "8px" }}>
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "12px",
                      background: "rgba(232, 184, 75, 0.1)",
                      border: "1px solid rgba(232, 184, 75, 0.25)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#e8b84b",
                    }}
                  >
                    <ActiveIcon size={20} strokeWidth={2.2} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#2d3142" }}>
                      {FEATURE_QUOTES[slideIndex].title}
                    </h4>
                    <p style={{ fontSize: "12px", fontWeight: 500, color: "#64748b" }}>
                      {FEATURE_QUOTES[slideIndex].subtitle}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <span
              style={{
                width: "24px",
                height: "6px",
                borderRadius: "3px",
                background: "#e8b84b",
                display: "block",
                transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            />
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "3px",
                background: "#cbd5e1",
                display: "block",
                transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            />
          </div>
        </div>

        {}
        <div
          className="right-panel"
          style={{
            padding: "48px 48px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <div style={{ marginBottom: "32px" }}>
            <h2
              style={{
                fontSize: "24px",
                fontWeight: 800,
                color: "#2d3142",
                letterSpacing: "-0.02em",
                marginBottom: "6px",
              }}
            >
              Welcome Back
            </h2>
            <p style={{ color: "#64748b", fontSize: "14px", fontWeight: 500 }}>
              Access your compliance knowledge base and reports
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#2d3142",
                  marginBottom: "8px",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                Username
              </label>
              <div style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: focusedField === "username" ? "#e8b84b" : "#94a3b8",
                    display: "flex",
                    transition: "color 0.2s ease",
                  }}
                >
                  <User size={18} strokeWidth={2.2} />
                </span>
                <input
                  type="text"
                  placeholder="Enter your username"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  onFocus={() => setFocusedField("username")}
                  onBlur={() => setFocusedField(null)}
                  autoComplete="username"
                  id="username"
                  style={{
                    width: "100%",
                    background: "#ffffff",
                    border: focusedField === "username" ? "1px solid #e8b84b" : "1px solid #e2e8f0",
                    borderRadius: "12px",
                    padding: "13px 16px 13px 44px",
                    color: "#2d3142",
                    fontSize: "14px",
                    fontWeight: 500,
                    outline: "none",
                    boxShadow:
                      focusedField === "username" ? "0 0 0 4px rgba(232, 184, 75, 0.1)" : "none",
                    transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                    fontFamily: "Inter, sans-serif",
                  }}
                />
              </div>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#2d3142",
                  marginBottom: "8px",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                Password
              </label>
              <div style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: focusedField === "password" ? "#e8b84b" : "#94a3b8",
                    display: "flex",
                    transition: "color 0.2s ease",
                  }}
                >
                  <Lock size={18} strokeWidth={2.2} />
                </span>
                <input
                  type={showPw ? "text" : "password"}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  autoComplete="current-password"
                  id="password"
                  style={{
                    width: "100%",
                    background: "#ffffff",
                    border: focusedField === "password" ? "1px solid #e8b84b" : "1px solid #e2e8f0",
                    borderRadius: "12px",
                    padding: "13px 48px 13px 44px",
                    color: "#2d3142",
                    fontSize: "14px",
                    fontWeight: 500,
                    outline: "none",
                    boxShadow:
                      focusedField === "password" ? "0 0 0 4px rgba(232, 184, 75, 0.1)" : "none",
                    transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                    fontFamily: "Inter, sans-serif",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  style={{
                    position: "absolute",
                    right: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "#94a3b8",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "4px",
                    borderRadius: "6px",
                  }}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              id="login-submit"
              style={{
                width: "100%",
                padding: "14px",
                fontSize: "15px",
                fontWeight: 600,
                marginTop: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #e8b84b 0%, #c49a2e 100%)",
                color: "#ffffff",
                border: "none",
                cursor: submitting ? "not-allowed" : "pointer",
                boxShadow: "0 4px 15px rgba(232, 184, 75, 0.25), 0 1px 2px rgba(0, 0, 0, 0.05)",
                transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                fontFamily: "Inter, sans-serif",
              }}
              onMouseEnter={(e) => {
                if (!submitting) {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 6px 20px rgba(232, 184, 75, 0.35)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = "0 4px 15px rgba(232, 184, 75, 0.25)";
              }}
            >
              {submitting ? (
                <Loader2 size={18} style={{ animation: "spin 0.7s linear infinite" }} />
              ) : (
                <>
                  Sign In <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div style={{ height: "1px", background: "#e2e8f0", margin: "32px 0 24px" }} />

          <p style={{ textAlign: "center", fontSize: "14px", color: "#64748b", fontWeight: 500 }}>
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              style={{
                color: "#c49a2e",
                textDecoration: "none",
                fontWeight: 600,
                transition: "color 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#e8b84b")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#c49a2e")}
            >
              Register here
            </Link>
          </p>

          <p
            style={{
              textAlign: "center",
              marginTop: "24px",
              fontSize: "11px",
              color: "#94a3b8",
              fontWeight: 500,
            }}
          >
            JWT-Enforced audit compliance · Cryptographically logged queries
          </p>
        </div>
      </div>
    </div>
  );
}
