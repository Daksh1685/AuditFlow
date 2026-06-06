"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import {
  Shield,
  MessageSquare,
  FileText,
  BarChart3,
  Users,
  LogOut,
  Rss,
  Search,
  HelpCircle,
  Menu,
  X,
} from "lucide-react";

const NAV = [
  { href: "/dashboard",        label: "Dashboard",        icon: BarChart3 },
  { href: "/chat",             label: "Ask AI",           icon: MessageSquare },
  { href: "/documents",        label: "Documents",        icon: FileText },
  { href: "/gap-analyzer",     label: "Gap Analyzer",     icon: Shield },
  { href: "/regulatory-feeds", label: "Regulatory Feeds", icon: Rss },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout, isAdmin } = useAuth();
  const router   = useRouter();
  const pathname = usePathname();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    ...NAV,
    ...(isAdmin ? [
      { href: "/admin",        label: "Admin Panel" },
      { href: "/audit-trail",   label: "Audit Trail" },
    ] : []),
  ];

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#faf9f6",
          textAlign: "center",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <div>
          <div
            style={{
              width: "44px",
              height: "44px",
              border: "3px solid rgba(232, 184, 75, 0.15)",
              borderTopColor: "#e8b84b",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
              margin: "0 auto 16px",
            }}
          />
          <p style={{ color: "#64748b", fontSize: "14px", fontWeight: 500 }}>Loading AuditFlow...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#faf9f6",
        padding: "0px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Inter, sans-serif",
        position: "relative",
        boxSizing: "border-box",
      }}
    >
      
      <style>{`
        .navbar-pills::-webkit-scrollbar { display: none; }
        @media (max-width: 950px) {
          .desktop-navbar { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
          .desktop-actions { display: none !important; }
        }
      `}</style>

      
      <div
        style={{
          width: "100vw",
          height: "100vh",
          minHeight: "100vh",
          background: "#ffffff",
          borderRadius: "0px",
          border: "none",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          position: "relative",
          zIndex: 1,
        }}
      >
        
        <header
          style={{
            background: "#ffffff",
            borderBottom: "1px solid rgba(232, 184, 75, 0.08)",
            padding: "16px 36px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
            zIndex: 10,
          }}
        >
          
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "#ffffff",
                boxShadow: "0 4px 10px rgba(45, 49, 66, 0.03)",
                border: "1px solid rgba(232, 184, 75, 0.15)",
                padding: "2px",
              }}
            >
              <svg width="26" height="26" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="6" y="6" width="116" height="116" rx="28" fill="#2d3142" stroke="#e8b84b" strokeOpacity={0.15} strokeWidth={2}/>
                <path d="M38 90 L64 38 L90 90" stroke="#FFFFFF" strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                <path d="M50 74 L68 56 L82 66 L112 36" stroke="#e8b84b" strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              </svg>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "16px", fontWeight: 800, color: "#2d3142", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
                AuditFlow
              </span>
              <span style={{ fontSize: "9px", fontWeight: 700, color: "#64748b", letterSpacing: "0.06em" }}>
                COMPLIANCE AI
              </span>
            </div>
          </div>

          
          <nav
            className="desktop-navbar"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "#f4f5f7",
              padding: "4px",
              borderRadius: "100px",
            }}
          >
            {navItems.map(({ href, label }) => {
              const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  style={{
                    padding: "8px 20px",
                    borderRadius: "100px",
                    fontSize: "13px",
                    fontWeight: active ? 700 : 600,
                    textDecoration: "none",
                    color: active ? "#ffffff" : "#64748b",
                    background: active ? "#2d3142" : "transparent",
                    boxShadow: active ? "0 4px 10px rgba(45, 49, 66, 0.15)" : "none",
                    transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          
          <div
            className="desktop-actions"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
            }}
          >
            
            <Link
              href="/faq"
              style={{
                color: "#64748b",
                padding: "8px",
                borderRadius: "100px",
                display: "flex",
                transition: "background 0.2s",
                textDecoration: "none",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f4f5f7")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
            >
              <HelpCircle size={18} />
            </Link>

            
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "100px",
                background: "linear-gradient(135deg, #e8b84b 0%, #c49a2e 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                fontSize: "14px",
                fontWeight: 700,
                border: "1.5px solid #ffffff",
                boxShadow: "0 2px 6px rgba(232, 184, 75, 0.25)",
                cursor: "default",
              }}
            >
              {user.username[0].toUpperCase()}
            </div>

            
            <button
              onClick={logout}
              style={{
                background: "#ffffff",
                border: "1px solid rgba(179, 93, 93, 0.2)",
                borderRadius: "10px",
                padding: "6px 12px",
                fontSize: "12px",
                fontWeight: 600,
                color: "#b35d5d",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(179, 93, 93, 0.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#ffffff";
              }}
            >
              <LogOut size={13} />
              <span>Sign Out</span>
            </button>
          </div>

          
          <button
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              display: "none",
              background: "#f4f5f7",
              border: "none",
              color: "#2d3142",
              cursor: "pointer",
              padding: "8px",
              borderRadius: "8px",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </header>

        
        {mobileMenuOpen && (
          <div
            style={{
              background: "#ffffff",
              borderBottom: "1px solid rgba(232, 184, 75, 0.08)",
              padding: "16px 24px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              zIndex: 9,
            }}
          >
            {navItems.map(({ href, label }) => {
              const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    padding: "10px 16px",
                    borderRadius: "10px",
                    fontSize: "14px",
                    fontWeight: 600,
                    textDecoration: "none",
                    color: active ? "#ffffff" : "#64748b",
                    background: active ? "#2d3142" : "transparent",
                    transition: "all 0.2s",
                  }}
                >
                  {label}
                </Link>
              );
            })}
            <div style={{ height: "1px", background: "#f1f5f9", margin: "8px 0" }} />
            <button
              onClick={logout}
              style={{
                width: "100%",
                background: "none",
                border: "none",
                padding: "10px 16px",
                color: "#b35d5d",
                fontWeight: 600,
                fontSize: "14px",
                textAlign: "left",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        )}

        
        <div
          style={{
            flex: 1,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
