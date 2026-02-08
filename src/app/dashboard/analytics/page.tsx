"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, Timestamp } from "firebase/firestore";
import { categories, menuData } from "@/data/menu";
import type { OrderData } from "@/lib/order";

/* ══════════════════════════════════════════════
   Types
   ══════════════════════════════════════════════ */
type Period = "daily" | "weekly" | "monthly";

interface ConsultationDoc {
  status: string;
  budget?: string;
  guestCount?: string;
  packageInterest?: string;
  createdAt: Timestamp | null;
}

interface InventoryDoc {
  name: string;
  categoryKey: string;
  status: "available" | "low" | "86";
  updatedAt: Timestamp | null;
  updatedBy: string;
}

/* ══════════════════════════════════════════════
   Helpers
   ══════════════════════════════════════════════ */
const CATEGORY_COLORS: Record<string, string> = {
  coldAppetizers: "#C9A050",
  salads: "#4ADE80",
  soups: "#60A5FA",
  hotAppetizers: "#E8C468",
  mains: "#FB923C",
  desserts: "#A78BFA",
  drinks: "#F472B6",
};

const CATEGORY_LABELS: Record<string, string> = {};
categories.forEach((c) => (CATEGORY_LABELS[c.key] = c.label));

/* All menu items flat */
const ALL_ITEMS = categories.flatMap((cat) =>
  (menuData[cat.key] ?? []).map((item) => ({
    name: item.name,
    price: item.price,
    categoryKey: cat.key,
  }))
);
const ITEM_CATEGORY: Record<string, string> = {};
ALL_ITEMS.forEach((i) => (ITEM_CATEGORY[i.name] = i.categoryKey));

function getStartOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

function getStartOfWeek(d: Date): Date {
  const r = new Date(d);
  const day = r.getDay();
  const diff = day === 0 ? 6 : day - 1; // Monday start
  r.setDate(r.getDate() - diff);
  r.setHours(0, 0, 0, 0);
  return r;
}

function getStartOfMonth(d: Date): Date {
  const r = new Date(d);
  r.setDate(1);
  r.setHours(0, 0, 0, 0);
  return r;
}

function estimateCateringValue(c: ConsultationDoc): number {
  /* Try to estimate from package + guest count */
  const pkg = (c.packageInterest ?? "").toLowerCase();
  const guestStr = c.guestCount ?? "";
  const guestMatches = guestStr.match(/(\d+)/g);
  const guests = guestMatches
    ? guestMatches.length >= 2
      ? Math.round((parseInt(guestMatches[0], 10) + parseInt(guestMatches[1], 10)) / 2)
      : parseInt(guestMatches[0], 10)
    : 40;

  if (pkg.includes("grand") || pkg.includes("feast")) return guests * 250;
  if (pkg.includes("tsar")) return guests * 165;
  if (pkg.includes("zakuski")) return guests * 85;

  /* Fallback: budget string or default */
  const budgetStr = c.budget ?? "";
  const budgetMatch = budgetStr.match(/(\d[\d,]*)/);
  if (budgetMatch) return parseInt(budgetMatch[1].replace(/,/g, ""), 10);

  return guests * 165; // default mid-tier
}

