"use client";

import React, { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import CustomSelect from "@/components/CustomSelect";
import {
  Rss,
  ExternalLink,
  Zap,
  Loader2,
  Calendar,
  ChevronRight,
  Building2,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  Search,
  Sparkles,
  Download,
  AlertTriangle,
  AlertCircle,
  Info,
  ShieldCheck,
  Plus,
  X,
  ShieldAlert,
} from "lucide-react";

interface FeedItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  source_short: string;
  url: string;
  published_at: string;
  category: string;
  severity: string;
  department_tags: string | null;
  ai_impact: string | null;
  created_at: string;
  is_read: boolean;
  is_bookmarked: boolean;
  is_reviewed: boolean;
  review_notes: string | null;
}

const SOURCE_COLORS: Record<string, string> = {
  SEBI: "#4a607a",
  "FIU-IND": "#5f8776",
  "Ind AS": "#c49a2e",
  RBI: "#b35d5d",
  IRDAI: "#7c5cbf",
  MCA: "#567c87",
  NFRA: "#8e6e88",
};

const CATEGORY_COLORS: Record<string, string> = {
  "AML / KYC": "#5f8776",
  "Securities Regulation": "#4a607a",
  "Sustainability / ESG": "#5f8776",
  Enforcement: "#b35d5d",
  "Banking / Capital": "#c49a2e",
  "Accounting Standards": "#8e6e88",
  Cybersecurity: "#567c87",
};

const SEVERITY_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  critical: { label: "Critical", color: "#b35d5d", bg: "rgba(179, 93, 93, 0.08)", icon: AlertTriangle },
  high: { label: "High", color: "#c49a2e", bg: "rgba(196, 154, 46, 0.08)", icon: AlertCircle },
  medium: { label: "Medium", color: "#4a607a", bg: "rgba(74, 96, 122, 0.08)", icon: Info },
  low: { label: "Low", color: "#5f8776", bg: "rgba(95, 135, 118, 0.08)", icon: ShieldCheck },
};

function SeverityBadge({ severity }: { severity: string }) {
  const cfg = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.medium;
  const Icon = cfg.icon;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "4px",
      fontSize: "10px", fontWeight: 700, color: cfg.color,
      background: cfg.bg, padding: "2px 8px", borderRadius: "8px",
      textTransform: "uppercase", letterSpacing: "0.04em",
      border: `1px solid ${cfg.color}15`,
    }}>
      <Icon size={10} /> {cfg.label}
    </span>
  );
}

