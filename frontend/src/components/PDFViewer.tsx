"use client";

import { X, ExternalLink, ShieldAlert, FileText, ChevronLeft, ChevronRight, RefreshCw, Download } from "lucide-react";
import { useEffect, useState } from "react";

interface PDFViewerProps {
  docId: string;
  filename: string;
  page: number;
  onClose: () => void;
}

interface PreviewPage {
  page: number;
  text: string;
}

export default function PDFViewer({ docId, filename, page, onClose }: PDFViewerProps) {
  const [currentPage, setCurrentPage] = useState(page);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [previewPages, setPreviewPages] = useState<PreviewPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fileExt = filename.split(".").pop()?.toLowerCase() || "";
  const isPdf = fileExt === "pdf";

  useEffect(() => {
    setCurrentPage(page);
  }, [page]);

  useEffect(() => {
    if (!isPdf) return;
    setLoading(true);
    setError(null);

    const token = localStorage.getItem("access_token") || "";

    fetch(`/api/v1/documents/${docId}/file?token=${token}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        return res.blob();
      })
      .then((blob) => {
        if (pdfUrl) URL.revokeObjectURL(pdfUrl);
        const objectUrl = URL.createObjectURL(blob);
        setPdfUrl(`${objectUrl}#page=${currentPage}`);
        setLoading(false);
      })
      .catch((err) => {
        console.error("PDF load error:", err);
        setError(err.message || "Failed to load PDF");
        setLoading(false);
      });

    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [docId, isPdf]);

  useEffect(() => {
    if (isPdf) return;
    setLoading(true);
    setError(null);

    const token = localStorage.getItem("access_token") || "";

    fetch(`/api/v1/documents/${docId}/preview?token=${token}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setPreviewPages(data.pages || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Preview load error:", err);
        setError("Could not load document preview.");
        setLoading(false);
      });
  }, [docId, isPdf]);

  useEffect(() => {
    if (!pdfUrl) return;
    const base = pdfUrl.split("#")[0];
    setPdfUrl(`${base}#page=${currentPage}`);
  }, [currentPage]);

  const handleDownload = () => {
    const token = localStorage.getItem("access_token") || "";
    const a = document.createElement("a");
    a.href = `/api/v1/documents/${docId}/file?token=${token}`;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleOpenInTab = () => {
    const token = localStorage.getItem("access_token") || "";
    window.open(`/api/v1/documents/${docId}/file?token=${token}`, "_blank");
  };

  const currentTextPage = previewPages.find((p) => p.page === currentPage) || previewPages[0];
  const maxPage = isPdf ? 999 : previewPages.length;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        borderLeft: "1px solid rgba(232, 184, 75, 0.12)",
        background: "#ffffff",
      }}
    >
      {}
      <div
        style={{
          padding: "14px 20px",
          borderBottom: "1px solid rgba(232, 184, 75, 0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#ffffff",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
          <FileText size={18} style={{ color: "#e8b84b", flexShrink: 0 }} />
          <span
            style={{
              fontWeight: 800,
              fontSize: "14px",
              color: "#2d3142",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              letterSpacing: "-0.01em",
            }}
          >
            {filename}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {}
          <button
            onClick={handleDownload}
            title="Download file"
            style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", display: "flex", transition: "color 0.15s" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#e8b84b")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#64748b")}
          >
            <Download size={16} />
          </button>
          {}
          <button
            onClick={handleOpenInTab}
            title="Open in new tab"
            style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", display: "flex", transition: "color 0.15s" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#e8b84b")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#64748b")}
          >
            <ExternalLink size={16} />
          </button>
          <button
            onClick={onClose}
            title="Close viewer"
            style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", display: "flex", transition: "color 0.15s" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#e8b84b")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#64748b")}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {}
      <div style={{ flex: 1, position: "relative", background: isPdf ? "#0f172a" : "#f8fafc", overflow: "auto" }}>
        {}
        {loading && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", color: "#64748b", fontSize: "13px" }}>
            <RefreshCw size={24} style={{ color: "#e8b84b", animation: "spin 1s linear infinite" }} />
            <span>Loading document...</span>
          </div>
        )}

        {}
        {!loading && error && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", padding: "20px", textAlign: "center" }}>
            <ShieldAlert size={32} style={{ color: "#f59e0b" }} />
            <p style={{ fontSize: "13px", color: "#64748b", maxWidth: "240px", lineHeight: 1.5 }}>{error}</p>
            <button onClick={handleDownload} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", padding: "8px 16px", background: "linear-gradient(135deg, #e8b84b, #c49a2e)", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 700 }}>
              <Download size={13} /> Download File
            </button>
          </div>
        )}

        {}
        {isPdf && pdfUrl && !loading && !error && (
          <object
            key={`${docId}-${currentPage}`}
            data={pdfUrl}
            type="application/pdf"
            style={{ width: "100%", height: "100%", border: "none" }}
          >
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "12px", padding: "20px", textAlign: "center" }}>
              <ShieldAlert size={32} style={{ color: "#f59e0b" }} />
              <p style={{ fontSize: "13px", color: "#64748b", lineHeight: 1.5 }}>Browser cannot display PDF inline.</p>
              <button onClick={handleDownload} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", padding: "8px 16px", background: "linear-gradient(135deg, #e8b84b, #c49a2e)", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 700 }}>
                <Download size={13} /> Download PDF
              </button>
            </div>
          </object>
        )}

        {}
        {!isPdf && !loading && !error && (
          <div style={{ padding: "24px", height: "100%", overflowY: "auto" }}>
            {}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
              <span style={{ background: "rgba(232, 184, 75, 0.12)", color: "#c49a2e", fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "20px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                .{fileExt} Document
              </span>
              {previewPages.length > 0 && (
                <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600 }}>
                  {previewPages.length} page{previewPages.length !== 1 ? "s" : ""} extracted
                </span>
              )}
            </div>

            {previewPages.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "#94a3b8" }}>
                <FileText size={32} style={{ marginBottom: "12px", opacity: 0.4 }} />
                <p style={{ fontSize: "13px" }}>No text content could be extracted from this document.</p>
                <button onClick={handleDownload} style={{ marginTop: "16px", display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", padding: "8px 16px", background: "linear-gradient(135deg, #e8b84b, #c49a2e)", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 700 }}>
                  <Download size={13} /> Download to Open
                </button>
              </div>
            ) : (
              <>
                {}
                {currentTextPage && (
                  <div
                    style={{
                      background: "#ffffff",
                      border: "1px solid rgba(232, 184, 75, 0.12)",
                      borderRadius: "12px",
                      padding: "20px 24px",
                      fontSize: "13px",
                      lineHeight: 1.8,
                      color: "#374151",
                      fontFamily: "'Georgia', serif",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                    }}
                  >
                    <div style={{ fontSize: "10px", fontWeight: 700, color: "#94a3b8", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      Page {currentTextPage.page}
                    </div>
                    {currentTextPage.text}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {}
      {!loading && !error && (isPdf ? !!pdfUrl : previewPages.length > 1) && (
        <div
          style={{
            padding: "10px 20px",
            borderTop: "1px solid rgba(232, 184, 75, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "16px",
            background: "#ffffff",
            flexShrink: 0,
          }}
        >
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            style={{ background: "none", border: "none", color: currentPage <= 1 ? "#94a3b8" : "#2d3142", opacity: currentPage <= 1 ? 0.4 : 1, cursor: currentPage <= 1 ? "default" : "pointer", display: "flex" }}
          >
            <ChevronLeft size={18} />
          </button>
          <span style={{ fontSize: "12px", fontWeight: 700, color: "#64748b" }}>
            Page {currentPage} {!isPdf && previewPages.length > 0 ? `of ${previewPages.length}` : ""}
          </span>
          <button
            onClick={() => setCurrentPage((p) => (isPdf ? p + 1 : Math.min(previewPages.length, p + 1)))}
            disabled={!isPdf && currentPage >= previewPages.length}
            style={{ background: "none", border: "none", color: "#2d3142", cursor: "pointer", display: "flex" }}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
