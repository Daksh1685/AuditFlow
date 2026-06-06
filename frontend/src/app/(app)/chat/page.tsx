"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRefetchOnFocus } from "@/hooks/useRefetchOnFocus";
import {
  queryApi,
  conversationsApi,
  ConversationSchema,
  MessageSchema,
  QueryResponse,
  SourceChunk,
} from "@/lib/api";
import toast from "react-hot-toast";
import {
  Send,
  Plus,
  Trash2,
  BookOpen,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Loader2,
  Shield,
  Clock,
  Zap,
  Eye,
  Download,
} from "lucide-react";
import PDFViewer from "@/components/PDFViewer";

function parseInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const re = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const raw = m[0];
    if (raw.startsWith("**")) {
      parts.push(<strong key={m.index} style={{ fontWeight: 700 }}>{raw.slice(2, -2)}</strong>);
    } else if (raw.startsWith("`")) {
      parts.push(
        <code key={m.index} style={{
          background: "rgba(45,49,66,0.07)", borderRadius: "4px",
          padding: "1px 5px", fontSize: "92%", fontFamily: "monospace",
        }}>{raw.slice(1, -1)}</code>
      );
    } else {
      parts.push(<em key={m.index}>{raw.slice(1, -1)}</em>);
    }
    last = m.index + raw.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length ? parts : [text];
}

function MarkdownText({ content, isUser }: { content: string; isUser: boolean }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let olItems: React.ReactNode[] = [];
  let ulItems: React.ReactNode[] = [];

  const flushOl = () => {
    if (olItems.length) {
      elements.push(<ol key={`ol-${elements.length}`} style={{ margin: "6px 0", paddingLeft: "20px", lineHeight: 1.7 }}>{olItems}</ol>);
      olItems = [];
    }
  };
  const flushUl = () => {
    if (ulItems.length) {
      elements.push(<ul key={`ul-${elements.length}`} style={{ margin: "6px 0", paddingLeft: "20px", lineHeight: 1.7 }}>{ulItems}</ul>);
      ulItems = [];
    }
  };

  lines.forEach((line, i) => {
    if (/^---+$/.test(line.trim())) {
      flushOl(); flushUl();
      elements.push(<hr key={i} style={{ border: "none", borderTop: "1px solid rgba(0,0,0,0.1)", margin: "8px 0" }} />);
      return;
    }
    const hMatch = line.match(/^(#{1,3})\s+(.+)/);
    if (hMatch) {
      flushOl(); flushUl();
      const lvl = hMatch[1].length;
      const sz = lvl === 1 ? "16px" : lvl === 2 ? "14px" : "13px";
      elements.push(<p key={i} style={{ fontWeight: 800, fontSize: sz, margin: "10px 0 4px", color: isUser ? "#fff" : "#2d3142" }}>{parseInline(hMatch[2])}</p>);
      return;
    }
    const olMatch = line.match(/^(\d+)[.)\s]\s*(.*)/);
    if (olMatch) {
      flushUl();
      olItems.push(<li key={i} style={{ marginBottom: "2px" }}>{parseInline(olMatch[2])}</li>);
      return;
    }
    const ulMatch = line.match(/^[*\-+]\s+(.*)/);
    if (ulMatch) {
      flushOl();
      ulItems.push(<li key={i} style={{ marginBottom: "2px" }}>{parseInline(ulMatch[1])}</li>);
      return;
    }
    if (line.trim() === "") {
      flushOl(); flushUl();
      if (elements.length && (elements[elements.length - 1] as React.ReactElement)?.type !== "br")
        elements.push(<br key={`br-${i}`} />);
      return;
    }
    flushOl(); flushUl();
    elements.push(<span key={i} style={{ display: "block", marginBottom: "2px" }}>{parseInline(line)}</span>);
  });

  flushOl(); flushUl();
  return <div style={{ lineHeight: 1.65 }}>{elements}</div>;
}


interface SourceCardProps {
  source: SourceChunk;
  onSelect: () => void;
}

function SourceCard({ source, onSelect }: SourceCardProps) {
  const [expanded, setExpanded] = useState(false);
  const pct = Math.round(source.relevance_score * 100);

  return (
    <div
      style={{
        marginBottom: "8px",
        background: "rgba(232, 184, 75, 0.04)",
        border: "1px solid rgba(232, 184, 75, 0.15)",
        borderRadius: "10px",
        padding: "12px 14px",
        transition: "border-color 0.2s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(232, 184, 75, 0.35)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(232, 184, 75, 0.15)")}
    >
      <div
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
      >
        
        <div
          onClick={onSelect}
          title="Click to view inside document"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flex: 1,
            minWidth: 0,
            cursor: "pointer",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          <BookOpen size={13} style={{ color: "#e8b84b", flexShrink: 0 }} />
          <span
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color: "#2d3142",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {source.source_doc}
          </span>
          <span style={{ fontSize: "11px", color: "#64748b", flexShrink: 0 }}>
            p.{source.page}
          </span>
          <Eye size={11} style={{ color: "#e8b84b", flexShrink: 0 }} />
        </div>

        
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: pct >= 70 ? "#5f8776" : pct >= 50 ? "#c49a2e" : "#64748b",
              background: pct >= 70 ? "rgba(95,135,118,0.1)" : pct >= 50 ? "rgba(196,154,46,0.1)" : "rgba(100,116,139,0.1)",
              padding: "2px 8px",
              borderRadius: "10px",
            }}
          >
            {pct}%
          </span>
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              background: "none",
              border: "none",
              color: "#64748b",
              cursor: "pointer",
              display: "flex",
            }}
          >
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>
      </div>
      {expanded && (
        <p
          className="mono"
          style={{
            marginTop: "10px",
            color: "#64748b",
            lineHeight: 1.6,
            fontSize: "11.5px",
            borderTop: "1px solid rgba(232, 184, 75, 0.15)",
            paddingTop: "10px",
          }}
        >
          {source.text}
        </p>
      )}
    </div>
  );
}

