"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart, type CartItem } from "@/components/order/Cartcontext";
import { categories } from "@/data/menu";

/* ── Lookup: categoryKey → label ── */
const catLabelMap: Record<string, string> = {};
categories.forEach((c) => { catLabelMap[c.key] = c.label; });

const TAX_RATE = 0.095;
const PACKAGING_FEE = 2;

/* ═══════════════════════════════════════════
   Extracted Sub-components
   ═══════════════════════════════════════════ */

/* ── Pickup Time Selector ── */
function PickupTimeSelector({ activeTime, setActiveTime }: { activeTime: number; setActiveTime: (i: number) => void }) {
  const timeOptions = [
    { label: "ASAP", value: "25–35 min" },
    { label: "Today", value: "6:30 PM" },
    { label: "Today", value: "7:00 PM" },
  ];

  return (
    <div style={{ padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      <div style={{ fontFamily: "var(--font-body)", fontSize: 10, fontWeight: 600, letterSpacing: 2.5, textTransform: "uppercase", color: "rgba(255,255,255,0.2)", marginBottom: 10 }}>
        Pickup Time
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        {timeOptions.map((opt, i) => (
          <button
            key={i}
            onClick={() => setActiveTime(i)}
            style={{
              flex: 1,
              padding: "10px 8px",
              border: `1px solid ${activeTime === i ? "rgba(201,160,80,0.5)" : "rgba(255,255,255,0.05)"}`,
              borderRadius: 10,
              background: activeTime === i ? "rgba(201,160,80,0.06)" : "transparent",
              cursor: "pointer",
              textAlign: "center",
              transition: "all 0.3s",
              fontFamily: "var(--font-body)",
              minHeight: 44,
            }}
          >
            <span style={{ fontSize: 10, letterSpacing: 0.5, textTransform: "uppercase", fontWeight: 600, color: "rgba(255,255,255,0.35)", display: "block" }}>
              {opt.label}
            </span>
            <span style={{ fontSize: 14, fontWeight: 600, color: activeTime === i ? "#C9A050" : "#fff", marginTop: 3, display: "block" }}>
              {opt.value}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Cart Item Row ── */
function CartItemRow({
  item,
  updateQty,
  removeItem,
  variant = "sheet",
}: {
  item: CartItem;
  updateQty: (name: string, categoryKey: string, qty: number) => void;
  removeItem: (name: string, categoryKey: string) => void;
  variant?: "sheet" | "desktop" | "modal";
}) {
  if (variant === "modal") {
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "72px 1fr auto",
          gap: 18,
          alignItems: "center",
          padding: "18px 0",
          borderBottom: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        <div style={{ width: 72, height: 72, borderRadius: 14, overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)", position: "relative" }}>
          <Image src={item.img} alt={item.name} width={72} height={72} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 500, color: "#fff", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</div>
          <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "rgba(255,255,255,0.25)", fontWeight: 300, marginBottom: 12 }}>{catLabelMap[item.categoryKey] ?? ""}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={() => { if (item.qty <= 1) removeItem(item.name, item.categoryKey); else updateQty(item.name, item.categoryKey, item.qty - 1); }} style={modalQtyBtnStyle} onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(183,143,82,0.3)"; e.currentTarget.style.color = "#C9A050"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "rgba(255,255,255,0.45)"; }}>−</button>
            <span style={{ fontFamily: "var(--font-body)", fontSize: 15, fontWeight: 700, color: "#fff", minWidth: 16, textAlign: "center" }}>{item.qty}</span>
            <button onClick={() => updateQty(item.name, item.categoryKey, item.qty + 1)} style={modalQtyBtnStyle} onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(183,143,82,0.3)"; e.currentTarget.style.color = "#C9A050"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "rgba(255,255,255,0.45)"; }}>+</button>
          </div>
        </div>
        <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
          <div style={{ fontFamily: "var(--font-accent)", fontSize: 22, fontWeight: 600, color: "#C9A050" }}>${(item.price * item.qty).toFixed(0)}</div>
          <button onClick={() => removeItem(item.name, item.categoryKey)} style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "rgba(255,255,255,0.15)", background: "none", border: "none", cursor: "pointer", transition: "color 0.2s", letterSpacing: 0.5, minHeight: 32, padding: "6px 4px" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#a85454")} onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.15)")}>Remove</button>
        </div>
      </div>
    );
  }

  if (variant === "desktop") {
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "50px 1fr auto",
          gap: 14,
          alignItems: "flex-start",
          padding: "16px 0",
          borderBottom: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        <div style={{ width: 50, height: 50, borderRadius: 10, overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)", position: "relative" }}>
          <Image src={item.img} alt={item.name} width={50} height={50} style={{ objectFit: "cover" }} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 500, color: "#fff", marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</div>
          <div style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "rgba(255,255,255,0.2)", fontWeight: 300, marginBottom: 8 }}>{catLabelMap[item.categoryKey] ?? ""}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={() => { if (item.qty <= 1) removeItem(item.name, item.categoryKey); else updateQty(item.name, item.categoryKey, item.qty - 1); }} style={desktopQtyBtnStyle} onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(183,143,82,0.3)"; e.currentTarget.style.color = "#C9A050"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "rgba(255,255,255,0.45)"; }}>−</button>
            <span style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 700, color: "#fff", minWidth: 14, textAlign: "center" }}>{item.qty}</span>
            <button onClick={() => updateQty(item.name, item.categoryKey, item.qty + 1)} style={desktopQtyBtnStyle} onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(183,143,82,0.3)"; e.currentTarget.style.color = "#C9A050"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "rgba(255,255,255,0.45)"; }}>+</button>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: "var(--font-accent)", fontSize: 18, fontWeight: 600, color: "#C9A050" }}>${(item.price * item.qty).toFixed(0)}</div>
          <button onClick={() => removeItem(item.name, item.categoryKey)} style={{ fontFamily: "var(--font-body)", fontSize: 10, color: "rgba(255,255,255,0.15)", background: "none", border: "none", cursor: "pointer", marginTop: 6, transition: "color 0.2s", letterSpacing: 0.5, minHeight: 36, padding: "8px 4px" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#a85454")} onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.15)")}>Remove</button>
        </div>
      </div>
    );
  }

  // Sheet variant
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "50px 1fr auto",
        gap: 12,
        alignItems: "center",
        padding: "14px 0",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
      }}
    >
      <div style={{ width: 50, height: 50, borderRadius: 10, overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)", flexShrink: 0, position: "relative" }}>
        <Image src={item.img} alt={item.name} width={50} height={50} style={{ objectFit: "cover" }} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 500, color: "#fff", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {item.name}
        </div>
        <div style={{ fontFamily: "var(--font-body)", fontSize: 10, color: "rgba(255,255,255,0.2)", fontWeight: 300 }}>
          {catLabelMap[item.categoryKey] ?? ""}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
        <span style={{ fontFamily: "var(--font-accent)", fontSize: 16, fontWeight: 600, color: "#C9A050" }}>
          ${(item.price * item.qty).toFixed(0)}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 0, background: "rgb(var(--bg-primary))", borderRadius: 8, border: "1px solid rgba(201,160,80,0.15)", overflow: "hidden" }}>
          <button
            onClick={() => {
              if (item.qty <= 1) removeItem(item.name, item.categoryKey);
              else updateQty(item.name, item.categoryKey, item.qty - 1);
            }}
            aria-label="Decrease quantity"
            style={sheetQtyBtnStyle}
          >
            −
          </button>
          <span style={{ width: 28, textAlign: "center", fontSize: 13, fontWeight: 700, color: "#C9A050", fontFamily: "var(--font-body)" }}>
            {item.qty}
          </span>
          <button
            onClick={() => updateQty(item.name, item.categoryKey, item.qty + 1)}
            aria-label="Increase quantity"
            style={sheetQtyBtnStyle}
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Promo Section ── */
function PromoSection({
  promo,
  promoInput,
  setPromoInput,
  promoLoading,
  promoError,
  handleApplyPromo,
  removePromo,
}: {
  promo: { code: string; type: string; value: number; discount: number } | null;
  promoInput: string;
  setPromoInput: (val: string) => void;
  promoLoading: boolean;
  promoError: string;
  handleApplyPromo: () => void;
  removePromo: () => void;
}) {
  return (
    <div style={{ padding: "14px 0 8px" }}>
      <div style={{ fontFamily: "var(--font-body)", fontSize: 10, fontWeight: 600, letterSpacing: 2.5, textTransform: "uppercase", color: "rgba(255,255,255,0.2)", marginBottom: 10 }}>
        Promo Code
      </div>
      {promo ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 14px",
            background: "rgba(74,222,128,0.06)",
            border: "1px solid rgba(74,222,128,0.15)",
            borderRadius: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>
            <span style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: "#4ADE80", letterSpacing: 1.5 }}>{promo.code}</span>
            <span style={{ fontSize: 11, color: "rgba(74,222,128,0.6)", fontFamily: "var(--font-body)" }}>−${promo.discount.toFixed(2)}</span>
          </div>
          <button onClick={removePromo} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 15, color: "rgba(255,255,255,0.25)", padding: "2px 4px", borderRadius: 4, transition: "color 0.15s", minHeight: 36, minWidth: 36, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="text"
              placeholder="Enter code"
              value={promoInput}
              onChange={(e) => setPromoInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleApplyPromo(); }}
              style={{
                flex: 1,
                padding: "12px 14px",
                background: "rgb(var(--bg-primary))",
                border: `1px solid ${promoError ? "rgba(248,113,113,0.3)" : "rgba(255,255,255,0.05)"}`,
                borderRadius: 10,
                fontFamily: "var(--font-body)",
                fontSize: 16,
                color: "#fff",
                outline: "none",
                textTransform: "uppercase",
                letterSpacing: 1,
                WebkitAppearance: "none",
                transition: "border-color 0.3s",
              }}
              onFocus={(e) => { if (!promoError) e.currentTarget.style.borderColor = "rgba(183,143,82,0.2)"; }}
              onBlur={(e) => { if (!promoError) e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)"; }}
            />
            <button
              onClick={handleApplyPromo}
              disabled={promoLoading}
              style={{
                padding: "12px 18px",
                borderRadius: 10,
                border: "1px solid rgba(201,160,80,0.15)",
                background: "rgba(201,160,80,0.08)",
                color: promoLoading ? "rgba(255,255,255,0.2)" : "#C9A050",
                cursor: promoLoading ? "wait" : "pointer",
                fontSize: 11,
                fontWeight: 700,
                fontFamily: "var(--font-body)",
                letterSpacing: 1,
                textTransform: "uppercase",
                whiteSpace: "nowrap",
                transition: "all 0.2s",
                minHeight: 44,
              }}
            >
              {promoLoading ? "…" : "Apply"}
            </button>
          </div>
          {promoError && (
            <div style={{ marginTop: 6, fontSize: 11, color: "#F87171", fontFamily: "var(--font-body)", display: "flex", alignItems: "center", gap: 5 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" /></svg>
              {promoError}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ── Totals Block ── */
function TotalsBlock({
  items,
  subtotal,
  tax,
  total,
  promo,
  showCheckout = true,
  onCheckout,
}: {
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  promo: { code: string; type: string; value: number; discount: number } | null;
  showCheckout?: boolean;
  onCheckout?: () => void;
}) {
  return (
    <>
      {items.length > 0 ? (
        <>
          <div style={totalRowStyle}><span>Subtotal</span><span style={{ color: "#fff", fontWeight: 500 }}>${subtotal.toFixed(2)}</span></div>
          {promo && (
            <div style={{ ...totalRowStyle, color: "#4ADE80" }}>
              <span>Discount ({promo.type === "percent" ? `${promo.value}%` : `$${promo.value}`})</span>
              <span style={{ color: "#4ADE80", fontWeight: 500 }}>−${promo.discount.toFixed(2)}</span>
            </div>
          )}
          <div style={totalRowStyle}><span>Tax (9.5%)</span><span style={{ color: "#fff", fontWeight: 500 }}>${tax.toFixed(2)}</span></div>
          <div style={totalRowStyle}><span>Packaging</span><span style={{ color: "#fff", fontWeight: 500 }}>${PACKAGING_FEE.toFixed(2)}</span></div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <span style={{ fontFamily: "var(--font-body)", fontSize: 16, fontWeight: 500, color: "#fff" }}>Total</span>
            <span style={{ fontFamily: "var(--font-accent)", fontSize: 22, fontWeight: 700, color: "#C9A050" }}>${total.toFixed(2)}</span>
          </div>

          {showCheckout && (
            <Link
              href="/order/checkout"
              onClick={onCheckout}
              className="btn-gold-filled"
              style={{
                display: "block",
                width: "100%",
                padding: 18,
                marginTop: 16,
                borderRadius: 14,
                fontSize: 12,
                letterSpacing: 2.5,
                fontWeight: 800,
                boxShadow: "0 6px 24px rgba(201,160,80,0.25)",
                textAlign: "center",
                textDecoration: "none",
                transition: "all 0.3s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 36px rgba(201,160,80,0.35)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 6px 24px rgba(201,160,80,0.25)"; }}
            >
              Proceed to Checkout
            </Link>
          )}
        </>
      ) : (
        <button className="btn-gold-outline" style={{ width: "100%", padding: 18, borderRadius: 14, fontSize: 12, letterSpacing: 2.5, fontWeight: 600, opacity: 0.4, cursor: "default" }} disabled>
          Add Items to Order
        </button>
      )}
    </>
  );
}

/* ══════════════════════════════════════════
   CartSidebar
   Desktop: sticky sidebar + modal
   Mobile:  fixed bottom bar + slide-up sheet
   ══════════════════════════════════════════ */
export default function CartSidebar() {
  const {
    items,
    updateQty,
    removeItem,
    promo,
    promoLoading,
    promoError,
    applyPromo,
    removePromo,
  } = useCart();

  const [activeTime, setActiveTime] = useState(0);
  const [showInstructions, setShowInstructions] = useState(false);
  const [promoInput, setPromoInput] = useState("");

  /* ── Mobile sheet state ── */
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetClosing, setSheetClosing] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);
  const touchDeltaY = useRef(0);
  const isDragging = useRef(false);

  /* ── Desktop modal state ── */
  const [modalOpen, setModalOpen] = useState(false);
  const [modalClosing, setModalClosing] = useState(false);

  const closeSheet = () => {
    setSheetClosing(true);
    setTimeout(() => {
      setSheetOpen(false);
      setSheetClosing(false);
    }, 300);
  };

  const closeModal = () => {
    setModalClosing(true);
    setTimeout(() => {
      setModalOpen(false);
      setModalClosing(false);
    }, 250);
  };

  /* Listen for open-cart-sheet event from mobile button */
  useEffect(() => {
    const handler = () => setSheetOpen(true);
    window.addEventListener("open-cart-sheet", handler);
    return () => window.removeEventListener("open-cart-sheet", handler);
  }, []);

  /* Listen for open-cart-modal event from desktop button */
  useEffect(() => {
    const handler = () => setModalOpen(true);
    window.addEventListener("open-cart-modal", handler);
    return () => window.removeEventListener("open-cart-modal", handler);
  }, []);

  /* Lock body scroll when sheet or modal is open */
  useEffect(() => {
    if (sheetOpen || modalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [sheetOpen, modalOpen]);

  /* ── Calculations ── */
  const totalItems = items.reduce((sum: number, i: CartItem) => sum + i.qty, 0);
  const subtotal = items.reduce((sum: number, i: CartItem) => sum + i.price * i.qty, 0);
  const discount = promo ? promo.discount : 0;
  const taxableSubtotal = subtotal - discount;
  const tax = taxableSubtotal * TAX_RATE;
  const total = taxableSubtotal + tax + (items.length > 0 ? PACKAGING_FEE : 0);

  const handleApplyPromo = async () => {
    const success = await applyPromo(promoInput, subtotal);
    if (success) setPromoInput("");
  };

  /* ── Shared props ── */
  const promoSectionProps = {
    promo,
    promoInput,
    setPromoInput,
    promoLoading,
    promoError: promoError || "",
    handleApplyPromo,
    removePromo,
  };

  const totalsProps = {
    items,
    subtotal,
    tax,
    total,
    promo,
  };

  return (
    <>
      {/* ════════════════════════════════════════
          DESKTOP SIDEBAR (hidden on mobile)
          ════════════════════════════════════════ */}
      <aside
        className="cart-desktop-sidebar"
        style={{
          position: "sticky",
          top: 76,
          height: "calc(100vh - 76px)",
          background: "rgb(var(--bg-secondary))",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          borderLeft: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        {/* Header */}
        <div style={{ padding: "28px 28px 20px", borderBottom: "1px solid rgba(255,255,255,0.04)", background: "linear-gradient(180deg, rgba(201,160,80,0.02) 0%, transparent 100%)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 500, color: "#fff", margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(183,143,82,0.4)" strokeWidth="1.5"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18" /><path d="M16 10a4 4 0 01-8 0" /></svg>
              Your Order
            </h2>
            {totalItems > 0 && (
              <span style={{ background: "linear-gradient(135deg, #C9A050, #B8903E)", color: "rgb(var(--bg-primary))", fontSize: 11, fontWeight: 800, padding: "3px 12px", borderRadius: 20, fontFamily: "var(--font-body)" }}>
                {totalItems} {totalItems === 1 ? "item" : "items"}
              </span>
            )}
          </div>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "rgba(255,255,255,0.2)", margin: "4px 0 0", fontWeight: 300 }}>
            {items.length > 0 ? "Review your selections before checkout" : "Add items to get started"}
          </p>
        </div>

        {/* Pickup Time */}
        <div style={{ padding: "18px 28px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
          <PickupTimeSelector activeTime={activeTime} setActiveTime={setActiveTime} />
        </div>

        {/* Cart Items (scrollable) */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 28px", scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.06) transparent" }}>
          {items.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: "40px 20px", textAlign: "center" }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" style={{ marginBottom: 20 }}>
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18" /><path d="M16 10a4 4 0 01-8 0" />
              </svg>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "rgba(255,255,255,0.15)", fontWeight: 300, lineHeight: 1.7 }}>
                Your order is empty.<br />Browse the menu and add items.
              </p>
            </div>
          ) : (
            items.map((item: CartItem) => (
              <CartItemRow key={`desktop-${item.categoryKey}-${item.name}`} item={item} updateQty={updateQty} removeItem={removeItem} variant="desktop" />
            ))
          )}
        </div>

        {/* Promo */}
        {items.length > 0 && (
          <div style={{ padding: "0 28px 14px" }}><PromoSection {...promoSectionProps} /></div>
        )}

        {/* Special Instructions */}
        {items.length > 0 && (
          <div style={{ padding: "0 28px 14px" }}>
            <button onClick={() => setShowInstructions(!showInstructions)} style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "rgba(255,255,255,0.2)", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontWeight: 500, padding: 0, minHeight: 36 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">{showInstructions ? <path d="M5 12h14" /> : <path d="M12 5v14m-7-7h14" />}</svg>
              {showInstructions ? "Hide special instructions" : "Add special instructions"}
            </button>
            {showInstructions && (
              <textarea placeholder="Allergies, dietary needs, special requests..." style={{ width: "100%", marginTop: 10, padding: 12, background: "rgb(var(--bg-primary))", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 10, fontFamily: "var(--font-body)", fontSize: 16, color: "#fff", resize: "none", height: 60, outline: "none", WebkitAppearance: "none" }} />
            )}
          </div>
        )}

        {/* Totals & Checkout */}
        <div style={{ padding: "18px 28px 24px", borderTop: "1px solid rgba(255,255,255,0.04)", background: "linear-gradient(180deg, transparent 0%, rgba(201,160,80,0.015) 100%)" }}>
          <TotalsBlock {...totalsProps} />
          <div style={{ textAlign: "center", fontFamily: "var(--font-body)", fontSize: 10, color: "rgba(255,255,255,0.15)", marginTop: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, letterSpacing: 0.5 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
            Secure checkout · SSL encrypted
          </div>
        </div>
      </aside>

      {/* ════════════════════════════════════════
          DESKTOP: Cart Modal
          (triggered by "View Order" button)
          ════════════════════════════════════════ */}
      {modalOpen && (
        <>
          {/* Backdrop */}
          <div
            className="cart-modal-backdrop"
            onClick={closeModal}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 200,
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(8px)",
              opacity: modalClosing ? 0 : 1,
              animation: modalClosing ? "none" : "cartFadeIn 0.2s ease",
              transition: modalClosing ? "opacity 0.25s ease" : "none",
            }}
          />

          {/* Modal */}
          <div
            className="cart-modal"
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              zIndex: 210,
              width: "min(680px, 92vw)",
              maxHeight: "85vh",
              background: "#111009",
              border: "1px solid rgba(201,160,80,0.12)",
              borderRadius: 24,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              boxShadow: "0 40px 120px rgba(0,0,0,0.6), 0 0 60px rgba(201,160,80,0.04)",
              transform: modalClosing
                ? "translate(-50%, -50%) scale(0.96)"
                : "translate(-50%, -50%) scale(1)",
              opacity: modalClosing ? 0 : 1,
              animation: modalClosing ? "none" : "cartModalIn 0.3s cubic-bezier(0.16,1,0.3,1)",
              transition: modalClosing ? "all 0.25s ease" : "none",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "28px 36px 24px", borderBottom: "1px solid rgba(255,255,255,0.04)", background: "linear-gradient(180deg, rgba(201,160,80,0.03) 0%, transparent 100%)" }}>
              <div>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 500, color: "#fff", margin: 0, display: "flex", alignItems: "center", gap: 14 }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(183,143,82,0.5)" strokeWidth="1.5"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18" /><path d="M16 10a4 4 0 01-8 0" /></svg>
                  Your Order
                </h2>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "rgba(255,255,255,0.25)", margin: "6px 0 0", fontWeight: 300 }}>
                  {items.length > 0
                    ? `${totalItems} item${totalItems !== 1 ? "s" : ""} · Review before checkout`
                    : "Your order is empty"}
                </p>
              </div>
              <button
                onClick={closeModal}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.06)",
                  background: "rgba(255,255,255,0.03)",
                  color: "rgba(255,255,255,0.4)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  fontFamily: "var(--font-body)",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.color = "rgba(255,255,255,0.4)"; }}
              >
                ✕
              </button>
            </div>

            {/* Pickup Time */}
            <div style={{ padding: "0 36px" }}>
              <PickupTimeSelector activeTime={activeTime} setActiveTime={setActiveTime} />
            </div>

            {/* Scrollable items */}
            <div style={{ flex: 1, overflowY: "auto", padding: "0 36px", scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.06) transparent" }}>
              {items.length === 0 ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", textAlign: "center" }}>
                  <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" style={{ marginBottom: 20 }}>
                    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18" /><path d="M16 10a4 4 0 01-8 0" />
                  </svg>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: 15, color: "rgba(255,255,255,0.15)", fontWeight: 300, lineHeight: 1.7 }}>
                    Your order is empty.<br />Browse the menu and add items.
                  </p>
                </div>
              ) : (
                items.map((item: CartItem) => (
                  <CartItemRow key={`modal-${item.categoryKey}-${item.name}`} item={item} updateQty={updateQty} removeItem={removeItem} variant="modal" />
                ))
              )}

              {/* Promo + Instructions inside scroll area */}
              {items.length > 0 && <PromoSection {...promoSectionProps} />}
              {items.length > 0 && (
                <div style={{ padding: "4px 0 14px" }}>
                  <button onClick={() => setShowInstructions(!showInstructions)} style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "rgba(255,255,255,0.2)", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontWeight: 500, padding: 0, minHeight: 36 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">{showInstructions ? <path d="M5 12h14" /> : <path d="M12 5v14m-7-7h14" />}</svg>
                    {showInstructions ? "Hide special instructions" : "Add special instructions"}
                  </button>
                  {showInstructions && (
                    <textarea placeholder="Allergies, dietary needs, special requests..." style={{ width: "100%", marginTop: 10, padding: 12, background: "rgb(var(--bg-primary))", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 10, fontFamily: "var(--font-body)", fontSize: 16, color: "#fff", resize: "none", height: 60, outline: "none", WebkitAppearance: "none" }} />
                  )}
                </div>
              )}
            </div>

            {/* Footer with totals + checkout */}
            <div style={{ padding: "24px 36px 28px", borderTop: "1px solid rgba(255,255,255,0.04)", background: "linear-gradient(180deg, transparent 0%, rgba(201,160,80,0.02) 100%)" }}>
              <TotalsBlock {...totalsProps} onCheckout={closeModal} />
              <div style={{ textAlign: "center", fontFamily: "var(--font-body)", fontSize: 10, color: "rgba(255,255,255,0.15)", marginTop: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, letterSpacing: 0.5 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
                Secure checkout · SSL encrypted
              </div>
            </div>
          </div>
        </>
      )}

      {/* ════════════════════════════════════════
          MOBILE: Fixed Bottom Cart Bar
          ════════════════════════════════════════ */}
      <div
        className="cart-mobile-bar"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 90,
          padding: "12px 16px",
          paddingBottom: "calc(12px + env(safe-area-inset-bottom, 0px))",
          background: "rgba(8,6,3,0.96)",
          backdropFilter: "blur(24px) saturate(1.5)",
          borderTop: "1px solid rgba(201,160,80,0.15)",
          display: "none",
          transition: "transform 0.3s ease",
          transform: totalItems > 0 ? "translateY(0)" : "translateY(100%)",
        }}
      >
        <button
          onClick={() => setSheetOpen(true)}
          style={{
            width: "100%",
            height: 52,
            borderRadius: 14,
            border: "none",
            background: "linear-gradient(135deg, #C9A050, #B8903E)",
            color: "#080603",
            cursor: "pointer",
            fontFamily: "var(--font-body)",
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: 1,
            textTransform: "uppercase",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 20px",
            boxShadow: "0 8px 32px rgba(201,160,80,0.25)",
            transition: "transform 0.15s",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 24, height: 24, borderRadius: 7, background: "rgba(0,0,0,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>
              {totalItems}
            </span>
            View Cart
          </span>
          <span style={{ fontFamily: "var(--font-accent)", fontSize: 16, fontWeight: 700 }}>
            ${total.toFixed(2)}
          </span>
        </button>
      </div>

      {/* ════════════════════════════════════════
          MOBILE: Cart Sheet Overlay
          ════════════════════════════════════════ */}
      {sheetOpen && (
        <>
          {/* Backdrop */}
          <div
            className="cart-sheet-backdrop"
            ref={backdropRef}
            onClick={() => closeSheet()}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 150,
              background: "rgba(0,0,0,0.7)",
              backdropFilter: "blur(4px)",
              animation: sheetClosing ? "none" : "cartFadeIn 0.25s ease",
              opacity: sheetClosing ? 0 : 1,
              transition: sheetClosing ? "opacity 0.3s ease" : "none",
            }}
          />

          {/* Sheet */}
          <div
            className="cart-sheet"
            ref={sheetRef}
            onTouchStart={(e) => {
              touchStartY.current = e.touches[0].clientY;
              touchDeltaY.current = 0;
              isDragging.current = false;
              if (sheetRef.current) sheetRef.current.style.transition = "none";
            }}
            onTouchMove={(e) => {
              const delta = e.touches[0].clientY - touchStartY.current;
              touchDeltaY.current = delta;
              const clampedDelta = Math.max(0, delta);
              if (clampedDelta > 10) isDragging.current = true;
              if (sheetRef.current && clampedDelta > 0) {
                const translated = clampedDelta < 40 ? clampedDelta : 40 + (clampedDelta - 40) * 0.4;
                sheetRef.current.style.transform = `translateY(${translated}px)`;
              }
              if (backdropRef.current && clampedDelta > 0) {
                backdropRef.current.style.opacity = String(Math.max(0, 1 - clampedDelta / 400));
              }
            }}
            onTouchEnd={() => {
              if (sheetRef.current) sheetRef.current.style.transition = "transform 0.3s cubic-bezier(0.22,1,0.36,1)";
              if (backdropRef.current) backdropRef.current.style.transition = "opacity 0.3s ease";
              if (touchDeltaY.current > 100) {
                if (sheetRef.current) sheetRef.current.style.transform = "translateY(100%)";
                if (backdropRef.current) backdropRef.current.style.opacity = "0";
                setTimeout(() => {
                  setSheetOpen(false);
                  if (sheetRef.current) { sheetRef.current.style.transform = ""; sheetRef.current.style.transition = ""; }
                  if (backdropRef.current) { backdropRef.current.style.opacity = ""; backdropRef.current.style.transition = ""; }
                }, 300);
              } else {
                if (sheetRef.current) sheetRef.current.style.transform = "translateY(0)";
                if (backdropRef.current) backdropRef.current.style.opacity = "1";
              }
              touchDeltaY.current = 0;
              isDragging.current = false;
            }}
            style={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 160,
              background: "rgb(var(--bg-secondary))",
              borderRadius: "24px 24px 0 0",
              maxHeight: "85vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 -20px 80px rgba(0,0,0,0.5)",
              animation: sheetClosing ? "none" : "cartSlideUp 0.35s cubic-bezier(0.16,1,0.3,1)",
              transform: sheetClosing ? "translateY(100%)" : "translateY(0)",
              transition: sheetClosing ? "transform 0.3s cubic-bezier(0.22,1,0.36,1)" : "none",
            }}
          >
            {/* Drag handle + Header */}
            <div
              className="cart-sheet-drag-zone"
              style={{ flexShrink: 0, userSelect: "none" }}
              onMouseDown={(e) => {
                e.preventDefault();
                touchStartY.current = e.clientY;
                touchDeltaY.current = 0;
                isDragging.current = false;
                if (sheetRef.current) sheetRef.current.style.transition = "none";

                const onMouseMove = (ev: MouseEvent) => {
                  const delta = ev.clientY - touchStartY.current;
                  touchDeltaY.current = delta;
                  const clampedDelta = Math.max(0, delta);
                  if (clampedDelta > 10) isDragging.current = true;
                  if (sheetRef.current && clampedDelta > 0) {
                    const translated = clampedDelta < 40 ? clampedDelta : 40 + (clampedDelta - 40) * 0.4;
                    sheetRef.current.style.transform = `translateY(${translated}px)`;
                  }
                  if (backdropRef.current && clampedDelta > 0) {
                    backdropRef.current.style.opacity = String(Math.max(0, 1 - clampedDelta / 400));
                  }
                };

                const onMouseUp = () => {
                  document.removeEventListener("mousemove", onMouseMove);
                  document.removeEventListener("mouseup", onMouseUp);
                  if (sheetRef.current) sheetRef.current.style.transition = "transform 0.3s cubic-bezier(0.22,1,0.36,1)";
                  if (backdropRef.current) backdropRef.current.style.transition = "opacity 0.3s ease";
                  if (touchDeltaY.current > 100) {
                    if (sheetRef.current) sheetRef.current.style.transform = "translateY(100%)";
                    if (backdropRef.current) backdropRef.current.style.opacity = "0";
                    setTimeout(() => {
                      setSheetOpen(false);
                      if (sheetRef.current) { sheetRef.current.style.transform = ""; sheetRef.current.style.transition = ""; }
                      if (backdropRef.current) { backdropRef.current.style.opacity = ""; backdropRef.current.style.transition = ""; }
                    }, 300);
                  } else {
                    if (sheetRef.current) sheetRef.current.style.transform = "translateY(0)";
                    if (backdropRef.current) backdropRef.current.style.opacity = "1";
                  }
                  touchDeltaY.current = 0;
                  isDragging.current = false;
                };

                document.addEventListener("mousemove", onMouseMove);
                document.addEventListener("mouseup", onMouseUp);
              }}
            >
              <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 0" }}>
                <div className="cart-drag-pill" style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.15)", transition: "all 0.2s ease" }} />
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.04)", flexShrink: 0 }}>
                <div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 500, color: "#fff" }}>Your Order</div>
                  <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "rgba(255,255,255,0.25)", fontWeight: 300 }}>{totalItems} item{totalItems !== 1 ? "s" : ""}</div>
                </div>
                <button
                  onClick={() => closeSheet()}
                  onMouseDown={(e) => e.stopPropagation()}
                  style={{
                    width: 36, height: 36, borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.06)",
                    background: "transparent", color: "rgba(255,255,255,0.4)",
                    cursor: "pointer", display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: 18, fontFamily: "var(--font-body)",
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Scrollable body */}
            <div style={{ flex: 1, overflowY: "auto", padding: "0 20px", WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}>
              <PickupTimeSelector activeTime={activeTime} setActiveTime={setActiveTime} />

              {items.map((item: CartItem) => (
                <CartItemRow key={`sheet-${item.categoryKey}-${item.name}`} item={item} updateQty={updateQty} removeItem={removeItem} variant="sheet" />
              ))}

              {items.length > 0 && <PromoSection {...promoSectionProps} />}

              {items.length > 0 && (
                <div style={{ padding: "8px 0 14px" }}>
                  <button onClick={() => setShowInstructions(!showInstructions)} style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "rgba(255,255,255,0.2)", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontWeight: 500, padding: 0, minHeight: 36 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">{showInstructions ? <path d="M5 12h14" /> : <path d="M12 5v14m-7-7h14" />}</svg>
                    {showInstructions ? "Hide special instructions" : "Add special instructions"}
                  </button>
                  {showInstructions && (
                    <textarea placeholder="Allergies, dietary needs, special requests..." style={{ width: "100%", marginTop: 10, padding: 12, background: "rgb(var(--bg-primary))", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 10, fontFamily: "var(--font-body)", fontSize: 16, color: "#fff", resize: "none", height: 60, outline: "none", WebkitAppearance: "none" }} />
                  )}
                </div>
              )}

              <div style={{ padding: "14px 0 8px" }}>
                <TotalsBlock {...totalsProps} showCheckout={false} />
              </div>
            </div>

            {/* Fixed checkout footer */}
            <div style={{ padding: "16px 20px", paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))", borderTop: "1px solid rgba(255,255,255,0.04)", flexShrink: 0, background: "rgb(var(--bg-secondary))" }}>
              <Link
                href="/order/checkout"
                onClick={() => setSheetOpen(false)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  width: "100%", height: 52, borderRadius: 14, border: "none",
                  background: "linear-gradient(135deg, #C9A050, #B8903E)", color: "#080603",
                  fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 700,
                  letterSpacing: 1.5, textTransform: "uppercase", textDecoration: "none",
                  boxShadow: "0 8px 32px rgba(201,160,80,0.25)",
                }}
              >
                Proceed to Checkout
                <span style={{ opacity: 0.5 }}>·</span>
                ${total.toFixed(2)}
              </Link>
            </div>
          </div>
        </>
      )}

      {/* ════════════════════════════════════════
          Responsive CSS
          ════════════════════════════════════════ */}
      <style>{`
        @media (max-width: 900px) {
          .cart-desktop-sidebar {
            display: none !important;
          }
          .cart-mobile-bar {
            display: block !important;
          }
          .cart-modal-backdrop,
          .cart-modal {
            display: none !important;
          }
        }
        @media (min-width: 901px) {
          .cart-mobile-bar {
            display: none !important;
          }
          .cart-sheet-backdrop,
          .cart-sheet {
            display: none !important;
          }
        }
        @keyframes cartSlideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes cartFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes cartModalIn {
          from { transform: translate(-50%, -50%) scale(0.94); opacity: 0; }
          to { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        }
        .cart-sheet > div:nth-child(2)::-webkit-scrollbar { display: none; }
        .cart-sheet-drag-zone:hover .cart-drag-pill {
          background: rgba(255,255,255,0.3) !important;
          width: 48px !important;
        }
        .cart-sheet-drag-zone {
          cursor: grab;
        }
        .cart-sheet-drag-zone:active {
          cursor: grabbing;
        }
        @media (hover: none) and (pointer: coarse) {
          .cart-desktop-sidebar button:active {
            opacity: 0.7;
          }
        }
      `}</style>
    </>
  );
}