function formatCurrency(n: number, compact?: boolean): string {
  if (compact && n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

/* ══════════════════════════════════════════════
   Main Component
   ══════════════════════════════════════════════ */
export default function AnalyticsPage() {
  /* ── Raw Firestore data ── */
  const [orders, setOrders] = useState<(OrderData & { id: string })[]>([]);
  const [consultations, setConsultations] = useState<(ConsultationDoc & { id: string })[]>([]);
  const [inventoryDocs, setInventoryDocs] = useState<(InventoryDoc & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("weekly");

  /* ── Clock ── */
  const [clock, setClock] = useState("");
  useEffect(() => {
    const tick = () =>
      setClock(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }));
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  /* ── Firestore subscriptions ── */
  useEffect(() => {
    let loaded = 0;
    const done = () => {
      loaded++;
      if (loaded >= 3) setLoading(false);
    };

    const unsubOrders = onSnapshot(collection(db, "orders"), (snap) => {
      const docs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as OrderData) }));
      setOrders(docs);
      done();
    });

    const unsubConsult = onSnapshot(collection(db, "consultations"), (snap) => {
      const docs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as ConsultationDoc) }));
      setConsultations(docs);
      done();
    });

    const unsubInv = onSnapshot(collection(db, "inventory"), (snap) => {
      const docs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as InventoryDoc) }));
      setInventoryDocs(docs);
      done();
    });

    return () => {
      unsubOrders();
      unsubConsult();
      unsubInv();
    };
  }, []);

  /* ── Filter orders by period ── */
  const now = useMemo(() => new Date(), []);

  const filteredOrders = useMemo(() => {
    const cutoff =
      period === "daily"
        ? getStartOfDay(now)
        : period === "weekly"
          ? getStartOfWeek(now)
          : getStartOfMonth(now);

    return orders.filter((o) => {
      if (o.status === "cancelled") return false;
      if (!o.createdAt) return false;
      const ts = o.createdAt instanceof Timestamp ? o.createdAt.toDate() : new Date();
      return ts >= cutoff;
    });
  }, [orders, period, now]);

  /* ── Stat computations ── */
  const stats = useMemo(() => {
    const totalRevenue = filteredOrders.reduce((s, o) => s + (o.total ?? 0), 0);
    const orderCount = filteredOrders.length;
    const avgOrder = orderCount > 0 ? totalRevenue / orderCount : 0;
    const totalTips = filteredOrders.reduce((s, o) => s + (o.tip ?? 0), 0);
    const avgTip = orderCount > 0 ? totalTips / orderCount : 0;
    const tipPct = totalRevenue > 0 ? (totalTips / (totalRevenue - totalTips)) * 100 : 0;
    const withPromo = filteredOrders.filter((o) => o.promoCode && o.promoCode.trim() !== "").length;
    const promoPct = orderCount > 0 ? (withPromo / orderCount) * 100 : 0;

    /* Avg items per order */
    const totalItems = filteredOrders.reduce(
      (s, o) => s + (o.items ?? []).reduce((si, item) => si + (item.qty ?? 1), 0),
      0
    );
    const avgItems = orderCount > 0 ? totalItems / orderCount : 0;

    return { totalRevenue, orderCount, avgOrder, avgTip, tipPct, withPromo, promoPct, avgItems };
  }, [filteredOrders]);

  /* ── Catering pipeline ── */
  const cateringStats = useMemo(() => {
    const completed = consultations.filter((c) => c.status === "completed");
    const active = consultations.filter(
      (c) => c.status !== "completed" && c.status !== "cancelled"
    );
    const completedRevenue = completed.reduce((s, c) => s + estimateCateringValue(c), 0);
    const pipelineRevenue = active.reduce((s, c) => s + estimateCateringValue(c), 0);
    return { completedCount: completed.length, activeCount: active.length, completedRevenue, pipelineRevenue };
  }, [consultations]);

  /* ── 86'd items ── */
  const eightySixedItems = useMemo(() => {
    return inventoryDocs.filter((d) => d.status === "86");
  }, [inventoryDocs]);

  const lowItems = useMemo(() => {
    return inventoryDocs.filter((d) => d.status === "low");
  }, [inventoryDocs]);

  /* ── Popular items ── */
  const popularItems = useMemo(() => {
    const counts: Record<string, { count: number; revenue: number; categoryKey: string }> = {};
    filteredOrders.forEach((o) => {
      (o.items ?? []).forEach((item) => {
        if (!counts[item.name]) {
          counts[item.name] = {
            count: 0,
            revenue: 0,
            categoryKey: item.categoryKey ?? ITEM_CATEGORY[item.name] ?? "unknown",
          };
        }
        counts[item.name].count += item.qty ?? 1;
        counts[item.name].revenue += (item.price ?? 0) * (item.qty ?? 1);
      });
    });

    const sorted = Object.entries(counts)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const maxCount = sorted.length > 0 ? sorted[0].count : 1;
    return sorted.map((item) => ({ ...item, pct: Math.round((item.count / maxCount) * 100) }));
  }, [filteredOrders]);

  /* ── Revenue by category ── */
  const categoryBreakdown = useMemo(() => {
    const totals: Record<string, number> = {};
    filteredOrders.forEach((o) => {
      (o.items ?? []).forEach((item) => {
        const cat = item.categoryKey ?? ITEM_CATEGORY[item.name] ?? "unknown";
        totals[cat] = (totals[cat] ?? 0) + (item.price ?? 0) * (item.qty ?? 1);
      });
    });

    const total = Object.values(totals).reduce((s, v) => s + v, 0) || 1;
    return categories
      .map((cat) => ({
        key: cat.key,
        label: cat.label,
        value: totals[cat.key] ?? 0,
        pct: Math.round(((totals[cat.key] ?? 0) / total) * 100),
        color: CATEGORY_COLORS[cat.key] ?? "#888",
      }))
      .filter((c) => c.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [filteredOrders]);

  /* ── Revenue trend data for chart ── */
  const chartData = useMemo(() => {
    if (period === "daily") {
      /* Hourly buckets 0–23 */
      const buckets = Array.from({ length: 24 }, () => ({ revenue: 0, orders: 0 }));
      filteredOrders.forEach((o) => {
        if (!o.createdAt) return;
        const ts = o.createdAt instanceof Timestamp ? o.createdAt.toDate() : new Date();
        const h = ts.getHours();
        buckets[h].revenue += o.total ?? 0;
        buckets[h].orders += 1;
      });
      const labels = buckets.map((_, i) => {
        if (i === 0) return "12a";
        if (i < 12) return `${i}a`;
        if (i === 12) return "12p";
        return `${i - 12}p`;
      });
      return {
        labels,
        revenue: buckets.map((b) => Math.round(b.revenue)),
        orders: buckets.map((b) => b.orders),
      };
    }

    if (period === "weekly") {
      /* Daily buckets Mon–Sun */
      const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      const weekStart = getStartOfWeek(now);
      const buckets = Array.from({ length: 7 }, () => ({ revenue: 0, orders: 0 }));

      filteredOrders.forEach((o) => {
        if (!o.createdAt) return;
        const ts = o.createdAt instanceof Timestamp ? o.createdAt.toDate() : new Date();
        const diff = Math.floor((ts.getTime() - weekStart.getTime()) / 86400000);
        const idx = Math.max(0, Math.min(6, diff));
        buckets[idx].revenue += o.total ?? 0;
        buckets[idx].orders += 1;
      });

      return {
        labels: dayNames,
        revenue: buckets.map((b) => Math.round(b.revenue)),
        orders: buckets.map((b) => b.orders),
      };
    }

    /* Monthly: weekly buckets */
    const monthStart = getStartOfMonth(now);
    const weeksInMonth = 5;
    const buckets = Array.from({ length: weeksInMonth }, () => ({ revenue: 0, orders: 0 }));

    filteredOrders.forEach((o) => {
      if (!o.createdAt) return;
      const ts = o.createdAt instanceof Timestamp ? o.createdAt.toDate() : new Date();
      const dayOfMonth = ts.getDate() - 1;
      const weekIdx = Math.min(Math.floor(dayOfMonth / 7), weeksInMonth - 1);
      buckets[weekIdx].revenue += o.total ?? 0;
      buckets[weekIdx].orders += 1;
    });

    return {
      labels: buckets.map((_, i) => `Week ${i + 1}`),
      revenue: buckets.map((b) => Math.round(b.revenue)),
      orders: buckets.map((b) => b.orders),
    };
  }, [filteredOrders, period, now]);

  /* ── Peak hours heatmap ── */
  const heatmapData = useMemo(() => {
    /* 12 rows (11am–10pm) × 7 cols (Mon–Sun) */
    const grid = Array.from({ length: 12 }, () => Array.from({ length: 7 }, () => 0));

    orders.forEach((o) => {
      if (o.status === "cancelled" || !o.createdAt) return;
      const ts = o.createdAt instanceof Timestamp ? o.createdAt.toDate() : null;
      if (!ts) return;

      /* Only include orders within last 30 days for heatmap */
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
      if (ts < thirtyDaysAgo) return;

      const hour = ts.getHours();
      const rowIdx = hour - 11; // 11am = row 0
      if (rowIdx < 0 || rowIdx > 11) return;

      const jsDay = ts.getDay(); // 0=Sun
      const colIdx = jsDay === 0 ? 6 : jsDay - 1; // Mon=0
      grid[rowIdx][colIdx]++;
    });

    return grid;
  }, [orders, now]);

  const heatmapMax = useMemo(
    () => Math.max(1, ...heatmapData.flat()),
    [heatmapData]
  );

  /* ══════════════════════════════════════════════
     Chart SVG builder
     ══════════════════════════════════════════════ */
  const buildChartSVG = useCallback(() => {
    const { labels, revenue } = chartData;
    const W = 900,
      H = 220;
    const padL = 55,
      padR = 20,
      padT = 15,
      padB = 30;
    const chartW = W - padL - padR;
    const chartH = H - padT - padB;
    const n = labels.length;

    if (n === 0 || revenue.every((v) => v === 0)) {
      return `<text x="${W / 2}" y="${H / 2}" text-anchor="middle" fill="rgba(255,255,255,0.2)" font-family="'DM Sans',sans-serif" font-size="13">No order data for this period</text>`;
    }

    const maxRev = Math.max(...revenue) * 1.15 || 100;
    let svg = `<defs>
      <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="rgba(201,160,80,0.25)"/>
        <stop offset="100%" stop-color="rgba(201,160,80,0)"/>
      </linearGradient>
    </defs>`;

    /* Grid lines */
    for (let i = 0; i <= 4; i++) {
      const y = padT + (chartH / 4) * i;
      const val = Math.round(maxRev - (maxRev / 4) * i);
      svg += `<line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>`;
      svg += `<text x="${padL - 8}" y="${y + 4}" text-anchor="end" fill="rgba(255,255,255,0.2)" font-family="'DM Mono',monospace" font-size="10">${formatCurrency(val, true)}</text>`;
    }

    /* Points */
    const points = revenue.map((v, i) => {
      const x = n === 1 ? padL + chartW / 2 : padL + (chartW / (n - 1)) * i;
      const y = padT + chartH - (v / maxRev) * chartH;
      return { x, y, v };
    });

    /* Area fill */
    const areaPath =
      `M${points[0].x},${points[0].y} ` +
      points
        .slice(1)
        .map((p) => `L${p.x},${p.y}`)
        .join(" ") +
      ` L${points[points.length - 1].x},${padT + chartH} L${points[0].x},${padT + chartH} Z`;
    svg += `<path d="${areaPath}" fill="url(#goldGrad)"/>`;

    /* Line */
    const linePath = `M${points.map((p) => `${p.x},${p.y}`).join(" L")}`;
    svg += `<path d="${linePath}" fill="none" stroke="#C9A050" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="filter:drop-shadow(0 0 6px rgba(201,160,80,0.3))"/>`;

    /* Labels + dots */
    points.forEach((p, i) => {
      /* Only show every Nth label if too many */
      const showLabel = n <= 12 || i % Math.ceil(n / 12) === 0;
      if (showLabel) {
        svg += `<text x="${p.x}" y="${H - 6}" text-anchor="middle" fill="rgba(255,255,255,0.2)" font-family="'DM Mono',monospace" font-size="10">${labels[i]}</text>`;
      }
      svg += `<circle cx="${p.x}" cy="${p.y}" r="4" fill="#C9A050" stroke="#0A0A0A" stroke-width="2" style="cursor:pointer">
        <title>${labels[i]}: ${formatCurrency(p.v)}</title>
      </circle>`;
    });

    return svg;
  }, [chartData]);

  /* ══════════════════════════════════════════════
     Donut SVG builder
     ══════════════════════════════════════════════ */
  const buildDonutSVG = useCallback(() => {
    const cx = 80,
      cy = 80,
      r = 60,
      strokeW = 18;
    const circ = 2 * Math.PI * r;
    let offset = 0;
    let svg = "";

    if (categoryBreakdown.length === 0) {
      svg += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="${strokeW}"/>`;
    } else {
      categoryBreakdown.forEach((cat) => {
        const len = (cat.pct / 100) * circ;
        svg += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${cat.color}" stroke-width="${strokeW}"
          stroke-dasharray="${len} ${circ - len}" stroke-dashoffset="${-offset}"
          transform="rotate(-90 ${cx} ${cy})" style="opacity:0.85;cursor:pointer;">
          <title>${cat.label}: ${cat.pct}% — ${formatCurrency(cat.value)}</title>
        </circle>`;
        offset += len;
      });
    }

    const count = categoryBreakdown.length || 0;
    svg += `<text x="${cx}" y="${cy - 4}" text-anchor="middle" fill="#fff" font-family="'Playfair Display',serif" font-size="20" font-weight="700">${count}</text>`;
    svg += `<text x="${cx}" y="${cy + 12}" text-anchor="middle" fill="rgba(255,255,255,0.3)" font-family="'DM Sans',sans-serif" font-size="10">${count === 1 ? "category" : "categories"}</text>`;

    return svg;
  }, [categoryBreakdown]);

  /* ══════════════════════════════════════════════
     Period label
     ══════════════════════════════════════════════ */
  const periodLabel = period === "daily" ? "Today" : period === "weekly" ? "This week" : "This month";

  /* ══════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════ */
  return (
    <div style={{ minHeight: "100vh" }}>
      {/* ── Topbar ── */}
      <div style={S.topbar}>
        <h1 style={S.topbarTitle}>Analytics</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {/* Period toggle */}
          <div style={S.periodToggle}>
            {(["daily", "weekly", "monthly"] as Period[]).map((p) => (
              <PeriodBtn key={p} label={p === "daily" ? "Today" : p === "weekly" ? "This Week" : "This Month"} active={period === p} onClick={() => setPeriod(p)} />
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={S.liveDot} />
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Live</span>
          </div>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", fontFamily: "monospace" }}>
            {clock}
          </span>
        </div>
      </div>

      <div style={{ padding: "20px 28px" }}>
        {loading ? (
          <div style={S.loadingState}>
            <span style={{ fontSize: 28, opacity: 0.3 }}>⏳</span>
            Loading analytics…
          </div>
        ) : (
          <>
            {/* ═══ Stat Cards ═══ */}
            <div style={S.statsRow}>
              <StatCard
                label="Total Revenue"
                value={formatCurrency(stats.totalRevenue)}
                sub={periodLabel}
                color="#E8C468"
              />
              <StatCard
                label="Orders Completed"
                value={String(stats.orderCount)}
                sub={stats.orderCount > 0 ? `Avg ${formatCurrency(Math.round(stats.avgOrder))}/order` : "No orders yet"}
                color="#5FBF7A"
              />
              <StatCard
                label="Avg Order Value"
                value={stats.orderCount > 0 ? formatCurrency(Math.round(stats.avgOrder)) : "—"}
                sub={stats.orderCount > 0 ? `${stats.avgItems.toFixed(1)} items/order` : "No data"}
                color="#fff"
              />
              <StatCard
                label="Catering Revenue"
                value={formatCurrency(cateringStats.completedRevenue, true)}
                sub={cateringStats.activeCount > 0 ? `+ ${formatCurrency(cateringStats.pipelineRevenue, true)} pipeline (${cateringStats.activeCount} active)` : `${cateringStats.completedCount} completed`}
                color="#E8C468"
              />
            </div>

            {/* ═══ Revenue Chart ═══ */}
            <div style={S.panel}>
              <div style={S.panelHeader}>
                <div style={S.panelTitle}>Revenue Trend</div>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 10, height: 3, background: "#C9A050", borderRadius: 2 }} />
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Revenue</span>
                  </div>
                </div>
              </div>
              <div style={{ position: "relative", height: 220 }}>
                <svg
                  style={{ width: "100%", height: "100%" }}
                  viewBox="0 0 900 220"
                  preserveAspectRatio="none"
                  dangerouslySetInnerHTML={{ __html: buildChartSVG() }}
                />
              </div>
            </div>

            {/* ═══ Popular Items + Heatmap ═══ */}
            <div style={S.grid2}>
              {/* Popular Items */}
              <div style={S.panel}>
                <div style={S.panelHeader}>
                  <div style={S.panelTitle}>Top Selling Items</div>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>By units sold</span>
                </div>
                {popularItems.length === 0 ? (
                  <div style={S.emptyState}>No order data for this period</div>
                ) : (
                  popularItems.map((item, i) => (
                    <div key={item.name} style={S.itemRow}>
                      <span style={{ ...S.itemRank, color: i < 3 ? "#E8C468" : "rgba(255,255,255,0.2)" }}>
                        {i + 1}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={S.itemName}>{item.name}</div>
                        <div style={S.itemCat}>{CATEGORY_LABELS[item.categoryKey] ?? item.categoryKey}</div>
                      </div>
                      <div style={S.barTrack}>
                        <div style={{ ...S.barFill, width: `${item.pct}%` }} />
                      </div>
                      <span style={S.itemCount}>{item.count} sold</span>
                      <span style={S.itemRevenue}>{formatCurrency(Math.round(item.revenue))}</span>
                    </div>
                  ))
                )}
              </div>

              {/* Peak Hours Heatmap */}
              <div style={S.panel}>
                <div style={S.panelHeader}>
                  <div style={S.panelTitle}>Peak Hours</div>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>Last 30 days</span>
                </div>
                <div style={S.heatmapGrid}>
                  {/* Header row */}
                  <div />
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                    <div key={d} style={S.heatmapDay}>{d}</div>
                  ))}

                  {/* Data rows */}
                  {heatmapData.map((row, ri) => (
                    <>
                      <div key={`l${ri}`} style={S.heatmapLabel}>
                        {ri + 11 <= 11 ? `${ri + 11}a` : ri + 11 === 12 ? "12p" : `${ri + 11 - 12}p`}
                      </div>
                      {row.map((val, ci) => (
                        <div
                          key={`${ri}-${ci}`}
                          title={`${["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][ci]} ${ri + 11 <= 11 ? `${ri + 11}a` : ri + 11 === 12 ? "12p" : `${ri + 11 - 12}p`}: ${val} orders`}
                          style={{
                            aspectRatio: "1.8",
                            borderRadius: 4,
                            minHeight: 22,
                            cursor: "pointer",
                            transition: "all 0.15s",
                            background:
                              val === 0
                                ? "rgba(255,255,255,0.02)"
                                : `rgba(201,160,80,${0.05 + (val / heatmapMax) * 0.8})`,
                          }}
                        />
                      ))}
                    </>
                  ))}
                </div>
                {/* Legend */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>Fewer</span>
                  <div style={{ display: "flex", gap: 3 }}>
                    {[0.05, 0.15, 0.3, 0.55, 0.85].map((o) => (
                      <div key={o} style={{ width: 16, height: 8, borderRadius: 2, background: `rgba(201,160,80,${o})` }} />
                    ))}
                  </div>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>More</span>
                </div>
              </div>
            </div>

            {/* ═══ Category Breakdown + Order Breakdown + 86'd Log ═══ */}
            <div style={S.grid3}>
              {/* Category Breakdown */}
              <div style={S.panel}>
                <div style={S.panelHeader}>
                  <div style={S.panelTitle}>Revenue by Category</div>
                </div>
                <div style={{ display: "flex", justifyContent: "center", padding: "16px 0" }}>
                  <svg
                    width="160"
                    height="160"
                    viewBox="0 0 160 160"
                    dangerouslySetInnerHTML={{ __html: buildDonutSVG() }}
                  />
                </div>
                {categoryBreakdown.map((cat) => (
                  <div key={cat.key} style={S.catRow}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: cat.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, fontWeight: 500, flex: 1 }}>{cat.label}</span>
                    <div style={S.catBarTrack}>
                      <div style={{ height: "100%", borderRadius: 3, background: cat.color, width: `${cat.pct}%`, transition: "width 0.6s ease" }} />
                    </div>
                    <span style={S.catPct}>{cat.pct}%</span>
                    <span style={S.catVal}>{formatCurrency(Math.round(cat.value))}</span>
                  </div>
                ))}
              </div>

              {/* Order Breakdown */}
              <div style={S.panel}>
                <div style={S.panelHeader}>
                  <div style={S.panelTitle}>Order Breakdown</div>
                </div>
                <div style={{ textAlign: "center", padding: "16px 0 24px" }}>
                  <div style={S.metricBig}>
                    {stats.orderCount > 0 ? formatCurrency(Math.round(stats.avgOrder)) : "—"}
                  </div>
                  <div style={S.metricLabel}>Average order value</div>
                </div>
                <MetricRow label="Total orders" value={String(stats.orderCount)} />
                <MetricRow label="Avg items/order" value={stats.avgItems.toFixed(1)} />
                <MetricRow label="With promo code" value={String(stats.withPromo)} extra={stats.orderCount > 0 ? `${stats.promoPct.toFixed(1)}%` : ""} />
                <MetricRow label="Avg tip" value={stats.orderCount > 0 ? formatCurrency(Math.round(stats.avgTip)) : "—"} extra={stats.tipPct > 0 ? `${stats.tipPct.toFixed(0)}%` : ""} />
                <MetricRow label="Total tips" value={formatCurrency(Math.round(stats.totalRevenue > 0 ? filteredOrders.reduce((s, o) => s + (o.tip ?? 0), 0) : 0))} />
              </div>

              {/* 86'd Log */}
              <div style={S.panel}>
                <div style={S.panelHeader}>
                  <div style={S.panelTitle}>Currently 86&apos;d</div>
                  <span style={{ fontSize: 20, fontWeight: 700, color: eightySixedItems.length > 0 ? "#EF4444" : "#5FBF7A" }}>
                    {eightySixedItems.length}
                  </span>
                </div>
                {eightySixedItems.length === 0 && lowItems.length === 0 ? (
                  <div style={{ ...S.emptyState, height: 80 }}>
                    <span style={{ fontSize: 20, opacity: 0.3 }}>✓</span>
                    All items available
                  </div>
                ) : (
                  <>
                    {eightySixedItems.map((item) => (
                      <div key={item.id} style={S.activityItem}>
                        <div style={{ ...S.activityDot, background: "#EF4444" }} />
                        <div style={{ flex: 1 }}>
                          <div style={S.activityText}>
                            <strong style={{ color: "#fff" }}>{item.name}</strong>
                            <span style={{ color: "#EF4444", fontWeight: 600 }}> — 86&apos;d</span>
                          </div>
                          <div style={S.activityTime}>
                            {item.updatedAt ? item.updatedAt.toDate().toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "Unknown"}
                          </div>
                        </div>
                      </div>
                    ))}
                    {lowItems.map((item) => (
                      <div key={item.id} style={S.activityItem}>
                        <div style={{ ...S.activityDot, background: "#E8C468" }} />
                        <div style={{ flex: 1 }}>
                          <div style={S.activityText}>
                            <strong style={{ color: "#fff" }}>{item.name}</strong>
                            <span style={{ color: "#E8C468", fontWeight: 600 }}> — Running Low</span>
                          </div>
                          <div style={S.activityTime}>
                            {item.updatedAt ? item.updatedAt.toDate().toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "Unknown"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {/* Inventory summary box */}
                <div style={S.summaryBox}>
                  <div style={S.summaryBoxTitle}>Inventory Status</div>
                  <div style={S.summaryBoxText}>
                    <strong style={{ color: "#EF4444" }}>{eightySixedItems.length}</strong> item{eightySixedItems.length !== 1 ? "s" : ""} 86&apos;d
                    {" · "}
                    <strong style={{ color: "#E8C468" }}>{lowItems.length}</strong> running low
                    {" · "}
                    <strong style={{ color: "#5FBF7A" }}>{ALL_ITEMS.length - eightySixedItems.length - lowItems.length}</strong> available
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Live dot animation ── */}
      <style>{`
        @keyframes analyticsPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}

/* ══════════════════════════════════════════════
   Sub-components
   ══════════════════════════════════════════════ */
function StatCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div style={S.statCard}>
      <div style={S.statLabel}>{label}</div>
      <div style={{ ...S.statValue, color }}>{value}</div>
      <div style={S.statSub}>{sub}</div>
    </div>
  );
}

function PeriodBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: "6px 16px",
        borderRadius: 6,
        fontSize: 12,
        fontWeight: 600,
        cursor: "pointer",
        fontFamily: "var(--font-body)",
        border: active ? "1px solid rgba(201,160,80,0.25)" : "1px solid transparent",
        background: active
          ? "rgba(201,160,80,0.1)"
          : hovered
            ? "rgba(255,255,255,0.04)"
            : "transparent",
        color: active ? "#E8C468" : "rgba(255,255,255,0.35)",
        transition: "all 0.15s",
      }}
    >
      {label}
    </button>
  );
}

function MetricRow({ label, value, extra }: { label: string; value: string; extra?: string }) {
  return (
    <div style={S.metricRow}>
      <span style={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{value}</span>
        {extra && <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>{extra}</span>}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   Styles
   ══════════════════════════════════════════════ */
const S: Record<string, React.CSSProperties> = {
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
    animation: "analyticsPulse 2s ease-in-out infinite",
  },
  periodToggle: {
    display: "flex",
    gap: 4,
    background: "rgba(255,255,255,0.04)",
    borderRadius: 8,
    padding: 3,
    border: "1px solid rgba(255,255,255,0.06)",
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
  panel: {
    background: "rgba(255,255,255,0.025)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 14,
    padding: 22,
    marginBottom: 16,
  },
  panelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  panelTitle: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.25)",
  },
  grid2: {
    display: "grid",
    gridTemplateColumns: "1.4fr 1fr",
    gap: 16,
    marginBottom: 16,
  },
  grid3: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 16,
    marginBottom: 16,
  },
  loadingState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: 400,
    color: "rgba(255,255,255,0.2)",
    fontSize: 14,
    gap: 12,
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: 120,
    color: "rgba(255,255,255,0.15)",
    fontSize: 12,
    gap: 8,
  },

  /* Popular items */
  itemRow: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "12px 0",
    borderBottom: "1px solid rgba(255,255,255,0.04)",
  },
  itemRank: {
    fontFamily: "monospace",
    fontSize: 12,
    width: 20,
    textAlign: "center",
    flexShrink: 0,
    fontWeight: 700,
  },
  itemName: {
    fontSize: 13,
    fontWeight: 600,
    color: "#fff",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  itemCat: {
    fontSize: 11,
    color: "rgba(255,255,255,0.25)",
    marginTop: 1,
  },
  barTrack: {
    width: 120,
    height: 6,
    background: "rgba(255,255,255,0.04)",
    borderRadius: 3,
    overflow: "hidden",
    flexShrink: 0,
  },
  barFill: {
    height: "100%",
    background: "linear-gradient(90deg, #C9A050, #E8C468)",
    borderRadius: 3,
    transition: "width 0.6s ease",
  },
  itemCount: {
    fontFamily: "monospace",
    fontSize: 12,
    color: "rgba(255,255,255,0.3)",
    width: 50,
    textAlign: "right",
    flexShrink: 0,
  },
  itemRevenue: {
    fontFamily: "monospace",
    fontSize: 12,
    color: "#C9A050",
    width: 65,
    textAlign: "right",
    flexShrink: 0,
  },

  /* Heatmap */
  heatmapGrid: {
    display: "grid",
    gridTemplateColumns: "40px repeat(7, 1fr)",
    gap: 3,
    marginTop: 8,
  },
  heatmapDay: {
    fontFamily: "monospace",
    fontSize: 10,
    color: "rgba(255,255,255,0.2)",
    textAlign: "center",
    paddingBottom: 4,
  },
  heatmapLabel: {
    fontFamily: "monospace",
    fontSize: 10,
    color: "rgba(255,255,255,0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingRight: 6,
  },

  /* Category breakdown */
  catRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 0",
    borderBottom: "1px solid rgba(255,255,255,0.04)",
  },
  catBarTrack: {
    width: 80,
    height: 5,
    background: "rgba(255,255,255,0.04)",
    borderRadius: 3,
    overflow: "hidden",
    flexShrink: 0,
  },
  catPct: {
    fontFamily: "monospace",
    fontSize: 12,
    color: "#C9A050",
    width: 40,
    textAlign: "right",
  },
  catVal: {
    fontFamily: "monospace",
    fontSize: 12,
    color: "rgba(255,255,255,0.3)",
    width: 65,
    textAlign: "right",
  },

  /* Order breakdown */
  metricBig: {
    fontFamily: "var(--font-display)",
    fontSize: 42,
    fontWeight: 700,
    color: "#E8C468",
    lineHeight: 1,
  },
  metricLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.3)",
    marginTop: 6,
  },
  metricRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 0",
    borderBottom: "1px solid rgba(255,255,255,0.04)",
  },

  /* 86'd log */
  activityItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    padding: "10px 0",
    borderBottom: "1px solid rgba(255,255,255,0.04)",
  },
  activityDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    marginTop: 5,
    flexShrink: 0,
  },
  activityText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    lineHeight: 1.5,
  },
  activityTime: {
    fontSize: 10,
    color: "rgba(255,255,255,0.15)",
    marginTop: 2,
    fontFamily: "monospace",
  },
  summaryBox: {
    marginTop: 16,
    padding: 12,
    background: "rgba(201,160,80,0.06)",
    borderRadius: 8,
    border: "1px solid rgba(201,160,80,0.12)",
  },
  summaryBoxTitle: {
    fontSize: 11,
    fontWeight: 600,
    color: "rgba(201,160,80,0.6)",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  summaryBoxText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    lineHeight: 1.5,
  },
};