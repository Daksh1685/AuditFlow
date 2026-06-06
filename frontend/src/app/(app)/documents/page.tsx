"use client";

import React, { useEffect, useState } from "react";
import { documentsApi, DocumentInfo, api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import toast from "react-hot-toast";
import { signalDataUpdated, useRefetchOnFocus } from "@/hooks/useRefetchOnFocus";
import CustomSelect from "@/components/CustomSelect";
import {
  FileText,
  Trash2,
  Search,
  RefreshCw,
  Database,
  Globe,
  Lock,
  Tag,
  Calendar,
  AlertTriangle,
  Clock,
  History,
  Edit3,
  Check,
  X,
  Filter,
  LayoutGrid,
  List,
  Loader2,
} from "lucide-react";

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function ExpiryBadge({ expiresAt }: { expiresAt: string | null }) {
  if (!expiresAt) return null;
  const now = Date.now();
  const exp = new Date(expiresAt).getTime();
  const daysLeft = Math.ceil((exp - now) / 86400000);
  const isExpired = daysLeft < 0;
  const isSoon = daysLeft >= 0 && daysLeft <= 30;

  if (!isExpired && !isSoon) return null;

  const color = isExpired ? "#b35d5d" : "#c49a2e";
  const label = isExpired ? "Expired" : `${daysLeft}d left`;

  return (
    <span
      style={{
        fontSize: "10px",
        fontWeight: 700,
        color,
        background: `${color}15`,
        border: `1px solid ${color}30`,
        padding: "2px 8px",
        borderRadius: "8px",
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
      }}
    >
      <AlertTriangle size={10} />
      {label}
    </span>
  );
}

function TagChip({ tag, onRemove }: { tag: string; onRemove?: () => void }) {
  return (
    <span
      style={{
        fontSize: "10px",
        color: "#c49a2e",
        background: "rgba(232, 184, 75, 0.06)",
        border: "1px solid rgba(232, 184, 75, 0.15)",
        padding: "2px 8px",
        borderRadius: "10px",
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        whiteSpace: "nowrap",
        fontWeight: 600,
      }}
    >
      {tag}
      {onRemove && (
        <button
          onClick={onRemove}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "#c49a2e", display: "flex" }}
        >
          <X size={9} />
        </button>
      )}
    </span>
  );
}

