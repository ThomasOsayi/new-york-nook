"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Image from "next/image";
import { categories, menuData } from "@/data/menu";
import { useCart, type CartItem } from "@/components/order/Cartcontext";
import type { MenuItem } from "@/data/menu";
import { db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";

/* ── Tag styling map ── */
const TAG_STYLES: Record<string, { label: string; bg: string; color: string; border: string }> = {
  popular: { label: "★ Popular", bg: "rgba(201,160,80,0.12)",  color: "#C9A050", border: "rgba(201,160,80,0.15)" },
  new:     { label: "✦ New",     bg: "rgba(106,158,108,0.14)", color: "#6a9e6c", border: "rgba(106,158,108,0.15)" },
  spicy:   { label: "🌶 Spicy",  bg: "rgba(168,84,84,0.14)",  color: "#a85454", border: "rgba(168,84,84,0.15)" },
  gf:      { label: "GF",        bg: "rgba(138,173,138,0.08)", color: "#8aad8a", border: "rgba(138,173,138,0.15)" },
  v:       { label: "V",         bg: "rgba(125,184,127,0.08)", color: "#7db87f", border: "rgba(125,184,127,0.15)" },
};

/* ── Inventory status type ── */
type ItemStatus = "available" | "low" | "86";

/* ── Toast Component ── */
function Toast({ message, show }: { message: string; show: boolean }) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: "clamp(100px, 16vw, 120px)",
        left: "50%",
        transform: `translateX(-50%) translateY(${show ? "0" : "80px"})`,
        background: "rgba(26,21,16,0.95)",
        border: "1px solid rgba(201,160,80,0.35)",
        borderRadius: 14,
        padding: "clamp(12px, 2vw, 16px) clamp(18px, 3vw, 28px)",
        fontSize: "clamp(12px, 1.4vw, 13px)",
        fontFamily: "var(--font-body)",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        gap: 12,
        opacity: show ? 1 : 0,
        transition: "all 0.5s cubic-bezier(0.16,1,0.3,1)",
        zIndex: 300,
        boxShadow: "0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(201,160,80,0.06)",
        fontWeight: 500,
        pointerEvents: "none",
        maxWidth: "calc(100vw - 32px)",
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C9A050" strokeWidth="2" style={{ flexShrink: 0 }}>
        <path d="M20 6L9 17l-5-5" />
      </svg>
      {message}
    </div>
  );
}

/* ── Quantity Stepper (inline on menu cards) ── */
function QtyStepper({ qty, onInc, onDec }: { qty: number; onInc: () => void; onDec: () => void }) {
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        background: "rgb(var(--bg-primary))",
        borderRadius: 10,
        border: "1px solid rgba(201,160,80,0.15)",
        padding: 3,
      }}
    >
      <button onClick={(e) => { e.stopPropagation(); onDec(); }} aria-label="Decrease quantity" style={qtyBtnStyle}>−</button>
      <span
        style={{
          width: 26,
          textAlign: "center",
          fontSize: 14,
          fontWeight: 700,
          color: "#C9A050",
          fontFamily: "var(--font-body)",
        }}
      >
        {qty}
      </span>
      <button onClick={(e) => { e.stopPropagation(); onInc(); }} aria-label="Increase quantity" style={qtyBtnStyle}>+</button>
    </div>
  );
}

const qtyBtnStyle: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: 8,
  border: "none",
  background: "transparent",
  color: "rgba(255,255,255,0.5)",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 15,
  fontWeight: 600,
  fontFamily: "var(--font-body)",
  transition: "all 0.2s",
};