function ReviewModal({
  item,
  onClose,
  onSave,
}: {
  item: FeedItem;
  onClose: () => void;
  onSave: (notes: string) => Promise<void>;
}) {
  const [notes, setNotes] = useState(item.review_notes || "");
  const [saving, setSaving] = useState(false);
  const [focused, setFocused] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(notes);
    setSaving(false);
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(45, 49, 66, 0.45)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 200, padding: "24px", backdropFilter: "blur(6px)",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="fade-up" style={{
        background: "#ffffff", border: "1px solid rgba(232, 184, 75, 0.22)",
        boxShadow: "0 20px 50px rgba(45, 49, 66, 0.1)",
        borderRadius: "24px", padding: "36px", width: "100%", maxWidth: "520px",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#2d3142", letterSpacing: "-0.02em" }}>
            <CheckCircle2 size={18} style={{ color: "#10b981", marginRight: "8px", verticalAlign: "middle" }} />
            Mark as Reviewed
          </h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", display: "flex" }}>
            <X size={20} />
          </button>
        </div>
        <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "20px", lineHeight: 1.6, fontWeight: 500 }}>
          {item.title}
        </p>
        <label style={{ fontSize: "11px", color: "#2d3142", display: "block", marginBottom: "8px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Review Notes (optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Add your compliance review notes, action items, or observations..."
          rows={4}
          style={{
            width: "100%",
            background: "#ffffff",
            border: focused ? "1px solid #e8b84b" : "1px solid #e2e8f0",
            borderRadius: "12px",
            padding: "12px 16px",
            color: "#2d3142",
            fontSize: "13px",
            outline: "none",
            resize: "vertical",
            fontFamily: "Inter, sans-serif",
            fontWeight: 500,
            transition: "all 0.2s",
          }}
        />
        <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              padding: "11px",
              fontSize: "14px",
              fontWeight: 600,
              color: "#2d3142",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              flex: 1.8,
              background: "linear-gradient(135deg, #e8b84b 0%, #c49a2e 100%)",
              border: "none",
              borderRadius: "12px",
              padding: "11px",
              fontSize: "14px",
              fontWeight: 600,
              color: "#ffffff",
              cursor: saving ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              boxShadow: "0 4px 10px rgba(232, 184, 75, 0.2)",
            }}
          >
            {saving ? <Loader2 size={16} style={{ animation: "spin 0.7s linear infinite" }} /> : <CheckCircle2 size={16} />}
            <span>{saving ? "Saving..." : "Confirm Reviewed"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function AddFeedModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [form, setForm] = useState({
    title: "", summary: "", source: "", source_short: "", url: "",
    published_at: new Date().toISOString().slice(0, 10),
    category: "Securities Regulation", severity: "medium", department_tags: "",
  });
  const [saving, setSaving] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleSave = async () => {
    if (!form.title || !form.summary || !form.source_short || !form.url) {
      toast.error("Title, summary, source, and URL are required.");
      return;
    }
    setSaving(true);
    try {
      await api.post("/feeds/admin", {
        ...form,
        published_at: new Date(form.published_at).toISOString(),
      });
      toast.success("Feed item added successfully");
      onAdded();
      onClose();
    } catch {
      toast.error("Failed to add feed item");
    } finally {
      setSaving(false);
    }
  };

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
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(45, 49, 66, 0.45)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 200, padding: "24px", backdropFilter: "blur(6px)",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="fade-up" style={{
        background: "#ffffff", border: "1px solid rgba(232, 184, 75, 0.22)",
        borderRadius: "24px", padding: "36px", width: "100%", maxWidth: "560px",
        maxHeight: "90vh", overflowY: "auto",
        boxShadow: "0 20px 50px rgba(45, 49, 66, 0.1)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#2d3142", letterSpacing: "-0.02em" }}>
            <Plus size={18} style={{ color: "#e8b84b", marginRight: "8px", verticalAlign: "middle" }} />
            Add Custom Regulatory Update
          </h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", display: "flex" }}>
            <X size={20} />
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div>
            <label style={labelStyle}>Title *</label>
            <input
              style={getInputStyle("title")}
              onFocus={() => setFocusedField("title")}
              onBlur={() => setFocusedField(null)}
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="e.g. SEBI issues circular on..."
            />
          </div>
          <div>
            <label style={labelStyle}>Summary *</label>
            <textarea
              style={{ ...getInputStyle("summary"), fontFamily: "Inter, sans-serif", resize: "vertical" }}
              onFocus={() => setFocusedField("summary")}
              onBlur={() => setFocusedField(null)}
              rows={3}
              value={form.summary}
              onChange={e => setForm(p => ({ ...p, summary: e.target.value }))}
              placeholder="Detailed summary of the regulation..."
            />
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Source Full Name *</label>
              <input
                style={getInputStyle("source")}
                onFocus={() => setFocusedField("source")}
                onBlur={() => setFocusedField(null)}
                value={form.source}
                onChange={e => setForm(p => ({ ...p, source: e.target.value }))}
                placeholder="Reserve Bank of India"
              />
            </div>
            <div style={{ flex: "0 0 120px" }}>
              <label style={labelStyle}>Short Code *</label>
              <input
                style={getInputStyle("source_short")}
                onFocus={() => setFocusedField("source_short")}
                onBlur={() => setFocusedField(null)}
                value={form.source_short}
                onChange={e => setForm(p => ({ ...p, source_short: e.target.value }))}
                placeholder="RBI"
              />
            </div>
          </div>
          <div>
            <label style={labelStyle}>URL *</label>
            <input
              style={getInputStyle("url")}
              onFocus={() => setFocusedField("url")}
              onBlur={() => setFocusedField(null)}
              value={form.url}
              onChange={e => setForm(p => ({ ...p, url: e.target.value }))}
              placeholder="https://..."
            />
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Category</label>
              <CustomSelect
                options={["AML / KYC", "Securities Regulation", "Sustainability / ESG", "Enforcement", "Banking / Capital", "Accounting Standards", "Cybersecurity"].map(c => ({ value: c, label: c }))}
                value={form.category}
                onChange={val => setForm(p => ({ ...p, category: val }))}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Severity</label>
              <CustomSelect
                options={[
                  { value: "critical", label: "● Critical" },
                  { value: "high", label: "● High" },
                  { value: "medium", label: "● Medium" },
                  { value: "low", label: "● Low" },
                ]}
                value={form.severity}
                onChange={val => setForm(p => ({ ...p, severity: val }))}
              />
            </div>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Published Date</label>
              <input
                type="date"
                style={getInputStyle("published_at")}
                onFocus={() => setFocusedField("published_at")}
                onBlur={() => setFocusedField(null)}
                value={form.published_at}
                onChange={e => setForm(p => ({ ...p, published_at: e.target.value }))}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Department Tags</label>
              <input
                style={getInputStyle("department_tags")}
                onFocus={() => setFocusedField("department_tags")}
                onBlur={() => setFocusedField(null)}
                value={form.department_tags}
                onChange={e => setForm(p => ({ ...p, department_tags: e.target.value }))}
                placeholder="compliance,audit"
              />
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "12px", marginTop: "28px" }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              padding: "11px",
              fontSize: "14px",
              fontWeight: 600,
              color: "#2d3142",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              flex: 1.8,
              background: "linear-gradient(135deg, #e8b84b 0%, #c49a2e 100%)",
              border: "none",
              borderRadius: "12px",
              padding: "11px",
              fontSize: "14px",
              fontWeight: 600,
              color: "#ffffff",
              cursor: saving ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              boxShadow: "0 4px 10px rgba(232, 184, 75, 0.2)",
            }}
          >
            {saving ? <Loader2 size={16} style={{ animation: "spin 0.7s linear infinite" }} /> : <Plus size={16} />}
            <span>{saving ? "Adding..." : "Add Feed Item"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RegulatoryFeedsPage() {
  const { user, isAdmin } = useAuth();
  const router = useRouter();
  const isAuthority = user ? ["admin", "compliance_officer", "auditor"].includes(user.role) : false;

  const [feeds, setFeeds] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterSource, setFilterSource] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("");
  const [showBookmarked, setShowBookmarked] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [reviewingItem, setReviewingItem] = useState<FeedItem | null>(null);
  const [addingFeed, setAddingFeed] = useState(false);
  const [loadingImpact, setLoadingImpact] = useState<string | null>(null);
  const [expandedImpact, setExpandedImpact] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const loadFeeds = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      const res = await api.get("/feeds", { params });
      setFeeds(res.data);
    } catch {
      toast.error("Failed to load regulatory feeds");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(loadFeeds, search ? 400 : 0);
    return () => clearTimeout(t);
  }, [loadFeeds]);

  const filteredFeeds = feeds.filter(f => {
    if (filterSource && f.source_short !== filterSource) return false;
    if (filterCategory && f.category !== filterCategory) return false;
    if (filterSeverity && f.severity !== filterSeverity) return false;
    if (showBookmarked && !f.is_bookmarked) return false;
    return true;
  });

  const deleteFeed = async (item: FeedItem) => {
    if (!confirm(`Delete "${item.title.slice(0, 60)}..."?\n\nThis cannot be undone.`)) return;
    setDeletingId(item.id);
    try {
      await api.delete(`/feeds/${item.id}`);
      setFeeds(prev => prev.filter(f => f.id !== item.id));
      toast.success("Feed item deleted");
    } catch {
      toast.error("Failed to delete feed item");
    } finally {
      setDeletingId(null);
    }
  };

  const toggleBookmark = async (item: FeedItem) => {
    try {
      const res = await api.post(`/feeds/${item.id}/bookmark`);
      const nowBookmarked = res.data.success !== false;
      setFeeds(prev => prev.map(f => f.id === item.id ? { ...f, is_bookmarked: nowBookmarked } : f));
      toast.success(nowBookmarked ? "Bookmarked" : "Bookmark removed");
    } catch {
      toast.error("Failed to update bookmark");
    }
  };

  const submitReview = async (item: FeedItem, notes: string) => {
    setFeeds(prev => prev.map(f => f.id === item.id ? { ...f, is_reviewed: true, review_notes: notes } : f));
    setReviewingItem(null);
    try {
      await api.post(`/feeds/${item.id}/review`, { notes });
      toast.success("Marked as reviewed and logged to audit trail");
    } catch {
      setFeeds(prev => prev.map(f => f.id === item.id ? { ...f, is_reviewed: false, review_notes: item.review_notes } : f));
      toast.error("Failed to save review. Please try again.");
    }
  };

  const generateImpact = async (item: FeedItem) => {
    setLoadingImpact(item.id);
    setExpandedImpact(item.id);
    try {
      const res = await api.get(`/feeds/${item.id}/impact`);
      const d = res.data;
      const urgencyLabel = (d.urgency || "medium").toUpperCase();
      const departments = Array.isArray(d.affected_departments)
        ? d.affected_departments.join(", ")
        : (d.affected_departments || "Compliance");
      const actions = Array.isArray(d.action_items)
        ? d.action_items.map((a: string, i: number) => `${i + 1}. ${a}`).join("\n")
        : (d.action_items || "");
      const formatted = [
        `[${urgencyLabel} URGENCY]`,
        d.impact_summary || d.impact || "No summary available.",
        "",
        `Affected Departments: ${departments}`,
        "",
        actions ? `Action Items:\n${actions}` : "",
      ].filter(Boolean).join("\n");

      setFeeds(prev => prev.map(f => f.id === item.id ? { ...f, ai_impact: formatted } : f));
      toast.success("AI compliance impact generated");
    } catch {
      toast.error("AI impact generation failed. Please try again.");
    } finally {
      setLoadingImpact(null);
    }
  };

  const exportPDF = async () => {
    setExporting(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const margin = 14;
      let y = 0;

      doc.setFillColor(45, 49, 66);
      doc.rect(0, 0, pageW, 22, "F");
      doc.setTextColor(232, 184, 75);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("AuditFlow — Indian Regulatory Feed Export", margin, 14);
      doc.setTextColor(148, 163, 184);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(`Generated: ${new Date().toLocaleString()}`, pageW - margin, 14, { align: "right" });

      y = 30;
      const itemsToExport = filteredFeeds;

      itemsToExport.forEach((item, i) => {
        if (y > 260) { doc.addPage(); y = 20; }

        const srcColor = item.source_short === "RBI" ? [179, 93, 93] :
          item.source_short === "SEBI" ? [74, 96, 122] :
            item.source_short === "FIU-IND" ? [95, 135, 118] : [196, 154, 46];

        doc.setFillColor(...(srcColor as [number, number, number]));
        doc.rect(margin, y, 2.5, 8, "F");

        doc.setTextColor(45, 49, 66);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        const titleLines = doc.splitTextToSize(`${i + 1}. ${item.title}`, pageW - margin * 2 - 6);
        doc.text(titleLines, margin + 5, y + 5);
        y += titleLines.length * 5 + 3;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(`${item.source_short} · ${item.category} · ${item.severity.toUpperCase()} · ${new Date(item.published_at).toLocaleDateString()}`, margin + 5, y);
        y += 6;

        doc.setTextColor(71, 85, 105);
        const summaryLines = doc.splitTextToSize(item.summary, pageW - margin * 2 - 6);
        doc.text(summaryLines.slice(0, 4), margin + 5, y);
        y += Math.min(summaryLines.length, 4) * 4 + 4;

        if (item.ai_impact) {
          doc.setTextColor(196, 154, 46);
          doc.setFont("helvetica", "bolditalic");
          doc.text("AI Impact:", margin + 5, y);
          y += 4;
          doc.setFont("helvetica", "italic");
          doc.setTextColor(71, 85, 105);
          const impactLines = doc.splitTextToSize(item.ai_impact, pageW - margin * 2 - 6);
          doc.text(impactLines.slice(0, 4), margin + 5, y);
          y += Math.min(impactLines.length, 4) * 4 + 4;
        }

        if (item.is_reviewed) {
          doc.setTextColor(16, 185, 129);
          doc.setFont("helvetica", "bold");
          doc.text(`Reviewed${item.review_notes ? `: ${item.review_notes.slice(0, 80)}` : ""}`, margin + 5, y);
          y += 6;
        }

        doc.setDrawColor(226, 232, 240);
        doc.line(margin, y + 2, pageW - margin, y + 2);
        y += 8;
      });

      doc.save(`RegulatoryFeed-${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success("Feed exported as PDF");
    } catch (e) {
      console.error(e);
      toast.error("PDF export failed");
    } finally {
      setExporting(false);
    }
  };

  const handleRunAnalysis = (item: FeedItem) => {
    router.push("/gap-analyzer");
    toast(
      `Navigating to Gap Analyzer. Upload the full circular from ${item.source_short} to run a gap analysis.`,
      { duration: 5000, icon: "📋" }
    );
  };

  const clearFilters = () => {
    setFilterSource(""); setFilterCategory(""); setFilterSeverity("");
    setShowBookmarked(false); setSearch("");
  };
  const hasFilters = filterSource || filterCategory || filterSeverity || showBookmarked || search;

  const uniqueCategories = Array.from(new Set(feeds.map(f => f.category)));
  const uniqueSources = Array.from(new Set(feeds.map(f => f.source_short))).sort();
  const criticalCount = feeds.filter(f => f.severity === "critical").length;
  const highCount = feeds.filter(f => f.severity === "high").length;
  const mediumCount = feeds.filter(f => f.severity === "medium").length;
  const lowCount = feeds.filter(f => f.severity === "low").length;

  const totalActionables = feeds.length;
  const reviewedActionables = feeds.filter(f => f.is_reviewed).length;
  const actionablePercent = totalActionables > 0 ? Math.round((reviewedActionables / totalActionables) * 100) : 0;

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: "32px 36px", background: "#faf9f6" }}>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <Rss size={20} style={{ color: "#e8b84b" }} />
            <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#2d3142", letterSpacing: "-0.03em" }}>
              Regulatory Circular Hub
            </h1>
            <span style={{
              fontSize: "10px", fontWeight: 700, color: "#5f8776",
              background: "rgba(95, 135, 118, 0.08)", padding: "2px 8px",
              borderRadius: "20px", textTransform: "uppercase", letterSpacing: "0.03em",
              border: "1px solid rgba(95, 135, 118, 0.2)",
            }}>Live</span>
          </div>
          <p style={{ color: "#64748b", fontSize: "14px", fontWeight: 500 }}>
            Circulars, notifications &amp; advisories from <strong style={{ color: "#2d3142" }}>SEBI &middot; FIU-IND &middot; Ind AS &middot; RBI</strong>.
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {(isAdmin || user?.role === "compliance_officer") && (
            <button
              onClick={() => setAddingFeed(true)}
              style={{
                display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 700,
                background: "linear-gradient(135deg, #e8b84b 0%, #c49a2e 100%)",
                border: "none", borderRadius: "10px", color: "#ffffff",
                padding: "8px 16px", cursor: "pointer", boxShadow: "0 4px 10px rgba(232, 184, 75, 0.15)",
                transition: "transform 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "none")}
            >
              <Plus size={13} /> Add Circular
            </button>
          )}
          <button
            onClick={exportPDF}
            disabled={exporting}
            style={{
              display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 700,
              background: "#ffffff", border: "1px solid rgba(232, 184, 75, 0.18)",
              borderRadius: "10px", color: "#2d3142", padding: "8px 16px",
              cursor: exporting ? "not-allowed" : "pointer", transition: "all 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#f4f5f7")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#ffffff")}
          >
            {exporting ? <Loader2 size={13} style={{ animation: "spin 0.8s linear infinite" }} /> : <Download size={13} />}
            <span>Export Feed</span>
          </button>
        </div>
      </div>


      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 360px",
          gap: "28px",
          alignItems: "start",
        }}
      >


        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>


          <div
            style={{
              background: "#ffffff",
              border: "1px solid rgba(232, 184, 75, 0.18)",
              borderRadius: "24px",
              padding: "24px 28px",
              boxShadow: "0 10px 30px rgba(45, 49, 66, 0.015)",
              display: "flex",
              flexDirection: "column",
              gap: "18px",
            }}
          >

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>

              <div style={{ position: "relative", flex: "1 1 300px" }}>
                <Search size={14} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#cbd5e1" }} />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search circulars, categories, topics..."
                  style={{
                    paddingLeft: "38px", fontSize: "13px", width: "100%",
                    background: "#f8fafc", border: "1px solid rgba(232, 184, 75, 0.12)",
                    borderRadius: "12px", padding: "11px 14px 11px 38px",
                    color: "#2d3142", outline: "none", fontWeight: 500,
                    transition: "all 0.2s",
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#e8b84b"}
                  onBlur={(e) => e.target.style.borderColor = "rgba(232, 184, 75, 0.12)"}
                />
              </div>


              <div style={{ flex: "0 0 155px" }}>
                <CustomSelect
                  options={[
                    { value: "", label: "All Severity" },
                    { value: "critical", label: "Critical" },
                    { value: "high", label: "High" },
                    { value: "medium", label: "Medium" },
                    { value: "low", label: "Low" },
                  ]}
                  value={filterSeverity}
                  onChange={val => setFilterSeverity(val)}
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                />
              </div>


              <button
                onClick={() => setShowBookmarked(!showBookmarked)}
                style={{
                  background: showBookmarked ? "rgba(232, 184, 75, 0.08)" : "#ffffff",
                  border: `1px solid ${showBookmarked ? "#e8b84b" : "rgba(232, 184, 75, 0.18)"}`,
                  color: showBookmarked ? "#c49a2e" : "#64748b",
                  borderRadius: "12px", padding: "10px 16px", fontSize: "12px",
                  cursor: "pointer", display: "flex", alignItems: "center", gap: "6px",
                  fontFamily: "Inter, sans-serif", fontWeight: 700, transition: "all 0.2s",
                }}
              >
                <Bookmark size={13} style={{ fill: showBookmarked ? "#e8b84b" : "none" }} />
                <span>Bookmarked</span>
              </button>

              {hasFilters && (
                <button
                  onClick={clearFilters}
                  style={{
                    background: "transparent", border: "1px solid rgba(232, 184, 75, 0.18)",
                    color: "#64748b", borderRadius: "12px", padding: "10px 16px",
                    fontSize: "12px", cursor: "pointer", fontFamily: "Inter, sans-serif", fontWeight: 700,
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  Reset
                </button>
              )}
            </div>


            <div style={{ height: "1px", background: "rgba(232, 184, 75, 0.08)" }} />


            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", marginRight: "6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Authorities:
              </span>
              {uniqueSources.map((src) => {
                const count = feeds.filter(f => f.source_short === src).length;
                const color = SOURCE_COLORS[src] || "#6366f1";
                const isFilter = filterSource === src;
                return (
                  <button
                    key={src}
                    onClick={() => setFilterSource(isFilter ? "" : src)}
                    style={{
                      padding: "6px 14px", cursor: "pointer", transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                      border: `1px solid ${isFilter ? color : "rgba(232, 184, 75, 0.12)"}`,
                      background: isFilter ? `${color}08` : "#ffffff",
                      borderRadius: "100px",
                      display: "flex", alignItems: "center", gap: "6px",
                      outline: "none",
                    }}
                    onMouseEnter={(e) => {
                      if (!isFilter) e.currentTarget.style.borderColor = color;
                    }}
                    onMouseLeave={(e) => {
                      if (!isFilter) e.currentTarget.style.borderColor = "rgba(232, 184, 75, 0.12)";
                    }}
                  >
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: color }} />
                    <span style={{ fontSize: "12px", fontWeight: 700, color: isFilter ? color : "#2d3142" }}>{src}</span>
                    <span style={{ fontSize: "10px", background: isFilter ? `${color}15` : "#f1f5f9", color: isFilter ? color : "#64748b", padding: "1px 6px", borderRadius: "8px", fontWeight: 700 }}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>


            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", marginRight: "6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Sectors:
              </span>
              {uniqueCategories.map((cat) => {
                const color = CATEGORY_COLORS[cat] || "#6366f1";
                const active = filterCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(active ? "" : cat)}
                    style={{
                      background: active ? "rgba(232, 184, 75, 0.08)" : "#ffffff",
                      border: `1px solid ${active ? "#e8b84b" : "rgba(232, 184, 75, 0.12)"}`,
                      color: active ? "#c49a2e" : "#64748b",
                      borderRadius: "100px", padding: "4px 12px", fontSize: "11px",
                      cursor: "pointer", fontFamily: "Inter, sans-serif",
                      fontWeight: active ? 700 : 600, transition: "all 0.15s",
                    }}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>


          {loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px", gap: "12px" }}>
              <Loader2 size={24} style={{ animation: "spin 0.8s linear infinite", color: "#e8b84b" }} />
              <span style={{ color: "#64748b", fontWeight: 500, fontSize: "13px" }}>Loading regulatory updates...</span>
            </div>
          ) : filteredFeeds.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px", background: "#ffffff", border: "1px solid rgba(232, 184, 75, 0.18)", borderRadius: "24px", color: "#64748b", boxShadow: "0 10px 30px rgba(45, 49, 66, 0.015)" }}>
              <Rss size={36} style={{ margin: "0 auto 16px", opacity: 0.25, color: "#e8b84b" }} />
              <p style={{ fontWeight: 700, fontSize: "14px", color: "#2d3142" }}>No circulars match your filters.</p>
              {hasFilters && (
                <button
                  style={{ marginTop: "16px", fontSize: "12px", background: "#ffffff", border: "1px solid rgba(232, 184, 75, 0.18)", padding: "8px 16px", borderRadius: "10px", fontWeight: 700, cursor: "pointer" }}
                  onClick={clearFilters}
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {filteredFeeds.map((item) => {
                const srcColor = SOURCE_COLORS[item.source_short] || "#6366f1";
                const catColor = CATEGORY_COLORS[item.category] || "#6366f1";
                const isExpanded = expandedImpact === item.id;
                const srcInitials = item.source_short === "FIU-IND" ? "FIU" : item.source_short === "Ind AS" ? "IAS" : item.source_short;

                return (
                  <div
                    key={item.id}
                    style={{
                      background: "#ffffff",
                      border: "1px solid rgba(232, 184, 75, 0.18)",
                      borderRadius: "24px",
                      padding: "24px 28px",
                      boxShadow: "0 10px 30px rgba(45, 49, 66, 0.015)",
                      transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                      position: "relative",
                      display: "flex",
                      gap: "20px",
                    }}
                  >

                    <div
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "50%",
                        background: `${srcColor}08`,
                        border: `1.5px solid ${srcColor}18`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "11px",
                        fontWeight: 800,
                        color: srcColor,
                        flexShrink: 0,
                        boxShadow: `0 4px 12px ${srcColor}05`,
                      }}
                    >
                      {srcInitials}
                    </div>


                    <div style={{ flex: 1, minWidth: 0 }}>

                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "10px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                          <span style={{
                            fontSize: "11px", fontWeight: 700, color: srcColor,
                            textTransform: "uppercase", letterSpacing: "0.05em",
                          }}>
                            {item.source}
                          </span>
                          <span style={{ color: "#cbd5e1" }}>&bull;</span>
                          <span style={{
                            fontSize: "11px", color: catColor, fontWeight: 600,
                          }}>
                            {item.category}
                          </span>
                          <span style={{ color: "#cbd5e1" }}>&bull;</span>
                          <SeverityBadge severity={item.severity} />
                          {item.is_reviewed && (
                            <span style={{
                              fontSize: "10px", fontWeight: 700, color: "#5f8776",
                              background: "rgba(95,135,118,0.06)", padding: "2px 8px",
                              borderRadius: "8px", display: "inline-flex", alignItems: "center", gap: "3px",
                              border: "1px solid rgba(95,135,118,0.15)",
                            }}>
                              <CheckCircle2 size={10} /> Reviewed
                            </span>
                          )}
                        </div>


                        <div style={{ display: "flex", gap: "6px", flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                          <button
                            title={item.is_bookmarked ? "Remove bookmark" : "Bookmark"}
                            onClick={() => toggleBookmark(item)}
                            style={{
                              background: item.is_bookmarked ? "rgba(232, 184, 75, 0.08)" : "#ffffff",
                              border: "1px solid rgba(232, 184, 75, 0.18)", borderRadius: "8px",
                              color: item.is_bookmarked ? "#c49a2e" : "#64748b",
                              cursor: "pointer", padding: "6px 8px", display: "flex", alignItems: "center",
                              transition: "all 0.15s",
                            }}
                            onMouseEnter={(e) => {
                              if (!item.is_bookmarked) {
                                e.currentTarget.style.borderColor = "#e8b84b";
                                e.currentTarget.style.color = "#e8b84b";
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!item.is_bookmarked) {
                                e.currentTarget.style.borderColor = "rgba(232, 184, 75, 0.18)";
                                e.currentTarget.style.color = "#64748b";
                              }
                            }}
                          >
                            {item.is_bookmarked ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
                          </button>
                          {isAuthority && (
                            <button
                              title="Mark as reviewed"
                              onClick={() => setReviewingItem(item)}
                              style={{
                                background: item.is_reviewed ? "rgba(95,135,118,0.06)" : "#ffffff",
                                border: "1px solid rgba(232, 184, 75, 0.18)", borderRadius: "8px",
                                color: item.is_reviewed ? "#5f8776" : "#64748b",
                                cursor: "pointer", padding: "6px 8px", display: "flex", alignItems: "center",
                                transition: "all 0.15s",
                              }}
                              onMouseEnter={(e) => {
                                if (!item.is_reviewed) {
                                  e.currentTarget.style.borderColor = "#5f8776";
                                  e.currentTarget.style.color = "#5f8776";
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!item.is_reviewed) {
                                  e.currentTarget.style.borderColor = "rgba(232, 184, 75, 0.18)";
                                  e.currentTarget.style.color = "#64748b";
                                }
                              }}
                            >
                              <CheckCircle2 size={13} />
                            </button>
                          )}
                          {isAdmin && (
                            <button
                              title="Delete update"
                              onClick={() => deleteFeed(item)}
                              disabled={deletingId === item.id}
                              style={{
                                background: "#ffffff", border: "1px solid rgba(239, 68, 68, 0.2)",
                                borderRadius: "8px", color: "#ef4444",
                                cursor: deletingId === item.id ? "not-allowed" : "pointer", padding: "6px 8px", display: "flex", alignItems: "center",
                                opacity: deletingId === item.id ? 0.5 : 1,
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239, 68, 68, 0.05)")}
                              onMouseLeave={(e) => (e.currentTarget.style.background = "#ffffff")}
                            >
                              {deletingId === item.id
                                ? <Loader2 size={13} style={{ animation: "spin 0.8s linear infinite" }} />
                                : <X size={13} />}
                            </button>
                          )}
                        </div>
                      </div>


                      <h3 style={{ fontSize: "15px", fontWeight: 800, color: "#2d3142", marginBottom: "8px", lineHeight: 1.45, letterSpacing: "-0.01em" }}>
                        {item.title}
                      </h3>


                      <p style={{ fontSize: "13px", color: "#475569", lineHeight: 1.6, marginBottom: "16px", fontWeight: 500 }}>
                        {item.summary}
                      </p>


                      {item.is_reviewed && item.review_notes && (
                        <div style={{
                          background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.15)",
                          borderRadius: "12px", padding: "12px 16px", marginBottom: "16px",
                          fontSize: "12.5px", color: "#475569", fontWeight: 500, lineHeight: 1.5,
                        }}>
                          <strong style={{ color: "#5f8776", fontWeight: 700 }}>Review notes: </strong>
                          {item.review_notes}
                        </div>
                      )}


                      {expandedImpact === item.id && (
                        <div style={{
                          background: "rgba(232, 184, 75, 0.04)", border: "1px solid rgba(232, 184, 75, 0.18)",
                          borderRadius: "16px", padding: "16px 20px", marginBottom: "16px",
                        }}>
                          <div style={{ fontSize: "11px", fontWeight: 700, color: "#c49a2e", marginBottom: "10px", display: "flex", alignItems: "center", gap: "5px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            <Sparkles size={12} /> AI Compliance Impact
                          </div>
                          {loadingImpact === item.id ? (
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#64748b", fontSize: "12px", fontWeight: 500 }}>
                              <Loader2 size={13} style={{ animation: "spin 0.8s linear infinite" }} />
                              Analysing regulatory impact with Groq AI...
                            </div>
                          ) : item.ai_impact ? (
                            <div style={{ fontSize: "12.5px", color: "#475569", lineHeight: 1.7, fontWeight: 500 }}>
                              {item.ai_impact.split("\n").map((line, i) => (
                                <p key={i} style={{
                                  margin: "0 0 4px",
                                  fontWeight: line.startsWith("[") || line.startsWith("Affected") || line.startsWith("Action") ? 700 : 500,
                                  color: line.startsWith("[HIGH") || line.startsWith("[CRITICAL") ? "#b91c1c"
                                    : line.startsWith("[MEDIUM") ? "#c49a2e"
                                      : line.startsWith("[LOW") ? "#16a34a"
                                        : "#475569",
                                }}>{line}</p>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      )}


                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                          <button
                            onClick={() => handleRunAnalysis(item)}
                            style={{
                              display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 700,
                              background: "linear-gradient(135deg, #e8b84b 0%, #c49a2e 100%)",
                              border: "none", borderRadius: "8px", color: "#ffffff",
                              padding: "6px 14px", cursor: "pointer", transition: "transform 0.15s",
                              boxShadow: "0 2px 8px rgba(232, 184, 75, 0.1)",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
                            onMouseLeave={(e) => (e.currentTarget.style.transform = "none")}
                          >
                            <Zap size={12} /> Run Gap Analysis
                          </button>

                          {!item.ai_impact && (
                            <button
                              onClick={() => generateImpact(item)}
                              disabled={loadingImpact === item.id}
                              style={{
                                display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 700,
                                background: "#ffffff", border: "1px solid rgba(232, 184, 75, 0.18)",
                                borderRadius: "8px", color: "#2d3142",
                                padding: "6px 14px", cursor: loadingImpact === item.id ? "not-allowed" : "pointer",
                                transition: "all 0.2s",
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = "#f4f5f7")}
                              onMouseLeave={(e) => (e.currentTarget.style.background = "#ffffff")}
                            >
                              {loadingImpact === item.id
                                ? <Loader2 size={12} style={{ animation: "spin 0.8s linear infinite" }} />
                                : <Sparkles size={12} />}
                              <span>AI Impact</span>
                            </button>
                          )}

                          {item.ai_impact && (
                            <button
                              onClick={() => setExpandedImpact(isExpanded ? null : item.id)}
                              style={{
                                display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 700,
                                background: "#ffffff", border: "1px solid rgba(232, 184, 75, 0.18)",
                                borderRadius: "8px", color: "#2d3142",
                                padding: "6px 14px", cursor: "pointer", transition: "all 0.2s",
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = "#f4f5f7")}
                              onMouseLeave={(e) => (e.currentTarget.style.background = "#ffffff")}
                            >
                              <Sparkles size={12} /> {isExpanded ? "Hide" : "Show"} Impact
                            </button>
                          )}

                          {!item.is_reviewed && (
                            <button
                              onClick={() => setReviewingItem(item)}
                              style={{
                                display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 700,
                                background: "#ffffff", border: "1px solid rgba(95,135,118,0.3)",
                                borderRadius: "8px", color: "#5f8776",
                                padding: "6px 14px", cursor: "pointer", transition: "all 0.2s",
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(95,135,118,0.06)")}
                              onMouseLeave={(e) => (e.currentTarget.style.background = "#ffffff")}
                            >
                              <CheckCircle2 size={12} /> Mark Reviewed
                            </button>
                          )}

                          {item.url ? (
                            <a
                              href={item.url} target="_blank" rel="noopener noreferrer"
                              style={{
                                display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", fontWeight: 700,
                                background: "#ffffff", border: "1px solid rgba(232, 184, 75, 0.18)",
                                borderRadius: "8px", color: "#2d3142", textDecoration: "none",
                                padding: "6px 14px", cursor: "pointer", transition: "all 0.2s",
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = "#f4f5f7")}
                              onMouseLeave={(e) => (e.currentTarget.style.background = "#ffffff")}
                            >
                              <span>Official Circular</span>
                              <ChevronRight size={12} />
                            </a>
                          ) : (
                            <span
                              style={{
                                display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", fontWeight: 700,
                                background: "#f8f9fa", border: "1px solid rgba(0,0,0,0.06)",
                                borderRadius: "8px", color: "#94a3b8", textDecoration: "none",
                                padding: "6px 14px", cursor: "not-allowed",
                              }}
                              title="No URL available for this circular"
                            >
                              <span>Official Circular</span>
                              <ChevronRight size={12} />
                            </span>
                          )}
                        </div>


                        <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "#94a3b8", fontWeight: 600 }}>
                          <Calendar size={12} />
                          <span>{new Date(item.published_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>


        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>


          <div
            style={{
              background: "#ffffff",
              border: "1px solid rgba(232, 184, 75, 0.18)",
              borderRadius: "24px",
              padding: "24px",
              boxShadow: "0 10px 30px rgba(45, 49, 66, 0.015)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
            }}
          >
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "16px" }}>
              Actionables Reviewed
            </span>


            <div style={{ position: "relative", width: "110px", height: "110px", marginBottom: "16px" }}>
              <svg width="110" height="110" viewBox="0 0 110 110">
                <circle cx="55" cy="55" r="45" fill="none" stroke="#f1f5f9" strokeWidth="8" />
                <circle
                  cx="55"
                  cy="55"
                  r="45"
                  fill="none"
                  stroke="#e8b84b"
                  strokeWidth="8"
                  strokeDasharray="282.74"
                  strokeDashoffset={282.74 * (1 - actionablePercent / 100)}
                  strokeLinecap="round"
                  transform="rotate(-90 55 55)"
                  style={{ transition: "stroke-dashoffset 0.4s ease" }}
                />
              </svg>
              <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", display: "flex", flexDirection: "column", alignItems: "center" }}>
                <span style={{ fontSize: "20px", fontWeight: 800, color: "#2d3142", lineHeight: 1 }}>
                  {actionablePercent}%
                </span>
                <span style={{ fontSize: "8px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", marginTop: "2px" }}>
                  Reviewed
                </span>
              </div>
            </div>

            <p style={{ fontSize: "12.5px", color: "#475569", lineHeight: 1.5, fontWeight: 500, padding: "0 8px" }}>
              <strong>{reviewedActionables} of {totalActionables}</strong> regulatory alerts marked reviewed and securely logged.
            </p>
          </div>


          <div
            style={{
              background: "#ffffff",
              border: "1px solid rgba(232, 184, 75, 0.18)",
              borderRadius: "24px",
              padding: "24px",
              boxShadow: "0 10px 30px rgba(45, 49, 66, 0.015)",
            }}
          >
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "16px" }}>
              Alert Severity Breakdown
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {[
                { label: "Critical Alerts", count: criticalCount, color: "#b35d5d", bg: "rgba(179, 93, 93, 0.08)" },
                { label: "High Alerts", count: highCount, color: "#c49a2e", bg: "rgba(196, 154, 46, 0.08)" },
                { label: "Medium Alerts", count: mediumCount, color: "#4a607a", bg: "rgba(74, 96, 122, 0.08)" },
                { label: "Low Alerts", count: lowCount, color: "#5f8776", bg: "rgba(95, 135, 118, 0.08)" },
              ].map((s) => (
                <div key={s.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "12.5px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: s.color }} />
                    <span style={{ color: "#2d3142", fontWeight: 600 }}>{s.label}</span>
                  </div>
                  <span style={{ fontSize: "10px", fontWeight: 700, color: s.color, background: s.bg, padding: "2px 8px", borderRadius: "6px", border: `1px solid ${s.color}15` }}>
                    {s.count} circulars
                  </span>
                </div>
              ))}
            </div>
          </div>


          <div
            style={{
              background: "linear-gradient(135deg, #2d3142 0%, #1a1c27 100%)",
              borderRadius: "24px",
              padding: "24px",
              color: "#ffffff",
              boxShadow: "0 10px 30px rgba(45, 49, 66, 0.05)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div style={{ position: "absolute", bottom: "-30px", right: "-30px", width: "100px", height: "100px", borderRadius: "50%", background: "rgba(232, 184, 75, 0.08)", filter: "blur(20px)" }} />
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
              <ShieldAlert size={16} style={{ color: "#e8b84b" }} />
              <h3 style={{ fontSize: "14px", fontWeight: 800, letterSpacing: "-0.01em", color: "#ffffff" }}>
                AI Compliance Tip
              </h3>
            </div>
            <p style={{ fontSize: "12px", color: "#94a3b8", lineHeight: 1.6, fontWeight: 500 }}>
              Use the "AI Impact" button on any RBI/SEBI Circular card to instantly run an automatic compliance liability extraction via Llama 3!
            </p>
          </div>

        </div>

      </div>


      {reviewingItem && (
        <ReviewModal
          item={reviewingItem}
          onClose={() => setReviewingItem(null)}
          onSave={(notes) => submitReview(reviewingItem, notes)}
        />
      )}
      {addingFeed && (
        <AddFeedModal
          onClose={() => setAddingFeed(false)}
          onAdded={loadFeeds}
        />
      )}
    </div>
  );
}
