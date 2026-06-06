"use client";

import { useEffect, useState } from "react";
import { adminApi, authApi, AuditLog, SystemStats, UserInfo } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import CustomSelect from "@/components/CustomSelect";
import {
  Shield,
  Users,
  BarChart3,
  FileText,
  MessageSquare,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Database,
  Plus,
  Edit,
  Trash2,
  Lock,
  Loader2
} from "lucide-react";

type Tab = "overview" | "audit" | "users" | "verified_qa";

interface VerifiedQA {
  id: string;
  question: string;
  answer: string;
  department: string;
  created_at: string;
}

const ACTION_COLORS: Record<string, string> = {
  query: "#5f8776",
  login: "#4a607a",
  register: "#4a607a",
  ingest: "#c49a2e",
  delete: "#b35d5d",
};

export default function AdminPage() {
  const { isAdmin } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [verifiedQAs, setVerifiedQAs] = useState<VerifiedQA[]>([]);
  const [loading, setLoading] = useState(true);

  const [showQAForm, setShowQAForm] = useState(false);
  const [editingQA, setEditingQA] = useState<VerifiedQA | null>(null);
  const [qaForm, setQAForm] = useState({ question: "", answer: "", department: "global" });
  const [savingQA, setSavingQA] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) {
      router.replace("/dashboard");
      return;
    }
    load();
  }, [isAdmin]);

  const load = async () => {
    setLoading(true);
    try {
      const [statsRes, logsRes, usersRes, qaRes] = await Promise.all([
        adminApi.systemStats(),
        adminApi.auditLogs({ limit: 100 }),
        authApi.listUsers(),
        adminApi.listVerifiedQAs(),
      ]);
      setStats(statsRes.data);
      setLogs(logsRes.data);
      setUsers(usersRes.data);
      setVerifiedQAs(qaRes.data);
    } catch {
      toast.error("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  const updateRole = async (userId: string, role: string) => {
    try {
      await authApi.updateUserRole(userId, role);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
      toast.success("Role updated");
    } catch {
      toast.error("Failed to update role");
    }
  };

  const handleQASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qaForm.question || !qaForm.answer) {
      toast.error("Please fill in all QA fields");
      return;
    }
    setSavingQA(true);
    try {
      if (editingQA) {

        const { data } = await adminApi.updateVerifiedQA(editingQA.id, qaForm);
        setVerifiedQAs((prev) => prev.map((q) => (q.id === editingQA.id ? data : q)));
        toast.success("Verified QA updated!");
      } else {

        const { data } = await adminApi.createVerifiedQA(qaForm);
        setVerifiedQAs((prev) => [data, ...prev]);
        toast.success("Pre-approved QA registered!");
      }
      setShowQAForm(false);
      setEditingQA(null);
      setQAForm({ question: "", answer: "", department: "global" });
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to save verified QA");
    } finally {
      setSavingQA(false);
    }
  };

  const handleDeleteQA = async (id: string) => {
    if (!confirm("Are you sure you want to delete this pre-approved question response?")) return;
    try {
      await adminApi.deleteVerifiedQA(id);
      setVerifiedQAs((prev) => prev.filter((q) => q.id !== id));
      toast.success("Deleted successfully");
    } catch {
      toast.error("Failed to delete verified QA");
    }
  };

  const startEditQA = (qa: VerifiedQA) => {
    setEditingQA(qa);
    setQAForm({ question: qa.question, answer: qa.answer, department: qa.department });
    setShowQAForm(true);
  };

  const startCreateQA = () => {
    setEditingQA(null);
    setQAForm({ question: "", answer: "", department: "global" });
    setShowQAForm(true);
  };

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "verified_qa", label: "Verified QAs", icon: Shield },
    { id: "audit", label: "Audit Logs", icon: Activity },
    { id: "users", label: "Users", icon: Users },
  ];

  const ROLES = ["viewer", "accountant", "auditor", "compliance_officer", "admin"];
  const DEPTS = ["compliance", "accounting", "audit", "legal", "global"];

  const labelStyle: React.CSSProperties = {
    fontSize: "11px", color: "#2d3142", display: "block",
    marginBottom: "8px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em",
  };

  const getInputStyle = (name: string): React.CSSProperties => ({
    width: "100%",
    background: "#ffffff",
    border: focusedField === name ? "1px solid #e8b84b" : "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "11px 16px",
    color: "#2d3142",
    fontSize: "13px",
    fontWeight: 500,
    outline: "none",
    transition: "all 0.2s",
  });

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: "32px 36px", background: "#faf9f6" }}>
      
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#2d3142", letterSpacing: "-0.03em", display: "flex", alignItems: "center", gap: "10px" }}>
            <Shield size={20} style={{ color: "#e8b84b" }} />
            Admin Panel
          </h1>
          <p style={{ color: "#64748b", fontSize: "14px", fontWeight: 500, marginTop: "4px" }}>
            System management, pre-approved verified response overrides, and compliance logs
          </p>
        </div>
        <button
          onClick={load}
          style={{
            display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: 700,
            background: "#ffffff", border: "1px solid rgba(232, 184, 75, 0.18)",
            borderRadius: "10px", color: "#2d3142", padding: "8px 16px", cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#f4f5f7")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#ffffff")}
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      
      <div
        style={{
          display: "flex",
          gap: "6px",
          background: "#f4f5f7",
          padding: "4px",
          borderRadius: "100px",
          width: "fit-content",
          marginBottom: "24px",
        }}
      >
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "7px",
                padding: "8px 20px",
                borderRadius: "100px",
                border: "none",
                fontSize: "13px",
                fontWeight: active ? 700 : 600,
                color: active ? "#ffffff" : "#64748b",
                background: active ? "#2d3142" : "transparent",
                boxShadow: active ? "0 4px 10px rgba(45, 49, 66, 0.15)" : "none",
                cursor: "pointer",
                transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                outline: "none",
                fontFamily: "Inter, sans-serif",
              }}
            >
              <Icon size={14} /> {label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div style={{ padding: "80px", textAlign: "center" }}>
          <Loader2 size={24} style={{ animation: "spin 0.8s linear infinite", color: "#e8b84b", margin: "0 auto 12px" }} />
          <p style={{ color: "#64748b", fontSize: "13px", fontWeight: 500 }}>Loading admin diagnostics...</p>
        </div>
      ) : (
        <>
          
          {tab === "overview" && stats && (
            <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
              <style>{`
                @keyframes ping {
                  0% { transform: scale(1); opacity: 1; }
                  70%, 100% { transform: scale(2.2); opacity: 0; }
                }
              `}</style>
              
              
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid rgba(232, 184, 75, 0.15)",
                  borderRadius: "20px",
                  padding: "16px 24px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "16px",
                  boxShadow: "0 4px 20px rgba(45, 49, 66, 0.01)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ position: "relative", width: "10px", height: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ position: "absolute", width: "10px", height: "10px", borderRadius: "50%", background: "#5f8776", opacity: 0.75, animation: "ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite" }} />
                    <span style={{ position: "relative", width: "6px", height: "6px", borderRadius: "50%", background: "#5f8776" }} />
                  </div>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#2d3142" }}>System status: Fully Operational</span>
                </div>
                <div style={{ display: "flex", gap: "16px", fontSize: "12px", color: "#64748b", fontWeight: 500 }}>
                  <span>DB: <strong style={{ color: "#2d3142" }}>SQLite (Connected)</strong></span>
                  <span>•</span>
                  <span>Vector Index: <strong style={{ color: "#2d3142" }}>ChromaDB (Active)</strong></span>
                  <span>•</span>
                  <span>Inference: <strong style={{ color: "#2d3142" }}>Llama 3 (Ready)</strong></span>
                </div>
              </div>

              
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 380px",
                  gap: "28px",
                  alignItems: "start",
                }}
              >
                
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  <h3 style={{ fontSize: "12px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>
                    Core Performance Metrics
                  </h3>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px" }}>
                    {[
                      {
                        icon: Users,
                        label: "Total Registered Users",
                        value: stats.users.total,
                        sub: `${stats.users.active} active sessions this week`,
                        color: "#4a607a",
                        tag: `${Math.round((stats.users.active / (stats.users.total || 1)) * 100)}% activity`
                      },
                      {
                        icon: Database,
                        label: "Knowledge Vectors",
                        value: stats.vector_store.total_chunks,
                        sub: stats.vector_store.collection_name,
                        color: "#c49a2e",
                        tag: "ChromaDB storage"
                      },
                      {
                        icon: FileText,
                        label: "Compliance Documents",
                        value: stats.documents.total,
                        sub: `${stats.documents.global} global SOPs, ${stats.documents.department_specific || 0} departmental`,
                        color: "#5f8776",
                        tag: "Index covered"
                      },
                      {
                        icon: Activity,
                        label: "Cognitive Queries",
                        value: stats.queries.total,
                        sub: `Queries resolved successfully`,
                        color: "#567c87",
                        tag: `${stats.queries.success_rate}% success rate`
                      }
                    ].map((card) => {
                      const Icon = card.icon;
                      return (
                        <div
                          key={card.label}
                          style={{
                            background: "#ffffff",
                            border: "1px solid rgba(232, 184, 75, 0.15)",
                            borderRadius: "20px",
                            padding: "24px",
                            boxShadow: "0 4px 20px rgba(45, 49, 66, 0.01)",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            gap: "16px",
                            transition: "all 0.2s",
                            minHeight: "180px",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div>
                              <span style={{ fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                                {card.label}
                              </span>
                              <div style={{ fontSize: "28px", fontWeight: 800, color: "#2d3142", marginTop: "4px", letterSpacing: "-0.02em" }}>
                                {card.value}
                              </div>
                            </div>
                            <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: `${card.color}10`, border: `1px solid ${card.color}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <Icon size={18} style={{ color: card.color }} />
                            </div>
                          </div>
                          
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", flexWrap: "wrap", marginTop: "auto" }}>
                            <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 500, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {card.sub}
                            </span>
                            <span
                              style={{
                                fontSize: "9px",
                                fontWeight: 700,
                                color: card.color,
                                background: `${card.color}08`,
                                border: `1px solid ${card.color}15`,
                                padding: "2px 8px",
                                borderRadius: "6px",
                                textTransform: "uppercase",
                                letterSpacing: "0.03em",
                                flexShrink: 0
                              }}
                            >
                              {card.tag}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  <h3 style={{ fontSize: "12px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>
                    Security & Health
                  </h3>

                  <div
                    style={{
                      background: "#ffffff",
                      border: "1px solid rgba(232, 184, 75, 0.15)",
                      borderRadius: "24px",
                      padding: "28px",
                      boxShadow: "0 10px 30px rgba(45, 49, 66, 0.015)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "20px",
                    }}
                  >
                    
                    <div style={{ display: "flex", gap: "12px", alignItems: "center", background: "rgba(95, 135, 118, 0.06)", border: "1px solid rgba(95, 135, 118, 0.15)", padding: "14px 18px", borderRadius: "16px" }}>
                      <Lock size={18} style={{ color: "#5f8776" }} />
                      <div>
                        <div style={{ fontSize: "12px", fontWeight: 800, color: "#5f8776", textTransform: "uppercase", letterSpacing: "0.02em" }}>Security Shield Active</div>
                        <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 500, marginTop: "2px" }}>JWT Tokens + bcrypt filters</div>
                      </div>
                    </div>

                    <div style={{ height: "1px", background: "rgba(232, 184, 75, 0.08)" }} />

                    
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                      {[
                        { label: "Vector Database status", sub: "ChromaDB allocation", value: "Optimal", color: "#c49a2e" },
                        { label: "System Success Rate", sub: "Resolved vs failed queries", value: `${stats.queries.success_rate}%`, color: "#5f8776" },
                        { label: "Gold QAs Caching", sub: "Pre-approved overrides", value: `${verifiedQAs.length} loaded`, color: "#8e6e88" },
                      ].map((item) => (
                        <div
                          key={item.label}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            background: "#faf9f6",
                            border: "1px solid rgba(232, 184, 75, 0.08)",
                            padding: "12px 16px",
                            borderRadius: "14px",
                          }}
                        >
                          <div>
                            <div style={{ fontSize: "12px", fontWeight: 700, color: "#2d3142" }}>{item.label}</div>
                            <div style={{ fontSize: "10px", color: "#64748b", fontWeight: 500, marginTop: "2px" }}>{item.sub}</div>
                          </div>
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: 700,
                              color: item.color,
                              background: `${item.color}08`,
                              border: `1px solid ${item.color}15`,
                              padding: "4px 10px",
                              borderRadius: "8px",
                              textTransform: "uppercase",
                              letterSpacing: "0.03em"
                            }}
                          >
                            {item.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          
          {tab === "verified_qa" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              
              
              {showQAForm && (
                <div
                  style={{
                    background: "#ffffff",
                    border: "1px solid rgba(232, 184, 75, 0.18)",
                    borderRadius: "24px",
                    padding: "28px",
                    boxShadow: "0 10px 30px rgba(45, 49, 66, 0.015)",
                  }}
                >
                  <h2 style={{ fontSize: "16px", fontWeight: 800, marginBottom: "20px", color: "#2d3142", letterSpacing: "-0.01em" }}>
                    {editingQA ? "Edit Gold Standard QA Override" : "Register Pre-Approved Verified Response"}
                  </h2>
                  <form onSubmit={handleQASubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div>
                      <label style={labelStyle}>Employee Query / Question *</label>
                      <input
                        type="text"
                        style={getInputStyle("question")}
                        onFocus={() => setFocusedField("question")}
                        onBlur={() => setFocusedField(null)}
                        placeholder="e.g. What is the emergency number for direct compliance?"
                        value={qaForm.question}
                        onChange={(e) => setQAForm({ ...qaForm, question: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Pre-Approved Factual Answer (Skipped Inference) *</label>
                      <textarea
                        placeholder="Provide the exact pre-approved answer..."
                        style={{ ...getInputStyle("answer"), fontFamily: "Inter, sans-serif", resize: "vertical" }}
                        onFocus={() => setFocusedField("answer")}
                        onBlur={() => setFocusedField(null)}
                        value={qaForm.answer}
                        onChange={(e) => setQAForm({ ...qaForm, answer: e.target.value })}
                        rows={4}
                        required
                      />
                    </div>
                    
                    <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "flex-end" }}>
                      <div style={{ flex: 1, minWidth: "150px" }}>
                        <label style={labelStyle}>Department Visibility</label>
                        <CustomSelect
                          options={DEPTS.map((d) => ({ value: d, label: d }))}
                          value={qaForm.department}
                          onChange={(val) => setQAForm({ ...qaForm, department: val })}
                        />
                      </div>

                      <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", flex: 1, minWidth: "200px" }}>
                        <button
                          type="button"
                          onClick={() => { setShowQAForm(false); setEditingQA(null); }}
                          style={{
                            background: "#ffffff", border: "1px solid #e2e8f0",
                            borderRadius: "12px", padding: "10px 18px", fontSize: "13px",
                            fontWeight: 600, color: "#2d3142", cursor: "pointer",
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={savingQA}
                          style={{
                            background: "linear-gradient(135deg, #e8b84b 0%, #c49a2e 100%)",
                            border: "none", borderRadius: "12px", padding: "10px 20px",
                            color: "#ffffff", fontSize: "13px", fontWeight: 700,
                            cursor: savingQA ? "not-allowed" : "pointer",
                            display: "flex", alignItems: "center", gap: "6px",
                            boxShadow: "0 4px 10px rgba(232, 184, 75, 0.15)",
                          }}
                        >
                          {savingQA && <Loader2 size={14} style={{ animation: "spin 0.8s linear infinite" }} />}
                          <span>Save Override</span>
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              )}

              
              <div style={{ background: "#ffffff", border: "1px solid rgba(232, 184, 75, 0.18)", borderRadius: "24px", boxShadow: "0 10px 30px rgba(45, 49, 66, 0.015)", overflow: "hidden" }}>
                <div style={{ padding: "18px 24px", borderBottom: "1px solid rgba(232, 184, 75, 0.08)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <h2 style={{ fontSize: "16px", fontWeight: 800, color: "#2d3142", letterSpacing: "-0.01em" }}>Active Verified QAs</h2>
                  {!showQAForm && (
                    <button
                      onClick={startCreateQA}
                      style={{
                        display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", fontSize: "12px", fontWeight: 700,
                        background: "linear-gradient(135deg, #e8b84b 0%, #c49a2e 100%)",
                        border: "none", borderRadius: "10px", color: "#ffffff",
                        cursor: "pointer", boxShadow: "0 4px 10px rgba(232, 184, 75, 0.15)",
                        transition: "transform 0.15s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = "none")}
                    >
                      <Plus size={14} /> Add QA Override
                    </button>
                  )}
                </div>
                
                {verifiedQAs.length === 0 ? (
                  <p style={{ padding: "40px", textAlign: "center", color: "#64748b", fontSize: "13px", fontWeight: 500 }}>
                    No verified overrides registered. Click "Add QA Override" to configure pre-approved compliance answers.
                  </p>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table className="af-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ background: "#f4f5f7" }}>
                          <th style={{ padding: "14px 18px", fontSize: "11px", fontWeight: 700, color: "#2d3142", borderBottom: "1px solid rgba(232, 184, 75, 0.08)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Question</th>
                          <th style={{ padding: "14px 18px", fontSize: "11px", fontWeight: 700, color: "#2d3142", borderBottom: "1px solid rgba(232, 184, 75, 0.08)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Pre-Approved Grounded Answer</th>
                          <th style={{ padding: "14px 18px", fontSize: "11px", fontWeight: 700, color: "#2d3142", borderBottom: "1px solid rgba(232, 184, 75, 0.08)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Scope</th>
                          <th style={{ padding: "14px 18px", fontSize: "11px", fontWeight: 700, color: "#2d3142", borderBottom: "1px solid rgba(232, 184, 75, 0.08)", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "right" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {verifiedQAs.map((qa) => (
                          <tr key={qa.id}>
                            <td style={{ fontWeight: 700, fontSize: "13px", color: "#2d3142", padding: "14px 20px", maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", borderBottom: "1px solid rgba(232, 184, 75, 0.08)" }} title={qa.question}>
                              {qa.question}
                            </td>
                            <td style={{ color: "#475569", fontSize: "12.5px", fontWeight: 500, padding: "14px 20px", maxWidth: "300px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", borderBottom: "1px solid rgba(232, 184, 75, 0.08)" }} title={qa.answer}>
                              {qa.answer}
                            </td>
                            <td style={{ padding: "14px 20px", borderBottom: "1px solid rgba(232, 184, 75, 0.08)" }}>
                              <span style={{ fontSize: "10px", fontWeight: 700, color: "#64748b", background: "rgba(100, 116, 139, 0.08)", padding: "2px 8px", borderRadius: "6px", border: "1px solid rgba(100,116,139,0.18)" }}>
                                {qa.department}
                              </span>
                            </td>
                            <td style={{ textAlign: "right", padding: "14px 20px", borderBottom: "1px solid rgba(232, 184, 75, 0.18)" }}>
                              <div style={{ display: "inline-flex", gap: "8px" }}>
                                <button
                                  onClick={() => startEditQA(qa)}
                                  style={{
                                    background: "#ffffff", border: "1px solid rgba(232, 184, 75, 0.18)",
                                    borderRadius: "8px", color: "#64748b", padding: "6px 10px", cursor: "pointer",
                                    transition: "all 0.15s",
                                  }}
                                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#e8b84b"; e.currentTarget.style.color = "#e8b84b"; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(232, 184, 75, 0.18)"; e.currentTarget.style.color = "#64748b"; }}
                                >
                                  <Edit size={12} />
                                </button>
                                <button
                                  onClick={() => handleDeleteQA(qa.id)}
                                  style={{
                                    background: "#ffffff", border: "1px solid rgba(239, 68, 68, 0.2)",
                                    borderRadius: "8px", color: "#ef4444", padding: "6px 10px", cursor: "pointer",
                                    transition: "all 0.15s",
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239, 68, 68, 0.05)")}
                                  onMouseLeave={(e) => (e.currentTarget.style.background = "#ffffff")}
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          
          {tab === "audit" && (
            <div style={{ background: "#ffffff", border: "1px solid rgba(232, 184, 75, 0.18)", borderRadius: "24px", boxShadow: "0 10px 30px rgba(45, 49, 66, 0.015)", overflow: "hidden" }}>
              <div style={{ padding: "18px 24px", borderBottom: "1px solid rgba(232, 184, 75, 0.08)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h2 style={{ fontSize: "16px", fontWeight: 800, color: "#2d3142", letterSpacing: "-0.01em" }}>Administrative Action Logs</h2>
                <span style={{ fontSize: "10px", fontWeight: 700, color: "#c49a2e", background: "rgba(232, 184, 75, 0.08)", padding: "2px 8px", borderRadius: "20px", border: "1px solid rgba(232, 184, 75, 0.2)" }}>
                  {logs.length} logged events
                </span>
              </div>
              <div style={{ overflowX: "auto", maxHeight: "600px", overflowY: "auto" }}>
                <table className="af-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead style={{ position: "sticky", top: 0, background: "#f4f5f7", zIndex: 1 }}>
                    <tr>
                      <th style={{ padding: "14px 18px", fontSize: "11px", fontWeight: 700, color: "#2d3142", borderBottom: "1px solid rgba(232, 184, 75, 0.08)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Timestamp</th>
                      <th style={{ padding: "14px 18px", fontSize: "11px", fontWeight: 700, color: "#2d3142", borderBottom: "1px solid rgba(232, 184, 75, 0.08)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Action</th>
                      <th style={{ padding: "14px 18px", fontSize: "11px", fontWeight: 700, color: "#2d3142", borderBottom: "1px solid rgba(232, 184, 75, 0.08)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Query</th>
                      <th style={{ padding: "14px 18px", fontSize: "11px", fontWeight: 700, color: "#2d3142", borderBottom: "1px solid rgba(232, 184, 75, 0.08)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Status</th>
                      <th style={{ padding: "14px 18px", fontSize: "11px", fontWeight: 700, color: "#2d3142", borderBottom: "1px solid rgba(232, 184, 75, 0.08)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Retrieval</th>
                      <th style={{ padding: "14px 18px", fontSize: "11px", fontWeight: 700, color: "#2d3142", borderBottom: "1px solid rgba(232, 184, 75, 0.08)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Generation</th>
                      <th style={{ padding: "14px 18px", fontSize: "11px", fontWeight: 700, color: "#2d3142", borderBottom: "1px solid rgba(232, 184, 75, 0.08)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Chunks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id}>
                        <td style={{ fontSize: "11px", whiteSpace: "nowrap", color: "#475569", fontWeight: 600, padding: "14px 20px", borderBottom: "1px solid rgba(232, 184, 75, 0.08)" }}>
                           {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td style={{ padding: "14px 20px", borderBottom: "1px solid rgba(232, 184, 75, 0.08)" }}>
                           <span style={{
                             fontSize: "9px", fontWeight: 700,
                             color: ACTION_COLORS[log.action] || "#6366f1",
                             background: `${ACTION_COLORS[log.action] || "#6366f1"}08`,
                             padding: "2px 8px", borderRadius: "6px",
                             border: `1px solid ${ACTION_COLORS[log.action] || "#6366f1"}15`,
                             textTransform: "uppercase", letterSpacing: "0.05em"
                           }}>
                             {log.action}
                           </span>
                        </td>
                        <td
                           style={{
                             maxWidth: "220px",
                             overflow: "hidden",
                             textOverflow: "ellipsis",
                             whiteSpace: "nowrap",
                             fontSize: "12px",
                             color: "#475569",
                             fontWeight: 500,
                             padding: "14px 20px",
                             borderBottom: "1px solid rgba(232, 184, 75, 0.08)"
                           }}
                           title={log.query_text || ""}
                        >
                           {log.query_text || <span style={{ color: "#94a3b8" }}>&mdash;</span>}
                        </td>
                         <td style={{ padding: "14px 20px", borderBottom: "1px solid rgba(232, 184, 75, 0.08)" }}>
                           {log.status === "success" ? (
                             <CheckCircle2 size={14} style={{ color: "#5f8776" }} />
                           ) : (
                             <XCircle size={14} style={{ color: "#b35d5d" }} />
                           )}
                         </td>
                        <td style={{ fontSize: "12px", color: "#475569", fontWeight: 600, padding: "14px 20px", borderBottom: "1px solid rgba(232, 184, 75, 0.08)" }}>
                           {log.retrieval_time_ms != null ? `${log.retrieval_time_ms.toFixed(0)}ms` : <span style={{ color: "#94a3b8" }}>&mdash;</span>}
                        </td>
                        <td style={{ fontSize: "12px", color: "#475569", fontWeight: 600, padding: "14px 20px", borderBottom: "1px solid rgba(232, 184, 75, 0.08)" }}>
                           {log.generation_time_ms != null ? `${log.generation_time_ms.toFixed(0)}ms` : <span style={{ color: "#94a3b8" }}>&mdash;</span>}
                        </td>
                        <td style={{ fontSize: "12px", color: "#475569", fontWeight: 600, padding: "14px 20px", borderBottom: "1px solid rgba(232, 184, 75, 0.08)" }}>
                           {log.total_chunks_retrieved ?? <span style={{ color: "#94a3b8" }}>&mdash;</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          
          {tab === "users" && (
            <div style={{ background: "#ffffff", border: "1px solid rgba(232, 184, 75, 0.18)", borderRadius: "24px", boxShadow: "0 10px 30px rgba(45, 49, 66, 0.015)", overflow: "hidden" }}>
              <div style={{ padding: "18px 24px", borderBottom: "1px solid rgba(232, 184, 75, 0.08)" }}>
                <h2 style={{ fontSize: "16px", fontWeight: 800, color: "#2d3142", letterSpacing: "-0.01em" }}>User Account Authorizations</h2>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table className="af-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f4f5f7" }}>
                      <th style={{ padding: "14px 18px", fontSize: "11px", fontWeight: 700, color: "#2d3142", borderBottom: "1px solid rgba(232, 184, 75, 0.08)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Identity</th>
                      <th style={{ padding: "14px 18px", fontSize: "11px", fontWeight: 700, color: "#2d3142", borderBottom: "1px solid rgba(232, 184, 75, 0.08)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Department</th>
                      <th style={{ padding: "14px 18px", fontSize: "11px", fontWeight: 700, color: "#2d3142", borderBottom: "1px solid rgba(232, 184, 75, 0.08)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Authorized Role</th>
                      <th style={{ padding: "14px 18px", fontSize: "11px", fontWeight: 700, color: "#2d3142", borderBottom: "1px solid rgba(232, 184, 75, 0.08)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Status</th>
                      <th style={{ padding: "14px 18px", fontSize: "11px", fontWeight: 700, color: "#2d3142", borderBottom: "1px solid rgba(232, 184, 75, 0.08)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Joined</th>
                      <th style={{ padding: "14px 18px", fontSize: "11px", fontWeight: 700, color: "#2d3142", borderBottom: "1px solid rgba(232, 184, 75, 0.08)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Modify Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td style={{ padding: "14px 20px", borderBottom: "1px solid rgba(232, 184, 75, 0.08)" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <div
                              style={{
                                width: "32px",
                                height: "32px",
                                borderRadius: "8px",
                                background: "linear-gradient(135deg, #e8b84b 0%, #c49a2e 100%)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "12px",
                                fontWeight: 700,
                                color: "white",
                                flexShrink: 0,
                                boxShadow: "0 2px 6px rgba(232, 184, 75, 0.2)",
                              }}
                            >
                              {u.username[0].toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: "13px", color: "#2d3142" }}>
                                {u.full_name || u.username}
                              </div>
                              <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 500 }}>{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "14px 20px", borderBottom: "1px solid rgba(232, 184, 75, 0.08)" }}>
                          <span style={{ fontSize: "10px", fontWeight: 700, color: "#64748b", background: "rgba(100, 116, 139, 0.08)", padding: "2px 8px", borderRadius: "6px", border: "1px solid rgba(100,116,139,0.15)", textTransform: "uppercase" }}>
                            {u.department}
                          </span>
                        </td>
                        <td style={{ padding: "14px 20px", borderBottom: "1px solid rgba(232, 184, 75, 0.08)" }}>
                          <span
                             style={{
                               fontSize: "10px",
                               fontWeight: 700,
                               color: u.role === "admin" ? "#8e6e88" : u.role === "compliance_officer" ? "#5f8776" : "#64748b",
                               background: u.role === "admin" ? "rgba(142, 110, 136, 0.08)" : u.role === "compliance_officer" ? "rgba(95, 133, 118, 0.08)" : "rgba(100, 116, 139, 0.08)",
                               padding: "2px 8px", borderRadius: "6px",
                               border: `1px solid ${u.role === "admin" ? "rgba(142, 110, 136, 0.15)" : u.role === "compliance_officer" ? "rgba(95, 133, 118, 0.15)" : "rgba(100, 116, 139, 0.15)"}`,
                               textTransform: "uppercase"
                             }}
                           >
                             {u.role}
                           </span>
                        </td>
                        <td style={{ padding: "14px 20px", borderBottom: "1px solid rgba(232, 184, 75, 0.08)" }}>
                          {u.is_active ? (
                             <CheckCircle2 size={14} style={{ color: "#5f8776" }} />
                           ) : (
                             <XCircle size={14} style={{ color: "#b35d5d" }} />
                           )}
                        </td>
                        <td style={{ fontSize: "12px", color: "#475569", fontWeight: 600, padding: "14px 20px", borderBottom: "1px solid rgba(232, 184, 75, 0.08)" }}>
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                        <td style={{ padding: "14px 20px", borderBottom: "1px solid rgba(232, 184, 75, 0.08)" }}>
                          <div style={{ width: "160px" }}>
                            <CustomSelect
                              options={ROLES.map((r) => ({ value: r, label: r }))}
                              value={u.role}
                              onChange={(val) => updateRole(u.id, val)}
                              style={{
                                fontSize: "12px",
                                fontWeight: 600,
                              }}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
