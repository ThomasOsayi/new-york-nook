"use client";

import { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  type Timestamp,
} from "firebase/firestore";
import "@/lib/auth";
import type { ConsultationData } from "@/lib/consultation";
import { useIsMobile, useIsTablet } from "@/hooks/useIsMobile";

/* ── Status config ─────────────────────────────────────── */
type InquiryStatus = "new" | "contacted" | "tasting" | "confirmed" | "completed" | "cancelled";

const STATUS_CONFIG: Record<InquiryStatus, { label: string; color: string; bg: string; ring: string }> = {
  new:       { label: "New",       color: "#60A5FA", bg: "rgba(96,165,250,0.10)",  ring: "rgba(96,165,250,0.25)" },
  contacted: { label: "Contacted", color: "#E8C468", bg: "rgba(232,196,104,0.10)", ring: "rgba(232,196,104,0.25)" },
  tasting:   { label: "Tasting",   color: "#E89B48", bg: "rgba(232,155,72,0.10)",  ring: "rgba(232,155,72,0.25)" },
  confirmed: { label: "Confirmed", color: "#5FBF7A", bg: "rgba(95,191,122,0.10)",  ring: "rgba(95,191,122,0.25)" },
  completed: { label: "Completed", color: "#6B7280", bg: "rgba(107,114,128,0.08)", ring: "rgba(107,114,128,0.20)" },
  cancelled: { label: "Cancelled", color: "#EF4444", bg: "rgba(239,68,68,0.08)",   ring: "rgba(239,68,68,0.20)" },
};

/* Status progression for the main action button */
const NEXT_STATUS: Partial<Record<InquiryStatus, InquiryStatus>> = {
  new:       "contacted",
  contacted: "tasting",
  tasting:   "confirmed",
  confirmed: "completed",
};

/* Linear flow for the visual stepper */
const STATUS_FLOW: InquiryStatus[] = ["new", "contacted", "tasting", "confirmed", "completed"];

/* Filter tabs shown in the UI */
const FILTER_TABS: { key: string; label: string; statuses: InquiryStatus[] }[] = [
  { key: "all",       label: "All",       statuses: ["new", "contacted", "tasting", "confirmed", "completed", "cancelled"] },
  { key: "new",       label: "New",       statuses: ["new"] },
  { key: "contacted", label: "Contacted", statuses: ["contacted"] },
  { key: "tasting",   label: "Tasting",   statuses: ["tasting"] },
  { key: "confirmed", label: "Confirmed", statuses: ["confirmed"] },
  { key: "completed", label: "Completed", statuses: ["completed", "cancelled"] },
];

/* ── Firestore consultation with doc ID ────────────────── */
interface FirestoreConsultation extends ConsultationData {
  id: string;
  referenceNumber: string;
  status: InquiryStatus;
  createdAt: Timestamp | null;
}

