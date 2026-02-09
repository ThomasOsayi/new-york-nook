"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useIsMobile, useIsTablet } from "@/hooks/useIsMobile";
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

/* ── Types ─────────────────────────────────────────────── */
type ResStatus = "confirmed" | "seated" | "completed" | "no-show" | "cancelled";

interface ReservationData {
  name: string;
  phone: string;
  date: string;          // "YYYY-MM-DD"
  time: string;          // "5:00 PM"
  party: number;
  status: ResStatus;
  table?: string;
  notes?: string;
  createdAt: Timestamp | null;
}

interface FirestoreReservation extends ReservationData {
  id: string;
}

/* ── Status config ─────────────────────────────────────── */
const STATUS_CONFIG: Record<ResStatus, { label: string; color: string; bg: string; ring: string }> = {
  confirmed:  { label: "Confirmed",  color: "#4ADE80", bg: "rgba(74,222,128,0.10)",  ring: "rgba(74,222,128,0.25)" },
  seated:     { label: "Seated",     color: "#60A5FA", bg: "rgba(96,165,250,0.10)",  ring: "rgba(96,165,250,0.25)" },
  completed:  { label: "Completed",  color: "#6B7280", bg: "rgba(107,114,128,0.08)", ring: "rgba(107,114,128,0.20)" },
  "no-show":  { label: "No Show",    color: "#EF4444", bg: "rgba(239,68,68,0.08)",   ring: "rgba(239,68,68,0.20)" },
  cancelled:  { label: "Cancelled",  color: "#6B7280", bg: "rgba(107,114,128,0.06)", ring: "rgba(107,114,128,0.15)" },
};

/* Status progression */
const NEXT_STATUS: Partial<Record<ResStatus, ResStatus>> = {
  confirmed: "seated",
  seated:    "completed",
};

/* Filter tabs */
const FILTER_TABS: { key: string; label: string; statuses: ResStatus[] }[] = [
  { key: "active",    label: "Active",    statuses: ["confirmed", "seated"] },
  { key: "confirmed", label: "Confirmed", statuses: ["confirmed"] },
  { key: "seated",    label: "Seated",    statuses: ["seated"] },
  { key: "completed", label: "Completed", statuses: ["completed"] },
  { key: "no-show",   label: "No Show",   statuses: ["no-show"] },
  { key: "cancelled", label: "Cancelled", statuses: ["cancelled"] },
];

/* Timeline slots for the heat strip */
const TIMELINE_SLOTS = ["5:00", "5:30", "6:00", "6:30", "7:00", "7:30", "8:00", "8:30", "9:00", "9:30"];

/* Table inventory — update to match your restaurant */
const TABLES = [
  { id: "T1", seats: 2 },
  { id: "T2", seats: 2 },
  { id: "T3", seats: 4 },
  { id: "T4", seats: 4 },
  { id: "T5", seats: 4 },
  { id: "T6", seats: 6 },
  { id: "T7", seats: 6 },
  { id: "T8", seats: 8 },
  { id: "T9", seats: 2 },
  { id: "T10", seats: 4 },
  { id: "PDR", seats: 12 },
];

