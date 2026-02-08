"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart, type CartItem } from "@/components/order/Cartcontext";
import { categories } from "@/data/menu";

/* ── Lookup: categoryKey → label ── */
const catLabelMap: Record<string, string> = {};
categories.forEach((c) => { catLabelMap[c.key] = c.label; });

const TAX_RATE = 0.095;
const PACKAGING_FEE = 2;

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
  const [mobileOpen, setMobileOpen] = useState(false);

  const totalItems = items.reduce((sum: number, i: CartItem) => sum + i.qty, 0);
  const subtotal = items.reduce((sum: number, i: CartItem) => sum + i.price * i.qty, 0);
  const discount = promo ? promo.discount : 0;
  const taxableSubtotal = subtotal - discount;
  const tax = taxableSubtotal * TAX_RATE;
  const total = taxableSubtotal + tax + (items.length > 0 ? PACKAGING_FEE : 0);

  const timeOptions = [
    { label: "ASAP", value: "25–35 min" },
    { label: "Today", value: "6:30 PM" },
    { label: "Today", value: "7:00 PM" },
  ];

  /* ── Handle Apply click ── */
  const handleApplyPromo = async () => {
    const success = await applyPromo(promoInput, subtotal);
    if (success) {
      setPromoInput(""); // clear input on success, badge will show instead
    }
  };

  return (
    <>
      {/* ── Mobile overlay backdrop ── */}
      {mobileOpen && (
        <div
          className="cart-backdrop"
          onClick={() => setMobileOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 89,
            display: "none",
          }}
        />
      )}

      <aside
        className={`order-cart-sidebar ${mobileOpen ? "cart-open" : ""}`}
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
        {/* ── Mobile drag handle ── */}
        <div
          className="cart-drag-handle"
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{
            display: "none",
            justifyContent: "center",
            alignItems: "center",
            padding: "10px 0 6px",
            cursor: "pointer",
          }}
        >
          <div
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              background: "rgba(255,255,255,0.15)",
            }}
          />
        </div>

        {/* ── Mobile summary bar (visible when collapsed) ── */}
        <div
          className="cart-mobile-summary"
          onClick={() => setMobileOpen(true)}
          style={{
            display: "none",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 clamp(16px, 3vw, 28px)",
            height: 64,
            cursor: "pointer",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C9A050" strokeWidth="1.5">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
            <span style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, color: "#fff" }}>
              {totalItems > 0 ? `${totalItems} item${totalItems !== 1 ? "s" : ""}` : "Your Order"}
            </span>
          </div>
          {totalItems > 0 && (
            <span style={{ fontFamily: "var(--font-accent)", fontSize: 18, fontWeight: 700, color: "#C9A050" }}>
              ${total.toFixed(2)}
            </span>
          )}
        </div>

        {/* ── Header ── */}
        <div
          className="cart-header"
          style={{
            padding: "clamp(18px, 3vw, 28px) clamp(16px, 3vw, 28px) clamp(14px, 2vw, 20px)",
            borderBottom: "1px solid rgba(255,255,255,0.04)",
            background: "linear-gradient(180deg, rgba(201,160,80,0.02) 0%, transparent 100%)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(18px, 2.5vw, 22px)",
                fontWeight: 500,
                color: "#fff",
                margin: 0,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(183,143,82,0.4)" strokeWidth="1.5">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18" />
                <path d="M16 10a4 4 0 01-8 0" />
              </svg>
              Your Order
            </h2>
            {totalItems > 0 && (
              <span
                style={{
                  background: "linear-gradient(135deg, #C9A050, #B8903E)",
                  color: "rgb(var(--bg-primary))",
                  fontSize: 11,
                  fontWeight: 800,
                  padding: "3px 12px",
                  borderRadius: 20,
                  fontFamily: "var(--font-body)",
                }}
              >
                {totalItems} {totalItems === 1 ? "item" : "items"}
              </span>
            )}
          </div>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 12,
              color: "rgba(255,255,255,0.2)",
              margin: "4px 0 0",
              fontWeight: 300,
            }}
          >
            {items.length > 0 ? "Review your selections before checkout" : "Add items to get started"}
          </p>
        </div>

        {/* ── Pickup Time ── */}
        <div style={{ padding: "clamp(12px, 2vw, 18px) clamp(16px, 3vw, 28px)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
          <div
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: 2.5,
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.2)",
              marginBottom: "clamp(8px, 1.2vw, 12px)",
            }}
          >
            Pickup Time
          </div>
          <div style={{ display: "flex", gap: "clamp(6px, 0.8vw, 8px)" }}>
            {timeOptions.map((opt, i) => (
              <button
                key={i}
                onClick={() => setActiveTime(i)}
                style={{
                  flex: 1,
                  padding: "clamp(8px, 1.2vw, 10px)",
                  border: `1px solid ${activeTime === i ? "rgba(201,160,80,0.5)" : "rgba(255,255,255,0.05)"}`,
                  borderRadius: 10,
                  background: activeTime === i ? "rgba(201,160,80,0.06)" : "transparent",
                  boxShadow: activeTime === i ? "0 0 16px rgba(201,160,80,0.04)" : "none",
                  cursor: "pointer",
                  textAlign: "center",
                  transition: "all 0.3s",
                  fontFamily: "var(--font-body)",
                  minHeight: 44,
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    letterSpacing: 0.5,
                    textTransform: "uppercase",
                    fontWeight: 600,
                    color: "rgba(255,255,255,0.35)",
                    display: "block",
                  }}
                >
                  {opt.label}
                </span>
                <span
                  style={{
                    fontSize: "clamp(12px, 1.4vw, 14px)",
                    fontWeight: 600,
                    color: activeTime === i ? "#C9A050" : "#fff",
                    marginTop: 3,
                    display: "block",
                    letterSpacing: 0,
                  }}
                >
                  {opt.value}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Cart Items (scrollable) ── */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "8px clamp(16px, 3vw, 28px)",
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(255,255,255,0.06) transparent",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {items.length === 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                padding: "40px 20px",
                textAlign: "center",
              }}
            >
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="1"
                style={{ marginBottom: 20 }}
              >
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18" />
                <path d="M16 10a4 4 0 01-8 0" />
              </svg>
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 14,
                  color: "rgba(255,255,255,0.15)",
                  fontWeight: 300,
                  lineHeight: 1.7,
                }}
              >
                Your order is empty.
                <br />
                Browse the menu and add items.
              </p>
            </div>
          ) : (
            items.map((item: CartItem) => (
              <div
                key={`${item.categoryKey}-${item.name}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "50px 1fr auto",
                  gap: "clamp(10px, 1.5vw, 14px)",
                  alignItems: "flex-start",
                  padding: "clamp(12px, 1.8vw, 16px) 0",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                }}
              >
                <div
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 10,
                    overflow: "hidden",
                    border: "1px solid rgba(255,255,255,0.06)",
                    flexShrink: 0,
                    position: "relative",
                  }}
                >
                  <Image
                    src={item.img}
                    alt={item.name}
                    width={50}
                    height={50}
                    style={{ objectFit: "cover" }}
                  />
                </div>

                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "clamp(13px, 1.6vw, 15px)",
                      fontWeight: 500,
                      color: "#fff",
                      marginBottom: 3,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.name}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: 11,
                      color: "rgba(255,255,255,0.2)",
                      fontWeight: 300,
                      marginBottom: 8,
                    }}
                  >
                    {catLabelMap[item.categoryKey] ?? ""}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button
                      aria-label="Decrease quantity"
                      onClick={() => {
                        if (item.qty <= 1) removeItem(item.name, item.categoryKey);
                        else updateQty(item.name, item.categoryKey, item.qty - 1);
                      }}
                      style={cartQtyBtnStyle}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "rgba(183,143,82,0.3)";
                        e.currentTarget.style.color = "#C9A050";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                        e.currentTarget.style.color = "rgba(255,255,255,0.45)";
                      }}
                    >
                      −
                    </button>
                    <span
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#fff",
                        minWidth: 14,
                        textAlign: "center",
                      }}
                    >
                      {item.qty}
                    </span>
                    <button
                      aria-label="Increase quantity"
                      onClick={() => updateQty(item.name, item.categoryKey, item.qty + 1)}
                      style={cartQtyBtnStyle}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "rgba(183,143,82,0.3)";
                        e.currentTarget.style.color = "#C9A050";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                        e.currentTarget.style.color = "rgba(255,255,255,0.45)";
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      fontFamily: "var(--font-accent)",
                      fontSize: "clamp(16px, 2vw, 18px)",
                      fontWeight: 600,
                      color: "#C9A050",
                    }}
                  >
                    ${(item.price * item.qty).toFixed(0)}
                  </div>
                  <button
                    onClick={() => removeItem(item.name, item.categoryKey)}
                    aria-label={`Remove ${item.name}`}
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: 10,
                      color: "rgba(255,255,255,0.15)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      marginTop: 6,
                      transition: "color 0.2s",
                      letterSpacing: 0.5,
                      minHeight: 28,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#a85454")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.15)")}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ── Promo Code ── */}
        {items.length > 0 && (
          <div style={{ padding: "0 clamp(16px, 3vw, 28px) 14px" }}>
            {promo ? (
              /* ── Applied promo badge ── */
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
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="2">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  <span
                    style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#4ADE80",
                      letterSpacing: 1.5,
                    }}
                  >
                    {promo.code}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      color: "rgba(74,222,128,0.6)",
                      fontFamily: "var(--font-body)",
                      fontWeight: 400,
                    }}
                  >
                    −${promo.discount.toFixed(2)}
                  </span>
                </div>
                <button
                  onClick={removePromo}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 15,
                    color: "rgba(255,255,255,0.25)",
                    lineHeight: 1,
                    padding: "2px 4px",
                    borderRadius: 4,
                    transition: "color 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#F87171")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.25)")}
                  title="Remove promo"
                >
                  ×
                </button>
              </div>
            ) : (
              /* ── Promo input ── */
              <>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type="text"
                    placeholder="Promo code"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleApplyPromo();
                    }}
                    style={{
                      flex: 1,
                      padding: "10px 14px",
                      background: "rgb(var(--bg-primary))",
                      border: `1px solid ${promoError ? "rgba(248,113,113,0.3)" : "rgba(255,255,255,0.05)"}`,
                      borderRadius: 8,
                      fontFamily: "var(--font-body)",
                      fontSize: 16,
                      color: "#fff",
                      outline: "none",
                      transition: "border-color 0.3s",
                      textTransform: "uppercase",
                      letterSpacing: 1,
                      WebkitAppearance: "none",
                    }}
                    onFocus={(e) => {
                      if (!promoError)
                        e.currentTarget.style.borderColor = "rgba(183,143,82,0.2)";
                    }}
                    onBlur={(e) => {
                      if (!promoError)
                        e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)";
                    }}
                  />
                  <button
                    onClick={handleApplyPromo}
                    disabled={promoLoading}
                    style={{
                      padding: "10px 16px",
                      background: "rgb(var(--bg-elevated))",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: 8,
                      fontFamily: "var(--font-body)",
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: 1,
                      textTransform: "uppercase",
                      color: promoLoading ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.4)",
                      cursor: promoLoading ? "wait" : "pointer",
                      transition: "all 0.2s",
                      minWidth: 64,
                      minHeight: 44,
                      whiteSpace: "nowrap",
                    }}
                    onMouseEnter={(e) => {
                      if (!promoLoading) {
                        e.currentTarget.style.borderColor = "rgba(183,143,82,0.3)";
                        e.currentTarget.style.color = "#C9A050";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                      e.currentTarget.style.color = promoLoading
                        ? "rgba(255,255,255,0.2)"
                        : "rgba(255,255,255,0.4)";
                    }}
                  >
                    {promoLoading ? "…" : "Apply"}
                  </button>
                </div>
                {promoError && (
                  <div
                    style={{
                      marginTop: 6,
                      fontSize: 11,
                      color: "#F87171",
                      fontFamily: "var(--font-body)",
                      fontWeight: 400,
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 8v4m0 4h.01" />
                    </svg>
                    {promoError}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── Special Instructions ── */}
        {items.length > 0 && (
          <div style={{ padding: "0 clamp(16px, 3vw, 28px) 14px" }}>
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 11,
                color: "rgba(255,255,255,0.2)",
                background: "none",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontWeight: 500,
                transition: "color 0.2s",
                padding: 0,
                minHeight: 36,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.2)")}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                {showInstructions ? <path d="M5 12h14" /> : <path d="M12 5v14m-7-7h14" />}
              </svg>
              {showInstructions ? "Hide special instructions" : "Add special instructions"}
            </button>
            {showInstructions && (
              <textarea
                placeholder="Allergies, dietary needs, special requests..."
                style={{
                  width: "100%",
                  marginTop: 10,
                  padding: 12,
                  background: "rgb(var(--bg-primary))",
                  border: "1px solid rgba(255,255,255,0.05)",
                  borderRadius: 10,
                  fontFamily: "var(--font-body)",
                  fontSize: 16,
                  color: "#fff",
                  resize: "none",
                  height: 60,
                  outline: "none",
                  transition: "border-color 0.3s",
                  WebkitAppearance: "none",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(183,143,82,0.2)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)")}
              />
            )}
          </div>
        )}

        {/* ── Totals & Checkout ── */}
        <div
          style={{
            padding: "clamp(14px, 2vw, 18px) clamp(16px, 3vw, 28px) clamp(18px, 3vw, 24px)",
            paddingBottom: "calc(clamp(18px, 3vw, 24px) + env(safe-area-inset-bottom))",
            borderTop: "1px solid rgba(255,255,255,0.04)",
            background: "linear-gradient(180deg, transparent 0%, rgba(201,160,80,0.015) 100%)",
          }}
        >
          {items.length > 0 ? (
            <>
              <div style={totalRowStyle}>
                <span>Subtotal</span>
                <span style={{ color: "#fff", fontWeight: 500 }}>${subtotal.toFixed(2)}</span>
              </div>
              {/* Discount row — only when promo is applied */}
              {promo && (
                <div style={{ ...totalRowStyle, color: "#4ADE80" }}>
                  <span>
                    Discount ({promo.type === "percent" ? `${promo.value}%` : `$${promo.value}`})
                  </span>
                  <span style={{ color: "#4ADE80", fontWeight: 500 }}>
                    −${promo.discount.toFixed(2)}
                  </span>
                </div>
              )}
              <div style={totalRowStyle}>
                <span>Tax (9.5%)</span>
                <span style={{ color: "#fff", fontWeight: 500 }}>${tax.toFixed(2)}</span>
              </div>
              <div style={totalRowStyle}>
                <span>Packaging</span>
                <span style={{ color: "#fff", fontWeight: 500 }}>${PACKAGING_FEE.toFixed(2)}</span>
              </div>

              {/* Grand total */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: 14,
                  paddingTop: 14,
                  borderTop: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <span style={{ fontFamily: "var(--font-body)", fontSize: "clamp(14px, 1.8vw, 16px)", fontWeight: 500, color: "#fff" }}>
                  Total
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-accent)",
                    fontSize: "clamp(22px, 3vw, 26px)",
                    fontWeight: 700,
                    color: "#C9A050",
                  }}
                >
                  ${total.toFixed(2)}
                </span>
              </div>

              {/* Checkout */}
              <Link
                href="/order/checkout"
                className="btn-gold-filled"
                style={{
                  display: "block",
                  width: "100%",
                  padding: "clamp(14px, 2vw, 18px)",
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
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 12px 36px rgba(201,160,80,0.35)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 6px 24px rgba(201,160,80,0.25)";
                }}
              >
                Proceed to Checkout
              </Link>
            </>
          ) : (
            <button
              className="btn-gold-outline"
              style={{
                width: "100%",
                padding: "clamp(14px, 2vw, 18px)",
                borderRadius: 14,
                fontSize: 12,
                letterSpacing: 2.5,
                fontWeight: 600,
                opacity: 0.4,
                cursor: "default",
              }}
              disabled
            >
              Add Items to Order
            </button>
          )}

          {/* Secure note */}
          <div
            style={{
              textAlign: "center",
              fontFamily: "var(--font-body)",
              fontSize: 10,
              color: "rgba(255,255,255,0.15)",
              marginTop: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              letterSpacing: 0.5,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
            Secure checkout · SSL encrypted
          </div>
        </div>
      </aside>

      {/* ── Responsive: mobile bottom sheet ── */}
      <style>{`
        @media (max-width: 900px) {
          .cart-backdrop {
            display: block !important;
          }
          .cart-drag-handle {
            display: flex !important;
          }
          .cart-mobile-summary {
            display: flex !important;
          }
          .order-cart-sidebar {
            position: fixed !important;
            bottom: 0 !important;
            left: 0 !important;
            right: 0 !important;
            top: auto !important;
            height: auto !important;
            max-height: 85vh !important;
            border-radius: 20px 20px 0 0 !important;
            border-top: 1px solid rgba(183,143,82,0.15) !important;
            border-left: none !important;
            box-shadow: 0 -20px 60px rgba(0,0,0,0.5) !important;
            z-index: 90 !important;
            transform: translateY(calc(100% - 72px)) !important;
            transition: transform 0.45s cubic-bezier(0.22,1,0.36,1) !important;
          }
          .order-cart-sidebar.cart-open {
            transform: translateY(0) !important;
          }
        }
      `}</style>
    </>
  );
}

/* ── Shared styles ── */
const cartQtyBtnStyle: React.CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: 6,
  border: "1px solid rgba(255,255,255,0.06)",
  background: "transparent",
  color: "rgba(255,255,255,0.45)",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 13,
  fontWeight: 600,
  fontFamily: "var(--font-body)",
  transition: "all 0.2s",
  minWidth: 28,
  minHeight: 28,
};

const totalRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: 7,
  fontFamily: "var(--font-body)",
  fontSize: 13,
  color: "rgba(255,255,255,0.4)",
  fontWeight: 300,
};