/* ── Helpers ────────────────────────────────────────────── */
function formatEventDate(dateStr: string): string {
  if (!dateStr) return "Not specified";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatTimestamp(ts: Timestamp | null): string {
  if (!ts || typeof ts.toDate !== "function") return "—";
  const d = ts.toDate();
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  if (diffDays === 0) return `Today, ${time}`;
  if (diffDays === 1) return `Yesterday, ${time}`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + `, ${time}`;
}

function formatTime(ts: Timestamp | null): string {
  if (!ts || typeof ts.toDate !== "function") return "—";
  return ts.toDate().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

/** Rough estimate: midpoint of guest range × per-head package price */
function estimateValue(guestCount: string, packageInterest: string): string {
  const guestMap: Record<string, number> = {
    "10–20 guests": 15, "21–40 guests": 30, "41–75 guests": 58,
    "76–100 guests": 88, "100+ guests": 120,
  };
  const priceMap: Record<string, number> = {
    "The Zakuski": 85, "The Tsar": 165, "The Grand Feast": 250,
  };
  const guests = guestMap[guestCount] || 0;
  const price = priceMap[packageInterest] || 0;
  if (!guests || !price) return "—";
  const est = guests * price;
  return est >= 1000 ? `$${(est / 1000).toFixed(1)}k` : `$${est}`;
}

function estimateValueNum(guestCount: string, packageInterest: string): number {
  const guestMap: Record<string, number> = {
    "10–20 guests": 15, "21–40 guests": 30, "41–75 guests": 58,
    "76–100 guests": 88, "100+ guests": 120,
  };
  const priceMap: Record<string, number> = {
    "The Zakuski": 85, "The Tsar": 165, "The Grand Feast": 250,
  };
  return (guestMap[guestCount] || 0) * (priceMap[packageInterest] || 0);
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Stat Card
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function StatCard({ label, value, sub, accent = "#C9A050" }: {
  label: string; value: string | number; sub?: string; accent?: string;
}) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.025)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 14,
        padding: "20px 22px",
        flex: 1,
        minWidth: 0,
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: "rgba(255,255,255,0.4)",
          fontFamily: "var(--font-body)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 30,
          fontWeight: 700,
          color: accent,
          fontFamily: "var(--font-display)",
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      {sub && (
        <div
          style={{
            fontSize: 12,
            color: "rgba(255,255,255,0.3)",
            marginTop: 6,
            fontFamily: "var(--font-body)",
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Inquiry Card (list item)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function InquiryCard({ inquiry, isSelected, onClick }: {
  inquiry: FirestoreConsultation; isSelected: boolean; onClick: () => void;
}) {
  const cfg = STATUS_CONFIG[inquiry.status];

  return (
    <div
      onClick={onClick}
      style={{
        background: isSelected ? "rgba(201,160,80,0.06)" : "rgba(255,255,255,0.015)",
        border: `1px solid ${isSelected ? "rgba(201,160,80,0.2)" : "rgba(255,255,255,0.04)"}`,
        borderLeft: isSelected ? "3px solid #C9A050" : "3px solid transparent",
        borderRadius: 12,
        padding: "14px 16px",
        cursor: "pointer",
        transition: "all 0.2s ease",
        marginBottom: 6,
      }}
    >
      {/* Top row: ref number + status badge */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div>
          <span
            style={{
              color: "#fff",
              fontWeight: 600,
              fontSize: 14,
              fontFamily: "var(--font-body)",
            }}
          >
            {inquiry.referenceNumber}
          </span>
          <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, marginLeft: 8 }}>
            {inquiry.firstName} {inquiry.lastName}
          </span>
        </div>
        <div
          style={{
            padding: "3px 10px",
            borderRadius: 20,
            background: cfg.bg,
            border: `1px solid ${cfg.ring}`,
            fontSize: 10,
            color: cfg.color,
            fontWeight: 600,
            fontFamily: "var(--font-body)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            whiteSpace: "nowrap",
          }}
        >
          {cfg.label}
        </div>
      </div>

      {/* Meta row: event type · date · guests · package tag */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", fontFamily: "var(--font-body)" }}>
          {inquiry.eventType}
        </span>
        <span style={{ width: 3, height: 3, borderRadius: "50%", background: "rgba(183,143,82,0.3)", flexShrink: 0 }} />
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", fontFamily: "var(--font-body)" }}>
          {formatEventDate(inquiry.eventDate)}
        </span>
        <span style={{ width: 3, height: 3, borderRadius: "50%", background: "rgba(183,143,82,0.3)", flexShrink: 0 }} />
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", fontFamily: "var(--font-body)" }}>
          {inquiry.guestCount || "TBD"}
        </span>
        {inquiry.packageInterest && (
          <>
            <span style={{ width: 3, height: 3, borderRadius: "50%", background: "rgba(183,143,82,0.3)", flexShrink: 0 }} />
            <span
              style={{
                fontSize: 10,
                letterSpacing: 1,
                textTransform: "uppercase",
                padding: "2px 8px",
                background: "rgba(201,160,80,0.08)",
                border: "1px solid rgba(201,160,80,0.15)",
                borderRadius: 4,
                color: "#C9A050",
                fontFamily: "var(--font-body)",
              }}
            >
              {inquiry.packageInterest}
            </span>
          </>
        )}
      </div>

      {/* Bottom row: timestamp */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", fontFamily: "var(--font-body)" }}>
          {formatTimestamp(inquiry.createdAt)}
        </span>
      </div>
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Inquiry Detail Panel
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function InquiryDetail({ inquiry, onStatusChange, isMobile }: {
  inquiry: FirestoreConsultation | null;
  onStatusChange: (id: string, status: InquiryStatus) => void;
  isMobile?: boolean;
}) {
  if (!inquiry) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          color: "rgba(255,255,255,0.2)",
          fontFamily: "var(--font-body)",
          fontSize: 14,
          flexDirection: "column",
          gap: 8,
        }}
      >
        <span style={{ fontSize: 40, opacity: 0.3 }}>🥂</span>
        Select an inquiry to view details
      </div>
    );
  }

  const cfg = STATUS_CONFIG[inquiry.status];
  const nextStatus = NEXT_STATUS[inquiry.status];
  const estValue = estimateValue(inquiry.guestCount, inquiry.packageInterest);
  const currentIdx = STATUS_FLOW.indexOf(inquiry.status);

  return (
    <div style={{ padding: 24, height: "100%", overflowY: "auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h2
            style={{
              margin: 0,
              color: "#fff",
              fontFamily: "var(--font-display)",
              fontSize: 24,
              fontWeight: 700,
              marginBottom: 4,
            }}
          >
            {inquiry.referenceNumber}
          </h2>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, fontFamily: "var(--font-body)" }}>
            {inquiry.firstName} {inquiry.lastName} · {inquiry.eventType}
          </div>
        </div>
        <div
          style={{
            padding: "5px 14px",
            borderRadius: 20,
            background: cfg.bg,
            border: `1px solid ${cfg.ring}`,
            fontSize: 12,
            color: cfg.color,
            fontWeight: 600,
            fontFamily: "var(--font-body)",
            textTransform: "uppercase",
          }}
        >
          {cfg.label}
        </div>
      </div>

      {/* Meta grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 24 }}>
        {[
          { label: "Submitted", value: formatTime(inquiry.createdAt) },
          { label: "Event Date", value: inquiry.eventDate ? formatEventDate(inquiry.eventDate) : "TBD" },
          { label: "Est. Value", value: estValue, gold: true },
        ].map((m, i) => (
          <div
            key={i}
            style={{
              background: "rgba(255,255,255,0.025)",
              borderRadius: 10,
              padding: "12px 14px",
              border: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: "rgba(255,255,255,0.3)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: 4,
                fontFamily: "var(--font-body)",
              }}
            >
              {m.label}
            </div>
            <div style={{ fontSize: 14, color: m.gold ? "#C9A050" : "#fff", fontWeight: 600, fontFamily: "var(--font-body)" }}>
              {m.value}
            </div>
          </div>
        ))}
      </div>

      {/* Status flow progression */}
      {inquiry.status !== "cancelled" && (
        <div
          style={{
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.05)",
            borderRadius: 10,
            padding: "16px 14px",
            marginBottom: 24,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
            {STATUS_FLOW.map((step, i) => {
              const isDone = currentIdx > i;
              const isActive = currentIdx === i;
              const stepCfg = STATUS_CONFIG[step];
              return (
                <div key={step} style={{ flex: 1, textAlign: "center", position: "relative" }}>
                  {/* Connector line (left) */}
                  {i > 0 && (
                    <div
                      style={{
                        position: "absolute", top: 11, left: 0, right: "50%",
                        height: 2,
                        background: isDone || isActive ? "rgba(183,143,82,0.4)" : "rgba(255,255,255,0.05)",
                      }}
                    />
                  )}
                  {/* Connector line (right) */}
                  {i < STATUS_FLOW.length - 1 && (
                    <div
                      style={{
                        position: "absolute", top: 11, left: "50%", right: 0,
                        height: 2,
                        background: isDone ? "rgba(183,143,82,0.4)" : "rgba(255,255,255,0.05)",
                      }}
                    />
                  )}
                  {/* Dot */}
                  <div
                    style={{
                      width: 10, height: 10, borderRadius: "50%",
                      border: `2px solid ${isDone ? "#C9A050" : isActive ? stepCfg.color : "rgba(255,255,255,0.1)"}`,
                      background: isDone ? "#C9A050" : "rgb(var(--bg-primary))",
                      display: "inline-block", position: "relative", zIndex: 2,
                      boxShadow: isActive ? `0 0 0 3px ${stepCfg.bg}` : "none",
                    }}
                  />
                  {/* Label */}
                  <div
                    style={{
                      fontSize: isMobile ? 12 : 9, letterSpacing: 1, textTransform: "uppercase",
                      color: isDone ? "rgba(255,255,255,0.35)" : isActive ? stepCfg.color : "rgba(255,255,255,0.15)",
                      marginTop: 6, fontFamily: "var(--font-body)",
                    }}
                  >
                    {stepCfg.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Contact info */}
      <div
        style={{
          background: "rgba(255,255,255,0.025)",
          border: "1px solid rgba(255,255,255,0.05)",
          borderRadius: 10,
          padding: "14px 16px",
          marginBottom: 24,
        }}
      >
        <div
          style={{
            fontSize: 10,
            color: "rgba(201,160,80,0.6)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: 10,
            fontFamily: "var(--font-body)",
          }}
        >
          Contact
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Name</div>
            <div style={{ fontSize: 13, color: "#fff", fontWeight: 500 }}>
              {inquiry.firstName} {inquiry.lastName}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Phone</div>
            <div style={{ fontSize: 13, color: "#fff", fontWeight: 500 }}>
              <a href={`tel:${inquiry.phone}`} style={{ color: "#C9A050", textDecoration: "none" }}>{inquiry.phone}</a>
            </div>
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Email</div>
            <div style={{ fontSize: 13, color: "#fff", fontWeight: 500 }}>
              <a href={`mailto:${inquiry.email}`} style={{ color: "#C9A050", textDecoration: "none" }}>{inquiry.email}</a>
            </div>
          </div>
        </div>
      </div>

      {/* Event details */}
      <div
        style={{
          background: "rgba(255,255,255,0.025)",
          border: "1px solid rgba(255,255,255,0.05)",
          borderRadius: 10,
          padding: "14px 16px",
          marginBottom: 24,
        }}
      >
        <div
          style={{
            fontSize: 10,
            color: "rgba(201,160,80,0.6)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: 10,
            fontFamily: "var(--font-body)",
          }}
        >
          Event Details
        </div>
        {[
          { label: "Type",        value: inquiry.eventType },
          { label: "Date",        value: inquiry.eventDate ? formatEventDate(inquiry.eventDate) : "Not specified" },
          { label: "Guest Count", value: inquiry.guestCount || "Not specified" },
          { label: "Budget",      value: inquiry.budget || "Not specified" },
          { label: "Package",     value: inquiry.packageInterest || "Not selected", isPackage: true },
        ].map((row, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "8px 0",
              borderBottom: i < 4 ? "1px solid rgba(255,255,255,0.04)" : "none",
              fontSize: 13,
              fontFamily: "var(--font-body)",
            }}
          >
            <span style={{ color: "rgba(255,255,255,0.35)" }}>{row.label}</span>
            {row.isPackage && row.value !== "Not selected" ? (
              <span
                style={{
                  fontSize: 10,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  padding: "2px 8px",
                  background: "rgba(201,160,80,0.08)",
                  border: "1px solid rgba(201,160,80,0.15)",
                  borderRadius: 4,
                  color: "#C9A050",
                }}
              >
                {row.value}
              </span>
            ) : (
              <span style={{ color: "#fff" }}>{row.value}</span>
            )}
          </div>
        ))}
      </div>

      {/* Special requests / message */}
      {inquiry.message && (
        <div
          style={{
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.05)",
            borderRadius: 10,
            padding: "14px 16px",
            marginBottom: 24,
          }}
        >
          <div
            style={{
              fontSize: 10,
              color: "rgba(201,160,80,0.6)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 8,
              fontFamily: "var(--font-body)",
            }}
          >
            Special Requests
          </div>
          <div
            style={{
              fontFamily: "var(--font-accent, var(--font-body))",
              fontSize: 13,
              fontStyle: "italic",
              color: "rgba(255,255,255,0.55)",
              lineHeight: 1.7,
              padding: "10px 14px",
              background: "rgba(255,255,255,0.015)",
              borderLeft: "2px solid rgba(183,143,82,0.2)",
              borderRadius: "0 6px 6px 0",
            }}
          >
            {inquiry.message}
          </div>
        </div>
      )}

      {/* Activity timeline */}
      <div
        style={{
          background: "rgba(255,255,255,0.025)",
          border: "1px solid rgba(255,255,255,0.05)",
          borderRadius: 10,
          padding: "14px 16px",
          marginBottom: 24,
        }}
      >
        <div
          style={{
            fontSize: 10,
            color: "rgba(201,160,80,0.6)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: 12,
            fontFamily: "var(--font-body)",
          }}
        >
          Activity
        </div>
        {/* Inquiry received */}
        <div style={{ display: "flex", gap: 12, padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.02)" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#60A5FA", flexShrink: 0 }} />
            <div style={{ width: 1, flex: 1, background: "rgba(255,255,255,0.04)", marginTop: 4 }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>Inquiry received via website</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.15)", marginTop: 2 }}>{formatTimestamp(inquiry.createdAt)}</div>
          </div>
        </div>
        {/* Email notification */}
        <div style={{ display: "flex", gap: 12, padding: "6px 0" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#C9A050", flexShrink: 0 }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>Email notification sent to events team</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.15)", marginTop: 2 }}>{formatTimestamp(inquiry.createdAt)}</div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 10 }}>
        {nextStatus && (
          <button
            onClick={() => onStatusChange(inquiry.id, nextStatus)}
            style={{
              flex: 1,
              padding: "14px 20px",
              background: "linear-gradient(135deg, rgb(var(--gold)), rgb(var(--gold-dark)))",
              border: "1px solid rgb(var(--gold))",
              borderRadius: 10,
              color: "rgb(var(--bg-primary))",
              fontSize: 13,
              fontWeight: 700,
              fontFamily: "var(--font-body)",
              cursor: "pointer",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Mark as {STATUS_CONFIG[nextStatus].label}
          </button>
        )}
        {inquiry.status !== "cancelled" && inquiry.status !== "completed" && (
          <button
            onClick={() => onStatusChange(inquiry.id, "cancelled")}
            style={{
              padding: "14px 18px",
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: 10,
              color: "#EF4444",
              fontSize: 12,
              fontWeight: 600,
              fontFamily: "var(--font-body)",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Catering Inquiries Page
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export default function CateringPage() {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const [inquiries, setInquiries] = useState<FirestoreConsultation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);

  /* ── Real-time Firestore listener ── */
  useEffect(() => {
    const q = query(collection(db, "consultations"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched: FirestoreConsultation[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));
      setInquiries(fetched);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  /* ── Clock tick ── */
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  /* ── Update inquiry status in Firestore ── */
  const handleStatusChange = useCallback(async (id: string, newStatus: InquiryStatus) => {
    try {
      await updateDoc(doc(db, "consultations", id), { status: newStatus });
    } catch (err) {
      console.error("Failed to update inquiry status:", err);
    }
  }, []);

  /* ── Filtering ── */
  const activeTab = FILTER_TABS.find((t) => t.key === filter)!;
  const filtered = inquiries.filter((inq) => activeTab.statuses.includes(inq.status));
  const selected = inquiries.find((inq) => inq.id === selectedId) ?? null;

  /* ── Stats ── */
  const newCount = inquiries.filter((i) => i.status === "new").length;
  const inProgressCount = inquiries.filter((i) => ["contacted", "tasting"].includes(i.status)).length;
  const confirmedCount = inquiries.filter((i) => i.status === "confirmed").length;

  const pipelineRevenue = inquiries
    .filter((i) => !["completed", "cancelled"].includes(i.status))
    .reduce((sum, i) => sum + estimateValueNum(i.guestCount, i.packageInterest), 0);

  const pipelineStr = pipelineRevenue >= 1000
    ? `$${(pipelineRevenue / 1000).toFixed(1)}k`
    : pipelineRevenue > 0
    ? `$${pipelineRevenue}`
    : "$0";

  return (
    <div style={{ minHeight: "100vh" }}>
      {/* ── Top bar ── */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: isTablet ? "0 16px" : "0 28px",
          height: 60,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(255,255,255,0.015)",
          position: "sticky",
          top: 0,
          zIndex: 50,
          backdropFilter: "blur(20px)",
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontFamily: "var(--font-display)",
              fontSize: 20,
              fontWeight: 700,
              color: "#fff",
            }}
          >
            Catering Inquiries
          </h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* Live indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "#5FBF7A",
                boxShadow: "0 0 8px rgba(95,191,122,0.5)",
                animation: "pulse 2s ease-in-out infinite",
              }}
            />
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-body)" }}>
              Live
            </span>
          </div>
          <span
            style={{
              fontSize: 13,
              color: "rgba(255,255,255,0.45)",
              fontFamily: "monospace",
            }}
          >
            {currentTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      </header>

      <div style={{ padding: isTablet ? "20px 16px" : "20px 28px" }}>
        {/* ── Stats row ── */}
        <div className="dash-stats-row" style={{ display: "flex", gap: 14, marginBottom: 24 }}>
          <StatCard
            label="New Inquiries"
            value={newCount}
            sub="Awaiting response"
            accent="#60A5FA"
          />
          <StatCard
            label="In Progress"
            value={inProgressCount}
            sub="Contacted / planning"
            accent="#E8C468"
          />
          <StatCard
            label="Confirmed Events"
            value={confirmedCount}
            sub="Upcoming booked"
            accent="#5FBF7A"
          />
          <StatCard
            label="Est. Revenue"
            value={pipelineStr}
            sub="Active pipeline"
          />
        </div>

        {/* ── Filter tabs ── */}
        <div className="dash-filter-tabs" style={{ display: "flex", gap: 6, marginBottom: 16 }}>
          {FILTER_TABS.map((tab) => {
            const count = inquiries.filter((i) => tab.statuses.includes(i.status)).length;
            const active = filter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                style={{
                  padding: "10px 14px",
                  minHeight: 44,
                  borderRadius: 8,
                  border: active
                    ? "1px solid rgba(201,160,80,0.25)"
                    : "1px solid rgba(255,255,255,0.06)",
                  background: active ? "rgba(201,160,80,0.08)" : "rgba(255,255,255,0.02)",
                  color: active ? "#C9A050" : "rgba(255,255,255,0.4)",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "var(--font-body)",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {tab.label}
                <span
                  style={{
                    background: active ? "rgba(201,160,80,0.15)" : "rgba(255,255,255,0.06)",
                    padding: "1px 7px",
                    borderRadius: 10,
                    fontSize: 11,
                    fontFamily: "monospace",
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Main grid: list + detail ── */}
        <div
          className="dash-split-layout"
          style={{
            display: "grid",
            gridTemplateColumns: isTablet ? "1fr" : "1fr 420px",
            gap: 18,
            minHeight: "calc(100vh - 280px)",
          }}
        >
          {/* Inquiry list */}
          <div
            style={{
              background: "rgba(255,255,255,0.015)",
              border: "1px solid rgba(255,255,255,0.05)",
              borderRadius: 14,
              padding: 12,
              overflowY: "auto",
              maxHeight: "calc(100vh - 280px)",
            }}
          >
            {loading ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: 200,
                  color: "rgba(255,255,255,0.3)",
                  fontSize: 13,
                  fontFamily: "var(--font-body)",
                }}
              >
                Loading inquiries…
              </div>
            ) : filtered.length === 0 ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: 200,
                  color: "rgba(255,255,255,0.2)",
                  fontSize: 13,
                  fontFamily: "var(--font-body)",
                  gap: 8,
                }}
              >
                <span style={{ fontSize: 32, opacity: 0.3 }}>🥂</span>
                No {activeTab.label.toLowerCase()} inquiries
              </div>
            ) : (
              <>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 10,
                    padding: "0 4px",
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      color: "rgba(255,255,255,0.25)",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    {filtered.length} inquir{filtered.length !== 1 ? "ies" : "y"}
                  </span>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>
                    Newest first
                  </span>
                </div>
                {filtered.map((inquiry) => (
                  <InquiryCard
                    key={inquiry.id}
                    inquiry={inquiry}
                    isSelected={inquiry.id === selectedId}
                    onClick={() => setSelectedId(inquiry.id)}
                  />
                ))}
              </>
            )}
          </div>

          {/* Detail panel – desktop only (hidden on tablet via grid col change) */}
          {!isTablet && (
            <div
              style={{
                background: "rgba(255,255,255,0.015)",
                border: "1px solid rgba(255,255,255,0.05)",
                borderRadius: 14,
                overflow: "hidden",
                maxHeight: "calc(100vh - 280px)",
              }}
            >
              <InquiryDetail inquiry={selected} onStatusChange={handleStatusChange} isMobile={isMobile} />
            </div>
          )}
        </div>
      </div>

      {/* Detail panel – tablet/mobile full-screen overlay */}
      {isTablet && selected && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(8,6,3,0.98)", overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
          <button
            onClick={() => setSelectedId(null)}
            style={{
              position: "sticky",
              top: 0,
              zIndex: 10,
              width: "100%",
              padding: "16px 20px",
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(8,6,3,0.98)",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              border: "none",
              cursor: "pointer",
              color: "#C9A050",
              fontSize: 13,
              fontFamily: "var(--font-body)",
            }}
          >
            &larr; Back to Inquiries
          </button>
          <InquiryDetail inquiry={selected} onStatusChange={handleStatusChange} isMobile={isMobile} />
        </div>
      )}

      {/* Pulse animation for live dot */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}