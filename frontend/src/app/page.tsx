"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  motion,
  useScroll,
  useTransform,
  useInView,
} from "framer-motion";

const GOLD = "#e8b84b";
const CHARCOAL = "#2d3142";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } },
};

const stagger = (delay = 0.08) => ({
  hidden: {},
  show: { transition: { staggerChildren: delay } },
});

function Reveal({ children, delay = 0, style = {} }: {
  children: React.ReactNode; delay?: number; style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      style={style}
      initial="hidden"
      animate={inView ? "show" : "hidden"}
      variants={fadeUp}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}

function CandlestickChart({ tab }: { tab: number }) {
  const dataPatterns = [

    [
      { x: 20, open: 22, close: 14, high: 26, low: 10 },
      { x: 45, open: 14, close: 20, high: 22, low: 12 },
      { x: 70, open: 20, close: 18, high: 24, low: 16 },
      { x: 95, open: 18, close: 26, high: 28, low: 15 },
      { x: 120, open: 26, close: 22, high: 29, low: 20 },
      { x: 145, open: 22, close: 32, high: 34, low: 21 },
      { x: 170, open: 32, close: 28, high: 35, low: 26 },
      { x: 195, open: 28, close: 36, high: 38, low: 25 },
      { x: 220, open: 36, close: 42, high: 45, low: 34 },
      { x: 245, open: 42, close: 46, high: 48, low: 40 },
    ],

    [
      { x: 20, open: 35, close: 28, high: 38, low: 25 },
      { x: 45, open: 28, close: 34, high: 36, low: 26 },
      { x: 70, open: 34, close: 40, high: 42, low: 30 },
      { x: 95, open: 40, close: 25, high: 41, low: 22 },
      { x: 120, open: 25, close: 18, high: 28, low: 15 },
      { x: 145, open: 18, close: 22, high: 24, low: 16 },
      { x: 170, open: 22, close: 30, high: 32, low: 20 },
      { x: 195, open: 30, close: 35, high: 38, low: 28 },
      { x: 220, open: 35, close: 33, high: 37, low: 31 },
      { x: 245, open: 33, close: 45, high: 47, low: 32 },
    ],

    [
      { x: 20, open: 15, close: 22, high: 25, low: 12 },
      { x: 45, open: 22, close: 29, high: 31, low: 20 },
      { x: 70, open: 29, close: 26, high: 32, low: 24 },
      { x: 95, open: 26, close: 34, high: 36, low: 25 },
      { x: 120, open: 34, close: 42, high: 44, low: 32 },
      { x: 145, open: 42, close: 38, high: 45, low: 36 },
      { x: 170, open: 38, close: 44, high: 47, low: 35 },
      { x: 195, open: 44, close: 41, high: 46, low: 39 },
      { x: 220, open: 41, close: 47, high: 49, low: 40 },
      { x: 245, open: 47, close: 52, high: 54, low: 45 },
    ],

    [
      { x: 20, open: 45, close: 44, high: 47, low: 42 },
      { x: 45, open: 44, close: 46, high: 48, low: 43 },
      { x: 70, open: 46, close: 45, high: 47, low: 44 },
      { x: 95, open: 45, close: 48, high: 49, low: 43 },
      { x: 120, open: 48, close: 47, high: 49, low: 46 },
      { x: 145, open: 47, close: 49, high: 50, low: 45 },
      { x: 170, open: 49, close: 48, high: 51, low: 47 },
      { x: 195, open: 48, close: 51, high: 52, low: 46 },
      { x: 220, open: 51, close: 50, high: 52, low: 49 },
      { x: 245, open: 50, close: 53, high: 54, low: 48 },
    ],

    [
      { x: 20, open: 12, close: 18, high: 20, low: 10 },
      { x: 45, open: 18, close: 15, high: 21, low: 14 },
      { x: 70, open: 15, close: 24, high: 26, low: 13 },
      { x: 95, open: 24, close: 28, high: 30, low: 22 },
      { x: 120, open: 28, close: 25, high: 29, low: 20 },
      { x: 145, open: 25, close: 32, high: 35, low: 24 },
      { x: 170, open: 32, close: 38, high: 40, low: 30 },
      { x: 195, open: 38, close: 35, high: 39, low: 32 },
      { x: 220, open: 35, close: 42, high: 44, low: 33 },
      { x: 245, open: 42, close: 48, high: 50, low: 40 },
    ],

    [
      { x: 20, open: 30, close: 32, high: 35, low: 28 },
      { x: 45, open: 32, close: 38, high: 40, low: 30 },
      { x: 70, open: 38, close: 35, high: 39, low: 33 },
      { x: 95, open: 35, close: 41, high: 43, low: 34 },
      { x: 120, open: 41, close: 44, high: 46, low: 39 },
      { x: 145, open: 44, close: 40, high: 45, low: 38 },
      { x: 170, open: 40, close: 46, high: 48, low: 39 },
      { x: 195, open: 46, close: 48, high: 50, low: 44 },
      { x: 220, open: 48, close: 45, high: 49, low: 43 },
      { x: 245, open: 45, close: 50, high: 52, low: 44 },
    ],
  ];

  const currentPattern = dataPatterns[tab] || dataPatterns[0];
  const mapValueToY = (val: number) => 130 - (val * 2.2);

  const mainLabels = [
    "AI Accuracy Index",
    "Spikes Severity Analyzer",
    "Gaps Analysis Resolution",
    "Audit Trail Integrity Scale",
    "Document Renewal Index",
    "Fine-Grained Role Scopes",
  ];

  const indexPercentages = ["98.4%", "12.4%", "88.2%", "100%", "92.6%", "99.8%"];
  const upColors = [true, false, true, true, true, true];

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
        <div>
          <p style={{ fontSize: "10px", color: "#64748b", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            {mainLabels[tab]}
          </p>
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "4px" }}>
            <span style={{ fontSize: "24px", fontWeight: 900, color: CHARCOAL, letterSpacing: "-0.02em" }}>
              {indexPercentages[tab]}
            </span>
            <span style={{ fontSize: "11px", fontWeight: 700, color: upColors[tab] ? "#5f8776" : "#b35d5d" }}>
              {upColors[tab] ? "▲ +18.4%" : "▼ -2.8%"}
            </span>
          </div>
        </div>

        <div style={{ height: "4px" }} />
      </div>

      
      <div style={{ flex: 1, minHeight: "140px", position: "relative" }}>
        <svg width="100%" height="100%" viewBox="0 0 280 130" preserveAspectRatio="none">
          {[20, 50, 80, 110].map((y) => (
            <line key={y} x1="0" y1={y} x2="280" y2={y} stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="3 3" />
          ))}

          <defs>
            <linearGradient id="chart-area-grad-light" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={GOLD} stopOpacity="0.16" />
              <stop offset="100%" stopColor={GOLD} stopOpacity="0" />
            </linearGradient>
          </defs>

          <path
            d={`M 20 ${mapValueToY(currentPattern[0].close)} 
                ${currentPattern.map((p, i) => `L ${p.x} ${mapValueToY(p.close)}`).join(" ")}
                L 245 130 L 20 130 Z`}
            fill="url(#chart-area-grad-light)"
          />

          <path
            d={`M 20 ${mapValueToY(currentPattern[0].close)} 
                ${currentPattern.map((p, i) => `C ${p.x - 10} ${mapValueToY(p.close)}, ${p.x - 5} ${mapValueToY(p.close)}, ${p.x} ${mapValueToY(p.close)}`).join(" ")}`}
            fill="none"
            stroke={GOLD}
            strokeWidth="1.8"
            strokeLinecap="round"
          />

          {currentPattern.map((p, i) => {
            const isUp = p.close >= p.open;
            const top = mapValueToY(isUp ? p.close : p.open);
            const bottom = mapValueToY(isUp ? p.open : p.close);
            const high = mapValueToY(p.high);
            const low = mapValueToY(p.low);
            const height = Math.max(bottom - top, 2);

            return (
              <g key={i}>
                <line x1={p.x} y1={high} x2={p.x} y2={low} stroke={isUp ? GOLD : "#94a3b8"} strokeWidth="1" />
                <rect
                  x={p.x - 3}
                  y={top}
                  width="6"
                  height={height}
                  fill={isUp ? GOLD : "#f1f5f9"}
                  stroke={isUp ? GOLD : "#cbd5e1"}
                  strokeWidth="1"
                  rx="1.5"
                />
              </g>
            );
          })}
        </svg>
      </div>

      <p style={{ fontSize: "10px", color: "#64748b", borderTop: "1px solid #f1f5f9", paddingTop: "10px", marginTop: "12px", lineHeight: 1.5 }}>
        We utilize advanced grounding algorithms and cryptographic hashing to ensure that users always retrieve highly accurate index analytics.
      </p>
    </div>
  );
}

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, 50]);
  const heroOpacity = useTransform(scrollY, [0, 380], [1, 0]);

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [user, loading, router]);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  if (loading || user) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        html { scroll-behavior: smooth; }
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          background: #faf9f6;
          color: ${CHARCOAL};
          font-family: 'Inter', system-ui, sans-serif;
          -webkit-font-smoothing: antialiased;
          overflow-x: hidden;
        }

        
        .ln {
          position: fixed;
          top: 16px;
          left: 50%;
          transform: translateX(-50%);
          width: calc(100% - 32px);
          max-width: 1200px;
          height: 52px;
          z-index: 999;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          background: rgba(255, 255, 255, 0.82);
          backdrop-filter: blur(20px);
          box-shadow: 0 4px 20px rgba(0,0,0,0.02);
          transition: border-color 0.3s, background 0.3s, box-shadow 0.3s;
        }
        .ln.s {
          border-color: #cbd5e1;
          background: rgba(255, 255, 255, 0.94);
          box-shadow: 0 8px 32px rgba(0,0,0,0.06);
        }

        .nl { display: flex; align-items: center; gap: 24px; }
        .na { font-size: 13px; color: #64748b; text-decoration: none; transition: color 0.2s; font-weight: 500; }
        .na:hover { color: ${CHARCOAL}; }

        .nc { display: flex; align-items: center; gap: 8px; }

        .nr { display: flex; align-items: center; gap: 10px; }
        .btn-ghost { font-size: 13px; color: #64748b; text-decoration: none;
                     padding: 7px 14px; transition: color 0.2s; font-weight: 500; }
        .btn-ghost:hover { color: ${CHARCOAL}; }
        .btn-solid { font-size: 12px; font-weight: 700; color: #ffffff;
                     text-decoration: none; padding: 8px 18px; border-radius: 6px;
                     background: ${CHARCOAL}; transition: opacity 0.2s, transform 0.2s;
                     white-space: nowrap; }
        .btn-solid:hover { opacity: 0.9; transform: translateY(-0.5px); }

        
        .div { height: 1px; background: #e2e8f0; }

        
        .sec { padding: 110px clamp(20px, 5vw, 96px); }
        .sec-label { font-size: 10px; font-weight: 700; letter-spacing: 0.12em;
                     text-transform: uppercase; color: ${GOLD}; margin-bottom: 12px; }
        .sec-h2 { font-size: clamp(28px, 4vw, 40px); font-weight: 900;
                  color: ${CHARCOAL}; line-height: 1.15; letter-spacing: -0.025em; margin-bottom: 16px; }
        .sec-sub { font-size: 14px; color: #64748b; line-height: 1.7; max-width: 520px; }

        
        .feat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        .how-grid  { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; }

        
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #faf9f6; }
        ::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: ${GOLD}; }

        @media (max-width: 960px) {
          .nl { display: none; }
          .feat-grid { grid-template-columns: 1fr 1fr !important; }
          .how-grid  { grid-template-columns: 1fr !important; }
          .cards-row { grid-template-columns: 1fr 1fr !important; }
          .circle-split { grid-template-columns: 1fr !important; gap: 40px !important; text-align: center; }
          .circle-orb-container { margin: 0 auto !important; }
          .checklist-split { grid-template-columns: 1fr !important; gap: 32px !important; }
        }
        @media (max-width: 640px) {
          .feat-grid { grid-template-columns: 1fr !important; }
          .cards-row { grid-template-columns: 1fr !important; }
          .stats-row { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>

      
      <motion.nav
        className={`ln${scrolled ? " s" : ""}`}
        initial={{ opacity: 0, y: -16, x: "-50%" }}
        animate={{ opacity: 1, y: 0, x: "-50%" }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="nl">
          <a href="#features" className="na">Features</a>
          <a href="#how-it-works" className="na">How it works</a>
          <a href="#security" className="na">Security</a>
        </div>

        <div className="nc">
          
          <svg width="120" height="32" viewBox="0 0 120 32" fill="none" style={{ cursor: "pointer" }} onClick={() => router.push("/")}>
            <text x="4" y="23" fill={CHARCOAL} fontFamily="'Inter', system-ui, sans-serif" fontWeight="900" fontSize="20" letterSpacing="-0.03em">
              Audit<tspan fill="#e8b84b">Flow</tspan>
            </text>
            <path d="M 8 16 C 20 23, 28 23, 38 16 C 46 8, 56 10, 68 20 C 78 12, 88 9, 106 6" stroke="#e8b84b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        </div>

        <div className="nr">
          <Link href="/login" className="btn-ghost">Sign in</Link>
          <Link href="/register" className="btn-solid">Get started</Link>
        </div>
      </motion.nav>

      
      <section style={{
        position: "relative", minHeight: "100vh",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        overflow: "visible", background: "#faf9f6",
        paddingTop: "110px",
      }}>
        
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          backgroundImage: `radial-gradient(circle, rgba(232,184,75,0.07) 1.2px, transparent 1.2px)`,
          backgroundSize: "36px 36px",
          maskImage: "radial-gradient(ellipse 85% 85% at 50% 40%, black 20%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 85% 85% at 50% 40%, black 20%, transparent 100%)",
          zIndex: 1,
        }} />

        
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
          <svg width="100%" height="100%" viewBox="0 0 1440 900" preserveAspectRatio="none" style={{ opacity: 0.9, position: "absolute", right: 0, top: 0 }}>
            <defs>
              <linearGradient id="curtain-fade-bottom-light" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="white" stopOpacity="0.9" />
                <stop offset="50%" stopColor="white" stopOpacity="0.45" />
                <stop offset="85%" stopColor="white" stopOpacity="0" />
              </linearGradient>
              <mask id="fade-mask-light">
                <rect width="1440" height="900" fill="url(#curtain-fade-bottom-light)" />
              </mask>
              <linearGradient id="panel-1-light" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#e8b84b" stopOpacity="0.26" />
                <stop offset="100%" stopColor="#e8b84b" stopOpacity="0.00" />
              </linearGradient>
              <linearGradient id="panel-2-light" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#2d3142" stopOpacity="0.14" />
                <stop offset="100%" stopColor="#2d3142" stopOpacity="0.00" />
              </linearGradient>
              <linearGradient id="panel-3-light" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#e8b84b" stopOpacity="0.34" />
                <stop offset="100%" stopColor="#e8b84b" stopOpacity="0.01" />
              </linearGradient>
              <linearGradient id="panel-4-light" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#2d3142" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#2d3142" stopOpacity="0.00" />
              </linearGradient>
              <linearGradient id="edge-line-grad-light" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#e8b84b" stopOpacity="0.55" />
                <stop offset="50%" stopColor="#e8b84b" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#e8b84b" stopOpacity="0.00" />
              </linearGradient>
            </defs>

            <g mask="url(#fade-mask-light)">
              <rect x="740" width="90" height="900" fill="url(#panel-1-light)" />
              <line x1="740" y1="0" x2="740" y2="900" stroke="url(#edge-line-grad-light)" strokeWidth="1" />

              <rect x="830" width="110" height="900" fill="url(#panel-2-light)" />
              <line x1="830" y1="0" x2="830" y2="900" stroke="url(#edge-line-grad-light)" strokeWidth="1" opacity="0.6" />

              <rect x="940" width="70" height="900" fill="url(#panel-3-light)" />
              <line x1="940" y1="0" x2="940" y2="900" stroke="url(#edge-line-grad-light)" strokeWidth="1.2" />

              <rect x="1010" width="130" height="900" fill="url(#panel-4-light)" />
              <line x1="1010" y1="0" x2="1010" y2="900" stroke="url(#edge-line-grad-light)" strokeWidth="1" opacity="0.8" />

              <rect x="1140" width="85" height="900" fill="url(#panel-1-light)" />
              <line x1="1140" y1="0" x2="1140" y2="900" stroke="url(#edge-line-grad-light)" strokeWidth="1" />

              <rect x="1225" width="105" height="900" fill="url(#panel-3-light)" />
              <line x1="1225" y1="0" x2="1225" y2="900" stroke="url(#edge-line-grad-light)" strokeWidth="1.2" />

              <rect x="1330" width="110" height="900" fill="url(#panel-2-light)" />
              <line x1="1330" y1="0" x2="1330" y2="900" stroke="url(#edge-line-grad-light)" strokeWidth="1" opacity="0.5" />
            </g>
          </svg>
        </div>

        
        <div style={{
          position: "absolute", top: "32%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: "700px", height: "320px",
          background: "radial-gradient(ellipse, rgba(232,184,75,0.03) 0%, transparent 70%)",
          filter: "blur(24px)",
          pointerEvents: "none",
          zIndex: 1,
        }} />

        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          height: "200px", pointerEvents: "none",
          background: "linear-gradient(to bottom, transparent, #faf9f6)",
          zIndex: 2,
        }} />

        
        <motion.div style={{ y: heroY, opacity: heroOpacity, position: "relative", zIndex: 2, width: "100%" }}>
          <motion.div
            style={{ textAlign: "center", padding: "80px clamp(20px, 5vw, 120px) 50px", maxWidth: "860px", margin: "0 auto" }}
            variants={stagger()}
            initial="hidden"
            animate="show"
          >
            
            <motion.div variants={fadeUp} style={{ display: "inline-flex", marginBottom: "28px" }}>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: "8px",
                background: `rgba(232,184,75,0.07)`,
                border: `1px solid rgba(232,184,75,0.22)`,
                color: "#c49a2e",
                fontSize: "11px", fontWeight: 700,
                padding: "6px 14px", borderRadius: "100px",
                letterSpacing: "0.02em",
              }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: GOLD, display: "inline-block" }} />
                Indian Regulatory &amp; Compliance Intelligence
              </span>
            </motion.div>

            
            <motion.h1 variants={fadeUp} style={{
              fontSize: "clamp(38px, 6.5vw, 76px)",
              fontWeight: 900,
              lineHeight: 1.05,
              letterSpacing: "-0.035em",
              color: CHARCOAL,
              marginBottom: "24px",
            }}>
              Streamline Your<br />Compliance<br />
              <span style={{ color: GOLD }}>with AuditFlow</span>
            </motion.h1>

            
            <motion.p variants={fadeUp} style={{
              fontSize: "clamp(14px, 1.6vw, 16px)",
              color: "#64748b",
              lineHeight: 1.7,
              maxWidth: "460px",
              margin: "0 auto 40px",
            }}>
              Grounded AI indexing SEBI · RBI · FIU-IND circulars,
              automated gap analysis, and unalterable audit trails.
            </motion.p>

            
            <motion.div variants={fadeUp} style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
              <motion.div whileHover={{ y: -1.5 }} whileTap={{ scale: 0.98 }}>
                <Link href="/register" style={{
                  display: "inline-flex", alignItems: "center", gap: "8px",
                  fontSize: "13px", fontWeight: 700, color: "#ffffff",
                  textDecoration: "none", padding: "12px 26px", borderRadius: "8px",
                  background: CHARCOAL,
                  boxShadow: `0 4px 16px rgba(45, 49, 66, 0.15)`,
                }}>
                  Open Dashboard
                </Link>
              </motion.div>
              <motion.div whileHover={{ y: -1.5 }} whileTap={{ scale: 0.98 }}>
                <Link href="#features" onClick={(e) => {
                  e.preventDefault();
                  document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
                }} style={{
                  display: "inline-flex", alignItems: "center", gap: "8px",
                  fontSize: "13px", fontWeight: 600, color: "#64748b",
                  textDecoration: "none", padding: "12px 24px", borderRadius: "8px",
                  border: "1px solid #cbd5e1", background: "rgba(0,0,0,0.01)",
                }}>
                  Explore More
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>

        
        <motion.div
          className="cards-row"
          style={{
            display: "grid",
            gridTemplateColumns: "190px 1.1fr 0.9fr 170px",
            gap: "12px",
            padding: "0 clamp(16px, 4vw, 64px)",
            position: "relative", zIndex: 3, width: "100%",
            maxWidth: "1200px",
            marginBottom: "-40px",
          }}
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          
          <div style={{
            background: "#ffffff", border: "1px solid rgba(232, 184, 75, 0.2)", borderRadius: "14px", padding: "18px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.05)"
          }}>
            <p style={{ fontSize: "8px", color: "#64748b", fontWeight: 700, letterSpacing: "0.08em", marginBottom: "12px" }}>COMPLIANCE TRUST</p>
            <div style={{ display: "flex", marginBottom: "14px" }}>
              {["SEBI", "RBI", "FIU", "MCA"].map((name, i) => (
                <div key={i} style={{
                  width: "28px", height: "28px", borderRadius: "50%",
                  background: ["#2d3142", "#e8b84b", "#1e2535", "#f1f5f9"][i],
                  border: "2px solid #ffffff", marginLeft: i ? "-8px" : "0",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "7px", fontWeight: 800, color: ["#fff", "#000", "#fff", "#c49a2e"][i],
                  boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
                }}>
                  {name}
                </div>
              ))}
            </div>
            <p style={{ fontSize: "22px", fontWeight: 900, color: CHARCOAL, lineHeight: 1 }}>
              <span style={{ color: GOLD }}>★</span> 4.9
            </p>
            <p style={{ fontSize: "9px", color: "#64748b", marginTop: "5px" }}>Corporate verified rating</p>
          </div>

          
          <div style={{
            background: "#ffffff", border: "1px solid rgba(232, 184, 75, 0.2)", borderRadius: "14px", padding: "16px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.05)"
          }}>
            <p style={{ fontSize: "8px", color: "#64748b", fontWeight: 700, letterSpacing: "0.08em", marginBottom: "10px" }}>COMPLIANCE COMPANION CHAT</p>
            <div style={{
              background: `rgba(232,184,75,0.05)`, border: `1px solid rgba(232,184,75,0.08)`,
              borderRadius: "8px 8px 8px 2px", padding: "8px 11px",
              fontSize: "10px", color: "#2d3142", lineHeight: 1.5, marginBottom: "6px",
              fontWeight: 500,
            }}>What's the threshold for PMLA reported transactions?</div>
            <div style={{
              background: "#f8f9fa", border: "1px solid #e2e8f0",
              borderRadius: "2px 8px 8px 8px", padding: "8px 11px",
              fontSize: "10px", color: "#64748b", lineHeight: 1.5,
            }}>Transactions exceeding ₹10 Lakhs require reporting to FIU-IND under Rule 3...</div>
          </div>

          
          <div style={{
            background: "#ffffff", border: "1px solid rgba(232, 184, 75, 0.2)",
            borderRadius: "14px", padding: "16px", position: "relative", overflow: "hidden",
            boxShadow: "0 10px 30px rgba(0,0,0,0.05)"
          }}>
            <div style={{
              position: "absolute", top: "-24px", right: "-24px", width: "100px", height: "100px",
              borderRadius: "50%", background: `radial-gradient(circle, rgba(232,184,75,0.08), transparent 70%)`,
              filter: "blur(16px)",
            }} />
            <p style={{ fontSize: "8px", color: "#64748b", fontWeight: 700, letterSpacing: "0.08em", marginBottom: "10px" }}>DOCUMENT AUDITING</p>

            
            <div style={{ position: "relative", width: "100%", height: "42px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="80" height="40" viewBox="0 0 80 40">
                <path d="M 10 38 A 30 30 0 0 1 70 38" fill="none" stroke="#e2e8f0" strokeWidth="6" strokeLinecap="round" />
                <path d="M 10 38 A 30 30 0 0 1 58 14" fill="none" stroke={GOLD} strokeWidth="6" strokeLinecap="round" strokeDasharray="100" />
              </svg>
              <div style={{ position: "absolute", bottom: "0", fontSize: "14px", fontWeight: 900, color: CHARCOAL }}>92.4%</div>
            </div>

            <p style={{ fontSize: "10px", fontWeight: 700, color: CHARCOAL, textAlign: "center", marginTop: "8px" }}>
              Secure Health Index
            </p>
          </div>

          
          <div style={{
            background: "#ffffff", border: "1px solid rgba(232, 184, 75, 0.2)", borderRadius: "14px", padding: "14px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.05)"
          }}>
            <p style={{ fontSize: "8px", color: "#64748b", fontWeight: 700, letterSpacing: "0.08em", marginBottom: "10px" }}>LIVE FEEDS</p>
            {[
              { r: "SEBI", s: "CRIT" },
              { r: "RBI", s: "HIGH" },
              { r: "FIU", s: "MED" },
            ].map((f, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "4px 0", borderBottom: i < 2 ? "1px solid #f1f5f9" : "none",
              }}>
                <span style={{ fontSize: "10px", fontWeight: 700, color: "#64748b" }}>{f.r}</span>
                <span style={{
                  fontSize: "8px", fontWeight: 700, padding: "1px 5px", borderRadius: "3px",
                  background: f.s === "CRIT" ? "rgba(179,93,93,0.08)" : f.s === "HIGH" ? "rgba(232,184,75,0.08)" : "rgba(71,85,105,0.15)",
                  color: f.s === "CRIT" ? "#b35d5d" : f.s === "HIGH" ? GOLD : "#64748b",
                }}>{f.s}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      
      <div style={{ height: "60px", position: "relative", zIndex: 1 }} />
      <div className="div" />
      <Reveal>
        <div style={{
          padding: "36px clamp(20px, 5vw, 96px)",
          display: "flex", gap: "clamp(24px, 5vw, 72px)",
          justifyContent: "center", alignItems: "center", flexWrap: "wrap",
          background: "#faf9f6"
        }}>
          {["SEBI", "RBI", "FIU-IND", "Ind AS", "PMLA", "MCA"].map(n => (
            <span key={n} style={{
              fontSize: "11px", fontWeight: 700, color: "#94a3b8",
              letterSpacing: "0.06em", textTransform: "uppercase",
              transition: "color 0.2s", cursor: "default",
            }}
              onMouseEnter={e => (e.currentTarget.style.color = CHARCOAL)}
              onMouseLeave={e => (e.currentTarget.style.color = "#94a3b8")}
            >{n}</span>
          ))}
        </div>
      </Reveal>
      <div className="div" />

      
      <section className="sec" style={{ background: "#f4f5f7", position: "relative" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div className="circle-split" style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "80px", alignItems: "center" }}>
            <div>
              <Reveal>
                <p className="sec-label">Unified Coverage</p>
                <h2 className="sec-h2">11+ Indian Regulatory Bodies under one roof</h2>
                <p className="sec-sub" style={{ marginBottom: "32px", color: "#64748b" }}>
                  We index, analyze, and map guidelines from India's key financial watchdogs in real-time. No more scanning multiple portals manually.
                </p>
              </Reveal>
              <Reveal delay={0.15}>
                <div style={{ display: "flex", gap: "10px" }}>
                  <Link href="/register" className="btn-solid" style={{ padding: "11px 22px" }}>
                    Get Started Free
                  </Link>
                  <Link href="#features" className="btn-ghost" style={{ padding: "10px 18px", border: "1px solid #cbd5e1", borderRadius: "6px" }}>
                    Learn More
                  </Link>
                </div>
              </Reveal>
            </div>

            
            <div style={{ display: "flex", justifyContent: "center" }}>
              <div className="circle-orb-container" style={{
                position: "relative",
                width: "260px",
                height: "260px",
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(232,184,75,0.04) 0%, transparent 70%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                
                <div style={{
                  width: "72px", height: "72px",
                  borderRadius: "50%", background: "#ffffff",
                  border: `2px solid ${GOLD}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: `0 8px 24px rgba(232,184,75,0.18)`,
                  zIndex: 2,
                }}>
                  <svg width="38" height="38" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
                    
                    <rect x="6" y="6" width="116" height="116" rx="28" fill="#2d3142" stroke="#e8b84b" strokeOpacity="0.15" strokeWidth="2" />
                    
                    <path d="M38 90 L64 38 L90 90" stroke="#FFFFFF" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    
                    <path d="M50 74 L68 56 L82 66 L112 36" stroke="#e8b84b" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </svg>
                </div>

                
                <div style={{
                  position: "absolute", width: "170px", height: "170px",
                  borderRadius: "50%", border: "1px solid #e2e8f0",
                }} />

                
                <div style={{
                  position: "absolute", width: "230px", height: "230px",
                  borderRadius: "50%", border: "1px solid #e2e8f0",
                }} />

                
                <motion.div
                  style={{
                    position: "absolute", width: "100%", height: "100%",
                  }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                >
                  
                  {[
                    { label: "SEBI", x: "130px", y: "0px", bg: "#2d3142", c: "#fff" },
                    { label: "RBI", x: "230px", y: "100px", bg: GOLD, c: "#000" },
                    { label: "FIU", x: "190px", y: "210px", bg: "#1e2535", c: "#fff" },
                    { label: "MCA", x: "70px", y: "210px", bg: "#ffffff", c: GOLD },
                    { label: "Ind AS", x: "30px", y: "100px", bg: "#2d3142", c: "#fff" },
                  ].map((orb, i) => (
                    <motion.div
                      key={i}
                      style={{
                        position: "absolute",
                        left: orb.x,
                        top: orb.y,
                        transform: "translate(-50%, -50%)",
                        width: "36px", height: "36px", borderRadius: "50%",
                        background: orb.bg,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "8px", fontWeight: 800, color: orb.c,
                        border: "2px solid #f4f5f7",
                        boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
                      }}
                    >
                      <motion.span
                        animate={{ rotate: -360 }}
                        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                      >
                        {orb.label}
                      </motion.span>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="div" />

      
      <section className="sec" id="features" style={{ background: "#faf9f6" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>

            
            <Reveal>
              <div style={{
                background: "#ffffff", border: "1px solid rgba(232, 184, 75, 0.15)", borderRadius: "14px", padding: "32px",
                height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between",
                minHeight: "320px", position: "relative", overflow: "hidden",
                boxShadow: "0 4px 20px rgba(0,0,0,0.02)"
              }}>
                <div>
                  <span style={{ fontSize: "9px", color: GOLD, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>Branching Pipeline</span>
                  <h3 style={{ fontSize: "18px", fontWeight: 800, color: CHARCOAL, marginTop: "6px", marginBottom: "10px" }}>Unified Intelligence Pipeline</h3>
                  <p style={{ fontSize: "12px", color: "#64748b", lineHeight: 1.6 }}>
                    Real-time circulars trace through our secure pipeline, updating compliance metrics and indexing semantic citations instantly.
                  </p>
                </div>

                
                <div style={{ position: "relative", height: "100px", marginTop: "24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="220" height="80" viewBox="0 0 220 80" fill="none">
                    <path d="M 110 40 L 30 15" stroke="#e2e8f0" strokeWidth="1.5" />
                    <path d="M 110 40 L 30 65" stroke="#e2e8f0" strokeWidth="1.5" />
                    <path d="M 110 40 L 190 15" stroke={GOLD} strokeWidth="1.5" strokeDasharray="3 3" />
                    <path d="M 110 40 L 190 65" stroke="#e2e8f0" strokeWidth="1.5" />

                    <circle cx="30" cy="15" r="8" fill="#f8f9fa" stroke="#cbd5e1" strokeWidth="1.5" />
                    <circle cx="30" cy="65" r="8" fill="#f8f9fa" stroke="#cbd5e1" strokeWidth="1.5" />
                    <circle cx="190" cy="15" r="8" fill="#2d3142" stroke={GOLD} strokeWidth="1.5" />
                    <circle cx="190" cy="65" r="8" fill="#f8f9fa" stroke="#cbd5e1" strokeWidth="1.5" />

                    <circle cx="110" cy="40" r="14" fill="#ffffff" stroke={GOLD} strokeWidth="2.5" />
                    <circle cx="110" cy="40" r="5" fill={GOLD} />
                  </svg>
                </div>
              </div>
            </Reveal>

            
            <Reveal delay={0.1}>
              <div style={{
                background: "#ffffff", border: "1px solid rgba(232, 184, 75, 0.15)", borderRadius: "14px", padding: "32px",
                height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between",
                minHeight: "320px", position: "relative", overflow: "hidden",
                boxShadow: "0 4px 20px rgba(0,0,0,0.02)"
              }}>
                <div>
                  <span style={{ fontSize: "9px", color: GOLD, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>Semantic Footprint</span>
                  <h3 style={{ fontSize: "18px", fontWeight: 800, color: CHARCOAL, marginTop: "6px", marginBottom: "10px" }}>Fast Gap Analysis &amp; Audits</h3>
                  <p style={{ fontSize: "12px", color: "#64748b", lineHeight: 1.6 }}>
                    Upload policy documents to overlay against Indian statutory grids, drawing automated warnings on lapses instantly.
                  </p>
                </div>

                
                <div style={{ position: "relative", height: "100px", marginTop: "24px" }}>
                  <svg width="100%" height="100%" viewBox="0 0 300 80" fill="none">
                    <path d="M20 20 L60 60 L140 10 L220 50 L280 15" stroke="#f1f5f9" strokeWidth="1" />
                    <path d="M60 60 L100 20 L180 50 L240 20" stroke="#f1f5f9" strokeWidth="1" />
                    <path d="M100 20 L140 10 L180 50" stroke={GOLD} strokeWidth="1.5" opacity="0.6" />

                    {[
                      { x: 20, y: 20 }, { x: 60, y: 60 }, { x: 100, y: 20 },
                      { x: 140, y: 10 }, { x: 180, y: 50 }, { x: 220, y: 50 },
                      { x: 240, y: 20 }, { x: 280, y: 15 }
                    ].map((dot, idx) => (
                      <circle
                        key={idx}
                        cx={dot.x}
                        cy={dot.y}
                        r="3"
                        fill={dot.x === 140 ? GOLD : "#cbd5e1"}
                        stroke={dot.x === 140 ? "#fff" : "transparent"}
                        strokeWidth="0.5"
                      />
                    ))}
                  </svg>
                </div>
              </div>
            </Reveal>

          </div>

          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "12px" }}>

            
            <Reveal>
              <div style={{
                background: "#ffffff", border: "1px solid rgba(232, 184, 75, 0.15)", borderRadius: "14px", padding: "24px",
                display: "flex", flexDirection: "column", gap: "16px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.02)"
              }}>
                <div>
                  <span style={{ fontSize: "8px", color: GOLD, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>Audit Trail Log</span>
                  <h4 style={{ fontSize: "15px", fontWeight: 800, color: CHARCOAL, marginTop: "4px", marginBottom: "12px" }}>Unalterable Audits</h4>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px", background: "#f8f9fa", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  {[
                    { u: "Priya S.", a: "Verified RBI AML Audit", t: "2m ago" },
                    { u: "Admin", a: "Updated Roles Scope", t: "14m ago" },
                  ].map((log, i) => (
                    <div key={i} style={{ display: "flex", gap: "8px", alignItems: "center", fontSize: "9px" }}>
                      <div style={{
                        width: "18px", height: "18px", borderRadius: "4px", background: "#2d3142",
                        display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: GOLD
                      }}>{log.u[0]}</div>
                      <div style={{ flex: 1 }}>
                        <p style={{ color: "#64748b", fontWeight: 600 }}>{log.a}</p>
                        <p style={{ fontSize: "7px", color: "#94a3b8" }}>{log.u} · {log.t}</p>
                      </div>
                      <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#5f8776" }} />
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            
            <Reveal delay={0.08}>
              <div style={{
                background: "#ffffff", border: "1px solid rgba(232, 184, 75, 0.15)", borderRadius: "14px", padding: "24px",
                display: "flex", flexDirection: "column", gap: "16px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.02)"
              }}>
                <div>
                  <span style={{ fontSize: "8px", color: GOLD, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>JWT Enforced</span>
                  <h4 style={{ fontSize: "15px", fontWeight: 800, color: CHARCOAL, marginTop: "4px", marginBottom: "12px" }}>Strong Token Security</h4>
                </div>

                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80px" }}>
                  <svg width="80" height="80" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="30" fill="none" stroke="#f1f5f9" strokeWidth="5" />
                    <circle cx="40" cy="40" r="30" fill="none" stroke={GOLD} strokeWidth="5" strokeDasharray="130 188" strokeLinecap="round" transform="rotate(-90 40 40)" />
                    <text x="40" y="44" fill={CHARCOAL} fontSize="11" fontWeight="800" textAnchor="middle">100%</text>
                  </svg>
                </div>
              </div>
            </Reveal>

            
            <Reveal delay={0.16}>
              <div style={{
                background: "#ffffff", border: "1px solid rgba(232, 184, 75, 0.15)", borderRadius: "14px", padding: "24px",
                display: "flex", flexDirection: "column", gap: "16px",
                position: "relative", overflow: "hidden",
                boxShadow: "0 4px 20px rgba(0,0,0,0.02)"
              }}>
                <div>
                  <span style={{ fontSize: "8px", color: GOLD, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>Compliance Standards</span>
                  <h4 style={{ fontSize: "15px", fontWeight: 800, color: CHARCOAL, marginTop: "4px", marginBottom: "12px" }}>Certified Frameworks</h4>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {["ISO 27001 Certified", "SOC 2 Type II Audited", "SEBI Data Aligned"].map((text) => (
                    <div key={text} style={{
                      display: "flex", alignItems: "center", gap: "8px",
                      background: "#f8f9fa", border: "1px solid #e2e8f0",
                      padding: "6px 12px", borderRadius: "6px", fontSize: "9px", color: "#64748b", fontWeight: 600
                    }}>
                      <span style={{ color: GOLD }}>✓</span> {text}
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

          </div>
        </div>
      </section>

      <div className="div" />

      
      <section className="sec" id="how-it-works" style={{ background: "#faf9f6" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div className="how-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "80px", alignItems: "center" }}>
            <div>
              <Reveal>
                <p className="sec-label">How It Works</p>
                <h2 className="sec-h2" style={{ marginBottom: "40px" }}>From circular to compliance in minutes</h2>
              </Reveal>
              <motion.div
                style={{ display: "flex", flexDirection: "column", gap: "26px" }}
                variants={stagger()}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-60px" }}
              >
                <Step n="01" title="Upload Compliance Documents" desc="Drop policy manuals, drafts, and historical reports. Our engine slices them into secure vector embeddings instantly." />
                <Step n="02" title="Active SEBI/RBI Pipeline mapping" desc="The engine cross-checks text segments against India's live circular feeds, tagging high/medium severity alerts." />
                <Step n="03" title="Grounded AI Citations Ask" desc="Search queries retrieve answers tied mathematically to document nodes, quoting precise chapter and page numbers." />
                <Step n="04" title="Immutable Audit Trail Export" desc="Export reports with absolute integrity signatures, logging user actions and verified nodes for external watchdogs." />
              </motion.div>
            </div>

            
            <Reveal delay={0.2}>
              <div style={{ background: "#ffffff", border: "1px solid rgba(232, 184, 75, 0.15)", borderRadius: "16px", padding: "22px", boxShadow: "0 10px 30px rgba(0,0,0,0.03)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
                  <p style={{ fontSize: "10px", fontWeight: 700, color: "#64748b", letterSpacing: "0.07em" }}>AUDIT TRAIL</p>
                  <span style={{
                    fontSize: "10px", fontWeight: 600, color: "#5f8776",
                    background: "rgba(95,135,118,0.07)", border: "1px solid rgba(95,135,118,0.12)",
                    padding: "2px 9px", borderRadius: "100px",
                  }}>● Live</span>
                </div>
                {[
                  { u: "Priya S.", a: "Uploaded SEBI LODR Circular", r: "Compliance Officer", t: "2 min ago" },
                  { u: "Rahul M.", a: "Ran gap analysis on AML Policy", r: "Auditor", t: "14 min ago" },
                  { u: "Admin", a: "Added new user — viewer role", r: "Admin", t: "1 hr ago" },
                  { u: "Anita K.", a: "Exported PDF compliance report", r: "Auditor", t: "3 hr ago" },
                  { u: "Priya S.", a: "Queried PMLA threshold limit", r: "Compliance Officer", t: "5 hr ago" },
                ].map((log, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.07, duration: 0.4 }}
                    style={{
                      display: "flex", gap: "11px", alignItems: "flex-start",
                      padding: "11px 0",
                      borderBottom: i < 4 ? "1px solid #f1f5f9" : "none",
                    }}
                  >
                    <div style={{
                      width: "26px", height: "26px", borderRadius: "7px", flexShrink: 0,
                      background: "#2d3142", border: `1px solid rgba(232,184,75,0.15)`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "11px", fontWeight: 800, color: GOLD,
                    }}>{log.u[0]}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "12px", color: CHARCOAL, marginBottom: "2px", fontWeight: 500 }}>{log.a}</p>
                      <p style={{ fontSize: "10px", color: "#64748b" }}>{log.u} · {log.r} · {log.t}</p>
                    </div>
                    <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#5f8776", flexShrink: 0, marginTop: "7px" }} />
                  </motion.div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <div className="div" />

      
      <section className="sec" id="security" style={{ background: "#f4f5f7" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <Reveal>
            <p className="sec-label">Security</p>
            <h2 className="sec-h2">Enterprise-grade security, built-in</h2>
            <p className="sec-sub" style={{ marginBottom: "48px", color: "#64748b" }}>
              Unalterable cryptographic chains, isolated environments, and micro-scoped clearance logs.
            </p>
          </Reveal>

          <motion.div
            style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px,1fr))", gap: "1px", background: "#cbd5e1", borderRadius: "14px", overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.02)" }}
            variants={stagger(0.07)}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
          >
            {[
              {
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e8b84b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                ),
                title: "JWT Authentication",
                desc: "Secure token-based auth with bcrypt password hashing and session management."
              },
              {
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e8b84b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ),
                title: "Immutable Audit Logs",
                desc: "Every user action timestamped and tamper-proof for regulatory evidence."
              },
              {
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e8b84b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                ),
                title: "Department Isolation",
                desc: "Documents scoped strictly by department and global visibility flags."
              },
              {
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e8b84b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                ),
                title: "Grounded AI Answers",
                desc: "Every AI response sourced exclusively from your indexed documents."
              },
            ].map(f => (
              <motion.div
                key={f.title}
                variants={fadeUp}
                style={{ background: "#ffffff", padding: "28px 22px", transition: "background 0.25s", cursor: "default" }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = "rgba(232,184,75,0.03)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = "#ffffff"; }}
              >
                <div style={{ marginBottom: "13px", color: "#e8b84b", display: "flex", alignItems: "center" }}>{f.icon}</div>
                <p style={{ fontSize: "14px", fontWeight: 700, color: CHARCOAL, marginBottom: "6px" }}>{f.title}</p>
                <p style={{ fontSize: "13px", color: "#64748b", lineHeight: 1.65 }}>{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <div className="div" />

      
      <section className="sec" style={{ background: "#faf9f6" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "52px" }}>
            <Reveal>
              <p className="sec-label">Interactive Platform Metrics</p>
              <h2 className="sec-h2">Simulate Compliance Efficiency Gains</h2>
              <p className="sec-sub" style={{ margin: "0 auto", color: "#64748b" }}>
                Select any platform capabilities below to dynamically analyze the historical efficiency, audit trail integrity, and warning precision metrics.
              </p>
            </Reveal>
          </div>

          <div className="checklist-split" style={{ display: "grid", gridTemplateColumns: "0.85fr 1.15fr", gap: "60px", alignItems: "center" }}>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {[
                { title: "Ask AI Compliance Index", desc: "View the accuracy of indexed SEBI/RBI Q&A answers." },
                { title: "Live Feed Severity Warnings", desc: "Trace severity spike intervals for critical regulations." },
                { title: "Gap Analysis Resolutions", desc: "Monitor efficiency index rates for policy mapping." },
                { title: "Immutable Audit Integrity", desc: "Verify cryptographic log hash accuracy scales." },
                { title: "Document Expiry Alerts", desc: "Analyze compliance manual shelf-life index rates." },
                { title: "Role-Based Scope Security", desc: "Review isolated department permission health." },
              ].map((item, idx) => {
                const isActive = activeTab === idx;
                return (
                  <motion.div
                    key={idx}
                    onClick={() => setActiveTab(idx)}
                    style={{
                      background: isActive ? "rgba(232, 184, 75, 0.05)" : "#ffffff",
                      border: isActive ? `1px solid ${GOLD}` : "1px solid #e2e8f0",
                      borderRadius: "10px",
                      padding: "16px",
                      cursor: "pointer",
                      transition: "border-color 0.2s, background 0.2s",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.01)",
                    }}
                    whileHover={{ y: -1 }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{
                        width: "6px", height: "6px", borderRadius: "50%",
                        background: isActive ? GOLD : "#94a3b8",
                        boxShadow: isActive ? `0 0 10px ${GOLD}` : "none",
                      }} />
                      <p style={{ fontSize: "13px", fontWeight: 700, color: isActive ? CHARCOAL : "#64748b" }}>
                        {item.title}
                      </p>
                    </div>
                    <p style={{ fontSize: "11px", color: "#64748b", marginTop: "4px", paddingLeft: "16px", lineHeight: 1.4 }}>
                      {item.desc}
                    </p>
                  </motion.div>
                );
              })}
            </div>

            
            <Reveal>
              <div style={{
                background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "18px", padding: "26px",
                boxShadow: "0 10px 40px rgba(0,0,0,0.04)", minHeight: "340px", display: "flex", flexDirection: "column"
              }}>
                <CandlestickChart tab={activeTab} />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <div className="div" />

      
      <section className="sec" style={{ background: "#f4f5f7" }}>
        <Reveal>
          <div style={{
            maxWidth: "700px", margin: "0 auto", textAlign: "center",
            background: "#ffffff", border: "1px solid rgba(232, 184, 75, 0.15)",
            borderRadius: "20px", padding: "clamp(48px,6vw,80px) clamp(24px,5vw,64px)",
            position: "relative", overflow: "hidden",
            boxShadow: "0 10px 40px rgba(0,0,0,0.03)"
          }}>
            
            <div style={{ width: "36px", height: "2px", background: GOLD, margin: "0 auto 24px", borderRadius: "1px" }} />

            <h2 style={{
              fontSize: "clamp(24px,3.8vw,36px)", fontWeight: 950,
              color: CHARCOAL, lineHeight: 1.18, letterSpacing: "-0.025em", marginBottom: "14px",
            }}>
              Ready to modernize<br />your compliance?
            </h2>
            <p style={{ fontSize: "13px", color: "#64748b", lineHeight: 1.7, marginBottom: "36px", maxWidth: "380px", margin: "0 auto 36px" }}>
              Join Indian financial corporations securing audits, mapping gaps, and chatting with compliance circulars using AuditFlow.
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
              <motion.div whileHover={{ y: -1.5 }} whileTap={{ scale: 0.98 }}>
                <Link href="/register" style={{
                  display: "inline-flex", alignItems: "center", gap: "8px",
                  fontSize: "13px", fontWeight: 700, color: "#ffffff",
                  textDecoration: "none", padding: "12px 26px", borderRadius: "8px",
                  background: CHARCOAL,
                  boxShadow: `0 4px 16px rgba(45, 49, 66, 0.15)`,
                }}>
                  Get Started Free
                </Link>
              </motion.div>
              <motion.div whileHover={{ y: -1.5 }} whileTap={{ scale: 0.98 }}>
                <Link href="/login" style={{
                  display: "inline-flex", alignItems: "center", gap: "8px",
                  fontSize: "13px", fontWeight: 600, color: "#64748b",
                  textDecoration: "none", padding: "12px 22px", borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                }}>
                  Sign In
                </Link>
              </motion.div>
            </div>
          </div>
        </Reveal>
      </section>

      
      <div className="div" />
      <footer style={{
        padding: "32px clamp(20px,5vw,96px)",
        display: "flex", justifyContent: "space-between",
        alignItems: "center", flexWrap: "wrap", gap: "16px",
        background: "#faf9f6"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          
          <svg width="105" height="28" viewBox="0 0 120 32" fill="none">
            <text x="4" y="23" fill={CHARCOAL} fontFamily="'Inter', system-ui, sans-serif" fontWeight="900" fontSize="20" letterSpacing="-0.03em">
              Audit<tspan fill="#e8b84b">Flow</tspan>
            </text>
            <path d="M 8 16 C 20 23, 28 23, 38 16 C 46 8, 56 10, 68 20 C 78 12, 88 9, 106 6" stroke="#e8b84b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
          <span style={{ fontSize: "12px", color: "#cbd5e1" }}>·</span>
          <span style={{ fontSize: "12px", color: "#94a3b8" }}>AI Compliance for Indian Finance</span>
        </div>
        <p style={{ fontSize: "11px", color: "#94a3b8" }}>© 2025 AuditFlow · Next.js · FastAPI · Llama 3.3</p>
      </footer>
    </>
  );
}

function Step({ n, title, desc }: { n: string; title: string; desc: string }) {
  return (
    <motion.div variants={fadeUp} style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
      <div style={{
        width: "34px", height: "34px", border: "1px solid #cbd5e1",
        borderRadius: "9px", display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "12px", fontWeight: 700, color: "#64748b", flexShrink: 0, marginTop: "2px",
        background: "#ffffff"
      }}>{n}</div>
      <div>
        <p style={{ fontSize: "14px", fontWeight: 700, color: CHARCOAL, marginBottom: "5px" }}>{title}</p>
        <p style={{ fontSize: "12px", color: "#64748b", lineHeight: 1.7 }}>{desc}</p>
      </div>
    </motion.div>
  );
}
