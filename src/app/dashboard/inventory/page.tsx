"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { db } from "@/lib/firebase";
import {
  doc,
  setDoc,
  onSnapshot,
  collection,
  writeBatch,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { categories, menuData } from "@/data/menu";

/* ── Types ── */
type ItemStatus = "available" | "low" | "86";

interface InventoryItem {
  name: string;
  categoryKey: string;
  status: ItemStatus;
  updatedAt: Timestamp | null;
  updatedBy: string;
}

interface ActivityEntry {
  item: string;
  from: ItemStatus;
  to: ItemStatus;
  time: string;
  dotColor: string;
  statusLabel: string;
  statusClass: string;
}

/* ── Build flat item list from menu data ── */
const ALL_ITEMS = categories.flatMap((cat) =>
  (menuData[cat.key] ?? []).map((item) => ({
    name: item.name,
    desc: item.desc ?? "",
    price: item.price,
    categoryKey: cat.key,
    categoryLabel: cat.label,
    tags: item.tags ?? [],
  }))
);

const TOTAL_ITEMS = ALL_ITEMS.length;

/* ── Status config ── */
const STATUS_CONFIG: Record<
  ItemStatus,
  { label: string; icon: string; color: string; dotColor: string }
> = {
  available: { label: "Available", icon: "✓", color: "#5FBF7A", dotColor: "green" },
  low: { label: "Running Low", icon: "⚠", color: "#E8C468", dotColor: "amber" },
  "86": { label: "Out", icon: "✕", color: "#EF4444", dotColor: "red" },
};

/* ── Tag style map ── */
const TAG_MAP: Record<string, { label: string; bg: string; color: string }> = {
  popular: { label: "popular", bg: "rgba(201,160,80,0.1)", color: "#C9A050" },
  new: { label: "new", bg: "rgba(96,165,250,0.1)", color: "#60A5FA" },
  spicy: { label: "spicy", bg: "rgba(239,68,68,0.1)", color: "#EF4444" },
};

/* ════════════════════════════════════════════
   Inventory Page
   ════════════════════════════════════════════ */
export default function InventoryPage() {
  /* ── State ── */
  const [statuses, setStatuses] = useState<Record<string, ItemStatus>>(() => {
    const init: Record<string, ItemStatus> = {};
    ALL_ITEMS.forEach((i) => (init[i.name] = "available"));
    return init;
  });
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [activityLog, setActivityLog] = useState<ActivityEntry[]>([]);
  const [toast, setToast] = useState({ show: false, message: "", color: "" });
  const [showResetModal, setShowResetModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Firestore: subscribe to inventory collection ── */
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "inventory"), (snapshot) => {
      const next: Record<string, ItemStatus> = {};
      ALL_ITEMS.forEach((i) => (next[i.name] = "available"));

      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as InventoryItem;
        if (next[data.name] !== undefined) {
          next[data.name] = data.status;
        }
      });

      setStatuses(next);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  /* ── Clock ── */
  const [clock, setClock] = useState("");
  useEffect(() => {
    const tick = () =>
      setClock(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }));
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  /* ── Toast helper ── */
  const fireToast = useCallback((message: string, color: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ show: true, message, color });
    toastTimer.current = setTimeout(() => setToast({ show: false, message: "", color: "" }), 2500);
  }, []);

  /* ── Set single item status → Firestore ── */
  const handleSetStatus = useCallback(
    async (name: string, categoryKey: string, newStatus: ItemStatus) => {
      const old = statuses[name];
      if (old === newStatus) return;

      // Optimistic update
      setStatuses((prev) => ({ ...prev, [name]: newStatus }));

      // Activity log (local — stays in session)
      const timeStr = new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });
      const cfg = STATUS_CONFIG[newStatus];
      setActivityLog((prev) => [
        {
          item: name,
          from: old,
          to: newStatus,
          time: timeStr,
          dotColor: cfg.dotColor,
          statusLabel: cfg.label,
          statusClass: newStatus === "86" ? "86" : newStatus,
        },
        ...prev,
      ]);

      fireToast(`${name} marked as ${cfg.label}`, cfg.color);

      // Write to Firestore
      const docId = name.replace(/[/\\. ]/g, "_");
      try {
        await setDoc(doc(db, "inventory", docId), {
          name,
          categoryKey,
          status: newStatus,
          updatedAt: serverTimestamp(),
          updatedBy: "staff",
        });
      } catch (err) {
        console.error("Inventory write failed:", err);
        setStatuses((prev) => ({ ...prev, [name]: old }));
      }
    },
    [statuses, fireToast]
  );

  /* ── Reset All → Firestore batch ── */
  const handleResetAll = useCallback(async () => {
    const changed = ALL_ITEMS.filter((i) => statuses[i.name] !== "available");
    if (changed.length === 0) {
      setShowResetModal(false);
      return;
    }

    // Optimistic
    setStatuses(() => {
      const next: Record<string, ItemStatus> = {};
      ALL_ITEMS.forEach((i) => (next[i.name] = "available"));
      return next;
    });

    const timeStr = new Date().toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
    setActivityLog((prev) => [
      {
        item: `${changed.length} items`,
        from: "low",
        to: "available",
        time: timeStr,
        dotColor: "green",
        statusLabel: "Available (Reset All)",
        statusClass: "available",
      },
      ...prev,
    ]);

    setShowResetModal(false);
    fireToast(`${changed.length} items reset to Available`, "#5FBF7A");

    // Batch write
    try {
      const batch = writeBatch(db);
      changed.forEach((item) => {
        const docId = item.name.replace(/[/\\. ]/g, "_");
        batch.set(doc(db, "inventory", docId), {
          name: item.name,
          categoryKey: item.categoryKey,
          status: "available" as ItemStatus,
          updatedAt: serverTimestamp(),
          updatedBy: "staff",
        });
      });
      await batch.commit();
    } catch (err) {
      console.error("Reset batch failed:", err);
    }
  }, [statuses, fireToast]);

  /* ── Computed stats ── */
  const stats = useMemo(() => {
    const available = Object.values(statuses).filter((s) => s === "available").length;
    const low = Object.values(statuses).filter((s) => s === "low").length;
    const eightySixed = Object.values(statuses).filter((s) => s === "86").length;
    return { available, low, eightySixed };
  }, [statuses]);

  /* ── Filtered items ── */
  const filteredItems = useMemo(() => {
    let items = ALL_ITEMS;
    if (activeCategory !== "all") {
      items = items.filter((i) => i.categoryKey === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      items = items.filter(
        (i) => i.name.toLowerCase().includes(q) || i.desc.toLowerCase().includes(q)
      );
    }
    return items;
  }, [activeCategory, search]);

  /* ── Category counts ── */
  const catCounts = useMemo(() => {
    const counts: Record<string, number> = { all: ALL_ITEMS.length };
    categories.forEach((cat) => {
      counts[cat.key] = (menuData[cat.key] ?? []).length;
    });
    return counts;
  }, []);

  /* ── 86'd / Low summary ── */
  const summaryItems = useMemo(() => {
    const items86 = ALL_ITEMS.filter((i) => statuses[i.name] === "86");
    const itemsLow = ALL_ITEMS.filter((i) => statuses[i.name] === "low");
    return { items86, itemsLow };
  }, [statuses]);

  /* ═══════════════════════════════════
     RENDER
     ═══════════════════════════════════ */
  return (
    <div style={{ minHeight: "100vh" }}>
      {/* ── Topbar ── */}
      <div style={styles.topbar}>
        <h1 style={styles.topbarTitle}>Inventory</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={styles.liveDot} />
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Live</span>
          </div>
          <span
            style={{
              fontSize: 13,
              color: "rgba(255,255,255,0.45)",
              fontFamily: "monospace",
            }}
          >
            {clock}
          </span>
        </div>
      </div>

      <div style={{ padding: "20px 28px" }}>
        {/* ── Stats row ── */}
        <div style={styles.statsRow}>
          <StatCard
            label="Total Items"
            value={TOTAL_ITEMS}
            sub={`Across ${categories.length} categories`}
            color="rgba(255,255,255,0.55)"
          />
          <StatCard
            label="Available"
            value={stats.available}
            sub={
              stats.available === TOTAL_ITEMS
                ? "All items in stock"
                : `${Math.round((stats.available / TOTAL_ITEMS) * 100)}% availability`
            }
            color="#5FBF7A"
          />
          <StatCard label="Running Low" value={stats.low} sub="Monitor closely" color="#E8C468" />
          <StatCard
            label="86'd Items"
            value={stats.eightySixed}
            sub="Unavailable tonight"
            color="#EF4444"
          />
        </div>

        {/* ── Controls bar ── */}
        <div style={styles.controlsBar}>
          <div style={styles.categoryTabs}>
            <CatTab
              label="All"
              count={catCounts.all}
              active={activeCategory === "all"}
              onClick={() => setActiveCategory("all")}
            />
            {categories.map((cat) => (
              <CatTab
                key={cat.key}
                label={cat.label}
                count={catCounts[cat.key]}
                active={activeCategory === cat.key}
                onClick={() => setActiveCategory(cat.key)}
              />
            ))}
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexShrink: 0 }}>
            <input
              type="text"
              placeholder="Search items…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={styles.searchBox}
              onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(201,160,80,0.3)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)")}
            />
            <button
              onClick={() => setShowResetModal(true)}
              style={styles.resetBtn}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(95,191,122,0.12)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "rgba(95,191,122,0.06)")
              }
            >
              ↻ Reset All
            </button>
          </div>
        </div>

        {/* ── Main grid ── */}
        <div style={styles.mainGrid}>
          {/* Items panel */}
          <div style={styles.itemsPanel}>
            {loading ? (
              <div style={styles.emptyState}>
                <span style={{ fontSize: 24, opacity: 0.3 }}>⏳</span>
                Loading inventory…
              </div>
            ) : filteredItems.length === 0 ? (
              <div style={styles.emptyState}>
                <span style={{ fontSize: 32, opacity: 0.3 }}>🔍</span>
                No items match your search
              </div>
            ) : (
              <>
                <div style={styles.itemsHeader}>
                  <span>
                    {filteredItems.length} item{filteredItems.length !== 1 ? "s" : ""}
                  </span>
                  <span>
                    {activeCategory === "all"
                      ? "All categories"
                      : categories.find((c) => c.key === activeCategory)?.label}
                  </span>
                </div>
                {filteredItems.map((item) => (
                  <ItemCard
                    key={`${item.categoryKey}-${item.name}`}
                    name={item.name}
                    desc={item.desc}
                    price={item.price}
                    tags={item.tags as string[]}
                    categoryKey={item.categoryKey}
                    status={statuses[item.name] ?? "available"}
                    onSetStatus={handleSetStatus}
                  />
                ))}
              </>
            )}
          </div>

          {/* Activity panel */}
          <div style={styles.activityPanel}>
            <div style={styles.activityTitle}>Activity Log</div>
            <div style={{ flex: 1, overflowY: "auto" }}>
              {activityLog.length === 0 ? (
                <div style={{ ...styles.emptyState, height: 120 }}>
                  <span style={{ fontSize: 24, opacity: 0.3 }}>📋</span>
                  No changes yet this session
                </div>
              ) : (
                activityLog.slice(0, 20).map((entry, i) => (
                  <div key={i} style={styles.activityItem}>
                    <div style={styles.activityDotCol}>
                      <div
                        style={{
                          ...styles.activityDot,
                          background: STATUS_CONFIG[entry.to]?.color ?? "#5FBF7A",
                        }}
                      />
                      {i < activityLog.length - 1 && <div style={styles.activityLine} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={styles.activityText}>
                        <span style={{ color: "#fff", fontWeight: 600 }}>{entry.item}</span>{" "}
                        →{" "}
                        <span
                          style={{
                            color: STATUS_CONFIG[entry.to]?.color ?? "#5FBF7A",
                            fontWeight: 600,
                          }}
                        >
                          {entry.statusLabel}
                        </span>
                      </p>
                      <div style={styles.activityTime}>{entry.time}</div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Tonight's Summary */}
            <div style={styles.summarySection}>
              <div style={styles.summaryTitle}>Tonight&apos;s Summary</div>
              {summaryItems.items86.length === 0 && summaryItems.itemsLow.length === 0 ? (
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", padding: "6px 0" }}>
                  ✓ All items available
                </div>
              ) : (
                <>
                  {summaryItems.items86.map((item) => (
                    <div key={item.name} style={styles.summaryItem}>
                      <span style={{ color: "rgba(255,255,255,0.35)" }}>{item.name}</span>
                      <span style={{ fontWeight: 600, fontFamily: "monospace", color: "#EF4444" }}>
                        Out
                      </span>
                    </div>
                  ))}
                  {summaryItems.itemsLow.map((item) => (
                    <div key={item.name} style={styles.summaryItem}>
                      <span style={{ color: "rgba(255,255,255,0.35)" }}>{item.name}</span>
                      <span style={{ fontWeight: 600, fontFamily: "monospace", color: "#E8C468" }}>
                        Low
                      </span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Reset Modal ── */}
      {showResetModal && (
        <div style={styles.modalOverlay} onClick={() => setShowResetModal(false)}>
          <div style={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <h3
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 18,
                marginBottom: 8,
              }}
            >
              Reset All Items
            </h3>
            <p
              style={{
                color: "rgba(255,255,255,0.45)",
                fontSize: 13,
                lineHeight: 1.5,
                marginBottom: 20,
              }}
            >
              This will mark all menu items as{" "}
              <strong style={{ color: "#5FBF7A" }}>Available</strong>. Use this at the
              start of each service.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button
                onClick={() => setShowResetModal(false)}
                style={styles.modalCancel}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(255,255,255,0.08)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "rgba(255,255,255,0.04)")
                }
              >
                Cancel
              </button>
              <button
                onClick={handleResetAll}
                style={styles.modalConfirm}
                onMouseEnter={(e) => (e.currentTarget.style.filter = "brightness(1.1)")}
                onMouseLeave={(e) => (e.currentTarget.style.filter = "brightness(1)")}
              >
                Reset All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      <div
        style={{
          position: "fixed",
          bottom: 24,
          right: 28,
          background: "rgba(17,16,9,0.95)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderLeft: `3px solid ${toast.color || "transparent"}`,
          borderRadius: 10,
          padding: "12px 20px",
          fontSize: 13,
          color: "#fff",
          zIndex: 300,
          transform: `translateY(${toast.show ? "0" : "80px"})`,
          opacity: toast.show ? 1 : 0,
          transition: "all 0.3s cubic-bezier(0.22,1,0.36,1)",
          display: "flex",
          alignItems: "center",
          gap: 8,
          pointerEvents: "none",
          fontFamily: "var(--font-body)",
        }}
      >
        {toast.message}
      </div>

      {/* ── Live dot animation ── */}
      <style>{`
        @keyframes inventoryPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}

/* ────────────────────────────────────────────
   Sub-components
   ──────────────────────────────────────────── */

function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: number;
  sub: string;
  color: string;
}) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statLabel}>{label}</div>
      <div style={{ ...styles.statValue, color }}>{value}</div>
      <div style={styles.statSub}>{sub}</div>
    </div>
  );
}

function CatTab({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: "7px 14px",
        borderRadius: 8,
        border: `1px solid ${active ? "rgba(201,160,80,0.25)" : "rgba(255,255,255,0.06)"}`,
        background: active
          ? "rgba(201,160,80,0.08)"
          : hovered
            ? "rgba(255,255,255,0.04)"
            : "rgba(255,255,255,0.02)",
        color: active ? "#C9A050" : "rgba(255,255,255,0.35)",
        fontSize: 12,
        fontWeight: 600,
        cursor: "pointer",
        fontFamily: "var(--font-body)",
        display: "flex",
        alignItems: "center",
        gap: 6,
        transition: "all 0.2s",
        whiteSpace: "nowrap",
      }}
    >
      {label}
      <span
        style={{
          padding: "1px 7px",
          borderRadius: 10,
          fontSize: 11,
          fontFamily: "monospace",
          background: active ? "rgba(201,160,80,0.15)" : "rgba(255,255,255,0.06)",
        }}
      >
        {count}
      </span>
    </button>
  );
}

function ItemCard({
  name,
  desc,
  price,
  tags,
  categoryKey,
  status,
  onSetStatus,
}: {
  name: string;
  desc: string;
  price: number;
  tags: string[];
  categoryKey: string;
  status: ItemStatus;
  onSetStatus: (name: string, categoryKey: string, status: ItemStatus) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const is86 = status === "86";
  const isLow = status === "low";

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "rgba(255,255,255,0.025)" : "rgba(255,255,255,0.015)",
        border: "1px solid rgba(255,255,255,0.04)",
        borderLeft: `3px solid ${is86 ? "#EF4444" : isLow ? "#E8C468" : "transparent"}`,
        borderRadius: 12,
        padding: "14px 16px",
        marginBottom: 6,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 14,
        transition: "all 0.2s ease",
        opacity: is86 ? 0.6 : 1,
      }}
    >
      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: is86 ? "rgba(255,255,255,0.4)" : "#fff",
            textDecoration: is86 ? "line-through" : "none",
            marginBottom: 2,
          }}
        >
          {name}
        </div>
        <div
          style={{
            fontSize: 11,
            color: "rgba(255,255,255,0.35)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {desc}
        </div>
        {tags.filter((t) => TAG_MAP[t]).length > 0 && (
          <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
            {tags
              .filter((t) => TAG_MAP[t])
              .map((t) => (
                <span
                  key={t}
                  style={{
                    fontSize: 9,
                    padding: "1px 6px",
                    borderRadius: 4,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    fontWeight: 600,
                    background: TAG_MAP[t].bg,
                    color: TAG_MAP[t].color,
                  }}
                >
                  {TAG_MAP[t].label}
                </span>
              ))}
          </div>
        )}
      </div>

      {/* Price */}
      <div
        style={{
          fontSize: 13,
          fontFamily: "monospace",
          color: is86 ? "rgba(201,160,80,0.3)" : "#C9A050",
          flexShrink: 0,
          minWidth: 40,
          textAlign: "right",
          marginRight: 14,
        }}
      >
        ${price}
      </div>

      {/* Status toggle */}
      <div
        style={{
          display: "flex",
          borderRadius: 8,
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.06)",
          flexShrink: 0,
        }}
      >
        {(["available", "low", "86"] as ItemStatus[]).map((s) => (
          <ToggleBtn
            key={s}
            label={s === "available" ? "In" : s === "low" ? "Low" : "Out"}
            active={status === s}
            variant={s}
            onClick={() => onSetStatus(name, categoryKey, s)}
          />
        ))}
      </div>
    </div>
  );
}

function ToggleBtn({
  label,
  active,
  variant,
  onClick,
}: {
  label: string;
  active: boolean;
  variant: ItemStatus;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  const activeBg: Record<ItemStatus, string> = {
    available: "rgba(95,191,122,0.12)",
    low: "rgba(232,196,104,0.12)",
    "86": "rgba(239,68,68,0.12)",
  };
  const activeColor: Record<ItemStatus, string> = {
    available: "#5FBF7A",
    low: "#E8C468",
    "86": "#EF4444",
  };

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: "6px 10px",
        fontSize: 10,
        fontWeight: 600,
        fontFamily: "var(--font-body)",
        cursor: "pointer",
        border: "none",
        borderRight: variant !== "86" ? "1px solid rgba(255,255,255,0.06)" : "none",
        background: active
          ? activeBg[variant]
          : hovered
            ? "rgba(255,255,255,0.03)"
            : "transparent",
        color: active ? activeColor[variant] : "rgba(255,255,255,0.25)",
        transition: "all 0.15s",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
      }}
    >
      {label}
    </button>
  );
}

/* ────────────────────────────────────────────
   Inline Styles
   ──────────────────────────────────────────── */
const styles: Record<string, React.CSSProperties> = {
  topbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 28px",
    height: 60,
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(255,255,255,0.015)",
    position: "sticky",
    top: 0,
    zIndex: 50,
    backdropFilter: "blur(20px)",
  },
  topbarTitle: {
    fontFamily: "var(--font-display)",
    fontSize: 20,
    fontWeight: 700,
    margin: 0,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: "#5FBF7A",
    boxShadow: "0 0 8px rgba(95,191,122,0.5)",
    animation: "inventoryPulse 2s ease-in-out infinite",
  },
  statsRow: {
    display: "flex",
    gap: 14,
    marginBottom: 24,
  },
  statCard: {
    background: "rgba(255,255,255,0.025)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 14,
    padding: "20px 22px",
    flex: 1,
    minWidth: 0,
  },
  statLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.35)",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 30,
    fontWeight: 700,
    fontFamily: "var(--font-display)",
    lineHeight: 1,
  },
  statSub: {
    fontSize: 12,
    color: "rgba(255,255,255,0.3)",
    marginTop: 6,
  },
  controlsBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    gap: 14,
  },
  categoryTabs: {
    display: "flex",
    gap: 6,
    flexWrap: "wrap",
  },
  searchBox: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 8,
    padding: "8px 14px",
    color: "#fff",
    fontSize: 12,
    fontFamily: "var(--font-body)",
    width: 200,
    outline: "none",
    transition: "border-color 0.2s",
  },
  resetBtn: {
    padding: "8px 16px",
    borderRadius: 8,
    border: "1px solid rgba(95,191,122,0.2)",
    background: "rgba(95,191,122,0.06)",
    color: "#5FBF7A",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "var(--font-body)",
    transition: "all 0.2s",
    whiteSpace: "nowrap",
  },
  mainGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 340px",
    gap: 18,
    minHeight: "calc(100vh - 280px)",
  },
  itemsPanel: {
    background: "rgba(255,255,255,0.015)",
    border: "1px solid rgba(255,255,255,0.05)",
    borderRadius: 14,
    padding: 12,
    overflowY: "auto",
    maxHeight: "calc(100vh - 280px)",
  },
  itemsHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 4px",
    marginBottom: 10,
    fontSize: 11,
    color: "rgba(255,255,255,0.25)",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: 200,
    color: "rgba(255,255,255,0.2)",
    fontSize: 13,
    gap: 8,
  },
  activityPanel: {
    background: "rgba(255,255,255,0.015)",
    border: "1px solid rgba(255,255,255,0.05)",
    borderRadius: 14,
    padding: 16,
    overflowY: "auto",
    maxHeight: "calc(100vh - 280px)",
    display: "flex",
    flexDirection: "column",
  },
  activityTitle: {
    fontSize: 10,
    color: "rgba(201,160,80,0.6)",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginBottom: 16,
  },
  activityItem: {
    display: "flex",
    gap: 12,
    padding: "8px 0",
    borderBottom: "1px solid rgba(255,255,255,0.02)",
  },
  activityDotCol: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    paddingTop: 4,
  },
  activityDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    flexShrink: 0,
  },
  activityLine: {
    width: 1,
    flex: 1,
    background: "rgba(255,255,255,0.04)",
    marginTop: 4,
  },
  activityText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.45)",
    lineHeight: 1.5,
    margin: 0,
  },
  activityTime: {
    fontSize: 10,
    color: "rgba(255,255,255,0.15)",
    marginTop: 2,
  },
  summarySection: {
    marginTop: "auto",
    paddingTop: 16,
    borderTop: "1px solid rgba(255,255,255,0.04)",
  },
  summaryTitle: {
    fontSize: 10,
    color: "rgba(201,160,80,0.6)",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginBottom: 12,
  },
  summaryItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "6px 0",
    fontSize: 12,
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 200,
    backdropFilter: "blur(4px)",
  },
  modalBox: {
    background: "#111009",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 14,
    padding: 28,
    maxWidth: 380,
    width: "90%",
    textAlign: "center",
  },
  modalCancel: {
    padding: "10px 24px",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "var(--font-body)",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "rgba(255,255,255,0.45)",
    transition: "all 0.2s",
  },
  modalConfirm: {
    padding: "10px 24px",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "var(--font-body)",
    background: "linear-gradient(135deg, #5FBF7A, #3da05a)",
    border: "none",
    color: "#080603",
    transition: "all 0.2s",
  },
};