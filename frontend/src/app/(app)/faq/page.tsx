"use client";

import { HelpCircle, ShieldCheck, BookOpen, FileText, Settings, Key } from "lucide-react";
import { useState } from "react";

export default function FAQPage() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const faqs = [
    {
      q: "What is AuditFlow compliance intelligence?",
      a: "AuditFlow is a state of the art compliance intelligence platform tailored specifically for Indian financial institutions. It automates policy analysis, monitors live regulatory feeds, and parses documents against frameworks established by regulators including SEBI, RBI, FIU-IND, and Ind AS.",
      icon: ShieldCheck,
    },
    {
      q: "How does the AI chat grounding verify answers?",
      a: "Every answer generated in our Ask AI chat workspace is strictly grounded in the regulatory texts and compliance manuals indexed on your system. The AI extracts relevant chunks, displays precise compliance matching percentages, and provides direct links to the exact source document pages.",
      icon: BookOpen,
    },
    {
      q: "What file formats does the platform support?",
      a: "We support PDF, DOCX, TXT, and Markdown format files. Compliance officers and admins can upload manuals, define department level visibility scopes (accounting, legal, compliance, global), and instantly index them for system-wide intelligence.",
      icon: FileText,
    },
    {
      q: "How do I perform an automated Gap Analysis?",
      a: "Navigate to the Gap Analyzer page, select any indexed manual, and trigger a compliance audit. The system maps the policy text against active regulatory notifications to automatically detect omissions, consistency anomalies, and missing enforcement protocols.",
      icon: Settings,
    },
    {
      q: "How does the system ensure administrative audit security?",
      a: "All actions including document uploads, compliance reviews, and custom feed adjustments are permanently logged inside an immutable cryptographic audit log. This unalterable log ledger guarantees full accountability during internal and external audits.",
      icon: Key,
    },
  ];

  return (
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        background: "#faf9f6",
        padding: "36px 40px",
        boxSizing: "border-box",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
          <HelpCircle size={22} style={{ color: "#e8b84b" }} />
          <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#2d3142", letterSpacing: "-0.03em" }}>
            Frequently Asked Questions
          </h1>
        </div>
        <p style={{ color: "#64748b", fontSize: "14px", fontWeight: 500, marginBottom: "32px", lineHeight: 1.6 }}>
          Learn how AuditFlow indexes circulars, manages AI grounded retrievals, tracks administrative audits, and maintains secure compliance intelligence.
        </p>


        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          {faqs.map((faq, idx) => {
            const isHovered = hoveredIndex === idx;
            const Icon = faq.icon;

            return (
              <div
                key={idx}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{
                  background: "#ffffff",
                  border: isHovered ? "1px solid #e8b84b" : "1px solid rgba(232, 184, 75, 0.15)",
                  borderRadius: "20px",
                  padding: "24px 28px",
                  boxShadow: "0 8px 24px rgba(45, 49, 66, 0.01)",
                  transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                  cursor: "default",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "10px",
                      background: isHovered ? "rgba(232, 184, 75, 0.1)" : "rgba(232, 184, 75, 0.05)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: isHovered ? "#c49a2e" : "#e8b84b",
                      flexShrink: 0,
                      transition: "all 0.25s",
                    }}
                  >
                    <Icon size={18} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3
                      style={{
                        fontSize: "15px",
                        fontWeight: 800,
                        color: "#2d3142",
                        marginBottom: "8px",
                        lineHeight: 1.4,
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {faq.q}
                    </h3>
                    <p
                      style={{
                        fontSize: "13.5px",
                        color: "#475569",
                        lineHeight: 1.65,
                        fontWeight: 500,
                      }}
                    >
                      {faq.a}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>


        <div
          style={{
            marginTop: "48px",
            paddingTop: "24px",
            borderTop: "1.5px solid #f1f5f9",
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 500 }}>
            AuditFlow compliance intelligence system &middot; @2026 Copyrights Reserved &middot; Created by Daksh Chaurasia
          </p>
        </div>
      </div>
    </div>
  );
}
