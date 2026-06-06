import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/contexts/AuthContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "AuditFlow — AI-Powered Compliance Intelligence for Indian Finance",
  description:
    "Chat with SEBI, RBI, FIU-IND, and Ind AS regulatory documents using AI. Automated gap analysis, live regulatory feeds, and immutable audit trails — built for Indian financial compliance teams.",
  keywords: ["compliance", "SEBI", "RBI", "FIU-IND", "Ind AS", "audit", "AML", "AI", "India", "regulatory"],
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "#16161f",
                color: "#f1f5f9",
                border: "1px solid #2a2a3a",
                borderRadius: "12px",
                fontSize: "14px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
              },
              success: {
                iconTheme: { primary: "#5f8776", secondary: "#16161f" },
              },
              error: {
                iconTheme: { primary: "#b35d5d", secondary: "#16161f" },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
