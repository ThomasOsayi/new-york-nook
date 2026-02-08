"use client";

import { useState, useEffect, useCallback } from "react";
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
import "@/lib/auth";
import type { OrderData } from "@/lib/order";

/* ── Status config ─────────────────────────────────────── */
type OrderStatus = OrderData["status"];

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string; ring: string }> = {
  pending:   { label: "Pending",   color: "#E8C468", bg: "rgba(232,196,104,0.10)", ring: "rgba(232,196,104,0.25)" },
  confirmed: { label: "Confirmed", color: "#60A5FA", bg: "rgba(96,165,250,0.10)",  ring: "rgba(96,165,250,0.25)" },
  preparing: { label: "Preparing", color: "#E89B48", bg: "rgba(232,155,72,0.10)",  ring: "rgba(232,155,72,0.25)" },
  ready:     { label: "Ready",     color: "#5FBF7A", bg: "rgba(95,191,122,0.10)",  ring: "rgba(95,191,122,0.25)" },
  picked_up: { label: "Picked Up", color: "#6B7280", bg: "rgba(107,114,128,0.08)", ring: "rgba(107,114,128,0.20)" },
  cancelled: { label: "Cancelled", color: "#EF4444", bg: "rgba(239,68,68,0.08)",   ring: "rgba(239,68,68,0.20)" },
};

/* Status progression for the main action button */
const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  pending:   "confirmed",
  confirmed: "preparing",
  preparing: "ready",
  ready:     "picked_up",
};

/* Filter tabs shown in the UI */
const FILTER_TABS: { key: string; label: string; statuses: OrderStatus[] }[] = [
  { key: "active",    label: "Active",    statuses: ["pending", "confirmed", "preparing", "ready"] },
  { key: "pending",   label: "Pending",   statuses: ["pending"] },
  { key: "preparing", label: "Preparing", statuses: ["confirmed", "preparing"] },
  { key: "ready",     label: "Ready",     statuses: ["ready"] },
  { key: "completed", label: "Completed", statuses: ["picked_up", "cancelled"] },
];

/* ── Firestore order with doc ID ───────────────────────── */
interface FirestoreOrder extends OrderData {
  id: string;
}

/* ── Helper: minutes elapsed since order creation ──────── */
function minutesAgo(createdAt: Timestamp | null): number {
  if (!createdAt || typeof createdAt.toMillis !== "function") return 0;
  return Math.max(0, Math.round((Date.now() - createdAt.toMillis()) / 60000));
}

