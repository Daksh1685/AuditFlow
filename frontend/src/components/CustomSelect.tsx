"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  style?: React.CSSProperties;
  triggerPadding?: string;
}

export default function CustomSelect({
  options,
  value,
  onChange,
  style = {},
  triggerPadding,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        display: "inline-block",
        width: "100%",
        fontFamily: "Inter, sans-serif",
        ...style,
      }}
    >
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#ffffff",
          border: "1px solid rgba(232, 184, 75, 0.18)",
          borderRadius: "12px",
          padding: triggerPadding || "10px 14px",
          color: "#2d3142",
          fontSize: "13px",
          fontWeight: 600,
          textAlign: "left",
          cursor: "pointer",
          outline: "none",
          transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "#e8b84b";
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.borderColor = "rgba(232, 184, 75, 0.18)";
          }
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {selectedOption?.label}
        </span>
        <ChevronDown
          size={14}
          style={{
            color: "#64748b",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
            flexShrink: 0,
            marginLeft: "8px",
          }}
        />
      </button>

      
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            width: "100%",
            background: "#ffffff",
            border: "1px solid rgba(232, 184, 75, 0.18)",
            borderRadius: "12px",
            boxShadow: "0 10px 30px rgba(45, 49, 66, 0.08)",
            zIndex: 1000,
            maxHeight: "220px",
            overflowY: "auto",
            padding: "4px",
          }}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <div
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                style={{
                  padding: "10px 12px",
                  fontSize: "13px",
                  fontWeight: isSelected ? 700 : 500,
                  color: isSelected ? "#c49a2e" : "#475569",
                  background: isSelected ? "rgba(232, 184, 75, 0.06)" : "transparent",
                  borderRadius: "8px",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(232, 184, 75, 0.08)";
                  e.currentTarget.style.color = "#c49a2e";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isSelected
                    ? "rgba(232, 184, 75, 0.06)"
                    : "transparent";
                  e.currentTarget.style.color = isSelected ? "#c49a2e" : "#475569";
                }}
              >
                {opt.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
