"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import toast from "react-hot-toast";
import CustomSelect from "@/components/CustomSelect";
import {
  Shield,
  Search,
  RefreshCw,
  Loader2,
  User,
  LogIn,
  Trash2,
  Upload,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Activity,
} from "lucide-react";

interface AuditLog {
  id: string;
  user_id: string | null;
  username: string | null;
  conversation_id: string | null;
  action: string;
  query_text: string | null;
  status: string;
  retrieval_time_ms: number | null;
  generation_time_ms: number | null;
  total_chunks_retrieved: number | null;
  ip_address: string | null;
  error_message: string | null;
  timestamp: string;
}

const ACTION_ICONS: Record<string, any> = {
  login: LogIn,
  query: Upload,
  ingest_document: Upload,
  delete_document: Trash2,
  logout: LogIn,
};

const ACTION_COLORS: Record<string, string> = {
  login: "#4a607a",
  query: "#5f8776",
  ingest_document: "#c49a2e",
  delete_document: "#b35d5d",
  logout: "#4a607a",
};

const STATUS_BADGE: Record<string, { color: string; icon: any; label: string; bg: string }> = {
  success: { color: "#5f8776", icon: CheckCircle, label: "Success", bg: "rgba(95, 135, 118, 0.08)" },
  error: { color: "#b35d5d", icon: XCircle, label: "Error", bg: "rgba(179, 93, 93, 0.08)" },
  no_results: { color: "#c49a2e", icon: AlertTriangle, label: "No Results", bg: "rgba(196, 154, 46, 0.08)" },
};

function timeSince(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return new Date(date).toLocaleDateString();
}

