"use client";

import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import CustomSelect from "@/components/CustomSelect";
import {
  FileUp,
  Loader2,
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  FileText,
  Sparkles,
  Download,
  ArrowRight,
  Info,
  ShieldCheck,
} from "lucide-react";

interface GapItem {
  id: string;
  new_rule: string;
  internal_policy: string;
  status: "matching" | "conflict" | "gap";
  explanation: string;
  recommendation: string;
}

interface GapAnalysisResponse {
  filename: string;
  gap_items: GapItem[];
  total_findings: number;
  conflicts_found: number;
  missing_found: number;
}

export default function GapAnalyzerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [department, setDepartment] = useState("compliance");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<GapAnalysisResponse | null>(null);

  const exportReport = async (results: GapAnalysisResponse) => {
    try {
      const { jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();

      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, pageW, 24, "F");
      doc.setTextColor(99, 102, 241);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("AuditFlow — Gap Analysis Report", 14, 15);
      doc.setTextColor(148, 163, 184);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`Generated: ${new Date().toLocaleString()}  ·  File: ${results.filename}`, pageW - 14, 15, { align: "right" });

      doc.setTextColor(30, 41, 59);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(`Total Findings: ${results.total_findings}   |   Conflicts: ${results.conflicts_found}   |   Gaps: ${results.missing_found}   |   Matching: ${results.total_findings - results.conflicts_found - results.missing_found}`, 14, 34);

      autoTable(doc, {
        startY: 40,
        head: [["#", "New Rule / Regulation", "Internal Policy", "Status", "Explanation", "Recommendation"]],
        body: results.gap_items.map((item, i) => [
          String(i + 1),
          item.new_rule,
          item.internal_policy,
          item.status.toUpperCase(),
          item.explanation,
          item.recommendation,
        ]),
        styles: { fontSize: 8, cellPadding: 3, overflow: "linebreak" },
        headStyles: { fillColor: [15, 23, 42], textColor: [99, 102, 241], fontStyle: "bold" },
        columnStyles: {
          0: { cellWidth: 8 },
          1: { cellWidth: 45 },
          2: { cellWidth: 45 },
          3: { cellWidth: 22 },
          4: { cellWidth: 60 },
          5: { cellWidth: 60 },
        },
        didParseCell: (data) => {
          if (data.column.index === 3 && data.section === "body") {
            const val = String(data.cell.raw).toLowerCase();
            if (val === "conflict") data.cell.styles.textColor = [239, 68, 68];
            else if (val === "gap") data.cell.styles.textColor = [245, 158, 11];
            else data.cell.styles.textColor = [16, 185, 129];
          }
        },
      });

      doc.save(`GapAnalysis-${results.filename.replace(/\.[^.]+$/, "")}-${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success("Report exported as PDF");
    } catch (err) {
      console.error(err);
      toast.error("PDF export failed");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error("Please select a policy amendment file to upload");
      return;
    }

    const form = new FormData();
    form.append("file", file);
    form.append("department", department);

    setLoading(true);
    setResults(null);

    try {
      const token = localStorage.getItem("access_token") || "";
      const { data } = await axios.post<GapAnalysisResponse>(
        "/api/v1/compare/gap-analysis",
        form,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
          timeout: 180000,
        }
      );
      setResults(data);
      toast.success("Gap analysis complete!");
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      const status = err.response?.status;
      const networkErr = err.code === "ERR_NETWORK" || err.message?.includes("Network Error");
      const isTimeout = err.code === "ECONNABORTED" || err.message?.includes("timeout");
      let msg = "Gap analysis failed.";
      if (detail) {
        msg = typeof detail === "string" ? detail : JSON.stringify(detail);
      } else if (networkErr) {
        msg = "Cannot reach the backend. Make sure it is running on port 8000.";
      } else if (isTimeout) {
        msg = "Request timed out — try a shorter document (under 10 pages).";
      } else if (status === 400) {
        msg = "Cannot extract text from this file. Use a text-based PDF, DOCX, or TXT (not a scanned image).";
      } else if (status === 401) {
        msg = "Session expired. Please log out and log back in.";
      } else if (status === 429) {
        msg = "AI rate limit hit. Please wait 60 seconds and try again.";
      } else if (status === 503) {
        msg = "GROQ API key not configured on the server.";
      } else if (err.message) {
        msg = "Gap analysis error: " + err.message;
      }
      toast.error(msg, { duration: 10000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "32px 36px", height: "100%", overflowY: "auto", background: "#faf9f6" }}>

      <style>{`
        .gap-container {
          display: flex;
          gap: 28px;
          align-items: flex-start;
          width: 100%;
        }
        .gap-left-workspace {
          flex: 0 0 380px;
          position: sticky;
          top: 0;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .gap-right-findings {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        @media (max-width: 950px) {
          .gap-container {
            flex-direction: column;
            align-items: stretch;
          }
          .gap-left-workspace {
            flex: none;
            position: relative;
            top: auto;
            width: 100%;
          }
        }
        .clause-mirror-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        @media (max-width: 640px) {
          .clause-mirror-container {
            grid-template-columns: 1fr;
          }
        }
        .dropzone-container {
          border: 2px dashed rgba(232, 184, 75, 0.15);
          border-radius: 16px;
          padding: 32px 20px;
          text-align: center;
          background: rgba(232, 184, 75, 0.01);
          cursor: pointer;
          position: relative;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .dropzone-container:hover {
          border-color: #e8b84b;
          background: rgba(232, 184, 75, 0.03);
          box-shadow: 0 6px 20px rgba(232, 184, 75, 0.04);
        }
      `}</style>


      <div style={{ marginBottom: "28px" }} className="fade-up">
        <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#2d3142", marginBottom: "6px", letterSpacing: "-0.02em" }}>
          Policy Gap Analyzer
        </h1>
        <p style={{ color: "#64748b", fontSize: "14px", fontWeight: 500 }}>
          Compare incoming regulatory amendments against your current internal SOPs section by section using Gemini 2.5 Flash.
        </p>
      </div>

      <div className="gap-container">


        <div className="gap-left-workspace">


          <div
            style={{
              background: "#ffffff",
              border: "1px solid rgba(232, 184, 75, 0.18)",
              borderRadius: "24px",
              padding: "24px",
              boxShadow: "0 10px 30px rgba(45, 49, 66, 0.015)",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <div style={{ borderBottom: "1px solid rgba(232, 184, 75, 0.08)", paddingBottom: "12px" }}>
              <h2 style={{ fontSize: "15px", fontWeight: 800, color: "#2d3142", letterSpacing: "-0.01em" }}>
                Upload Amendment Document
              </h2>
              <p style={{ fontSize: "11px", color: "#64748b", fontWeight: 500, marginTop: "2px" }}>
                Select a compliance circular, rulebook or text file.
              </p>
            </div>

            <form onSubmit={handleUpload} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

              <div
                className="dropzone-container"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    setFile(e.dataTransfer.files[0]);
                  }
                }}
              >
                <input
                  type="file"
                  accept=".pdf,.docx,.txt,.md"
                  onChange={handleFileChange}
                  style={{
                    position: "absolute",
                    inset: 0,
                    opacity: 0,
                    cursor: "pointer",
                    width: "100%",
                    height: "100%",
                  }}
                />
                <FileUp size={32} style={{ color: "#e8b84b", marginBottom: "10px", margin: "0 auto 10px" }} />
                <p style={{ fontSize: "12px", fontWeight: 700, color: file ? "#c49a2e" : "#475569", marginBottom: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {file ? file.name : "Drag & drop file or browse"}
                </p>
                <p style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 500 }}>
                  PDF, DOCX, TXT, or MD (Max 50MB)
                </p>
              </div>


              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#64748b", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                  Target SOP Department
                </label>
                <CustomSelect
                  options={[
                    { value: "compliance", label: "Compliance SOPs" },
                    { value: "accounting", label: "Accounting SOPs" },
                    { value: "audit", label: "Audit Manuals" },
                    { value: "legal", label: "Legal Frameworks" },
                  ]}
                  value={department}
                  onChange={(val) => setDepartment(val)}
                />
              </div>


              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  fontSize: "13px",
                  fontWeight: 700,
                  border: "none",
                  borderRadius: "12px",
                  color: "#ffffff",
                  background: "linear-gradient(135deg, #e8b84b 0%, #c49a2e 100%)",
                  cursor: loading ? "not-allowed" : "pointer",
                  boxShadow: loading ? "none" : "0 4px 10px rgba(232, 184, 75, 0.15)",
                  opacity: loading ? 0.6 : 1,
                  transition: "all 0.2s ease",
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={15} style={{ animation: "spin 0.8s linear infinite" }} />
                    Comparing SOPs...
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    Run Gap Comparison
                  </>
                )}
              </button>
            </form>
          </div>


          <div
            style={{
              background: "rgba(232, 184, 75, 0.04)",
              border: "1px solid rgba(232, 184, 75, 0.18)",
              borderRadius: "16px",
              padding: "16px",
              fontSize: "11px",
              color: "#64748b",
              display: "flex",
              alignItems: "flex-start",
              gap: "8px",
              fontWeight: 500,
              lineHeight: 1.5,
            }}
          >
            <HelpCircle size={14} style={{ color: "#e8b84b", flexShrink: 0, marginTop: "1px" }} />
            <span>
              <strong>Note:</strong> We analyze the regulation section by section against indexed corporate policies in real-time. Matches are logged into your immutable ledger.
            </span>
          </div>


          {results && (
            <div
              style={{
                background: "#ffffff",
                border: "1px solid rgba(232, 184, 75, 0.18)",
                borderRadius: "24px",
                padding: "20px",
                boxShadow: "0 10px 30px rgba(45, 49, 66, 0.015)",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <h3 style={{ fontSize: "12px", fontWeight: 800, color: "#2d3142", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid rgba(232, 184, 75, 0.08)", paddingBottom: "8px" }}>
                Alignment Summary
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {[
                  { label: "Total Clauses Audited", val: results.total_findings, icon: FileText, color: "#c49a2e", bg: "rgba(232, 184, 75, 0.06)" },
                  { label: "Critical Conflicts", val: results.conflicts_found, icon: ShieldAlert, color: "#b35d5d", bg: "rgba(179, 93, 93, 0.06)" },
                  { label: "Missing Clauses / Gaps", val: results.missing_found, icon: AlertTriangle, color: "#c49a2e", bg: "rgba(196, 154, 46, 0.06)" },
                  { label: "Matching / Aligned", val: results.total_findings - results.conflicts_found - results.missing_found, icon: CheckCircle, color: "#5f8776", bg: "rgba(95, 135, 118, 0.06)" }
                ].map((stat) => (
                  <div
                    key={stat.label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 14px",
                      borderRadius: "12px",
                      background: stat.bg,
                      border: "1px solid rgba(232, 184, 75, 0.04)"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <stat.icon size={14} style={{ color: stat.color }} />
                      <span style={{ fontSize: "11px", color: "#475569", fontWeight: 600 }}>{stat.label}</span>
                    </div>
                    <span style={{ fontSize: "14px", fontWeight: 800, color: "#2d3142" }}>{stat.val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>


        <div className="gap-right-findings">


          {loading && (
            <div
              style={{
                background: "#ffffff",
                border: "1px solid rgba(232, 184, 75, 0.18)",
                borderRadius: "24px",
                padding: "60px 40px",
                textAlign: "center",
                boxShadow: "0 10px 30px rgba(45, 49, 66, 0.015)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "400px",
              }}
            >
              <div style={{ position: "relative", marginBottom: "20px" }}>
                <div style={{ width: "64px", height: "64px", border: "4px solid rgba(232, 184, 75, 0.1)", borderTopColor: "#e8b84b", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                <Sparkles size={20} style={{ color: "#e8b84b", position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }} />
              </div>
              <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#2d3142", marginBottom: "8px", letterSpacing: "-0.01em" }}>
                Deep Compliance Gap Analysis Active
              </h3>
              <p style={{ fontSize: "13px", color: "#64748b", fontWeight: 500, maxWidth: "480px", lineHeight: 1.6, margin: "0 auto" }}>
                We are parsing the circular, running a deep vector similarity lookup against your internal manuals database, and performing section-by-section comparison.
              </p>


              <div style={{ marginTop: "32px", width: "100%", maxWidth: "340px", display: "flex", flexDirection: "column", gap: "12px", textAlign: "left" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "12px" }}>
                  <CheckCircle size={14} style={{ color: "#5f8776" }} />
                  <span style={{ color: "#475569", fontWeight: 600 }}>Parsed and chunked document structure</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "12px" }}>
                  <Loader2 size={14} style={{ color: "#e8b84b", animation: "spin 1.2s linear infinite" }} />
                  <span style={{ color: "#2d3142", fontWeight: 700 }}>Performing vector cross-mapping...</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "12px" }}>
                  <div style={{ width: "14px", height: "14px", borderRadius: "50%", border: "1.5px solid #cbd5e1" }} />
                  <span style={{ color: "#94a3b8", fontWeight: 500 }}>Generating actionable remediation checklist</span>
                </div>
              </div>
            </div>
          )}


          {!loading && !results && (
            <div
              style={{
                background: "#ffffff",
                border: "1px solid rgba(232, 184, 75, 0.18)",
                borderRadius: "24px",
                padding: "60px 40px",
                textAlign: "center",
                boxShadow: "0 10px 30px rgba(45, 49, 66, 0.015)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "400px",
              }}
            >
              <div style={{ width: "64px", height: "64px", borderRadius: "20px", background: "rgba(232, 184, 75, 0.06)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px", border: "1px solid rgba(232, 184, 75, 0.12)" }}>
                <ShieldCheck size={28} style={{ color: "#e8b84b", margin: "auto" }} />
              </div>
              <h3 style={{ fontSize: "17px", fontWeight: 800, color: "#2d3142", marginBottom: "8px", letterSpacing: "-0.01em" }}>
                Workspace Ready
              </h3>
              <p style={{ fontSize: "13px", color: "#64748b", fontWeight: 500, maxWidth: "420px", lineHeight: 1.6, margin: "0 auto" }}>
                Upload a regulatory amendment file on the left and select the target compliance SOP department to trigger a line by line automated audit.
              </p>

              <div style={{ display: "flex", gap: "24px", marginTop: "32px", width: "100%", maxWidth: "520px", flexWrap: "wrap" }}>
                {[
                  { title: "1. Upload File", desc: "PDF, DOCX, or TXT rules" },
                  { title: "2. Vector Map", desc: "Compare against internal manuals" },
                  { title: "3. Action Plan", desc: "Generate bulletproof checklist" }
                ].map((step, i) => (
                  <div key={i} style={{ flex: 1, minWidth: "140px", textAlign: "left", background: "#f8fafc", padding: "14px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                    <div style={{ fontSize: "10px", fontWeight: 800, color: "#e8b84b", textTransform: "uppercase", marginBottom: "4px" }}>Step 0{i + 1}</div>
                    <div style={{ fontSize: "12px", fontWeight: 700, color: "#2d3142" }}>{step.title}</div>
                    <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>{step.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}


          {results && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>


              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#2d3142", letterSpacing: "-0.01em" }}>
                    Auditor Clause-by-Clause Findings
                  </h3>
                  <p style={{ fontSize: "11px", color: "#64748b", fontWeight: 500 }}>
                    Comparing circular items against active internal compliance code.
                  </p>
                </div>

                <button
                  onClick={() => exportReport(results)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "#ffffff",
                    border: "1px solid rgba(232, 184, 75, 0.18)",
                    borderRadius: "10px",
                    padding: "8px 16px",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#2d3142",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f4f5f7")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "#ffffff")}
                >
                  <Download size={13} /> Export PDF Report
                </button>
              </div>


              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {results.gap_items.map((item) => {
                  const statusInfo = {
                    matching: { border: "#5f8776", bg: "rgba(95, 135, 118, 0.06)", text: "#5f8776", label: "● Aligned" },
                    conflict: { border: "#b35d5d", bg: "rgba(179, 93, 93, 0.06)", text: "#b35d5d", label: "● Conflict" },
                    gap: { border: "#c49a2e", bg: "rgba(196, 154, 46, 0.06)", text: "#c49a2e", label: "● Gap Detected" }
                  }[item.status] || { border: "#64748b", bg: "#f4f5f7", text: "#64748b", label: "● Unknown" };

                  return (
                    <div
                      key={item.id}
                      style={{
                        background: "#ffffff",
                        border: "1px solid rgba(232, 184, 75, 0.15)",
                        borderRadius: "20px",
                        boxShadow: "0 4px 16px rgba(45, 49, 66, 0.01)",
                        overflow: "hidden",
                        display: "flex",
                        flexDirection: "column",
                        position: "relative",
                      }}
                    >

                      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "4px", background: statusInfo.border }} />


                      <div
                        style={{
                          padding: "16px 20px",
                          borderBottom: "1px solid rgba(232, 184, 75, 0.06)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          flexWrap: "wrap",
                          gap: "8px",
                          background: "#fcfcfa"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span
                            style={{
                              fontSize: "10px",
                              fontWeight: 800,
                              color: statusInfo.text,
                              background: statusInfo.bg,
                              padding: "4px 10px",
                              borderRadius: "8px",
                              textTransform: "uppercase",
                              letterSpacing: "0.03em"
                            }}
                          >
                            {statusInfo.label}
                          </span>
                          <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600 }}>
                            Clause Identifier: {item.id}
                          </span>
                        </div>
                      </div>


                      <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "18px" }}>

                        <div className="clause-mirror-container">

                          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            <span style={{ fontSize: "10px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                              Incoming Regulatory Clause
                            </span>
                            <div
                              style={{
                                padding: "14px",
                                borderRadius: "12px",
                                border: "1px solid rgba(232, 184, 75, 0.1)",
                                background: "#faf9f6",
                                color: "#2d3142",
                                fontSize: "12.5px",
                                fontWeight: 500,
                                lineHeight: 1.5,
                                flex: 1,
                              }}
                            >
                              {item.new_rule}
                            </div>
                          </div>


                          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            <span style={{ fontSize: "10px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                              Matched Internal Manual Policy
                            </span>
                            <div
                              style={{
                                padding: "14px",
                                borderRadius: "12px",
                                border: "1px solid rgba(232, 184, 75, 0.1)",
                                background: "#faf9f6",
                                color: "#2d3142",
                                fontSize: "12.5px",
                                fontWeight: 500,
                                lineHeight: 1.5,
                                flex: 1,
                              }}
                            >
                              {item.internal_policy || <em style={{ color: "#94a3b8" }}>No matching policy manual found inside this department directory.</em>}
                            </div>
                          </div>
                        </div>


                        <div
                          style={{
                            background: "rgba(232, 184, 75, 0.02)",
                            border: "1px solid rgba(232, 184, 75, 0.08)",
                            borderRadius: "14px",
                            padding: "16px",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                            <Sparkles size={12} style={{ color: "#e8b84b" }} />
                            <h4 style={{ fontSize: "11px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.02em" }}>
                              AI Compliance Diagnostics
                            </h4>
                          </div>
                          <p style={{ fontSize: "12.5px", color: "#475569", lineHeight: 1.6, fontWeight: 500 }}>
                            {item.explanation}
                          </p>
                        </div>


                        {item.status !== "matching" && (
                          <div
                            style={{
                              borderLeft: "3px solid #e8b84b",
                              background: "rgba(232, 184, 75, 0.03)",
                              padding: "16px",
                              borderRadius: "0 12px 12px 0",
                            }}
                          >
                            <h4 style={{ fontSize: "11px", fontWeight: 800, color: "#c49a2e", textTransform: "uppercase", letterSpacing: "0.03em", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                              <Info size={12} />
                              SOP Remediation Action Items
                            </h4>
                            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                              {item.recommendation.split(/[●\n]/).map((step, idx) => {
                                const clean = step.trim().replace(/^-\s*/, "");
                                if (!clean) return null;
                                return (
                                  <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "12px", color: "#2d3142", fontWeight: 500, lineHeight: 1.4 }}>
                                    <span style={{ color: "#e8b84b", flexShrink: 0, marginTop: "2px" }}>●</span>
                                    <span>{clean}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