function MetadataEditor({
  doc,
  onSave,
  onCancel,
  isGrid = false,
}: {
  doc: DocumentInfo;
  onSave: (updates: { tags?: string; expires_at?: string; description?: string }) => Promise<void>;
  onCancel: () => void;
  isGrid?: boolean;
}) {
  const [tags, setTags] = useState(doc.tags || "");
  const [expiresAt, setExpiresAt] = useState(
    doc.expires_at ? new Date(doc.expires_at).toISOString().slice(0, 10) : ""
  );
  const [description, setDescription] = useState(doc.description || "");
  const [saving, setSaving] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    await onSave({
      tags: tags || undefined,
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      description: description || undefined,
    });
    setSaving(false);
  };

  const getInputStyle = (field: string): React.CSSProperties => ({
    width: "100%",
    background: "#ffffff",
    border: focusedField === field ? "1px solid #e8b84b" : "1px solid rgba(232, 184, 75, 0.15)",
    borderRadius: "8px",
    padding: "8px 12px",
    color: "#2d3142",
    fontSize: "12px",
    fontFamily: "Inter, sans-serif",
    outline: "none",
    transition: "all 0.2s",
  });

  const fields = (
    <div style={{ display: "flex", gap: "12px", flexDirection: isGrid ? "column" : "row", flexWrap: "wrap", width: "100%" }}>
      <div style={isGrid ? { width: "100%" } : { flex: "1 1 180px" }}>
        <label style={{ fontSize: "10px", color: "#64748b", fontWeight: 700, marginBottom: "4px", display: "block", textTransform: "uppercase", letterSpacing: "0.02em" }}>
          Tags (comma-separated)
        </label>
        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          onFocus={() => setFocusedField("tags")}
          onBlur={() => setFocusedField(null)}
          placeholder="aml, sox, ifrs, ..."
          style={getInputStyle("tags")}
        />
      </div>
      <div style={isGrid ? { width: "100%" } : { flex: "0 0 160px" }}>
        <label style={{ fontSize: "10px", color: "#64748b", fontWeight: 700, marginBottom: "4px", display: "block", textTransform: "uppercase", letterSpacing: "0.02em" }}>
          Review / Expiry Date
        </label>
        <input
          type="date"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
          onFocus={() => setFocusedField("expiry")}
          onBlur={() => setFocusedField(null)}
          style={getInputStyle("expiry")}
        />
      </div>
      <div style={isGrid ? { width: "100%" } : { flex: "2 1 220px" }}>
        <label style={{ fontSize: "10px", color: "#64748b", fontWeight: 700, marginBottom: "4px", display: "block", textTransform: "uppercase", letterSpacing: "0.02em" }}>
          Description
        </label>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onFocus={() => setFocusedField("desc")}
          onBlur={() => setFocusedField(null)}
          placeholder="Brief description..."
          style={getInputStyle("desc")}
        />
      </div>
    </div>
  );

  const actions = (
    <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          fontSize: "12px",
          padding: "8px 16px",
          background: "linear-gradient(135deg, #e8b84b 0%, #c49a2e 100%)",
          border: "none",
          borderRadius: "8px",
          color: "#ffffff",
          fontWeight: 700,
          cursor: saving ? "not-allowed" : "pointer",
          boxShadow: "0 4px 10px rgba(232, 184, 75, 0.15)",
        }}
      >
        <Check size={12} />
        {saving ? "Saving..." : "Save"}
      </button>
      <button
        onClick={onCancel}
        style={{
          fontSize: "12px",
          padding: "8px 16px",
          background: "#ffffff",
          border: "1px solid rgba(232, 184, 75, 0.18)",
          borderRadius: "8px",
          color: "#2d3142",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Cancel
      </button>
    </div>
  );

  if (isGrid) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%", boxSizing: "border-box" }}>
        {fields}
        {actions}
      </div>
    );
  }

  return (
    <tr>
      <td colSpan={10} style={{ padding: "10px 18px" }}>
        <div
          style={{
            background: "#faf9f6",
            border: "1px solid rgba(232, 184, 75, 0.18)",
            borderRadius: "16px",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            width: "100%",
            boxSizing: "border-box"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(232, 184, 75, 0.08)", paddingBottom: "8px", marginBottom: "4px" }}>
            <span style={{ fontSize: "10.5px", fontWeight: 800, color: "#c49a2e", textTransform: "uppercase", letterSpacing: "0.03em" }}>
              Edit Metadata — {doc.filename}
            </span>
            <button
              onClick={onCancel}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                color: "#64748b",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={14} />
            </button>
          </div>
          {fields}
          {actions}
        </div>
      </td>
    </tr>
  );
}

export default function DocumentsPage() {
  const { isAdmin, user } = useAuth();
  const AUTHORITY_ROLES = ["admin", "compliance_officer", "auditor"];
  const isAuthority = user ? AUTHORITY_ROLES.includes(user.role) : false;
  
  const [docs, setDocs] = useState<DocumentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [filterTag, setFilterTag] = useState("");
  const [stats, setStats] = useState<{ total_documents: number; total_chunks: number } | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");

  const load = async () => {
    setLoading(true);
    try {
      const [docsRes, statsRes] = await Promise.all([
        documentsApi.list(),
        documentsApi.stats(),
      ]);
      setDocs(docsRes.data);
      setStats(statsRes.data);
    } catch {
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [user?.id]); // reload per user
  useRefetchOnFocus(load, [user?.id]);

  const deleteDoc = async (docId: string, filename: string) => {
    if (!window.confirm(`Delete "${filename}"? This will remove all its vectors from ChromaDB.`)) return;
    setDeleting(docId);
    try {
      await documentsApi.delete(docId);
      setDocs((prev) => prev.filter((d) => d.doc_id !== docId));
      signalDataUpdated();
      toast.success(`${filename} deleted`);
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeleting(null);
    }
  };

  const saveMetadata = async (docId: string, updates: any) => {
    try {
      const { data } = await api.patch(`/documents/${docId}/metadata`, updates);
      setDocs((prev) => prev.map((d) => (d.doc_id === docId ? { ...d, ...data } : d)));
      setEditingId(null);
      toast.success("Metadata saved");
    } catch {
      toast.error("Failed to save metadata");
    }
  };

  const allTags = Array.from(
    new Set(docs.flatMap((d) => (d.tags || "").split(",").map((t) => t.trim()).filter(Boolean)))
  );
  const allDepts = Array.from(new Set(docs.map((d) => d.department)));

  const filtered = docs.filter((d) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      d.filename.toLowerCase().includes(q) ||
      d.department.toLowerCase().includes(q) ||
      (d.tags || "").toLowerCase().includes(q) ||
      (d.description || "").toLowerCase().includes(q);
    const matchDept = !filterDept || d.department === filterDept;
    const matchTag = !filterTag || (d.tags || "").split(",").map((t) => t.trim()).includes(filterTag);
    return matchSearch && matchDept && matchTag;
  });

  const expiringSoon = docs.filter((d) => {
    if (!d.expires_at) return false;
    const daysLeft = Math.ceil((new Date(d.expires_at).getTime() - Date.now()) / 86400000);
    return daysLeft >= 0 && daysLeft <= 30;
  });

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: "32px 36px", background: "#faf9f6" }}>
      
      <style>{`
        .docs-grid-layout {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
          gap: 20px;
          align-items: start;
        }
        .view-pill-btn {
          padding: 8px 14px;
          border-radius: 8px;
          border: 1px solid rgba(232, 184, 75, 0.18);
          background: #ffffff;
          color: #64748b;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 600;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .view-pill-btn.active {
          background: #2d3142;
          color: #ffffff;
          border-color: #2d3142;
          box-shadow: 0 4px 10px rgba(45, 49, 66, 0.15);
        }
      `}</style>

      
      {expiringSoon.length > 0 && (
        <div
          style={{
            background: "rgba(196, 154, 46, 0.08)",
            border: "1px solid rgba(196, 154, 46, 0.3)",
            borderRadius: "12px",
            padding: "12px 18px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "20px",
            fontSize: "13px",
            fontWeight: 500,
          }}
        >
          <AlertTriangle size={16} style={{ color: "#c49a2e", flexShrink: 0 }} />
          <span style={{ color: "#2d3142" }}>
            <strong>{expiringSoon.length} document{expiringSoon.length > 1 ? "s" : ""}</strong> are expiring within 30 days and need review:&nbsp;
            {expiringSoon.map((d) => d.filename).join(", ")}
          </span>
        </div>
      )}

      
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#2d3142", marginBottom: "4px", letterSpacing: "-0.02em" }}>
            Documents Hub
          </h1>
          <p style={{ color: "#64748b", fontSize: "14px", fontWeight: 500 }}>
            Manage indexed compliance manuals, tag visibility, vector allocations and document reviews.
          </p>
        </div>
        
        <div style={{ display: "flex", gap: "10px" }}>
          
          <div style={{ display: "flex", background: "#f1f3f5", borderRadius: "10px", padding: "4px" }}>
            <button
              onClick={() => setViewMode("grid")}
              className={`view-pill-btn ${viewMode === "grid" ? "active" : ""}`}
              style={{ border: "none", borderRadius: "8px" }}
            >
              <LayoutGrid size={13} />
              Grid View
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`view-pill-btn ${viewMode === "list" ? "active" : ""}`}
              style={{ border: "none", borderRadius: "8px" }}
            >
              <List size={13} />
              List View
            </button>
          </div>

          <button
            onClick={load}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "#ffffff",
              border: "1px solid rgba(232, 184, 75, 0.18)",
              borderRadius: "10px",
              padding: "8px 16px",
              fontSize: "13px",
              fontWeight: 700,
              color: "#2d3142",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#f4f5f7")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#ffffff")}
          >
            <RefreshCw size={13} /> Sync
          </button>
        </div>
      </div>

      
      {stats && (
        <div style={{ display: "flex", gap: "16px", marginBottom: "24px", flexWrap: "wrap" }}>
          {[
            { icon: FileText, label: "Indexed Manuals", value: stats.total_documents, color: "#e8b84b" },
            { icon: Database, label: "Total Vectors Chunks", value: stats.total_chunks, color: "#5f8776" },
            { icon: Globe, label: "Global Coverage", value: docs.filter((d) => d.is_global).length, color: "#e8b84b" },
            { icon: Lock, label: "Departmental SOPs", value: docs.filter((d) => !d.is_global).length, color: "#64748b" },
            { icon: AlertTriangle, label: "Expiring Alerts", value: expiringSoon.length, color: "#b35d5d" },
          ].map(({ icon: Icon, label, value, color }) => (
            <div
              key={label}
              style={{
                background: "#ffffff",
                border: "1px solid rgba(232, 184, 75, 0.15)",
                borderRadius: "16px",
                padding: "16px 20px",
                display: "flex",
                alignItems: "center",
                gap: "14px",
                flex: "1 0 170px",
                boxShadow: "0 4px 12px rgba(45, 49, 66, 0.015)",
              }}
            >
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: `${color}10`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon size={18} style={{ color }} />
              </div>
              <div>
                <div style={{ fontSize: "20px", fontWeight: 800, color: "#2d3142", lineHeight: 1.1 }}>{value}</div>
                <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 600, marginTop: "2px" }}>{label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      
      <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: "1 1 240px" }}>
          <Search size={15} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
          <input
            style={{
              width: "100%",
              background: "#ffffff",
              border: "1px solid rgba(232, 184, 75, 0.15)",
              borderRadius: "10px",
              padding: "10px 14px 10px 36px",
              color: "#2d3142",
              fontSize: "13px",
              fontFamily: "Inter, sans-serif",
              fontWeight: 500,
              outline: "none",
            }}
            placeholder="Search filenames, categories, manual descriptions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div style={{ flex: "0 0 180px" }}>
          <CustomSelect
            options={[{ value: "", label: "All Departments" }, ...allDepts.map(d => ({ value: d, label: d.charAt(0).toUpperCase() + d.slice(1) }))] }
            value={filterDept}
            onChange={(val) => setFilterDept(val)}
            style={{
              fontSize: "13px",
              fontWeight: 500,
            }}
          />
        </div>
        <div style={{ flex: "0 0 180px" }}>
          <CustomSelect
            options={[{ value: "", label: "All Tag Classifications" }, ...allTags.map(t => ({ value: t, label: t }))] }
            value={filterTag}
            onChange={(val) => setFilterTag(val)}
            style={{
              fontSize: "13px",
              fontWeight: 500,
            }}
          />
        </div>
      </div>

      
      {allTags.length > 0 && (
        <div style={{ display: "flex", gap: "6px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
          <Tag size={12} style={{ color: "#64748b" }} />
          {allTags.slice(0, 15).map((tag) => {
            const active = filterTag === tag;
            return (
              <button
                key={tag}
                onClick={() => setFilterTag(active ? "" : tag)}
                style={{
                  background: active ? "rgba(232, 184, 75, 0.08)" : "#ffffff",
                  border: `1px solid ${active ? "#e8b84b" : "rgba(232, 184, 75, 0.15)"}`,
                  color: active ? "#c49a2e" : "#64748b",
                  borderRadius: "12px",
                  padding: "3px 12px",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "Inter, sans-serif",
                  transition: "all 0.15s",
                }}
              >
                {tag}
              </button>
            );
          })}
        </div>
      )}

      
      {viewMode === "grid" && !loading && (
        filtered.length === 0 ? (
          <div style={{ padding: "60px", background: "#ffffff", borderRadius: "24px", border: "1px solid rgba(232, 184, 75, 0.18)", textAlign: "center" }}>
            <FileText size={36} style={{ color: "#94a3b8", margin: "0 auto 12px" }} />
            <p style={{ color: "#64748b", fontSize: "14px", fontWeight: 500 }}>
              {search || filterDept || filterTag ? "No documents match your filters" : "No documents indexed yet"}
            </p>
          </div>
        ) : (
          <div className="docs-grid-layout">
            {filtered.map((doc) => {
              const isEditing = editingId === doc.doc_id;

              const ext = doc.file_type.toLowerCase();
              const extColor = {
                pdf: { bg: "rgba(179, 93, 93, 0.06)", text: "#b35d5d", border: "rgba(179, 93, 93, 0.12)" },
                txt: { bg: "rgba(100, 116, 139, 0.06)", text: "#475569", border: "rgba(100, 116, 139, 0.12)" },
                docx: { bg: "rgba(74, 96, 122, 0.06)", text: "#4a607a", border: "rgba(74, 96, 122, 0.12)" },
              }[ext] || { bg: "rgba(232, 184, 75, 0.06)", text: "#c49a2e", border: "rgba(232, 184, 75, 0.12)" };

              const scopeColor = doc.is_global 
                ? { bg: "rgba(95, 135, 118, 0.06)", text: "#5f8776", border: "rgba(95, 135, 118, 0.12)" }
                : { bg: "rgba(232, 184, 75, 0.06)", text: "#c49a2e", border: "rgba(232, 184, 75, 0.12)" };

              if (isEditing) {
                return (
                  <div
                    key={doc.id}
                    style={{
                      background: "#ffffff",
                      border: "1px solid #e8b84b",
                      borderRadius: "16px",
                      boxShadow: "0 6px 20px rgba(232, 184, 75, 0.08)",
                      padding: "20px",
                      display: "flex",
                      flexDirection: "column",
                      position: "relative",
                      transition: "all 0.2s ease",
                      alignSelf: "start",
                      minHeight: "260px",
                      boxSizing: "border-box",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(232, 184, 75, 0.08)", paddingBottom: "10px", marginBottom: "14px" }}>
                      <span style={{ fontSize: "10.5px", fontWeight: 800, color: "#c49a2e", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                        Edit Metadata
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "9px", fontWeight: 800, color: extColor.text, background: extColor.bg, padding: "2px 6px", borderRadius: "6px", fontFamily: "JetBrains Mono, monospace" }}>
                          {doc.file_type.toUpperCase()}
                        </span>
                        <button
                          onClick={() => setEditingId(null)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: 0,
                            color: "#64748b",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "color 0.2s",
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.color = "#2d3142"}
                          onMouseLeave={(e) => e.currentTarget.style.color = "#64748b"}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>

                    <div style={{ flex: 1 }}>
                      <MetadataEditor
                        doc={doc}
                        onSave={(updates) => saveMetadata(doc.doc_id, updates)}
                        onCancel={() => setEditingId(null)}
                        isGrid={true}
                      />
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={doc.id}
                  style={{
                    background: "#ffffff",
                    border: "1px solid rgba(232, 184, 75, 0.12)",
                    borderRadius: "16px",
                    boxShadow: "0 4px 14px rgba(45, 49, 66, 0.01)",
                    padding: "20px",
                    display: "flex",
                    flexDirection: "column",
                    position: "relative",
                    transition: "all 0.2s ease",
                    alignSelf: "start",
                  }}
                >
                  <div style={{ display: "flex", gap: "16px", alignItems: "flex-start", flex: 1 }}>
                    
                    <div
                      style={{
                        width: "44px",
                        height: "44px",
                        borderRadius: "12px",
                        background: extColor.bg,
                        border: `1px solid ${extColor.border}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <FileText size={20} style={{ color: extColor.text }} />
                    </div>

                    
                    <div style={{ flex: 1, minWidth: 0 }}>
                      
                      <h3
                        style={{
                          fontSize: "13.5px",
                          fontWeight: 700,
                          color: "#1e293b",
                          lineHeight: 1.35,
                          wordBreak: "break-all",
                          margin: 0,
                        }}
                      >
                        {doc.filename}
                      </h3>

                      
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginTop: "6px" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "3px",
                            padding: "2px 8px",
                            borderRadius: "12px",
                            fontSize: "9px",
                            fontWeight: 800,
                            background: scopeColor.bg,
                            color: scopeColor.text,
                            border: `1px solid ${scopeColor.border}`,
                            textTransform: "uppercase",
                            letterSpacing: "0.02em"
                          }}
                        >
                          {doc.is_global ? "Global" : doc.department}
                        </span>

                        <span style={{ fontSize: "10px", color: "#64748b", fontWeight: 500 }}>
                          {fmtSize(doc.file_size_bytes)}
                        </span>
                        <span style={{ fontSize: "10px", color: "#94a3b8" }}>•</span>
                        <span style={{ fontSize: "10px", color: "#64748b", fontWeight: 500 }}>
                          {doc.chunk_count} chunks
                        </span>
                        <span style={{ fontSize: "10px", color: "#94a3b8" }}>•</span>
                        <span style={{ fontSize: "10px", color: "#64748b", fontWeight: 500 }}>
                          v{doc.version || 1}
                        </span>
                      </div>

                      
                      {doc.description && (
                        <p style={{ fontSize: "11px", color: "#64748b", marginTop: "8px", marginBottom: 0, lineHeight: 1.4, wordBreak: "break-word" }}>
                          {doc.description}
                        </p>
                      )}
                    </div>
                  </div>

                  
                  <div style={{ borderTop: "1px dashed rgba(232, 184, 75, 0.08)", margin: "14px 0" }} />

                  
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      
                      <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", alignItems: "center" }}>
                        {(doc.tags || "").split(",").filter((t) => t.trim()).map((tag) => (
                          <TagChip key={tag.trim()} tag={tag.trim()} />
                        ))}
                      </div>

                      
                      {doc.expires_at && (
                        <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                          <ExpiryBadge expiresAt={doc.expires_at} />
                          <span style={{ fontSize: "9.5px", color: "#64748b", fontWeight: 700 }}>
                            Exp: {new Date(doc.expires_at).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>

                    
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      {(isAuthority || doc.uploaded_by === user?.id) && (
                        <button
                          title="Edit metadata"
                          onClick={() => setEditingId(isEditing ? null : doc.doc_id)}
                          style={{
                            background: isEditing ? "rgba(232, 184, 75, 0.08)" : "#ffffff",
                            border: "1px solid rgba(232, 184, 75, 0.18)",
                            color: "#c49a2e",
                            cursor: "pointer",
                            width: "30px",
                            height: "30px",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "all 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "rgba(232, 184, 75, 0.04)";
                          }}
                          onMouseLeave={(e) => {
                            if (!isEditing) e.currentTarget.style.background = "#ffffff";
                          }}
                        >
                          <Edit3 size={12} />
                        </button>
                      )}
                      {isAdmin && (
                        <button
                          title="Delete document"
                          onClick={() => deleteDoc(doc.doc_id, doc.filename)}
                          disabled={deleting === doc.doc_id}
                          style={{
                            background: "#ffffff",
                            border: "1px solid rgba(179, 93, 93, 0.18)",
                            color: "#b35d5d",
                            cursor: "pointer",
                            width: "30px",
                            height: "30px",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "all 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "rgba(179, 93, 93, 0.04)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "#ffffff";
                          }}
                        >
                          {deleting === doc.doc_id ? (
                            <Loader2 size={12} style={{ animation: "spin 0.8s linear infinite" }} />
                          ) : (
                            <Trash2 size={12} />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      
      {viewMode === "list" && !loading && (
        <div
          style={{
            background: "#ffffff",
            border: "1px solid rgba(232, 184, 75, 0.18)",
            borderRadius: "24px",
            boxShadow: "0 10px 30px rgba(45, 49, 66, 0.015)",
            padding: 0,
            overflow: "hidden",
          }}
        >
          {filtered.length === 0 ? (
            <div style={{ padding: "60px", textAlign: "center" }}>
              <FileText size={36} style={{ color: "#94a3b8", margin: "0 auto 12px" }} />
              <p style={{ color: "#64748b", fontSize: "14px", fontWeight: 500 }}>
                {search || filterDept || filterTag ? "No documents match your filters" : "No documents indexed yet"}
              </p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="af-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f4f5f7" }}>
                    <th style={{ padding: "14px 18px", fontSize: "11px", fontWeight: 700, color: "#2d3142", borderBottom: "1px solid rgba(232, 184, 75, 0.08)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Document</th>
                    <th style={{ padding: "14px 18px", fontSize: "11px", fontWeight: 700, color: "#2d3142", borderBottom: "1px solid rgba(232, 184, 75, 0.08)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Tags</th>
                    <th style={{ padding: "14px 18px", fontSize: "11px", fontWeight: 700, color: "#2d3142", borderBottom: "1px solid rgba(232, 184, 75, 0.08)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Type</th>
                    <th style={{ padding: "14px 18px", fontSize: "11px", fontWeight: 700, color: "#2d3142", borderBottom: "1px solid rgba(232, 184, 75, 0.08)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Access</th>
                    <th style={{ padding: "14px 18px", fontSize: "11px", fontWeight: 700, color: "#2d3142", borderBottom: "1px solid rgba(232, 184, 75, 0.08)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Chunks</th>
                    <th style={{ padding: "14px 18px", fontSize: "11px", fontWeight: 700, color: "#2d3142", borderBottom: "1px solid rgba(232, 184, 75, 0.08)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Size</th>
                    <th style={{ padding: "14px 18px", fontSize: "11px", fontWeight: 700, color: "#2d3142", borderBottom: "1px solid rgba(232, 184, 75, 0.08)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Expiry</th>
                    <th style={{ padding: "14px 18px", fontSize: "11px", fontWeight: 700, color: "#2d3142", borderBottom: "1px solid rgba(232, 184, 75, 0.08)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Version</th>
                    <th style={{ padding: "14px 18px", fontSize: "11px", fontWeight: 700, color: "#2d3142", borderBottom: "1px solid rgba(232, 184, 75, 0.08)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Uploaded</th>
                    <th style={{ padding: "14px 18px", fontSize: "11px", fontWeight: 700, color: "#2d3142", borderBottom: "1px solid rgba(232, 184, 75, 0.08)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((doc) => (
                    <React.Fragment key={doc.id}>
                      <tr style={{ background: "#ffffff", borderBottom: "1px solid rgba(232, 184, 75, 0.05)", transition: "background 0.2s" }}>
                        <td style={{ padding: "14px 18px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(232, 184, 75, 0.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <FileText size={14} style={{ color: "#e8b84b" }} />
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: "13px", color: "#2d3142" }}>
                                {doc.filename}
                              </div>
                              {doc.description && (
                                <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 500, marginTop: "2px" }}>{doc.description}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "14px 18px" }}>
                          <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", maxWidth: "180px" }}>
                            {(doc.tags || "").split(",").filter((t) => t.trim()).map((tag) => (
                              <TagChip key={tag.trim()} tag={tag.trim()} />
                            ))}
                            {!doc.tags && <span style={{ fontSize: "11px", color: "#94a3b8" }}>—</span>}
                          </div>
                        </td>
                        <td style={{ padding: "14px 18px" }}>
                          <span style={{
                            fontSize: "10px",
                            fontWeight: 700,
                            color: "#64748b",
                            background: "#f4f5f7",
                            border: "1px solid rgba(232, 184, 75, 0.08)",
                            padding: "3px 10px",
                            borderRadius: "20px",
                            fontFamily: "JetBrains Mono, monospace"
                          }}>{doc.file_type.toUpperCase()}</span>
                        </td>
                        <td style={{ padding: "14px 18px" }}>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "3px 10px",
                              borderRadius: "20px",
                              fontSize: "11px",
                              fontWeight: 700,
                              background: doc.is_global ? "rgba(95, 135, 118, 0.08)" : "rgba(232, 184, 75, 0.08)",
                              color: doc.is_global ? "#5f8776" : "#c49a2e",
                              border: `1px solid ${doc.is_global ? "rgba(95, 135, 118, 0.2)" : "rgba(232, 184, 75, 0.2)"}`
                            }}
                          >
                            {doc.is_global ? <><Globe size={10} /> Global</> : <><Lock size={10} /> {doc.department.toUpperCase()}</>}
                          </span>
                        </td>
                        <td style={{ padding: "14px 18px", fontWeight: 700, color: "#2d3142" }}>{doc.chunk_count}</td>
                        <td style={{ padding: "14px 18px", color: "#64748b", fontWeight: 500 }}>{fmtSize(doc.file_size_bytes)}</td>
                        <td style={{ padding: "14px 18px" }}>
                          {doc.expires_at ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                              <ExpiryBadge expiresAt={doc.expires_at} />
                              <span style={{ fontSize: "10px", color: "#64748b", fontWeight: 600 }}>
                                {new Date(doc.expires_at).toLocaleDateString()}
                              </span>
                            </div>
                          ) : (
                            <span style={{ fontSize: "11px", color: "#94a3b8" }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: "14px 18px" }}>
                          <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
                            <History size={11} />
                            v{doc.version || 1}
                          </span>
                        </td>
                        <td style={{ padding: "14px 18px", fontSize: "12px", color: "#64748b", fontWeight: 500 }}>
                          {new Date(doc.upload_timestamp).toLocaleDateString()}
                        </td>
                        <td style={{ padding: "14px 18px" }}>
                          <div style={{ display: "flex", gap: "6px" }}>
                            {(isAuthority || doc.uploaded_by === user?.id) && (
                              <button
                                title="Edit tags & expiry"
                                onClick={() => setEditingId(editingId === doc.doc_id ? null : doc.doc_id)}
                                style={{
                                  background: editingId === doc.doc_id ? "rgba(232, 184, 75, 0.08)" : "#ffffff",
                                  border: "1px solid rgba(232, 184, 75, 0.18)",
                                  color: "#c49a2e",
                                  cursor: "pointer",
                                  padding: "6px 8px",
                                  borderRadius: "8px",
                                  display: "flex",
                                  alignItems: "center",
                                  transition: "all 0.2s",
                                }}
                              >
                                <Edit3 size={12} />
                              </button>
                            )}
                            {isAdmin && (
                              <button
                                onClick={() => deleteDoc(doc.doc_id, doc.filename)}
                                disabled={deleting === doc.doc_id}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "5px",
                                  background: "rgba(179, 93, 93, 0.08)",
                                  border: "1px solid rgba(179, 93, 93, 0.2)",
                                  color: "#b35d5d",
                                  borderRadius: "8px",
                                  padding: "6px 12px",
                                  fontSize: "12px",
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  transition: "all 0.2s",
                                }}
                              >
                                <Trash2 size={12} />
                                <span>{deleting === doc.doc_id ? "..." : "Delete"}</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {editingId === doc.doc_id && (
                        <MetadataEditor
                          doc={doc}
                          onSave={(updates) => saveMetadata(doc.doc_id, updates)}
                          onCancel={() => setEditingId(null)}
                        />
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      
      {loading && (
        <div style={{ padding: "60px", background: "#ffffff", border: "1px solid rgba(232, 184, 75, 0.18)", borderRadius: "24px", textAlign: "center" }}>
          <div style={{ width: "32px", height: "32px", border: "2px solid rgba(232, 184, 75, 0.15)", borderTopColor: "#e8b84b", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
          <p style={{ color: "#64748b", fontSize: "13px", fontWeight: 500 }}>Syncing document indices...</p>
        </div>
      )}

    </div>
  );
}