export default function AuditTrailPage() {
  const { isAdmin } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterAction, setFilterAction] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;

  const load = async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(page * PAGE_SIZE),
      });
      if (filterAction) params.set("action", filterAction);
      if (filterStatus) params.set("status", filterStatus);
      const { data } = await api.get(`/admin/audit-logs?${params}`);
      setLogs(data);
    } catch {
      toast.error("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [page, filterAction, filterStatus]);

  const filtered = logs.filter((l) => {
    if (!search) return true;
    return (
      l.username?.toLowerCase().includes(search.toLowerCase()) ||
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.query_text?.toLowerCase().includes(search.toLowerCase()) ||
      l.ip_address?.includes(search)
    );
  });

  if (!isAdmin) {
    return (
      <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "16px", background: "#faf9f6" }}>
        <Shield size={48} style={{ color: "#94a3b8" }} />
        <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#2d3142" }}>Admin Access Required</h2>
        <p style={{ color: "#64748b", fontSize: "14px" }}>Only administrators can view the audit trail.</p>
      </div>
    );
  }

  const uniqueActions = Array.from(new Set(logs.map((l) => l.action)));

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: "32px 36px", background: "#faf9f6" }}>
      
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "24px", gap: "16px", flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <Activity size={20} style={{ color: "#e8b84b" }} />
            <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#2d3142", letterSpacing: "-0.03em" }}>Audit Trail</h1>
          </div>
          <p style={{ color: "#64748b", fontSize: "14px", fontWeight: 500 }}>
            Immutable log of every user action &middot; {logs.length} entries loaded.
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

      
      <div style={{ display: "flex", gap: "16px", marginBottom: "24px", flexWrap: "wrap" }}>
        {[
          { label: "Total Events", value: logs.length, color: "#4a607a", bg: "rgba(74, 96, 122, 0.08)" },
          { label: "Queries", value: logs.filter((l) => l.action === "query").length, color: "#5f8776", bg: "rgba(95, 135, 118, 0.08)" },
          { label: "Uploads", value: logs.filter((l) => l.action === "ingest_document").length, color: "#c49a2e", bg: "rgba(196, 154, 46, 0.08)" },
          { label: "Errors", value: logs.filter((l) => l.status === "error").length, color: "#b35d5d", bg: "rgba(179, 93, 93, 0.08)" },
        ].map(({ label, value, color, bg }) => (
          <div
            key={label}
            style={{
              padding: "20px 24px", display: "flex", alignItems: "center", gap: "16px", flex: "1 0 160px",
              background: "#ffffff", border: "1px solid rgba(232, 184, 75, 0.18)",
              borderRadius: "24px", boxShadow: "0 10px 30px rgba(45, 49, 66, 0.015)"
            }}
          >
            <div style={{ fontSize: "26px", fontWeight: 800, color }}>{value}</div>
            <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
          </div>
        ))}
      </div>

      
      <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: "1 1 240px" }}>
          <Search size={14} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
          <input
            style={{
              paddingLeft: "38px", fontSize: "13px", width: "100%",
              background: "#ffffff", border: "1px solid rgba(232, 184, 75, 0.18)",
              borderRadius: "12px", padding: "10px 14px 10px 38px",
              color: "#2d3142", outline: "none", fontWeight: 500
            }}
            placeholder="Search by user, query, IP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div style={{ flex: "0 0 170px" }}>
          <CustomSelect
            options={[{ value: "", label: "All Actions" }, ...uniqueActions.map(a => ({ value: a, label: a }))] }
            value={filterAction}
            onChange={(val) => { setFilterAction(val); setPage(0); }}
            style={{
              fontSize: "12px",
              fontWeight: 600,
            }}
          />
        </div>
        <div style={{ flex: "0 0 170px" }}>
          <CustomSelect
            options={[
              { value: "", label: "All Statuses" },
              { value: "success", label: "Success" },
              { value: "error", label: "Error" },
              { value: "no_results", label: "No Results" },
            ]}
            value={filterStatus}
            onChange={(val) => { setFilterStatus(val); setPage(0); }}
            style={{
              fontSize: "12px",
              fontWeight: 600,
            }}
          />
        </div>
      </div>

      
      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px", gap: "12px" }}>
          <Loader2 size={24} style={{ animation: "spin 0.8s linear infinite", color: "#e8b84b" }} />
          <span style={{ color: "#64748b", fontWeight: 500, fontSize: "13px" }}>Loading audit trail...</span>
        </div>
      ) : (
        <div style={{ position: "relative" }}>
          
          <div style={{ position: "absolute", left: "20px", top: 0, bottom: 0, width: "1.5px", background: "rgba(232, 184, 75, 0.18)" }} />

          <div style={{ paddingLeft: "48px", display: "flex", flexDirection: "column", gap: "4px" }}>
            {filtered.length === 0 ? (
              <div style={{ padding: "60px", textAlign: "center", color: "#64748b", fontWeight: 600, fontSize: "13px" }}>
                No audit events match your filters.
              </div>
            ) : (
              filtered.map((log) => {
                const ActionIcon = ACTION_ICONS[log.action] || Shield;
                const actionColor = ACTION_COLORS[log.action] || "#6366f1";
                const statusInfo = STATUS_BADGE[log.status] || STATUS_BADGE.success;
                const StatusIcon = statusInfo.icon;

                return (
                  <div
                    key={log.id}
                    style={{
                      background: "#ffffff",
                      border: "1px solid rgba(232, 184, 75, 0.18)",
                      borderRadius: "24px",
                      padding: "20px 24px",
                      position: "relative",
                      marginBottom: "8px",
                      boxShadow: "0 10px 30px rgba(45, 49, 66, 0.015)"
                    }}
                  >
                    
                    <div
                      style={{
                        position: "absolute",
                        left: "-40px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        background: `${actionColor}12`,
                        border: `1.5px solid ${actionColor}25`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 2,
                      }}
                    >
                      <ActionIcon size={13} style={{ color: actionColor }} />
                    </div>

                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", flexWrap: "wrap" }}>
                          <span
                            style={{
                              fontSize: "10px",
                              fontWeight: 700,
                              color: actionColor,
                              background: `${actionColor}08`,
                              padding: "2px 8px",
                              borderRadius: "6px",
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                              border: `1px solid ${actionColor}15`,
                            }}
                          >
                            {log.action.replace(/_/g, " ")}
                          </span>
                          <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#475569", fontWeight: 600 }}>
                            <User size={11} style={{ color: "#94a3b8" }} />
                            {log.username || log.user_id?.slice(0, 8) || "System"}
                          </div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              fontSize: "11px",
                              color: statusInfo.color,
                              background: statusInfo.bg,
                              padding: "1px 7px",
                              borderRadius: "10px",
                              border: `1px solid ${statusInfo.color}15`,
                              fontWeight: 600,
                            }}
                          >
                            <StatusIcon size={10} />
                            {statusInfo.label}
                          </div>
                        </div>

                        
                        {log.query_text && (
                          <p style={{
                            fontSize: "12.5px",
                            color: "#475569",
                            fontStyle: "italic",
                            marginTop: "6px",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            maxWidth: "500px",
                            fontWeight: 500,
                          }}>
                            &ldquo;{log.query_text}&rdquo;
                          </p>
                        )}

                        
                        {log.error_message && (
                          <div style={{ display: "flex", alignItems: "center", gap: "5px", color: "#b35d5d", fontSize: "11.5px", marginTop: "6px", fontWeight: 600 }}>
                            <AlertTriangle size={12} />
                            <span>{log.error_message}</span>
                          </div>
                        )}

                        
                        {(log.retrieval_time_ms || log.generation_time_ms) && (
                          <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                            {log.retrieval_time_ms && (
                              <span style={{ fontSize: "10.5px", color: "#94a3b8", fontWeight: 600 }}>
                                retrieval: {log.retrieval_time_ms.toFixed(0)}ms
                              </span>
                            )}
                            {log.generation_time_ms && (
                              <span style={{ fontSize: "10.5px", color: "#94a3b8", fontWeight: 600 }}>
                                generation: {log.generation_time_ms.toFixed(0)}ms
                              </span>
                            )}
                            {log.total_chunks_retrieved != null && (
                              <span style={{ fontSize: "10.5px", color: "#94a3b8", fontWeight: 600 }}>
                                {log.total_chunks_retrieved} chunks
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px", flexShrink: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "#94a3b8", fontWeight: 600 }}>
                          <Clock size={11} />
                          {timeSince(log.timestamp)}
                        </div>
                        {log.ip_address && (
                          <span style={{ fontSize: "10px", color: "#94a3b8", fontFamily: "monospace", fontWeight: 600 }}>
                            {log.ip_address}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      
      <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginTop: "32px" }}>
        <button
          disabled={page === 0}
          onClick={() => setPage((p) => p - 1)}
          style={{
            display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 700,
            background: "#ffffff", border: "1px solid rgba(232, 184, 75, 0.18)",
            borderRadius: "10px", color: "#2d3142", padding: "8px 16px",
            cursor: page === 0 ? "not-allowed" : "pointer", opacity: page === 0 ? 0.5 : 1,
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            if (page > 0) e.currentTarget.style.background = "#f4f5f7";
          }}
          onMouseLeave={(e) => {
            if (page > 0) e.currentTarget.style.background = "#ffffff";
          }}
        >
          &larr; Previous
        </button>
        <span style={{ padding: "6px 12px", fontSize: "13px", color: "#64748b", fontWeight: 700 }}>
          Page {page + 1}
        </span>
        <button
          disabled={logs.length < PAGE_SIZE}
          onClick={() => setPage((p) => p + 1)}
          style={{
            display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 700,
            background: "#ffffff", border: "1px solid rgba(232, 184, 75, 0.18)",
            borderRadius: "10px", color: "#2d3142", padding: "8px 16px",
            cursor: logs.length < PAGE_SIZE ? "not-allowed" : "pointer", opacity: logs.length < PAGE_SIZE ? 0.5 : 1,
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            if (logs.length >= PAGE_SIZE) e.currentTarget.style.background = "#f4f5f7";
          }}
          onMouseLeave={(e) => {
            if (logs.length >= PAGE_SIZE) e.currentTarget.style.background = "#ffffff";
          }}
        >
          Next &rarr;
        </button>
      </div>
    </div>
  );
}