interface MessageProps {
  msg: MessageSchema;
  onSelectSource: (source: SourceChunk) => void;
}

function ConfidencePill({ sources }: { sources: SourceChunk[] }) {
  if (!sources.length) return null;
  const avg = sources.reduce((s, c) => s + c.relevance_score, 0) / sources.length;
  const pct = Math.round(avg * 100);
  const color = pct >= 75 ? "#5f8776" : pct >= 50 ? "#c49a2e" : "#b35d5d";
  const bg = pct >= 75 ? "rgba(95,135,118,0.1)" : pct >= 50 ? "rgba(196,154,46,0.1)" : "rgba(179,93,93,0.1)";
  const label = pct >= 75 ? "High confidence" : pct >= 50 ? "Medium confidence" : "Low confidence";

  return (
    <span
      title={`Average chunk relevance: ${pct}%`}
      style={{
        fontSize: "10px",
        fontWeight: 700,
        color,
        background: bg,
        border: `1px solid ${color}30`,
        padding: "2px 8px",
        borderRadius: "10px",
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        cursor: "default",
      }}
    >
      <span style={{ fontSize: "8px" }}>●</span>
      {label} ({pct}%)
    </span>
  );
}

function Message({ msg, onSelectSource }: MessageProps) {
  const [showSources, setShowSources] = useState(false);
  const isUser = msg.role === "user";
  const sources = (msg.sources as SourceChunk[]) || [];

  return (
    <div
      className="fade-up"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: isUser ? "flex-end" : "flex-start",
        marginBottom: "16px",
      }}
    >
      <div
        style={{
          background: isUser ? "linear-gradient(135deg, #e8b84b 0%, #c49a2e 100%)" : "#f4f5f7",
          border: isUser ? "none" : "1px solid rgba(232, 184, 75, 0.08)",
          color: isUser ? "#ffffff" : "#2d3142",
          borderRadius: isUser ? "18px 18px 4px 18px" : "4px 18px 18px 18px",
          padding: "12px 16px",
          maxWidth: isUser ? "80%" : "85%",
          lineHeight: 1.6,
          fontSize: "14px",
          fontWeight: 500,
          boxShadow: isUser ? "0 4px 10px rgba(232, 184, 75, 0.15)" : "none",
        }}
      >
        {isUser ? msg.content : <MarkdownText content={msg.content} isUser={false} />}
      </div>

      {!isUser && sources.length > 0 && (
        <div style={{ maxWidth: "85%", marginTop: "6px" }}>
          
          <div style={{ marginBottom: "6px" }}>
            <ConfidencePill sources={sources} />
          </div>
          <button
            onClick={() => setShowSources(!showSources)}
            style={{
              background: "none",
              border: "none",
              color: "#e8b84b",
              fontSize: "12px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "5px",
              padding: "4px 0",
              fontFamily: "Inter, sans-serif",
              fontWeight: 600,
            }}
          >
            <BookOpen size={13} />
            {showSources ? "Hide" : "Show"} {sources.length} source
            {sources.length !== 1 ? "s" : ""}
            {showSources ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
          {showSources && (
            <div style={{ marginTop: "8px" }}>
              {sources.map((s, i) => (
                <SourceCard key={i} source={s} onSelect={() => onSelectSource(s)} />
              ))}
            </div>
          )}
        </div>
      )}

      <span style={{ fontSize: "10px", color: "#64748b", marginTop: "4px" }}>
        {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </span>
    </div>
  );
}