/* ── Helper: format timestamp to readable time ─────────── */
function formatTime(createdAt: Timestamp | null): string {
  if (!createdAt || typeof createdAt.toDate !== "function") return "—";
  return createdAt.toDate().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
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
   Order Card (list item)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function OrderCard({ order, isSelected, onClick }: {
  order: FirestoreOrder; isSelected: boolean; onClick: () => void;
}) {
  const cfg = STATUS_CONFIG[order.status];
  const elapsed = minutesAgo(order.createdAt as Timestamp);
  const isUrgent = elapsed > 30 && !["picked_up", "cancelled"].includes(order.status);

  return (
    <div
      onClick={onClick}
      style={{
        background: isSelected ? "rgba(201,160,80,0.06)" : "rgba(255,255,255,0.015)",
        border: `1px solid ${isSelected ? "rgba(201,160,80,0.2)" : "rgba(255,255,255,0.04)"}`,
        borderLeft: isUrgent
          ? "3px solid #EF4444"
          : isSelected
          ? "3px solid #C9A050"
          : "3px solid transparent",
        borderRadius: 12,
        padding: "14px 16px",
        cursor: "pointer",
        transition: "all 0.2s ease",
        marginBottom: 6,
      }}
    >
      {/* Top row: order number + status badge */}
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
            {order.orderNumber}
          </span>
          <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, marginLeft: 8 }}>
            {order.firstName} {order.lastName}
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

      {/* Item summary chips */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
        {order.items.slice(0, 4).map((item, i) => (
          <span
            key={i}
            style={{
              background: "rgba(255,255,255,0.04)",
              padding: "2px 8px",
              borderRadius: 6,
              fontSize: 11,
              color: "rgba(255,255,255,0.55)",
              fontFamily: "var(--font-body)",
            }}
          >
            {item.qty}× {item.name}
          </span>
        ))}
        {order.items.length > 4 && (
          <span
            style={{
              padding: "2px 8px",
              borderRadius: 6,
              fontSize: 11,
              color: "rgba(201,160,80,0.6)",
              fontFamily: "var(--font-body)",
            }}
          >
            +{order.items.length - 4} more
          </span>
        )}
      </div>

      {/* Bottom row: time + elapsed */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-body)" }}>
          {formatTime(order.createdAt as Timestamp)} · Pickup: {order.pickupTime}
        </span>
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            fontFamily: "monospace",
            color: elapsed > 30
              ? "#EF4444"
              : elapsed > 20
              ? "#E89B48"
              : "rgba(255,255,255,0.35)",
          }}
        >
          {elapsed}m
        </span>
      </div>

      {/* Urgent warning */}
      {isUrgent && (
        <div
          style={{
            marginTop: 8,
            padding: "5px 10px",
            background: "rgba(239,68,68,0.08)",
            borderRadius: 6,
            fontSize: 11,
            color: "#EF4444",
            fontFamily: "var(--font-body)",
            borderLeft: "2px solid #EF4444",
          }}
        >
          ⚠ Order waiting {elapsed} min
        </div>
      )}
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Order Detail Panel
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function OrderDetail({ order, onStatusChange }: {
  order: FirestoreOrder | null;
  onStatusChange: (id: string, status: OrderStatus) => void;
}) {
  if (!order) {
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
        <span style={{ fontSize: 40, opacity: 0.3 }}>📋</span>
        Select an order to view details
      </div>
    );
  }

  const cfg = STATUS_CONFIG[order.status];
  const elapsed = minutesAgo(order.createdAt as Timestamp);
  const nextStatus = NEXT_STATUS[order.status];

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
            {order.orderNumber}
          </h2>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, fontFamily: "var(--font-body)" }}>
            {order.firstName} {order.lastName} · Takeout
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
          { label: "Ordered", value: formatTime(order.createdAt as Timestamp) },
          { label: "Elapsed", value: `${elapsed} min` },
          { label: "Pickup", value: order.pickupTime },
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
            <div style={{ fontSize: 14, color: "#fff", fontWeight: 600, fontFamily: "var(--font-body)" }}>
              {m.value}
            </div>
          </div>
        ))}
      </div>

      {/* Customer info */}
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
          Customer
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Name</div>
            <div style={{ fontSize: 13, color: "#fff", fontWeight: 500 }}>
              {order.firstName} {order.lastName}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Phone</div>
            <div style={{ fontSize: 13, color: "#fff", fontWeight: 500 }}>{order.phone}</div>
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Email</div>
            <div style={{ fontSize: 13, color: "#fff", fontWeight: 500 }}>{order.email}</div>
          </div>
        </div>
      </div>

      {/* Items */}
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            fontSize: 10,
            color: "rgba(255,255,255,0.3)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: 12,
            fontFamily: "var(--font-body)",
          }}
        >
          Items ({order.items.length})
        </div>
        {order.items.map((item, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "10px 0",
              borderBottom: i < order.items.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                style={{
                  background: "rgba(201,160,80,0.12)",
                  color: "#C9A050",
                  width: 24,
                  height: 24,
                  borderRadius: 6,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 700,
                  fontFamily: "monospace",
                  flexShrink: 0,
                }}
              >
                {item.qty}
              </span>
              <span style={{ color: "#fff", fontSize: 13, fontWeight: 500, fontFamily: "var(--font-body)" }}>
                {item.name}
              </span>
            </div>
            <span
              style={{
                color: "rgba(255,255,255,0.45)",
                fontSize: 13,
                fontFamily: "monospace",
                flexShrink: 0,
              }}
            >
              ${(item.price * item.qty).toFixed(2)}
            </span>
          </div>
        ))}

        {/* Totals */}
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          {[
            { label: "Subtotal", value: order.subtotal },
            { label: "Tax", value: order.tax },
            { label: "Packaging", value: order.packagingFee },
            { label: "Tip", value: order.tip },
          ].map((row) => (
            <div
              key={row.label}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "3px 0",
                fontSize: 12,
                color: "rgba(255,255,255,0.4)",
                fontFamily: "var(--font-body)",
              }}
            >
              <span>{row.label}</span>
              <span style={{ fontFamily: "monospace" }}>${row.value.toFixed(2)}</span>
            </div>
          ))}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              paddingTop: 10,
              marginTop: 6,
              borderTop: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, fontFamily: "var(--font-body)" }}>
              Total
            </span>
            <span
              style={{
                color: "#C9A050",
                fontSize: 16,
                fontWeight: 700,
                fontFamily: "monospace",
              }}
            >
              ${order.total.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Special instructions */}
      {order.instructions && (
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
              marginBottom: 6,
              fontFamily: "var(--font-body)",
            }}
          >
            Special Instructions
          </div>
          <div
            style={{
              color: "rgba(255,255,255,0.65)",
              fontSize: 13,
              fontFamily: "var(--font-body)",
              lineHeight: 1.5,
            }}
          >
            {order.instructions}
          </div>
        </div>
      )}

      {/* Promo code */}
      {order.promoCode && (
        <div
          style={{
            display: "inline-block",
            background: "rgba(201,160,80,0.08)",
            border: "1px solid rgba(201,160,80,0.15)",
            borderRadius: 6,
            padding: "4px 10px",
            fontSize: 11,
            color: "#C9A050",
            fontFamily: "var(--font-body)",
            marginBottom: 24,
          }}
        >
          Promo: {order.promoCode}
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 10 }}>
        {nextStatus && (
          <button
            onClick={() => onStatusChange(order.id, nextStatus)}
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
        {order.status !== "cancelled" && order.status !== "picked_up" && (
          <button
            onClick={() => onStatusChange(order.id, "cancelled")}
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
   Orders Page
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export default function OrdersPage() {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const [orders, setOrders] = useState<FirestoreOrder[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState("active");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);

  /* ── Real-time Firestore listener ── */
  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched: FirestoreOrder[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as OrderData),
      }));
      setOrders(fetched);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  /* ── Clock tick ── */
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 30000); // every 30s
    return () => clearInterval(t);
  }, []);

  /* ── Update order status in Firestore ── */
  const handleStatusChange = useCallback(async (id: string, newStatus: OrderStatus) => {
    try {
      await updateDoc(doc(db, "orders", id), { status: newStatus });
    } catch (err) {
      console.error("Failed to update order status:", err);
    }
  }, []);

  /* ── Filtering ── */
  const activeTab = FILTER_TABS.find((t) => t.key === filter)!;
  const filtered = orders.filter((o) => activeTab.statuses.includes(o.status));
  const selected = orders.find((o) => o.id === selectedId) ?? null;

  /* ── Stats ── */
  const activeOrders = orders.filter((o) => !["picked_up", "cancelled"].includes(o.status));
  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const preparingCount = orders.filter((o) => ["confirmed", "preparing"].includes(o.status)).length;
  const readyCount = orders.filter((o) => o.status === "ready").length;
  const completedToday = orders.filter((o) => o.status === "picked_up").length;

  const avgElapsed =
    activeOrders.length > 0
      ? Math.round(
          activeOrders.reduce((sum, o) => sum + minutesAgo(o.createdAt as Timestamp), 0) /
            activeOrders.length
        )
      : 0;

  const todayRevenue = orders
    .filter((o) => o.status === "picked_up")
    .reduce((sum, o) => sum + o.total, 0);

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
            Orders
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
            label="Active Orders"
            value={activeOrders.length}
            sub={`${pendingCount} pending · ${preparingCount} in prep`}
          />
          <StatCard label="Ready for Pickup" value={readyCount} sub="Awaiting customers" accent="#5FBF7A" />
          <StatCard
            label="Avg. Wait Time"
            value={`${avgElapsed}m`}
            sub="Target: 25m"
            accent={avgElapsed > 25 ? "#E89B48" : "#5FBF7A"}
          />
          <StatCard
            label="Completed Today"
            value={completedToday}
            sub={`$${todayRevenue.toFixed(0)} revenue`}
            accent="rgba(255,255,255,0.55)"
          />
        </div>

        {/* ── Filter tabs ── */}
        <div className="dash-filter-tabs" style={{ display: "flex", gap: 6, marginBottom: 16 }}>
          {FILTER_TABS.map((tab) => {
            const count = orders.filter((o) => tab.statuses.includes(o.status)).length;
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
            gridTemplateColumns: "1fr 420px",
            gap: 18,
            minHeight: "calc(100vh - 280px)",
          }}
        >
          {/* Order list */}
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
                Loading orders…
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
                <span style={{ fontSize: 32, opacity: 0.3 }}>✓</span>
                No {activeTab.label.toLowerCase()} orders
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
                    {filtered.length} order{filtered.length !== 1 ? "s" : ""}
                  </span>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>
                    Newest first
                  </span>
                </div>
                {filtered.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    isSelected={order.id === selectedId}
                    onClick={() => setSelectedId(order.id)}
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
                maxHeight: "calc(100vh - 280px)",
              }}
            >
              <OrderDetail order={selected} onStatusChange={handleStatusChange} />
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
            &larr; Back to Orders
          </button>
          <OrderDetail order={selected} onStatusChange={handleStatusChange} />
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