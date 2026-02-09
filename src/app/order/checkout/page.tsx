"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useCart, type CartItem } from "@/components/order/Cartcontext";
import { useScrollY } from "@/hooks/useScrollY";
import { useIsTablet } from "@/hooks/useIsMobile";
import { categories } from "@/data/menu";
import { getStripe } from "@/lib/stripe";

/* ── Category label lookup ── */
const catLabelMap: Record<string, string> = {};
categories.forEach((c) => { catLabelMap[c.key] = c.label; });

const TAX_RATE = 0.095;
const PACKAGING_FEE = 2;

/* ══════════════════════════════════════════
   Checkout Page
   ══════════════════════════════════════════ */
export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart, promo } = useCart();
  const scrollY = useScrollY();
  const scrolled = scrollY > 10;
  const isTablet = useIsTablet();
  const [summaryOpen, setSummaryOpen] = useState(false);

  /* ── Form state ── */
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  /* ── Tip state ── */
  const [tipIndex, setTipIndex] = useState(1); // default 18%
  const [showCustomTip, setShowCustomTip] = useState(false);
  const [customTipValue, setCustomTipValue] = useState("");

  /* ── Submit state ── */
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* ── Calculations (with promo discount) ── */
  const subtotal = items.reduce((sum: number, i: CartItem) => sum + i.price * i.qty, 0);
  const discount = promo ? promo.discount : 0;
  const discountedSubtotal = subtotal - discount;
  const tax = discountedSubtotal * TAX_RATE;
  const totalItems = items.reduce((sum: number, i: CartItem) => sum + i.qty, 0);

  const tipOptions = [
    { pct: 15, amt: discountedSubtotal * 0.15 },
    { pct: 18, amt: discountedSubtotal * 0.18 },
    { pct: 20, amt: discountedSubtotal * 0.20 },
    { pct: 25, amt: discountedSubtotal * 0.25 },
  ];

  const tipAmount = showCustomTip
    ? parseFloat(customTipValue) || 0
    : tipOptions[tipIndex]?.amt ?? 0;

  const total = discountedSubtotal + tax + (items.length > 0 ? PACKAGING_FEE : 0) + tipAmount;

  /* ── Submit handler ── */
  const handlePlaceOrder = async () => {
    setError("");

    if (items.length === 0) { setError("Your cart is empty."); return; }
    if (!firstName.trim()) { setError("First name is required."); return; }
    if (!lastName.trim()) { setError("Last name is required."); return; }
    if (!phone.trim()) { setError("Phone number is required."); return; }
    if (!email.trim() || !email.includes("@")) { setError("A valid email is required."); return; }

    setLoading(true);

    try {
      // Create Stripe checkout session
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            name: i.name,
            price: i.price,
            qty: i.qty,
            img: i.img,
            categoryKey: i.categoryKey,
            desc: i.desc,
          })),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim(),
          email: email.trim(),
          subtotal,
          discount,
          tax,
          packagingFee: PACKAGING_FEE,
          tip: tipAmount,
          total,
          pickupTime: "ASAP (25–35 min)",
          instructions: undefined, // Add instructions field if you have one in the UI
          ...(promo && {
            promoCode: promo.code,
            promoType: promo.type,
            promoValue: promo.value,
          }),
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      // Redirect to Stripe Checkout (session URL is preferred; redirectToCheckout used as fallback)
      if (data.url) {
        window.location.href = data.url;
        return;
      }

      const stripe = await getStripe();
      if (!stripe) {
        throw new Error("Stripe failed to load");
      }
      const s = stripe as unknown as { redirectToCheckout: (opts: { sessionId: string }) => Promise<{ error?: Error }> };
      const { error: stripeError } = await s.redirectToCheckout({ sessionId: data.sessionId });
      if (stripeError) {
        throw stripeError;
      }

      // Note: cart will be cleared in the webhook after successful payment
      // User will be redirected back from Stripe to /order/confirmation?session_id=xxx
    } catch (err: unknown) {
      console.error("Checkout failed:", err);
      const message = err instanceof Error ? err.message : "Unknown error occurred";
      setError(message);
      setLoading(false);
    }
  };

  return (
    <div style={{ background: "rgb(var(--bg-primary))", minHeight: "100vh", overflow: "hidden" }}>
      {/* ═══ Header ═══ */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: scrolled ? "rgba(8,6,3,0.96)" : "rgba(8,6,3,0.85)",
          backdropFilter: "blur(24px) saturate(1.4)",
          borderBottom: `1px solid ${scrolled ? "rgba(183,143,82,0.08)" : "rgba(255,255,255,0.03)"}`,
          height: "clamp(56px, 8vw, 76px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 clamp(20px,4vw,48px)",
          transition: "all 0.4s ease",
        }}
      >
        {/* Left: logo + back */}
        <div style={{ display: "flex", alignItems: "center", gap: "clamp(16px, 3vw, 32px)" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
            <div
              style={{
                width: 32,
                height: 32,
                border: "1px solid rgba(183,143,82,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transform: "rotate(45deg)",
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  transform: "rotate(-45deg)",
                  fontFamily: "var(--font-display)",
                  fontSize: 14,
                  color: "#C9A050",
                  fontWeight: 700,
                }}
              >
                N
              </span>
            </div>
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700, color: "#fff", letterSpacing: 2.5, lineHeight: 1 }}>
                NEW YORK NOOK
              </div>
              <div style={{ fontFamily: "var(--font-body)", fontSize: 7, fontWeight: 400, letterSpacing: 3.5, color: "rgba(183,143,82,0.6)", textTransform: "uppercase" }}>
                Fine Russian Cuisine
              </div>
            </div>
          </Link>

          <Link
            href="/order"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontFamily: "var(--font-body)",
              fontSize: 11,
              letterSpacing: 2,
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.45)",
              textDecoration: "none",
              transition: "color 0.3s",
              minHeight: 44,
              minWidth: 44,
              justifyContent: "center",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#C9A050")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.45)")}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M19 12H5m0 0l7 7m-7-7l7-7" />
            </svg>
            <span className="checkout-back-text">Back to Order</span>
          </Link>
        </div>

        {/* Center: step indicator */}
        <div className="checkout-steps" style={{ display: "flex", alignItems: "center", gap: 12, fontFamily: "var(--font-body)", fontSize: 11, letterSpacing: 1, color: "rgba(255,255,255,0.2)" }}>
          <span style={stepDotStyle("done")}>✓</span>
          <span style={{ color: "rgba(201,160,80,0.4)" }}>Menu</span>
          <span style={stepLineStyle(true)} />
          <span style={stepDotStyle("active")}>2</span>
          <span style={{ color: "#C9A050" }}>Checkout</span>
          <span style={stepLineStyle(false)} />
          <span style={stepDotStyle("pending")}>3</span>
          <span>Confirm</span>
        </div>

        {/* Right: secure badge */}
        <div
          className="checkout-secure"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 16px",
            background: "rgba(106,158,108,0.06)",
            border: "1px solid rgba(106,158,108,0.12)",
            borderRadius: 40,
            fontSize: 11,
            fontFamily: "var(--font-body)",
            color: "rgba(106,158,108,0.7)",
            letterSpacing: 0.5,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
          SSL Encrypted
        </div>
      </header>

      {/* ═══ Layout ═══ */}
      <div
        className="checkout-layout"
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) 420px",
          maxWidth: 1300,
          margin: "0 auto",
          minHeight: "calc(100vh - 76px)",
          position: "relative",
        }}
      >
        {/* ═══ Form Side ═══ */}
        <div
          style={{
            padding: isTablet ? "32px clamp(16px,4vw,64px) 120px" : "48px clamp(24px,4vw,64px) 100px",
            borderRight: isTablet ? "none" : "1px solid rgba(255,255,255,0.04)",
          }}
        >
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 32,
              fontWeight: 400,
              color: "#fff",
              marginBottom: 6,
            }}
          >
            Checkout
          </h1>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 14,
              color: "rgba(255,255,255,0.2)",
              fontWeight: 300,
              marginBottom: 40,
            }}
          >
            Complete your order for pickup
          </p>

          {/* ── Express Pay ── */}
          <FormSection label="Express Checkout" delay={0}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 28 }} className="checkout-express-grid">
              <ExpressButton label=" Pay" icon="apple" />
              <ExpressButton label="Google Pay" icon="google" />
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                marginBottom: 28,
                color: "rgba(255,255,255,0.2)",
                fontFamily: "var(--font-body)",
                fontSize: 11,
                letterSpacing: 2,
                textTransform: "uppercase",
              }}
            >
              <span style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.05)" }} />
              <span>or pay with card</span>
              <span style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.05)" }} />
            </div>
          </FormSection>

          {/* ── Contact Info ── */}
          <FormSection label="Contact Information" delay={1}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }} className="checkout-field-row">
              <Field label="First Name" placeholder="John" value={firstName} onChange={setFirstName} />
              <Field label="Last Name" placeholder="Doe" value={lastName} onChange={setLastName} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }} className="checkout-field-row">
              <Field label="Phone" placeholder="(323) 000-0000" type="tel" value={phone} onChange={setPhone} />
              <Field label="Email" placeholder="john@email.com" type="email" value={email} onChange={setEmail} />
            </div>
          </FormSection>

          {/* ── Tip ── */}
          <FormSection label="Add a Tip" delay={2}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginBottom: 14 }} className="checkout-tip-grid">
              {tipOptions.map((opt, i) => (
                <button
                  key={opt.pct}
                  onClick={() => { setTipIndex(i); setShowCustomTip(false); }}
                  style={{
                    padding: "14px 8px",
                    border: `1px solid ${!showCustomTip && tipIndex === i ? "#C9A050" : "rgba(255,255,255,0.05)"}`,
                    borderRadius: 10,
                    background: !showCustomTip && tipIndex === i ? "rgba(201,160,80,0.08)" : "rgb(var(--bg-secondary))",
                    boxShadow: !showCustomTip && tipIndex === i ? "0 0 16px rgba(201,160,80,0.06)" : "none",
                    cursor: "pointer",
                    textAlign: "center",
                    transition: "all 0.3s",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  <span
                    style={{
                      display: "block",
                      fontSize: 16,
                      fontWeight: 600,
                      color: !showCustomTip && tipIndex === i ? "#C9A050" : "#fff",
                      marginBottom: 2,
                    }}
                  >
                    {opt.pct}%
                  </span>
                  <span
                    style={{
                      display: "block",
                      fontSize: 11,
                      color: !showCustomTip && tipIndex === i ? "rgba(201,160,80,0.6)" : "rgba(255,255,255,0.2)",
                      fontWeight: 300,
                    }}
                  >
                    ${opt.amt.toFixed(2)}
                  </span>
                </button>
              ))}
              <button
                onClick={() => setShowCustomTip(true)}
                style={{
                  padding: "14px 8px",
                  border: `1px solid ${showCustomTip ? "#C9A050" : "rgba(255,255,255,0.05)"}`,
                  borderRadius: 10,
                  background: showCustomTip ? "rgba(201,160,80,0.08)" : "rgb(var(--bg-secondary))",
                  cursor: "pointer",
                  textAlign: "center",
                  transition: "all 0.3s",
                  fontFamily: "var(--font-body)",
                  fontSize: 12,
                  color: showCustomTip ? "#C9A050" : "rgba(255,255,255,0.45)",
                  fontWeight: 500,
                }}
              >
                Custom
              </button>
            </div>
            {showCustomTip && (
              <Field
                label="Custom Tip Amount"
                placeholder="$0.00"
                value={customTipValue}
                onChange={(v) => setCustomTipValue(v)}
              />
            )}
          </FormSection>

          {/* ── Card Details ── */}
          <FormSection label="Payment Details" delay={3}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }} className="checkout-field-row">
              <div style={{ gridColumn: "1 / -1", position: "relative" }}>
                <Field label="Card Number" placeholder="1234  5678  9012  3456" />
                <div style={{ position: "absolute", right: 16, top: 34, display: "flex", gap: 6 }}>
                  <CardIcon label="VISA" />
                  <CardIcon label="MC" />
                  <CardIcon label="AMEX" />
                </div>
              </div>
              <Field label="Expiry" placeholder="MM / YY" />
              <Field label="CVC" placeholder="123" />
            </div>
            <div style={{ marginTop: 14 }}>
              <Field label="Name on Card" placeholder="John Doe" />
            </div>
          </FormSection>

          {/* ── Error message ── */}
          {error && (
            <div
              style={{
                padding: "14px 18px",
                background: "rgba(168,84,84,0.1)",
                border: "1px solid rgba(168,84,84,0.2)",
                borderRadius: 10,
                fontFamily: "var(--font-body)",
                fontSize: 13,
                color: "#e07070",
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 8,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4m0 4h.01" />
              </svg>
              {error}
            </div>
          )}

          {/* ── Place Order ── */}
          <div className="checkout-place-order-desktop" style={{ animation: "checkoutFadeUp 0.5s ease both", animationDelay: "0.33s" }}>
            <button
              onClick={handlePlaceOrder}
              disabled={loading}
              className="btn-gold-filled"
              style={{
                width: "100%",
                padding: 20,
                marginTop: 32,
                borderRadius: 14,
                fontSize: 13,
                letterSpacing: 2.5,
                fontWeight: 800,
                boxShadow: "0 8px 32px rgba(201,160,80,0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                transition: "all 0.35s cubic-bezier(0.16,1,0.3,1)",
                opacity: loading ? 0.6 : 1,
                cursor: loading ? "wait" : "pointer",
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 12px 40px rgba(201,160,80,0.35)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 8px 32px rgba(201,160,80,0.25)";
              }}
            >
              {loading ? (
                <>
                  <span
                    style={{
                      width: 18,
                      height: 18,
                      border: "2px solid rgba(8,6,3,0.3)",
                      borderTopColor: "#080603",
                      borderRadius: "50%",
                      animation: "checkoutSpin 0.6s linear infinite",
                    }}
                  />
                  Placing Order...
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                  Place Order · ${total.toFixed(2)}
                </>
              )}
            </button>
            <p
              style={{
                textAlign: "center",
                fontFamily: "var(--font-body)",
                fontSize: 11,
                color: "rgba(255,255,255,0.2)",
                marginTop: 16,
                lineHeight: 1.6,
              }}
            >
              By placing this order, you agree to our{" "}
              <span style={{ color: "rgba(255,255,255,0.35)", textDecoration: "underline", cursor: "pointer" }}>Terms</span> and{" "}
              <span style={{ color: "rgba(255,255,255,0.35)", textDecoration: "underline", cursor: "pointer" }}>Privacy Policy</span>
            </p>
          </div>
        </div>

        {/* ═══ Order Summary Side ═══ */}
        <aside
          className="checkout-summary"
          style={{
            position: "sticky",
            top: 76,
            height: "calc(100vh - 76px)",
            background: "rgb(var(--bg-secondary))",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Header — collapsible on mobile */}
          <div
            style={{
              padding: "32px 28px 20px",
              borderBottom: "1px solid rgba(255,255,255,0.04)",
              background: "linear-gradient(180deg, rgba(201,160,80,0.02) 0%, transparent 100%)",
              cursor: isTablet ? "pointer" : "default",
            }}
            onClick={() => isTablet && setSummaryOpen(!summaryOpen)}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 500, color: "#fff", margin: "0 0 4px" }}>
                  Order Summary
                </h2>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "rgba(255,255,255,0.2)", fontWeight: 300, margin: 0 }}>
                  {totalItems} {totalItems === 1 ? "item" : "items"} · ${total.toFixed(2)}
                </p>
              </div>
              {isTablet && (
                <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 18, transition: "transform 0.3s", transform: summaryOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
                  ▾
                </span>
              )}
            </div>
          </div>

          {/* Summary body — collapsed on mobile unless toggled */}
          <div style={{ display: isTablet && !summaryOpen ? "none" : "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
          {/* Pickup info */}
          <div
            style={{
              padding: "16px 28px",
              borderBottom: "1px solid rgba(255,255,255,0.04)",
              display: "flex",
              alignItems: "center",
              gap: 12,
              background: "rgba(201,160,80,0.02)",
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "rgba(201,160,80,0.08)",
                border: "1px solid rgba(201,160,80,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C9A050" strokeWidth="1.5">
                <path d="M12 6v6l4 2" />
                <circle cx="12" cy="12" r="10" />
              </svg>
            </div>
            <div>
              <div style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, color: "#fff" }}>
                Pickup: ASAP (25–35 min)
              </div>
              <div style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "rgba(255,255,255,0.2)", fontWeight: 300 }}>
                7065 Sunset Blvd, Hollywood
              </div>
            </div>
          </div>

          {/* Items list */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "12px 28px",
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(255,255,255,0.04) transparent",
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
                <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "rgba(255,255,255,0.15)", fontWeight: 300 }}>
                  No items in your order.
                  <br />
                  <Link href="/order" style={{ color: "#C9A050", textDecoration: "underline" }}>Go back to add items.</Link>
                </p>
              </div>
            ) : (
              items.map((item: CartItem) => (
                <div
                  key={`${item.categoryKey}-${item.name}`}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "44px 1fr auto",
                    gap: 12,
                    alignItems: "center",
                    padding: "14px 0",
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 8,
                      overflow: "hidden",
                      border: "1px solid rgba(255,255,255,0.06)",
                      position: "relative",
                    }}
                  >
                    <Image src={item.img} alt={item.name} width={44} height={44} style={{ objectFit: "cover" }} />
                  </div>
                  <div>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 500, color: "#fff", marginBottom: 2 }}>
                      {item.name}
                    </div>
                    <div style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "rgba(255,255,255,0.2)", fontWeight: 300 }}>
                      Qty: {item.qty}{catLabelMap[item.categoryKey] ? ` · ${catLabelMap[item.categoryKey]}` : ""}
                    </div>
                  </div>
                  <div style={{ fontFamily: "var(--font-accent)", fontSize: 16, fontWeight: 500, color: "#C9A050" }}>
                    ${(item.price * item.qty).toFixed(0)}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Totals */}
          <div
            style={{
              padding: "20px 28px 28px",
              borderTop: "1px solid rgba(255,255,255,0.04)",
              background: "linear-gradient(180deg, transparent, rgba(201,160,80,0.015))",
            }}
          >
            <TotalRow label="Subtotal" value={`$${subtotal.toFixed(2)}`} />
            {/* Discount row */}
            {promo && (
              <TotalRow
                label={`Discount (${promo.type === "percent" ? `${promo.value}%` : `$${promo.value}`})`}
                value={`−$${promo.discount.toFixed(2)}`}
                color="#4ADE80"
              />
            )}
            <TotalRow label="Tax (9.5%)" value={`$${tax.toFixed(2)}`} />
            <TotalRow label="Packaging" value={`$${PACKAGING_FEE.toFixed(2)}`} />
            <TotalRow label={`Tip (${showCustomTip ? "Custom" : `${tipOptions[tipIndex].pct}%`})`} value={`$${tipAmount.toFixed(2)}`} highlight />

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
              <span style={{ fontFamily: "var(--font-body)", fontSize: 16, fontWeight: 500, color: "#fff" }}>Total</span>
              <span style={{ fontFamily: "var(--font-accent)", fontSize: 26, fontWeight: 700, color: "#C9A050" }}>
                ${total.toFixed(2)}
              </span>
            </div>

            <Link
              href="/order"
              style={{
                display: "block",
                textAlign: "center",
                marginTop: 16,
                fontFamily: "var(--font-body)",
                fontSize: 11,
                letterSpacing: 1,
                color: "rgba(255,255,255,0.2)",
                textDecoration: "none",
                transition: "color 0.3s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#C9A050")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.2)")}
            >
              ← Edit Order
            </Link>
          </div>
          </div>{/* end summary body wrapper */}
        </aside>
      </div>

      {/* ═══ Fixed bottom Place Order bar (mobile) ═══ */}
      {isTablet && (
        <div
          className="checkout-mobile-bar"
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "16px 20px",
            paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))",
            background: "rgba(8,6,3,0.97)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderTop: "1px solid rgba(183,143,82,0.12)",
            zIndex: 90,
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "rgba(255,255,255,0.3)", fontWeight: 300 }}>
              {totalItems} {totalItems === 1 ? "item" : "items"}
            </div>
            <div style={{ fontFamily: "var(--font-accent)", fontSize: 22, fontWeight: 700, color: "#C9A050" }}>
              ${total.toFixed(2)}
            </div>
          </div>
          <button
            onClick={handlePlaceOrder}
            disabled={loading}
            className="btn-gold-filled"
            style={{
              padding: "16px 28px",
              borderRadius: 12,
              fontSize: 12,
              letterSpacing: 2,
              fontWeight: 800,
              boxShadow: "0 8px 32px rgba(201,160,80,0.25)",
              display: "flex",
              alignItems: "center",
              gap: 10,
              opacity: loading ? 0.6 : 1,
              cursor: loading ? "wait" : "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {loading ? "Placing..." : "Place Order"}
          </button>
        </div>
      )}

      {/* ═══ Animations + Responsive ═══ */}
      <style>{`
        @keyframes checkoutFadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes checkoutSpin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 900px) {
          .checkout-layout {
            grid-template-columns: 1fr !important;
          }
          .checkout-summary {
            position: relative !important;
            top: auto !important;
            height: auto !important;
            order: -1; /* Move summary above form on mobile */
          }
          .checkout-steps { display: none !important; }
          .checkout-secure { display: none !important; }
          .checkout-back-text { display: none; }
          .checkout-express-grid {
            grid-template-columns: 1fr !important;
          }
          .checkout-tip-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }
          .checkout-field-row {
            grid-template-columns: 1fr !important;
          }
          .checkout-place-order-desktop {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Sub-components
   ═══════════════════════════════════════════ */

/* ── Form Section wrapper ── */
function FormSection({ label, delay, children }: { label: string; delay: number; children: React.ReactNode }) {
  return (
    <div
      style={{
        marginBottom: 40,
        animation: "checkoutFadeUp 0.5s ease both",
        animationDelay: `${0.05 + delay * 0.07}s`,
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-body)",
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: 3,
          textTransform: "uppercase",
          color: "#C9A050",
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        {label}
        <span style={{ flex: 1, height: 1, background: "linear-gradient(90deg, rgba(201,160,80,0.12), transparent)" }} />
      </div>
      {children}
    </div>
  );
}

/* ── Input Field ── */
function Field({
  label,
  placeholder,
  type = "text",
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  type?: string;
  value?: string;
  onChange?: (val: string) => void;
}) {
  return (
    <div>
      <label
        style={{
          display: "block",
          fontFamily: "var(--font-body)",
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: 0.5,
          color: "rgba(255,255,255,0.45)",
          marginBottom: 8,
        }}
      >
        {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        style={{
          width: "100%",
          padding: "14px 16px",
          background: "rgb(var(--bg-tertiary))",
          border: "1px solid rgba(255,255,255,0.05)",
          borderRadius: 10,
          fontFamily: "var(--font-body)",
          fontSize: 16,
          color: "#fff",
          outline: "none",
          transition: "border-color 0.3s, box-shadow 0.3s",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "rgba(183,143,82,0.25)";
          e.currentTarget.style.boxShadow = "0 0 24px rgba(201,160,80,0.04)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)";
          e.currentTarget.style.boxShadow = "none";
        }}
      />
    </div>
  );
}

/* ── Express Pay Button ── */
function ExpressButton({ label, icon }: { label: string; icon: "apple" | "google" }) {
  return (
    <button
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        padding: 16,
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.05)",
        background: "rgb(var(--bg-secondary))",
        cursor: "pointer",
        transition: "all 0.3s",
        fontFamily: "var(--font-body)",
        fontSize: 14,
        fontWeight: 600,
        color: "#fff",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgba(183,143,82,0.2)";
        e.currentTarget.style.background = "rgb(var(--bg-elevated))";
        e.currentTarget.style.transform = "translateY(-1px)";
        e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.3)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)";
        e.currentTarget.style.background = "rgb(var(--bg-secondary))";
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {icon === "apple" ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff">
          <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
        </svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
      )}
      {label}
    </button>
  );
}

/* ── Card brand icon ── */
function CardIcon({ label }: { label: string }) {
  return (
    <div
      style={{
        width: 32,
        height: 20,
        borderRadius: 3,
        background: "rgba(255,255,255,0.08)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 8,
        fontWeight: 700,
        fontFamily: "var(--font-body)",
        color: "rgba(255,255,255,0.45)",
        letterSpacing: 0.5,
      }}
    >
      {label}
    </div>
  );
}

/* ── Total row ── */
function TotalRow({ label, value, highlight, color }: { label: string; value: string; highlight?: boolean; color?: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        marginBottom: 8,
        fontFamily: "var(--font-body)",
        fontSize: 13,
        color: color || "rgba(255,255,255,0.4)",
        fontWeight: 300,
      }}
    >
      <span>{label}</span>
      <span style={{ color: color || (highlight ? "#E8D5A3" : "#fff"), fontWeight: 500 }}>{value}</span>
    </div>
  );
}

/* ── Step indicator helpers ── */
function stepDotStyle(state: "done" | "active" | "pending"): React.CSSProperties {
  const base: React.CSSProperties = {
    width: 24,
    height: 24,
    borderRadius: "50%",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 11,
    fontWeight: 700,
    fontFamily: "var(--font-body)",
    transition: "all 0.3s",
  };
  if (state === "done") return { ...base, background: "rgba(201,160,80,0.12)", color: "#C9A050", border: "1px solid rgba(201,160,80,0.25)" };
  if (state === "active") return { ...base, background: "#C9A050", color: "#080603", border: "1px solid #C9A050", boxShadow: "0 0 16px rgba(201,160,80,0.2)" };
  return { ...base, background: "transparent", color: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.05)" };
}

function stepLineStyle(done: boolean): React.CSSProperties {
  return {
    width: 32,
    height: 1,
    background: done ? "rgba(201,160,80,0.25)" : "rgba(255,255,255,0.05)",
    display: "inline-block",
  };
}