/* ── Single Menu Item Card ── */
function MenuItemCard({
  item,
  categoryKey,
  onAdded,
  inventoryStatus,
}: {
  item: MenuItem;
  categoryKey: string;
  onAdded: (name: string) => void;
  inventoryStatus: ItemStatus;
}) {
  const { items, addItem, updateQty, removeItem } = useCart();
  const cartItem = items.find((i: CartItem) => i.name === item.name && i.categoryKey === categoryKey);
  const [hovered, setHovered] = useState(false);

  const isLow = inventoryStatus === "low";

  const badgeTags = item.tags?.filter((t) => t === "popular" || t === "new" || t === "spicy") ?? [];
  const dietaryTags = item.tags?.filter((t) => t === "gf" || t === "v") ?? [];

  const handleAdd = () => {
    addItem({
      name: item.name,
      price: item.price,
      img: item.img,
      categoryKey,
      desc: item.desc,
    });
    onAdded(item.name);
  };

  return (
    <div
      className="menu-item-card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => {
        /* On mobile, tapping anywhere on the card adds the item (if not already in cart) */
        if (!cartItem && window.innerWidth <= 1024) {
          handleAdd();
        }
      }}
      style={{
        display: "grid",
        gridTemplateColumns: "clamp(90px, 12vw, 130px) 1fr auto",
        alignItems: "stretch",
        background: hovered ? "rgb(var(--bg-elevated))" : "rgba(12,10,7,0.8)",
        border: `1px solid ${hovered ? "rgba(183,143,82,0.15)" : "rgba(255,255,255,0.04)"}`,
        borderRadius: "clamp(12px, 1.5vw, 16px)",
        cursor: "pointer",
        transition: "all 0.4s cubic-bezier(0.16,1,0.3,1)",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        boxShadow: hovered
          ? "0 8px 32px rgba(0,0,0,0.35), 0 0 40px rgba(201,160,80,0.04)"
          : "none",
      }}
    >
      {/* Image */}
      <div
        className="menu-item-img"
        style={{
          width: "100%",
          height: "100%",
          minHeight: "clamp(90px, 12vw, 130px)",
          overflow: "hidden",
          position: "relative",
          borderRadius: "inherit",
        }}
      >
        <Image
          src={item.img}
          alt={item.name}
          width={130}
          height={130}
          loading="lazy"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transition: "transform 0.6s cubic-bezier(0.16,1,0.3,1), filter 0.4s",
            filter: hovered ? "brightness(0.95) saturate(1.2)" : "brightness(0.8) saturate(1.1)",
            transform: hovered ? "scale(1.08)" : "scale(1)",
          }}
        />
        {/* Fade to card bg */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: hovered
              ? "linear-gradient(90deg, transparent 50%, rgb(var(--bg-elevated)) 100%)"
              : "linear-gradient(90deg, transparent 50%, rgba(12,10,7,0.8) 100%)",
            pointerEvents: "none",
            transition: "background 0.4s",
          }}
        />
        {/* Running Low badge on image */}
        {isLow && (
          <div
            style={{
              position: "absolute",
              top: 8,
              left: 8,
              background: "rgba(232,196,104,0.9)",
              color: "#1a1508",
              fontSize: 8,
              fontWeight: 700,
              fontFamily: "var(--font-body)",
              letterSpacing: 1,
              textTransform: "uppercase",
              padding: "3px 7px",
              borderRadius: 4,
            }}
          >
            Few Left
          </div>
        )}
      </div>

      {/* Info */}
      <div
        className="menu-item-info"
        style={{
          padding: "clamp(12px, 2vw, 18px) clamp(12px, 2vw, 20px)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          minWidth: 0,
        }}
      >
        {/* Name + badge tags */}
        <div style={{ display: "flex", alignItems: "center", gap: "clamp(6px, 1vw, 10px)", marginBottom: "clamp(4px, 0.6vw, 6px)", flexWrap: "wrap" }}>
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(15px, 1.8vw, 18px)",
              fontWeight: 500,
              color: "#fff",
              letterSpacing: 0.3,
            }}
          >
            {item.name}
          </span>
          {badgeTags.map((tag) => {
            const s = TAG_STYLES[tag];
            return (
              <span
                key={tag}
                style={{
                  fontSize: "clamp(8px, 1.2vw, 9px)",
                  letterSpacing: 1.5,
                  textTransform: "uppercase",
                  padding: "3px 8px",
                  borderRadius: 4,
                  fontWeight: 700,
                  fontFamily: "var(--font-body)",
                  background: s.bg,
                  color: s.color,
                  border: `1px solid ${s.border}`,
                  whiteSpace: "nowrap",
                }}
              >
                {s.label}
              </span>
            );
          })}
        </div>

        {/* Description */}
        {item.desc && (
          <p
            className="menu-item-desc"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "clamp(11px, 1.3vw, 12.5px)",
              color: "rgba(255,255,255,0.4)",
              fontWeight: 300,
              lineHeight: 1.55,
              letterSpacing: 0.2,
              margin: 0,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              wordBreak: "break-word",
              maxWidth: "100%",
            }}
          >
            {item.desc}
          </p>
        )}

        {/* Dietary tags */}
        {dietaryTags.length > 0 && (
          <div style={{ display: "flex", gap: 5, marginTop: "clamp(4px, 0.8vw, 8px)" }}>
            {dietaryTags.map((tag) => {
              const s = TAG_STYLES[tag];
              return (
                <span
                  key={tag}
                  style={{
                    fontSize: "clamp(8px, 1.2vw, 9px)",
                    letterSpacing: 1,
                    textTransform: "uppercase",
                    padding: "2px 6px",
                    borderRadius: 3,
                    fontWeight: 700,
                    fontFamily: "var(--font-body)",
                    background: s.bg,
                    color: s.color,
                    border: `1px solid ${s.border}`,
                  }}
                >
                  {s.label}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Mobile price + Add row — own grid row spanning full width (visible only on small screens) */}
      <div
        className="menu-item-price-mobile"
        onClick={(e) => e.stopPropagation()}
        style={{
          display: "none",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-accent)",
            fontSize: 20,
            fontWeight: 600,
            color: "#C9A050",
            flexShrink: 0,
          }}
        >
          ${item.price}
        </span>
        {cartItem ? (
          <QtyStepper
            qty={cartItem.qty}
            onInc={() => updateQty(item.name, categoryKey, cartItem.qty + 1)}
            onDec={() => {
              if (cartItem.qty <= 1) removeItem(item.name, categoryKey);
              else updateQty(item.name, categoryKey, cartItem.qty - 1);
            }}
          />
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleAdd();
            }}
            aria-label={`Add ${item.name} to order`}
            className="menu-add-btn"
            style={{
              padding: "8px 20px",
              borderRadius: 10,
              border: "1px solid rgba(201,160,80,0.4)",
              background: "rgba(201,160,80,0.12)",
              color: "#C9A050",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 700,
              fontFamily: "var(--font-body)",
              letterSpacing: 0.5,
              transition: "all 0.2s",
              minHeight: 38,
              minWidth: 72,
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            + Add
          </button>
        )}
      </div>

      {/* Price + Add/Qty — desktop only */}
      <div
        className="menu-item-price-col"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "clamp(14px, 2vw, 18px) clamp(14px, 2vw, 22px)",
          gap: 14,
          borderLeft: "1px solid rgba(255,255,255,0.04)",
          minWidth: "clamp(90px, 10vw, 110px)",
          background: "rgba(0,0,0,0.12)",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-accent)",
            fontSize: "clamp(20px, 2.5vw, 24px)",
            fontWeight: 600,
            color: "#C9A050",
            letterSpacing: 0.5,
          }}
        >
          ${item.price}
        </span>

        {cartItem ? (
          <QtyStepper
            qty={cartItem.qty}
            onInc={() => updateQty(item.name, categoryKey, cartItem.qty + 1)}
            onDec={() => {
              if (cartItem.qty <= 1) removeItem(item.name, categoryKey);
              else updateQty(item.name, categoryKey, cartItem.qty - 1);
            }}
          />
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleAdd();
            }}
            aria-label={`Add ${item.name} to order`}
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgb(var(--bg-elevated))",
              color: "rgba(255,255,255,0.45)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.3s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#C9A050";
              e.currentTarget.style.color = "#C9A050";
              e.currentTarget.style.background = "rgba(201,160,80,0.1)";
              e.currentTarget.style.boxShadow = "0 0 20px rgba(201,160,80,0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
              e.currentTarget.style.color = "rgba(255,255,255,0.45)";
              e.currentTarget.style.background = "rgb(var(--bg-elevated))";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14m-7-7h14" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Category Section ── */
function CategorySection({
  categoryKey,
  label,
  img,
  items,
  onItemAdded,
  inventoryStatuses,
}: {
  categoryKey: string;
  label: string;
  img: string;
  items: MenuItem[];
  onItemAdded: (name: string) => void;
  inventoryStatuses: Record<string, ItemStatus>;
}) {
  return (
    <section style={{ padding: "clamp(24px, 4vw, 40px) 0 10px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "clamp(10px, 2vw, 18px)", marginBottom: "clamp(14px, 2.5vw, 28px)" }}>
        <div
          style={{
            width: "clamp(36px, 5vw, 48px)",
            height: "clamp(36px, 5vw, 48px)",
            borderRadius: 12,
            overflow: "hidden",
            flexShrink: 0,
            border: "1px solid rgba(255,255,255,0.06)",
            position: "relative",
          }}
        >
          <Image src={img} alt="" width={48} height={48} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(20px, 2.8vw, 26px)",
              fontWeight: 500,
              color: "#fff",
              letterSpacing: 0.5,
              margin: 0,
            }}
          >
            {label}
          </h2>
          <div
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "clamp(10px, 1.2vw, 12px)",
              color: "rgba(255,255,255,0.25)",
              fontWeight: 300,
              letterSpacing: 0.5,
              marginTop: 2,
            }}
          >
            {items.length} {items.length === 1 ? "dish" : "dishes"} · Starting from $
            {Math.min(...items.map((i) => i.price))}
          </div>
        </div>
        <div
          style={{
            flex: 1,
            height: 1,
            background: "linear-gradient(90deg, rgba(201,160,80,0.15), transparent)",
          }}
        />
      </div>

      {/* Items */}
      <div style={{ display: "flex", flexDirection: "column", gap: "clamp(8px, 1vw, 10px)" }}>
        {items.map((item) => (
          <MenuItemCard
            key={item.name}
            item={item}
            categoryKey={categoryKey}
            onAdded={onItemAdded}
            inventoryStatus={inventoryStatuses[item.name] ?? "available"}
          />
        ))}
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════
   Main MenuBrowser
   ════════════════════════════════════════════ */
export default function MenuBrowser() {
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState({ show: false, message: "" });
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  /* ── Inventory: real-time Firestore subscription ── */
  const [inventoryStatuses, setInventoryStatuses] = useState<Record<string, ItemStatus>>({});

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "inventory"), (snapshot) => {
      const next: Record<string, ItemStatus> = {};
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.name && data.status) {
          next[data.name as string] = data.status as ItemStatus;
        }
      });
      setInventoryStatuses(next);
    });
    return () => unsub();
  }, []);

  /* Show toast */
  const showToast = (name: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ show: true, message: `${name} added to your order` });
    toastTimer.current = setTimeout(() => setToast({ show: false, message: "" }), 2600);
  };

  /* Filter items by search AND hide items that are "out" (86'd) */
  const filteredCategories = useMemo(() => {
    const q = search.toLowerCase().trim();
    return categories
      .map((cat) => {
        const items = menuData[cat.key] ?? [];
        const filtered = items.filter((item) => {
          const status = inventoryStatuses[item.name] ?? "available";
          if (status === "86") return false;
          if (q) {
            return (
              item.name.toLowerCase().includes(q) ||
              (item.desc?.toLowerCase().includes(q) ?? false)
            );
          }
          return true;
        });
        return { ...cat, items: filtered };
      })
      .filter((cat) => cat.items.length > 0);
  }, [search, inventoryStatuses]);

  /* Categories to display based on active tab */
  const displayCategories = useMemo(() => {
    if (activeTab === "all") return filteredCategories;
    return filteredCategories.filter((c) => c.key === activeTab);
  }, [activeTab, filteredCategories]);

  /* Total item count per category (only available items) */
  const catCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    let total = 0;
    categories.forEach((cat) => {
      const available = (menuData[cat.key] ?? []).filter(
        (item) => (inventoryStatuses[item.name] ?? "available") !== "86"
      ).length;
      counts[cat.key] = available;
      total += available;
    });
    counts.all = total;
    return counts;
  }, [inventoryStatuses]);

  /* Scroll to category section on tab click */
  const handleTabClick = (key: string) => {
    setActiveTab(key);
    if (key !== "all" && sectionRefs.current[key]) {
      sectionRefs.current[key]?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <main style={{ borderRight: "1px solid rgba(255,255,255,0.04)" }}>
      {/* ── Sticky category tabs ── */}
      <nav
        className="order-cat-nav"
        style={{
          position: "sticky",
          top: 76,
          zIndex: 50,
          background: "rgba(8,6,3,0.95)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(255,255,255,0.04)",
          padding: "0 clamp(12px, 3vw, 48px)",
          display: "flex",
          alignItems: "stretch",
          gap: 0,
          overflowX: "auto",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {/* "All" tab */}
        <button
          onClick={() => handleTabClick("all")}
          className={`order-cat-tab ${activeTab === "all" ? "order-cat-tab-active" : ""}`}
          style={tabStyle(activeTab === "all")}
        >
          All <span style={tabCountStyle(activeTab === "all")}>{catCounts.all}</span>
        </button>

        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => handleTabClick(cat.key)}
            className={`order-cat-tab ${activeTab === cat.key ? "order-cat-tab-active" : ""}`}
            style={tabStyle(activeTab === cat.key)}
          >
            {cat.label}{" "}
            <span style={tabCountStyle(activeTab === cat.key)}>{catCounts[cat.key]}</span>
          </button>
        ))}
      </nav>

      {/* ── Search bar ── */}
      <div style={{ padding: "clamp(14px, 2.5vw, 28px) clamp(12px, 3vw, 48px) 0" }}>
        <div style={{ position: "relative" }}>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="1.5"
            style={{ position: "absolute", left: "clamp(14px, 2vw, 20px)", top: "50%", transform: "translateY(-50%)" }}
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search dishes, ingredients..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setActiveTab("all");
            }}
            style={{
              width: "100%",
              padding: "clamp(12px, 1.8vw, 16px) 22px clamp(12px, 1.8vw, 16px) clamp(40px, 5vw, 52px)",
              background: "rgb(var(--bg-secondary))",
              border: "1px solid rgba(255,255,255,0.05)",
              borderRadius: 14,
              fontFamily: "var(--font-body)",
              fontSize: 16,
              color: "#fff",
              outline: "none",
              transition: "border-color 0.3s, box-shadow 0.3s",
              WebkitAppearance: "none",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "rgba(183,143,82,0.25)";
              e.currentTarget.style.boxShadow = "0 0 40px rgba(201,160,80,0.04)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
        </div>
      </div>

      {/* ── Category sections ── */}
      <div style={{ padding: "0 clamp(12px, 3vw, 48px) clamp(80px, 12vw, 100px)" }}>
        {displayCategories.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "clamp(40px, 8vw, 80px) 0",
              fontFamily: "var(--font-body)",
              color: "rgba(255,255,255,0.25)",
              fontSize: 14,
            }}
          >
            No dishes found for &ldquo;{search}&rdquo;
          </div>
        ) : (
          displayCategories.map((cat) => (
            <div key={cat.key} ref={(el) => { sectionRefs.current[cat.key] = el; }}>
              <CategorySection
                categoryKey={cat.key}
                label={cat.label}
                img={cat.img}
                items={cat.items}
                onItemAdded={showToast}
                inventoryStatuses={inventoryStatuses}
              />
            </div>
          ))
        )}
      </div>

      {/* ── Bottom spacer for mobile cart bar ── */}
      <div className="menu-bottom-spacer" />

      {/* ── Toast ── */}
      <Toast message={toast.message} show={toast.show} />

      {/* ── Responsive styles ── */}
      <style>{`
        .order-cat-nav::-webkit-scrollbar { display: none; }
        .order-cat-nav { scrollbar-width: none; }

        /* Desktop: clip image scale on hover; mobile: visible so Add button isn't clipped */
        @media (min-width: 1025px) {
          .menu-item-card { overflow: hidden; }
        }

        /* Desktop: no bottom spacer needed */
        .menu-bottom-spacer { height: 0; }

        /* ── Mobile: pill tabs + bottom spacer ── */
        @media (max-width: 1024px) {
          /* Sticky nav adjusts for 56px mobile header */
          .order-cat-nav {
            top: 56px !important;
            padding: 10px 16px !important;
            gap: 8px !important;
          }

          /* Pill-style tabs on mobile */
          .order-cat-tab {
            padding: 8px 16px !important;
            border-radius: 20px !important;
            border: 1px solid rgba(255,255,255,0.04) !important;
            border-bottom: 1px solid rgba(255,255,255,0.04) !important;
            font-size: 12px !important;
            letter-spacing: 0.5px !important;
            min-height: 38px !important;
            background: transparent !important;
          }
          .order-cat-tab-active {
            background: rgba(201,160,80,0.12) !important;
            border-color: rgba(201,160,80,0.15) !important;
          }

          /* Spacer so last items aren't hidden behind fixed cart bar */
          .menu-bottom-spacer {
            height: 88px;
          }
        }

        /* Mobile: stacked layout — image+info in row 1, price+Add full-width row 2 */
        @media (max-width: 1024px) {
          .menu-item-card {
            grid-template-columns: 80px 1fr !important;
            grid-template-rows: auto auto !important;
            transform: none !important;
            box-shadow: none !important;
          }
          .menu-item-price-col {
            display: none !important;
          }
          .menu-item-price-mobile {
            display: flex !important;
            grid-column: 1 / -1 !important;
            padding: 8px 12px 12px !important;
            justify-content: space-between !important;
            align-items: center !important;
            border-top: 1px solid rgba(255,255,255,0.04) !important;
          }
          .menu-item-img {
            min-height: 80px !important;
            border-radius: 12px 0 0 0 !important;
          }
          .menu-item-desc {
            -webkit-line-clamp: 2 !important;
          }
        }

        /* Extra compact on small phones */
        @media (max-width: 480px) {
          .menu-item-img {
            min-height: 80px !important;
            border-radius: 10px 0 0 0 !important;
          }
          .menu-item-desc {
            -webkit-line-clamp: 1 !important;
          }
        }

        @media (hover: none) and (pointer: coarse) {
          .menu-item-card {
            transform: none !important;
            box-shadow: none !important;
          }
          .menu-item-card:active {
            background: rgb(var(--bg-elevated)) !important;
            border-color: rgba(183,143,82,0.15) !important;
            transform: scale(0.98) !important;
          }
          .menu-add-btn:active {
            background: rgba(201,160,80,0.3) !important;
            border-color: rgba(201,160,80,0.6) !important;
            transform: scale(0.95) !important;
          }
        }
      `}</style>
    </main>
  );
}

/* ── Tab style helpers ── */
function tabStyle(active: boolean): React.CSSProperties {
  return {
    padding: "clamp(14px, 2vw, 18px) clamp(14px, 2.5vw, 24px)",
    fontSize: "clamp(10px, 1.2vw, 11px)",
    letterSpacing: "clamp(1px, 0.3vw, 2px)",
    textTransform: "uppercase",
    color: active ? "#C9A050" : "rgba(255,255,255,0.25)",
    background: "none",
    border: "none",
    borderBottom: `2px solid ${active ? "#C9A050" : "transparent"}`,
    cursor: "pointer",
    transition: "all 0.3s",
    whiteSpace: "nowrap",
    fontFamily: "var(--font-body)",
    fontWeight: active ? 600 : 500,
    minHeight: 44,
  };
}

function tabCountStyle(active: boolean): React.CSSProperties {
  return {
    fontSize: 9,
    color: active ? "#C9A050" : "rgba(255,255,255,0.15)",
    marginLeft: 5,
    fontWeight: 400,
  };
}