export default function ChatPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationSchema[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageSchema[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [lastMeta, setLastMeta] = useState<Pick<QueryResponse, "retrieval_time_ms" | "generation_time_ms" | "chunks_retrieved"> | null>(null);
  const [activePDF, setActivePDF] = useState<{ docId: string; filename: string; page: number } | null>(null);
  const [convListOpen, setConvListOpen] = useState(false);
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const loadConversations = async () => {
    try {
      const { data } = await conversationsApi.list();
      setConversations(data);
    } finally {
      setLoadingConvs(false);
    }
  };

  const loadMessages = async (convId: string) => {
    try {
      const { data } = await conversationsApi.get(convId);
      setMessages(data.messages);
    } catch {
      toast.error("Could not load conversation");
    }
  };

  useEffect(() => { loadConversations(); }, [user?.id]); // reload per user
  useRefetchOnFocus(loadConversations, [user?.id]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const selectConversation = async (id: string) => {
    setActiveConvId(id);
    setLastMeta(null);
    setActivePDF(null);
    setConvListOpen(false);
    await loadMessages(id);
  };

  const startNew = () => {
    setActiveConvId(null);
    setMessages([]);
    setLastMeta(null);
    setActivePDF(null);
    inputRef.current?.focus();
  };

  const deleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await conversationsApi.delete(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConvId === id) startNew();
      toast.success("Conversation deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const sendMessage = async () => {
    const q = input.trim();
    if (!q || loading) return;
    setInput("");
    setLoading(true);

    const tempId = `temp-user-${Date.now()}`;

    const tempUserMsg: MessageSchema = {
      id: tempId,
      role: "user",
      content: q,
      sources: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const { data } = await queryApi.ask({
        query: q,
        conversation_id: activeConvId || undefined,
        top_k: 5,
        include_sources: true,
      });

      const assistantMsg: MessageSchema = {
        id: data.message_id,
        role: "assistant",
        content: data.answer,
        sources: data.sources as unknown as SourceChunk[],
        created_at: new Date().toISOString(),
      };

      const finalUserMsg: MessageSchema = {
        ...tempUserMsg,
        id: `user-${data.message_id}`,
      };

      setMessages((prev) => [...prev.filter((m) => m.id !== tempId), finalUserMsg, assistantMsg]);
      setLastMeta({
        retrieval_time_ms: data.retrieval_time_ms,
        generation_time_ms: data.generation_time_ms,
        chunks_retrieved: data.chunks_retrieved,
      });

      if (!activeConvId) {
        setActiveConvId(data.conversation_id);
        await loadConversations();
      } else {
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConvId ? { ...c, message_count: c.message_count + 2, updated_at: new Date().toISOString() } : c
          )
        );
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      toast.error("Query failed. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const exportChat = async () => {
    if (!messages.length) return;
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 18;
      let y = margin;

      const addPage = () => {
        doc.addPage();
        y = margin;
      };

      const checkY = (needed: number) => {
        if (y + needed > pageH - margin) addPage();
      };

      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, pageW, 22, "F");
      doc.setTextColor(99, 102, 241);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("AuditFlow — Compliance AI", margin, 14);
      doc.setTextColor(148, 163, 184);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`Exported: ${new Date().toLocaleString()}`, pageW - margin, 14, { align: "right" });

      y = 32;

      messages.forEach((msg) => {
        const isUser = msg.role === "user";
        const sources = (msg.sources as SourceChunk[]) || [];
        const role = isUser ? "You" : "Compliance AI";
        const time = new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

        checkY(20);

        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(isUser ? 99 : 16, isUser ? 102 : 185, isUser ? 241 : 129);
        doc.text(`${role}  ·  ${time}`, margin, y);
        y += 5;

        doc.setFont("helvetica", "normal");
        doc.setTextColor(30, 41, 59);
        doc.setFontSize(10);
        const lines = doc.splitTextToSize(msg.content, pageW - margin * 2);
        lines.forEach((line: string) => {
          checkY(6);
          doc.text(line, margin, y);
          y += 5.5;
        });

        if (!isUser && sources.length > 0) {
          checkY(6);
          doc.setFontSize(8);
          doc.setTextColor(100, 116, 139);
          doc.text(`Sources: ${sources.map((s) => `${s.source_doc} p.${s.page}`).join(" · ")}`, margin, y);
          y += 5;
        }

        checkY(6);
        doc.setDrawColor(226, 232, 240);
        doc.line(margin, y, pageW - margin, y);
        y += 6;
      });

      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(`Page ${i} of ${totalPages}`, pageW / 2, pageH - 8, { align: "center" });
      }

      doc.save(`AuditFlow-Chat-${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success("Conversation exported as PDF");
    } catch (err) {
      console.error(err);
      toast.error("Failed to export PDF");
    }
  };

  return (
    <div className="chat-shell" style={{ display: "flex", height: "100%", overflow: "hidden", background: "#faf9f6" }}>
      
      <div
        className={`chat-conv-sidebar${convListOpen ? " expanded" : ""}`}
        style={{
          width: "260px",
          flexShrink: 0,
          borderRight: "1px solid rgba(232, 184, 75, 0.12)",
          display: "flex",
          flexDirection: "column",
          background: "#ffffff",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "14px 12px", borderBottom: "1px solid rgba(232, 184, 75, 0.08)", display: "flex", gap: "8px" }}>
          <button
            onClick={startNew}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "10px",
              background: "linear-gradient(135deg, #e8b84b 0%, #c49a2e 100%)",
              border: "none",
              borderRadius: "12px",
              color: "#ffffff",
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 4px 10px rgba(232, 184, 75, 0.15)",
              transition: "transform 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "none")}
          >
            <Plus size={16} /> New Chat
          </button>
          
          <button
            className="conv-list-toggle"
            onClick={() => setConvListOpen(!convListOpen)}
            title={convListOpen ? "Hide history" : "Show history"}
            style={{
              background: "#f4f5f7",
              border: "1px solid rgba(232, 184, 75, 0.12)",
              borderRadius: "8px",
              color: "#64748b",
              cursor: "pointer",
              padding: "0 10px",
              display: "none",
              alignItems: "center",
            }}
          >
            {convListOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
          {loadingConvs ? (
            <div style={{ padding: "20px", textAlign: "center" }}>
              <Loader2 size={20} style={{ color: "#64748b", animation: "spin 0.8s linear infinite" }} />
            </div>
          ) : conversations.length === 0 ? (
            <p style={{ padding: "20px 10px", textAlign: "center", color: "#64748b", fontSize: "12px", fontWeight: 500 }}>
              No conversations yet. Start asking!
            </p>
          ) : (
            conversations.map((conv) => {
              const active = activeConvId === conv.id;
              return (
                <div
                  key={conv.id}
                  onClick={() => selectConversation(conv.id)}
                  style={{
                    padding: "10px 12px",
                    borderRadius: "10px",
                    cursor: "pointer",
                    background: active ? "rgba(232, 184, 75, 0.08)" : "transparent",
                    border: `1px solid ${active ? "rgba(232, 184, 75, 0.22)" : "transparent"}`,
                    marginBottom: "4px",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "8px",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) e.currentTarget.style.background = "#f4f5f7";
                  }}
                  onMouseLeave={(e) => {
                    if (!active) e.currentTarget.style.background = "transparent";
                  }}
                >
                  <MessageSquare size={14} style={{ color: active ? "#e8b84b" : "#64748b", marginTop: "2px", flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: "12px",
                        fontWeight: 600,
                        color: active ? "#2d3142" : "#64748b",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        marginBottom: "2px",
                      }}
                    >
                      {conv.title || "Untitled conversation"}
                    </p>
                    <p style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 500 }}>
                      {conv.message_count} messages
                    </p>
                  </div>
                  <button
                    onClick={(e) => deleteConversation(conv.id, e)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#94a3b8",
                      cursor: "pointer",
                      padding: "2px",
                      flexShrink: 0,
                      opacity: 0,
                      transition: "opacity 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
                    className="sidebar-conv-delete"
                  >
                    <Trash2 size={12} />
                  </button>
                  <style>{`
                    div:hover > .sidebar-conv-delete { opacity: 1 !important; }
                  `}</style>
                </div>
              );
            })
          )}
        </div>
      </div>

      
      <div className="chat-workspace" style={{ flex: 1, display: "flex", overflow: "hidden", minWidth: 0 }}>
        
        
        <div
          style={{
            flex: activePDF ? "0 0 60%" : "1",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            borderRight: activePDF ? "1px solid rgba(232, 184, 75, 0.12)" : "none",
          }}
        >
          
          <div
            style={{
              padding: "14px 24px",
              borderBottom: "1px solid rgba(232, 184, 75, 0.08)",
              background: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Shield size={18} style={{ color: "#e8b84b" }} />
              <span style={{ fontWeight: 800, fontSize: "15px", color: "#2d3142", letterSpacing: "-0.02em" }}>Compliance AI</span>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "#10b981",
                  background: "rgba(16, 185, 129, 0.08)",
                  border: "1px solid rgba(16, 185, 129, 0.2)",
                  padding: "2px 8px",
                  borderRadius: "20px",
                  textTransform: "uppercase",
                  letterSpacing: "0.03em",
                }}
              >
                Grounded
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              {lastMeta && (
                <div style={{ display: "flex", gap: "16px" }}>
                  {[
                    { icon: Zap, label: `${lastMeta.retrieval_time_ms.toFixed(0)}ms retrieval` },
                    { icon: Clock, label: `${lastMeta.generation_time_ms.toFixed(0)}ms generation` },
                    { icon: BookOpen, label: `${lastMeta.chunks_retrieved} sources` },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                      <Icon size={12} style={{ color: "#64748b" }} />
                      <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 500 }}>{label}</span>
                    </div>
                  ))}
                </div>
              )}
              {messages.length > 0 && (
                <button
                  onClick={exportChat}
                  title="Download conversation as PDF"
                  style={{
                    background: "#ffffff",
                    border: "1px solid rgba(232, 184, 75, 0.18)",
                    borderRadius: "10px",
                    padding: "6px 12px",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#2d3142",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f4f5f7")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "#ffffff")}
                >
                  <Download size={13} /> Export
                </button>
              )}
            </div>
          </div>

          
          <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px", background: "#faf9f6" }}>
            {messages.length === 0 && (
              <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <div
                  style={{
                    width: "64px",
                    height: "64px",
                    borderRadius: "20px",
                    background: "linear-gradient(135deg, #e8b84b 0%, #c49a2e 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "16px",
                    boxShadow: "0 10px 30px rgba(232, 184, 75, 0.2)",
                    animation: "spin-slow 8s linear infinite",
                  }}
                >
                  <Shield size={28} color="white" />
                </div>
                <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#2d3142", marginBottom: "8px", letterSpacing: "-0.02em" }}>
                  Ask a compliance question
                </h2>
                <p style={{ color: "#64748b", fontSize: "13px", fontWeight: 500, textAlign: "center", maxWidth: "380px", lineHeight: 1.6 }}>
                  I will search through your indexed regulatory documents and provide grounded answers with source citations.
                </p>
                <div style={{ display: "flex", gap: "10px", marginTop: "24px", flexWrap: "wrap", justifyContent: "center", maxWidth: "680px" }}>
                  {[
                    { label: "Summarize Document", prompt: "Summarize this document: provide a concise executive summary, highlighting its primary purpose and key takeaways." },
                    { label: "Analyze Compliance Gaps", prompt: "Analyze this document for compliance: identify any potential regulatory gaps, policy ambiguities, or missing implementation details." },
                    { label: "Extract Deadlines & Duties", prompt: "Extract compliance duties: list all reporting deadlines, action items, and penalty provisions specified in this document." },
                    { label: "Generate Audit Checklist", prompt: "Generate an audit checklist: create a comprehensive, step-by-step audit verification checklist for assessing compliance with these policies." },
                  ].map((t) => (
                    <button
                      key={t.label}
                      onClick={() => { setInput(t.prompt); inputRef.current?.focus(); }}
                      style={{
                        background: "#ffffff",
                        border: "1px solid rgba(232, 184, 75, 0.15)",
                        borderRadius: "20px",
                        padding: "8px 16px",
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#64748b",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        fontFamily: "Inter, sans-serif",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "#e8b84b";
                        e.currentTarget.style.color = "#e8b84b";
                        e.currentTarget.style.background = "rgba(232, 184, 75, 0.02)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "rgba(232, 184, 75, 0.15)";
                        e.currentTarget.style.color = "#64748b";
                        e.currentTarget.style.background = "#ffffff";
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <Message
                key={msg.id}
                msg={msg}
                onSelectSource={(s) => setActivePDF({ docId: s.doc_id, filename: s.source_doc, page: s.page })}
              />
            ))}

            {loading && (
              <div className="fade-up" style={{ display: "flex", alignItems: "flex-start", marginBottom: "16px" }}>
                <div
                  style={{
                    background: "#f4f5f7",
                    border: "1px solid rgba(232, 184, 75, 0.08)",
                    color: "#2d3142",
                    borderRadius: "4px 18px 18px 18px",
                    padding: "14px 16px",
                    maxWidth: "85%",
                    fontSize: "13px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    fontWeight: 500,
                  }}
                >
                  <Loader2 size={16} style={{ animation: "spin 0.8s linear infinite", color: "#e8b84b" }} />
                  <span style={{ color: "#64748b" }}>Searching documents and generating answer...</span>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          
          <div
            style={{
              padding: "16px 24px",
              borderTop: "1px solid rgba(232, 184, 75, 0.08)",
              background: "#ffffff",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: "12px",
                alignItems: "flex-end",
                background: "#f4f5f7",
                border: "1px solid rgba(232, 184, 75, 0.12)",
                borderRadius: "14px",
                padding: "12px 16px",
                transition: "border-color 0.2s, background 0.2s",
              }}
              onFocusCapture={(e) => {
                e.currentTarget.style.borderColor = "#e8b84b";
                e.currentTarget.style.background = "#ffffff";
              }}
              onBlurCapture={(e) => {
                e.currentTarget.style.borderColor = "rgba(232, 184, 75, 0.12)";
                e.currentTarget.style.background = "#f4f5f7";
              }}
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a compliance or accounting question... (Enter to send, Shift+Enter for newline)"
                rows={1}
                style={{
                  flex: 1,
                  background: "none",
                  border: "none",
                  outline: "none",
                  color: "#2d3142",
                  fontSize: "14px",
                  fontFamily: "Inter, sans-serif",
                  resize: "none",
                  lineHeight: 1.5,
                  maxHeight: "120px",
                  overflowY: "auto",
                  fontWeight: 500,
                }}
                onInput={(e) => {
                  const el = e.currentTarget;
                  el.style.height = "auto";
                  el.style.height = Math.min(el.scrollHeight, 120) + "px";
                }}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                style={{
                  padding: "8px 16px",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "13px",
                  fontWeight: 700,
                  border: "none",
                  borderRadius: "10px",
                  color: "#ffffff",
                  background: "linear-gradient(135deg, #e8b84b 0%, #c49a2e 100%)",
                  cursor: (!input.trim() || loading) ? "not-allowed" : "pointer",
                  opacity: (!input.trim() || loading) ? 0.6 : 1,
                  boxShadow: (!input.trim() || loading) ? "none" : "0 4px 10px rgba(232, 184, 75, 0.15)",
                }}
                id="send-btn"
              >
                <Send size={15} />
                Send
              </button>
            </div>
            <p style={{ fontSize: "11px", color: "#94a3b8", marginTop: "8px", textAlign: "center", fontWeight: 500 }}>
              Answers are grounded solely in indexed compliance documentation · All queries are audit-logged
            </p>
          </div>
        </div>

        
        {activePDF && (
          <div
            className="fade-in"
            style={{
              flex: "0 0 40%",
              height: "100%",
              overflow: "hidden",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            <PDFViewer
              docId={activePDF.docId}
              filename={activePDF.filename}
              page={activePDF.page}
              onClose={() => setActivePDF(null)}
            />
          </div>
        )}
        
      </div>
    </div>
  );
}
