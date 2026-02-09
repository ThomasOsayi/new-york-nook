"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useCart, type CartItem } from "@/components/order/Cartcontext";
import { useScrollY } from "@/hooks/useScrollY";
import { useIsTablet } from "@/hooks/useIsMobile";
import { categories } from "@/data/menu";
import { loadStripe, StripeElementsOptions } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

/* ── Category label lookup ── */
const catLabelMap: Record<string, string> = {};
categories.forEach((c) => { catLabelMap[c.key] = c.label; });

const TAX_RATE = 0.095;
const PACKAGING_FEE = 2;

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

/* ══════════════════════════════════════════
   Payment Form Component (uses Stripe hooks)
   ══════════════════════════════════════════ */
function PaymentForm({
  clientSecret,
  total,
  onSuccess,
}: {
  clientSecret: string;
  total: number;
  onSuccess: (paymentIntentId: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError("");

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/order/confirmation`,
      },
      redirect: "if_required",
    });

    if (result.error) {
      setError(result.error.message || "Payment failed");
      setLoading(false);
    } else {
      // Payment succeeded - get the payment intent ID from the result
      const paymentIntentId = result.paymentIntent?.id;

      if (paymentIntentId) {
        onSuccess(paymentIntentId);
      } else {
        setError("Payment completed but no confirmation received");
        setLoading(false);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Stripe Payment Element */}
      <div
        style={{
          background: "rgb(var(--bg-tertiary))",
          border: "1px solid rgba(255, 255, 255, 0.05)",
          borderRadius: 12,
          padding: 20,
          marginTop: 12,
        }}
      >
        <PaymentElement
          options={{
            layout: "tabs",
            wallets: {
              applePay: "auto",
              googlePay: "auto",
            },
          }}
        />
      </div>

      {/* Security badge */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "12px 18px",
          background: "rgba(106, 158, 108, 0.06)",
          border: "1px solid rgba(106, 158, 108, 0.12)",
          borderRadius: 8,
          fontSize: 11,
          color: "rgba(106, 158, 108, 0.7)",
          marginTop: 12,
          fontFamily: "var(--font-body)",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0110 0v4" />
        </svg>
        Secured by Stripe • Your payment information is encrypted
      </div>

      {/* Error message */}
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
            marginTop: 16,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4m0 4h.01" />
          </svg>
          {error}
        </div>
      )}

      {/* Submit button */}
      <button
        type="submit"
        disabled={!stripe || loading}
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
          opacity: loading || !stripe ? 0.6 : 1,
          cursor: loading || !stripe ? "wait" : "pointer",
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
            Processing...
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
    </form>
  );
}

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

  /* ── Payment Intent state ── */
  const [clientSecret, setClientSecret] = useState("");
  const [paymentIntentId, setPaymentIntentId] = useState("");
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

  /* ── Create Payment Intent when form is ready ── */
  const createPaymentIntent = async () => {
    setError("");

    if (items.length === 0) { setError("Your cart is empty."); return; }
    if (!firstName.trim()) { setError("First name is required."); return; }
    if (!lastName.trim()) { setError("Last name is required."); return; }
    if (!phone.trim()) { setError("Phone number is required."); return; }
    if (!email.trim() || !email.includes("@")) { setError("A valid email is required."); return; }

    setLoading(true);

    try {
      const response = await fetch("/api/create-payment-intent", {
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
          instructions: undefined,
          ...(promo && {
            promoCode: promo.code,
            promoType: promo.type,
            promoValue: promo.value,
          }),
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || "Failed to create payment intent");
      }

      setClientSecret(data.clientSecret);
      setPaymentIntentId(data.paymentIntentId);
      setLoading(false);
    } catch (err: unknown) {
      console.error("Payment intent creation failed:", err);
      const message = err instanceof Error ? err.message : "Unknown error occurred";
      setError(message);
      setLoading(false);
    }
  };

  /* ── Handle successful payment ── */
  const handlePaymentSuccess = async (paymentIntentId: string) => {
    try {
      // Create the order in Firestore directly
      const orderData = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        items: items.map((i) => ({
          name: i.name,
          price: i.price,
          qty: i.qty,
          img: i.img,
          categoryKey: i.categoryKey,
        })),
        subtotal,
        discount,
        tax,
        packagingFee: PACKAGING_FEE,
        tip: tipAmount,
        total,
        pickupTime: "ASAP (25–35 min)",
        instructions: "",
        ...(promo && {
          promoCode: promo.code,
          promoType: promo.type,
          promoValue: promo.value,
        }),
        paymentIntentId: paymentIntentId,
        paymentStatus: "paid",
        status: "pending",
        orderNumber: `NYN-${String(new Date().getMonth() + 1).padStart(2, "0")}${String(new Date().getDate()).padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}`,
        createdAt: new Date(),
      };

      // Save to Firestore
      const { collection, addDoc, doc, updateDoc, increment } = await import("firebase/firestore");
      const { db } = await import("@/lib/firebase");

      await addDoc(collection(db, "orders"), orderData);

      // Increment promo usage if applicable
      if (promo) {
        const promoRef = doc(db, "promoCodes", promo.code);
        await updateDoc(promoRef, { usageCount: increment(1) });
      }

      clearCart();
      router.push(`/order/confirmation?payment_intent=${paymentIntentId}`);
    } catch (err) {
      console.error("Failed to create order:", err);
      setError("Payment succeeded but failed to save order. Please contact support.");
    }
  };

  /* ── Stripe Elements options ── */
  const elementsOptions: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: "night",
      variables: {
        colorPrimary: "#C9A050",
        colorBackground: "#0A0806",
        colorText: "#ffffff",
        colorDanger: "#e07070",
        fontFamily: "DM Sans, sans-serif",
        borderRadius: "10px",
      },
    },
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
                  type="button"
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
                type="button"
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

          {/* ── Payment Method (Embedded Stripe) ── */}
          <FormSection label="Payment Method" delay={3}>
            {!clientSecret ? (
              <>
                {/* Show button to initialize payment */}
                <button
                  onClick={createPaymentIntent}
                  type="button"
                  disabled={loading}
                  className="btn-gold-outline"
                  style={{
                    width: "100%",
                    padding: 18,
                    borderRadius: 12,
                    fontSize: 13,
                    letterSpacing: 2,
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    opacity: loading ? 0.6 : 1,
                    cursor: loading ? "wait" : "pointer",
                  }}
                >
                  {loading ? "Loading payment form..." : "Continue to Payment"}
                </button>
              </>
            ) : (
              <>
                {/* Render Stripe Elements */}
                <Elements stripe={stripePromise} options={elementsOptions}>
                  <PaymentForm
                    clientSecret={clientSecret}
                    total={total}
                    onSuccess={handlePaymentSuccess}
                  />
                </Elements>
              </>
            )}

            {/* Error message */}
            {error && !clientSecret && (
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
                  marginTop: 16,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4m0 4h.01" />
                </svg>
                {error}
              </div>
            )}
          </FormSection>
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
          .checkout-tip-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }
          .checkout-field-row {
            grid-template-columns: 1fr !important;
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