/* ── Helpers ────────────────────────────────────────────── */
function formatTimestamp(ts: Timestamp | null): string {
  if (!ts || typeof ts.toDate !== "function") return "—";
  return ts.toDate().toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function tomorrowStr(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function friendlyDate(dateStr: string): string {
  const today = todayStr();
  const tomorrow = tomorrowStr();
  if (dateStr === today) return "Today";
  if (dateStr === tomorrow) return "Tomorrow";
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
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
   Reservation Card (list item)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function ReservationCard({ res, isSelected, onClick }: {
  res: FirestoreReservation; isSelected: boolean; onClick: () => void;
}) {
  const cfg = STATUS_CONFIG[res.status];

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
      {/* Top row: guest name + status */}
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
            {res.name}
          </span>
          <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, marginLeft: 8 }}>
            Party of {res.party}
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

      {/* Detail chips */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
        <span
          style={{
            background: "rgba(201,160,80,0.08)",
            padding: "2px 8px",
            borderRadius: 6,
            fontSize: 11,
            color: "#C9A050",
            fontFamily: "var(--font-body)",
            fontWeight: 500,
          }}
        >
          {res.time}
        </span>
        <span
          style={{
            background: "rgba(255,255,255,0.04)",
            padding: "2px 8px",
            borderRadius: 6,
            fontSize: 11,
            color: "rgba(255,255,255,0.55)",
            fontFamily: "var(--font-body)",
          }}
        >
          {friendlyDate(res.date)}
        </span>
        {res.table && (
          <span
            style={{
              background: "rgba(96,165,250,0.08)",
              border: "1px solid rgba(96,165,250,0.15)",
              padding: "2px 8px",
              borderRadius: 6,
              fontSize: 11,
              color: "#60A5FA",
              fontFamily: "var(--font-body)",
              fontWeight: 600,
            }}
          >
            {res.table}
          </span>
        )}
        {res.party >= 8 && (
          <span
            style={{
              background: "rgba(232,155,72,0.08)",
              padding: "2px 8px",
              borderRadius: 6,
              fontSize: 11,
              color: "#E89B48",
              fontFamily: "var(--font-body)",
            }}
          >
            Large party
          </span>
        )}
      </div>

      {/* Bottom: phone + notes hint */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-body)" }}>
          {res.phone}
        </span>
        {res.notes && (
          <span
            style={{
              fontSize: 11,
              color: "rgba(201,160,80,0.45)",
              fontFamily: "var(--font-body)",
              fontStyle: "italic",
              maxWidth: 180,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {res.notes}
          </span>
        )}
      </div>
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Reservation Detail Panel
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function ReservationDetail({ res, allRes, onStatusChange }: {
  res: FirestoreReservation | null;
  allRes: FirestoreReservation[];
  onStatusChange: (id: string, status: ResStatus, table?: string) => void;
}) {
  const [assignTable, setAssignTable] = useState("");

  if (!res) {
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
        <span style={{ fontSize: 40, opacity: 0.3 }}>📅</span>
        Select a reservation to view details
      </div>
    );
  }

  const cfg = STATUS_CONFIG[res.status];
  const nextStatus = NEXT_STATUS[res.status];

  /* Figure out which tables are occupied (by seated reservations today) */
  const occupiedTables = new Set(
    allRes
      .filter((r) => r.status === "seated" && r.table && r.id !== res.id)
      .map((r) => r.table!)
  );

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
            {res.name}
          </h2>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, fontFamily: "var(--font-body)" }}>
            Reservation · {friendlyDate(res.date)}
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
          { label: "Time", value: res.time },
          { label: "Party Size", value: `${res.party} guests` },
          { label: "Table", value: res.table || "Not assigned" },
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
            <div
              style={{
                fontSize: 14,
                color: m.value === "Not assigned" ? "rgba(255,255,255,0.2)" : "#fff",
                fontWeight: 600,
                fontFamily: "var(--font-body)",
              }}
            >
              {m.value}
            </div>
          </div>
        ))}
      </div>

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
            color: "rgba(255,255,255,0.3)",
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
            <div style={{ fontSize: 13, color: "#fff", fontWeight: 500 }}>{res.name}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Phone</div>
            <div style={{ fontSize: 13, color: "#fff", fontWeight: 500 }}>{res.phone}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Date</div>
            <div style={{ fontSize: 13, color: "#fff", fontWeight: 500 }}>{friendlyDate(res.date)}, {res.date}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Booked</div>
            <div style={{ fontSize: 13, color: "#fff", fontWeight: 500 }}>{formatTimestamp(res.createdAt)}</div>
          </div>
        </div>
      </div>

      {/* Notes */}
      {res.notes && (
        <div
          style={{
            background: "rgba(201,160,80,0.04)",
            border: "1px solid rgba(201,160,80,0.12)",
            borderRadius: 10,
            padding: "14px 16px",
            marginBottom: 24,
          }}
        >
          <div
            style={{
              fontSize: 10,
              color: "rgba(201,160,80,0.5)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 6,
              fontFamily: "var(--font-body)",
            }}
          >
            Notes
          </div>
          <div
            style={{
              color: "rgba(255,255,255,0.65)",
              fontSize: 13,
              fontFamily: "var(--font-body)",
              lineHeight: 1.5,
              fontStyle: "italic",
            }}
          >
            {res.notes}
          </div>
        </div>
      )}

      {/* ── Table assignment (for confirmed reservations) ── */}
      {res.status === "confirmed" && (
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
              color: "rgba(255,255,255,0.3)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 10,
              fontFamily: "var(--font-body)",
            }}
          >
            Assign Table
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {TABLES.map((t) => {
              const occupied = occupiedTables.has(t.id);
              const selected = assignTable === t.id;
              const fits = t.seats >= res.party;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    if (!occupied) setAssignTable(selected ? "" : t.id);
                  }}
                  disabled={occupied}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: selected
                      ? "1px solid rgba(201,160,80,0.4)"
                      : occupied
                      ? "1px solid rgba(255,255,255,0.03)"
                      : "1px solid rgba(255,255,255,0.06)",
                    background: selected
                      ? "rgba(201,160,80,0.1)"
                      : occupied
                      ? "rgba(255,255,255,0.01)"
                      : "rgba(255,255,255,0.02)",
                    cursor: occupied ? "not-allowed" : "pointer",
                    opacity: occupied ? 0.3 : 1,
                    transition: "all 0.15s",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: selected ? "#C9A050" : occupied ? "rgba(255,255,255,0.2)" : "#fff",
                    }}
                  >
                    {t.id}
                  </div>
                  <div
                    style={{
                      fontSize: 9,
                      color: !fits && !occupied ? "#E89B48" : "rgba(255,255,255,0.25)",
                      marginTop: 1,
                    }}
                  >
                    {t.seats} seats{!fits && !occupied ? " ⚠" : ""}
                  </div>
                </button>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            {[
              { color: "rgba(255,255,255,0.5)", label: "Available" },
              { color: "rgba(255,255,255,0.15)", label: "Occupied" },
              { color: "#C9A050", label: "Selected" },
            ].map((l) => (
              <span key={l.label} style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: l.color }} />
                {l.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Table overview (for seated guests) ── */}
      {res.status === "seated" && res.table && (
        <div
          style={{
            display: "inline-block",
            background: "rgba(96,165,250,0.08)",
            border: "1px solid rgba(96,165,250,0.15)",
            borderRadius: 6,
            padding: "4px 10px",
            fontSize: 12,
            color: "#60A5FA",
            fontFamily: "var(--font-body)",
            fontWeight: 600,
            marginBottom: 24,
          }}
        >
          Seated at {res.table}
        </div>
      )}

      {/* ── Action buttons ── */}
      <div style={{ display: "flex", gap: 10 }}>
        {nextStatus && (
          <button
            onClick={() => {
              const table = res.status === "confirmed" && assignTable ? assignTable : res.table;
              onStatusChange(res.id, nextStatus, table || undefined);
            }}
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
            {res.status === "confirmed"
              ? `Seat Guest${assignTable ? ` → ${assignTable}` : ""}`
              : `Mark as ${STATUS_CONFIG[nextStatus].label}`}
          </button>
        )}
        {res.status === "confirmed" && (
          <button
            onClick={() => onStatusChange(res.id, "no-show")}
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
            No Show
          </button>
        )}
        {(res.status === "confirmed" || res.status === "seated") && (
          <button
            onClick={() => onStatusChange(res.id, "cancelled")}
            style={{
              padding: "14px 18px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 10,
              color: "rgba(255,255,255,0.4)",
              fontSize: 12,
              fontWeight: 600,
              fontFamily: "var(--font-body)",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        )}
        {(res.status === "no-show" || res.status === "cancelled") && (
          <button
            onClick={() => onStatusChange(res.id, "confirmed")}
            style={{
              flex: 1,
              padding: "14px 18px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 10,
              color: "rgba(255,255,255,0.4)",
              fontSize: 13,
              fontWeight: 600,
              fontFamily: "var(--font-body)",
              cursor: "pointer",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Restore Reservation
          </button>
        )}
      </div>
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Reservations Page
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export default function ReservationsPage() {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const [reservations, setReservations] = useState<FirestoreReservation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState("active");
  const [dateFilter, setDateFilter] = useState<"today" | "tomorrow" | "all">("today");
  const [search, setSearch] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);

  /* ── Real-time Firestore listener ── */
  useEffect(() => {
    const q = query(collection(db, "reservations"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched: FirestoreReservation[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as ReservationData),
      }));
      setReservations(fetched);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  /* ── Clock tick ── */
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  /* ── Update reservation status in Firestore ── */
  const handleStatusChange = useCallback(async (id: string, newStatus: ResStatus, table?: string) => {
    try {
      const update: Record<string, unknown> = { status: newStatus };
      if (table) update.table = table;
      await updateDoc(doc(db, "reservations", id), update);
    } catch (err) {
      console.error("Failed to update reservation status:", err);
    }
  }, []);

  /* ── Filtering ── */
  const today = todayStr();
  const tomorrow = tomorrowStr();

  const activeTab = FILTER_TABS.find((t) => t.key === filter)!;

  const filtered = useMemo(() => {
    let items = reservations;
    // Date filter
    if (dateFilter === "today") items = items.filter((r) => r.date === today);
    else if (dateFilter === "tomorrow") items = items.filter((r) => r.date === tomorrow);
    // Status filter
    items = items.filter((r) => activeTab.statuses.includes(r.status));
    // Search
    if (search) {
      const q = search.toLowerCase();
      items = items.filter((r) =>
        r.name.toLowerCase().includes(q) ||
        r.phone.includes(q) ||
        r.id.toLowerCase().includes(q) ||
        (r.table && r.table.toLowerCase().includes(q))
      );
    }
    return items;
  }, [reservations, dateFilter, activeTab, search, today, tomorrow]);

  const selected = reservations.find((r) => r.id === selectedId) ?? null;

  /* ── Stats (based on today) ── */
  const todayRes = reservations.filter((r) => r.date === today);
  const confirmedCount = todayRes.filter((r) => r.status === "confirmed").length;
  const seatedCount = todayRes.filter((r) => r.status === "seated").length;
  const completedCount = todayRes.filter((r) => r.status === "completed").length;
  const noShowCount = todayRes.filter((r) => r.status === "no-show").length;
  const totalGuests = todayRes
    .filter((r) => r.status === "confirmed" || r.status === "seated")
    .reduce((sum, r) => sum + r.party, 0);

  /* Tables currently occupied by seated guests */
  const occupiedTables = new Set(
    reservations
      .filter((r) => r.status === "seated" && r.table)
      .map((r) => r.table!)
  );
  const availableTables = TABLES.filter((t) => !occupiedTables.has(t.id)).length;

  /* ── Timeline data ── */
  const timeline = useMemo(() => {
    const active = reservations.filter(
      (r) => r.date === today && (r.status === "confirmed" || r.status === "seated")
    );
    return TIMELINE_SLOTS.map((slot) => {
      const matching = active.filter((r) => r.time.startsWith(slot));
      return {
        time: slot,
        count: matching.length,
        guests: matching.reduce((sum, r) => sum + r.party, 0),
      };
    });
  }, [reservations, today]);

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
        <h1
          style={{
            margin: 0,
            fontFamily: "var(--font-display)",
            fontSize: 20,
            fontWeight: 700,
            color: "#fff",
          }}
        >
          Reservations
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
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
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", fontFamily: "monospace" }}>
            {currentTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      </header>

      <div style={{ padding: isTablet ? "20px 16px" : "20px 28px" }}>
        {/* ── Stats row ── */}
        <div className="dash-stats-row" style={{ display: "flex", gap: 14, marginBottom: 24 }}>
          <StatCard
            label="Today's Reservations"
            value={confirmedCount + seatedCount + completedCount}
            sub={`${confirmedCount} upcoming · ${seatedCount} seated`}
          />
          <StatCard
            label="Expected Guests"
            value={totalGuests}
            sub={`Across ${confirmedCount + seatedCount} parties`}
            accent="#E8D5A3"
          />
          <StatCard
            label="Available Tables"
            value={`${availableTables}/${TABLES.length}`}
            sub={`${TABLES.filter((t) => !occupiedTables.has(t.id)).reduce((s, t) => s + t.seats, 0)} open seats`}
            accent="#5FBF7A"
          />
          <StatCard
            label="No-Shows Today"
            value={noShowCount}
            sub={noShowCount > 0 ? "Follow up recommended" : "All clear"}
            accent={noShowCount > 0 ? "#EF4444" : "rgba(255,255,255,0.55)"}
          />
        </div>

        {/* ── Timeline strip ── */}
        <div
          style={{
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 14,
            padding: "14px 16px",
            marginBottom: 24,
          }}
        >
          <div
            style={{
              fontSize: 10,
              color: "rgba(255,255,255,0.25)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 10,
              fontFamily: "var(--font-body)",
            }}
          >
            Today&apos;s Timeline
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {timeline.map((slot, i) => {
              const intensity = Math.min(slot.count / 3, 1);
              return (
                <div key={i} style={{ flex: 1, textAlign: "center", minWidth: 0 }}>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginBottom: 6, fontWeight: 500 }}>
                    {slot.time}
                  </div>
                  <div
                    style={{
                      height: 40,
                      borderRadius: 6,
                      background: slot.count > 0
                        ? `rgba(201,160,80,${0.06 + intensity * 0.18})`
                        : "rgba(255,255,255,0.015)",
                      border: slot.count > 0
                        ? `1px solid rgba(201,160,80,${0.1 + intensity * 0.2})`
                        : "1px solid rgba(255,255,255,0.03)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.3s",
                    }}
                  >
                    {slot.count > 0 && (
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#C9A050" }}>{slot.count}</span>
                    )}
                  </div>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.15)", marginTop: 4 }}>
                    {slot.guests > 0 ? `${slot.guests} pax` : "—"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Filter row ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            {/* Date filter */}
            <div style={{ display: "flex", gap: 4 }}>
              {(["today", "tomorrow", "all"] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDateFilter(d)}
                  style={{
                    padding: "10px 14px",
                    minHeight: 44,
                    borderRadius: 8,
                    border: dateFilter === d
                      ? "1px solid rgba(201,160,80,0.25)"
                      : "1px solid rgba(255,255,255,0.06)",
                    background: dateFilter === d ? "rgba(201,160,80,0.08)" : "rgba(255,255,255,0.02)",
                    color: dateFilter === d ? "#C9A050" : "rgba(255,255,255,0.4)",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "var(--font-body)",
                    textTransform: "capitalize",
                  }}
                >
                  {d}
                </button>
              ))}
            </div>

            {/* Status filter */}
            <div className="dash-filter-tabs" style={{ display: "flex", gap: 6 }}>
              {FILTER_TABS.map((tab) => {
                const count = (() => {
                  let items = reservations;
                  if (dateFilter === "today") items = items.filter((r) => r.date === today);
                  else if (dateFilter === "tomorrow") items = items.filter((r) => r.date === tomorrow);
                  return items.filter((r) => tab.statuses.includes(r.status)).length;
                })();
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
                      whiteSpace: "nowrap",
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
          </div>

          {/* Search */}
          <div style={{ position: "relative" }}>
            <input
              placeholder="Search name, phone, table..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: 220,
                padding: "10px 12px 10px 34px",
                fontSize: 12,
                fontFamily: "var(--font-body)",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 8,
                color: "#fff",
                outline: "none",
                minHeight: 44,
              }}
            />
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 14, opacity: 0.3 }}>
              🔍
            </span>
          </div>
        </div>

        {/* ── Main grid: list + detail ── */}
        <div
          className="dash-split-layout"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 420px",
            gap: 18,
            minHeight: "calc(100vh - 380px)",
          }}
        >
          {/* Reservation list */}
          <div
            style={{
              background: "rgba(255,255,255,0.015)",
              border: "1px solid rgba(255,255,255,0.05)",
              borderRadius: 14,
              padding: 12,
              overflowY: "auto",
              maxHeight: "calc(100vh - 380px)",
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
                Loading reservations…
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
                <span style={{ fontSize: 32, opacity: 0.3 }}>📅</span>
                No {activeTab.label.toLowerCase()} reservations
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
                    {filtered.length} reservation{filtered.length !== 1 ? "s" : ""}
                  </span>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>
                    Newest first
                  </span>
                </div>
                {filtered.map((res) => (
                  <ReservationCard
                    key={res.id}
                    res={res}
                    isSelected={res.id === selectedId}
                    onClick={() => setSelectedId(res.id)}
                  />
                ))}
              </>
            )}
          </div>

          {/* Detail panel (desktop only) */}
          {!isTablet && (
            <div
              style={{
                background: "rgba(255,255,255,0.015)",
                border: "1px solid rgba(255,255,255,0.05)",
                borderRadius: 14,
                overflow: "hidden",
                maxHeight: "calc(100vh - 380px)",
              }}
            >
              <ReservationDetail
                res={selected}
                allRes={reservations}
                onStatusChange={handleStatusChange}
              />
            </div>
          )}
        </div>
      </div>

      {/* Detail panel (mobile/tablet overlay) */}
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
            &larr; Back to Reservations
          </button>
          <ReservationDetail
            res={selected}
            allRes={reservations}
            onStatusChange={handleStatusChange}
          />
        </div>
      )}

      {/* Pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}