/* ── Style constants ── */
const sheetQtyBtnStyle: React.CSSProperties = {
  width: 34, height: 34, border: "none", background: "transparent",
  color: "rgba(255,255,255,0.5)", cursor: "pointer", display: "flex",
  alignItems: "center", justifyContent: "center", fontSize: 15,
  fontWeight: 600, fontFamily: "var(--font-body)", transition: "all 0.15s",
  minWidth: 34, minHeight: 34,
};

const desktopQtyBtnStyle: React.CSSProperties = {
  width: 34, height: 34, borderRadius: 6,
  border: "1px solid rgba(255,255,255,0.06)", background: "transparent",
  color: "rgba(255,255,255,0.45)", cursor: "pointer", display: "flex",
  alignItems: "center", justifyContent: "center", fontSize: 13,
  fontWeight: 600, fontFamily: "var(--font-body)", transition: "all 0.2s",
  minWidth: 34, minHeight: 34,
};

const modalQtyBtnStyle: React.CSSProperties = {
  width: 38, height: 38, borderRadius: 8,
  border: "1px solid rgba(255,255,255,0.06)", background: "transparent",
  color: "rgba(255,255,255,0.45)", cursor: "pointer", display: "flex",
  alignItems: "center", justifyContent: "center", fontSize: 15,
  fontWeight: 600, fontFamily: "var(--font-body)", transition: "all 0.2s",
  minWidth: 38, minHeight: 38,
};

const totalRowStyle: React.CSSProperties = {
  display: "flex", justifyContent: "space-between", marginBottom: 7,
  fontFamily: "var(--font-body)", fontSize: 13, color: "rgba(255,255,255,0.4)", fontWeight: 300,
};