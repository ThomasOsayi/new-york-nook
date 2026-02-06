"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getOrder, type OrderData, type OrderItem } from "@/lib/order";
import { useScrollY } from "@/hooks/useScrollY";
import { categories } from "@/data/menu";

/* ── Category label lookup ── */
const catLabelMap: Record<string, string> = {};
categories.forEach((c) => { catLabelMap[c.key] = c.label; });

/* ══════════════════════════════════════════
   Confirmation Page
   ══════════════════════════════════════════ */
export default function ConfirmationPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("id");
  const orderNumber = searchParams.get("order");
  const scrollY = useScrollY();
  const scrolled = scrollY > 10;

  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!orderId) { setError(true); setLoading(false); return; }
    getOrder(orderId)
      .then((data: OrderData | null) => {
        if (!data) setError(true);
        else setOrder(data);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [orderId]);

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
          height: 76,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 clamp(20px,4vw,48px)",
          transition: "all 0.4s ease",
        }}
      >
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

        {/* Step indicator — all done */}
        <div className="confirm-steps" style={{ display: "flex", alignItems: "center", gap: 12, fontFamily: "var(--font-body)", fontSize: 11, letterSpacing: 1, color: "rgba(255,255,255,0.2)" }}>
          <span style={stepDot("done")}>✓</span>
          <span style={{ color: "rgba(201,160,80,0.4)" }}>Menu</span>
          <span style={stepLine(true)} />
          <span style={stepDot("done")}>✓</span>
          <span style={{ color: "rgba(201,160,80,0.4)" }}>Checkout</span>
          <span style={stepLine(true)} />
          <span style={stepDot("active")}>3</span>
          <span style={{ color: "#C9A050" }}>Confirmed</span>
        </div>

        <div style={{ width: 120 }} />
      </header>

      {/* ═══ Content ═══ */}
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "60px clamp(20px,4vw,40px) 100px" }}>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", paddingTop: 80 }}>
            <span
              style={{
                display: "inline-block",
                width: 32,
                height: 32,
                border: "2px solid rgba(201,160,80,0.15)",
                borderTopColor: "#C9A050",
                borderRadius: "50%",
                animation: "confirmSpin 0.6s linear infinite",
              }}
            />
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div style={{ textAlign: "center", paddingTop: 80 }}>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 16, color: "rgba(255,255,255,0.4)" }}>
              Order not found.
            </p>
            <Link
              href="/order"
              className="btn-gold-filled"
              style={{
                display: "inline-block",
                marginTop: 24,
                padding: "14px 32px",
                borderRadius: 10,
                fontSize: 12,
                letterSpacing: 2,
                textDecoration: "none",
              }}
            >
              Back to Menu
            </Link>
          </div>
        )}

        {/* Success */}
        {!loading && order && (
          <>
            {/* ── Animated checkmark ── */}
            <div
              style={{
                textAlign: "center",
                marginBottom: 40,
                animation: "confirmFadeUp 0.6s ease both",
              }}
            >
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  background: "rgba(106,158,108,0.08)",
                  border: "2px solid rgba(106,158,108,0.25)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 28,
                  animation: "confirmPop 0.5s cubic-bezier(0.16,1,0.3,1) 0.2s both",
                }}
              >
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#6A9E6C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" style={{ strokeDasharray: 30, strokeDashoffset: 30, animation: "confirmCheck 0.4s ease 0.5s forwards" }} />
                </svg>
              </div>

              <h1
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 34,
                  fontWeight: 400,
                  color: "#fff",
                  marginBottom: 8,
                }}
              >
                Order Confirmed
              </h1>
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 14,
                  color: "rgba(255,255,255,0.3)",
                  fontWeight: 300,
                  lineHeight: 1.6,
                }}
              >
                Thank you, {order.firstName}! Your order has been received.
              </p>
            </div>

            {/* ── Order number + pickup card ── */}
            <div
              style={{
                background: "rgb(var(--bg-secondary))",
                border: "1px solid rgba(255,255,255,0.04)",
                borderRadius: 16,
                padding: 28,
                marginBottom: 24,
                animation: "confirmFadeUp 0.6s ease 0.15s both",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
                <div>
                  <div style={{ fontFamily: "var(--font-body)", fontSize: 10, fontWeight: 600, letterSpacing: 3, textTransform: "uppercase", color: "rgba(255,255,255,0.2)", marginBottom: 6 }}>
                    Order Number
                  </div>
                  <div style={{ fontFamily: "var(--font-accent)", fontSize: 22, fontWeight: 700, color: "#C9A050", letterSpacing: 1 }}>
                    {orderNumber || order.orderNumber}
                  </div>
                </div>
                <div
                  style={{
                    padding: "8px 16px",
                    background: "rgba(201,160,80,0.08)",
                    border: "1px solid rgba(201,160,80,0.15)",
                    borderRadius: 40,
                    fontFamily: "var(--font-body)",
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#C9A050",
                    letterSpacing: 1,
                    textTransform: "uppercase",
                  }}
                >
                  {order.status === "pending" ? "Pending" : order.status}
                </div>
              </div>

              {/* Pickup details */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 20,
                  padding: "20px 0 0",
                  borderTop: "1px solid rgba(255,255,255,0.04)",
                }}
              >
                <div>
                  <div style={{ fontFamily: "var(--font-body)", fontSize: 10, fontWeight: 600, letterSpacing: 2.5, textTransform: "uppercase", color: "rgba(255,255,255,0.2)", marginBottom: 8 }}>
                    Pickup Time
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C9A050" strokeWidth="1.5">
                      <path d="M12 6v6l4 2" />
                      <circle cx="12" cy="12" r="10" />
                    </svg>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 500, color: "#fff" }}>
                      {order.pickupTime}
                    </span>
                  </div>
                </div>
                <div>
                  <div style={{ fontFamily: "var(--font-body)", fontSize: 10, fontWeight: 600, letterSpacing: 2.5, textTransform: "uppercase", color: "rgba(255,255,255,0.2)", marginBottom: 8 }}>
                    Location
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C9A050" strokeWidth="1.5">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 500, color: "#fff" }}>
                      7065 Sunset Blvd
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Items ── */}
            <div
              style={{
                background: "rgb(var(--bg-secondary))",
                border: "1px solid rgba(255,255,255,0.04)",
                borderRadius: 16,
                overflow: "hidden",
                marginBottom: 24,
                animation: "confirmFadeUp 0.6s ease 0.25s both",
              }}
            >
              <div style={{ padding: "20px 28px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <span style={{ fontFamily: "var(--font-body)", fontSize: 10, fontWeight: 600, letterSpacing: 3, textTransform: "uppercase", color: "rgba(255,255,255,0.2)" }}>
                  Items Ordered
                </span>
              </div>
              {order.items.map((item: OrderItem, idx: number) => (
                <div
                  key={idx}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "44px 1fr auto",
                    gap: 14,
                    alignItems: "center",
                    padding: "14px 28px",
                    borderBottom: idx < order.items.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 8,
                      overflow: "hidden",
                      border: "1px solid rgba(255,255,255,0.06)",
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
              ))}
            </div>

            {/* ── Totals ── */}
            <div
              style={{
                background: "rgb(var(--bg-secondary))",
                border: "1px solid rgba(255,255,255,0.04)",
                borderRadius: 16,
                padding: 28,
                marginBottom: 40,
                animation: "confirmFadeUp 0.6s ease 0.35s both",
              }}
            >
              <Row label="Subtotal" value={`$${order.subtotal.toFixed(2)}`} />
              <Row label="Tax (9.5%)" value={`$${order.tax.toFixed(2)}`} />
              <Row label="Packaging" value={`$${order.packagingFee.toFixed(2)}`} />
              <Row label="Tip" value={`$${order.tip.toFixed(2)}`} highlight />
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
                <span style={{ fontFamily: "var(--font-body)", fontSize: 16, fontWeight: 500, color: "#fff" }}>
                  Total Paid
                </span>
                <span style={{ fontFamily: "var(--font-accent)", fontSize: 26, fontWeight: 700, color: "#C9A050" }}>
                  ${order.total.toFixed(2)}
                </span>
              </div>
            </div>

            {/* ── Confirmation email note ── */}
            <div
              style={{
                textAlign: "center",
                marginBottom: 32,
                animation: "confirmFadeUp 0.6s ease 0.45s both",
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 24px",
                  background: "rgba(201,160,80,0.04)",
                  border: "1px solid rgba(201,160,80,0.08)",
                  borderRadius: 40,
                  fontFamily: "var(--font-body)",
                  fontSize: 12,
                  color: "rgba(255,255,255,0.4)",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C9A050" strokeWidth="1.5">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M22 4L12 13 2 4" />
                </svg>
                Confirmation sent to <span style={{ color: "#fff", fontWeight: 500 }}>{order.email}</span>
              </div>
            </div>

            {/* ── Actions ── */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 16,
                animation: "confirmFadeUp 0.6s ease 0.5s both",
              }}
              className="confirm-actions"
            >
              <Link
                href="/order"
                className="btn-gold-filled"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "16px 32px",
                  borderRadius: 12,
                  fontSize: 12,
                  letterSpacing: 2,
                  fontWeight: 700,
                  textDecoration: "none",
                  boxShadow: "0 8px 32px rgba(201,160,80,0.2)",
                  transition: "all 0.35s cubic-bezier(0.16,1,0.3,1)",
                }}
              >
                Order Again
              </Link>
              <Link
                href="/"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "16px 32px",
                  borderRadius: 12,
                  fontSize: 12,
                  letterSpacing: 2,
                  fontWeight: 600,
                  fontFamily: "var(--font-body)",
                  textTransform: "uppercase",
                  textDecoration: "none",
                  color: "rgba(255,255,255,0.4)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  background: "transparent",
                  transition: "all 0.3s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(183,143,82,0.2)";
                  e.currentTarget.style.color = "#C9A050";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                  e.currentTarget.style.color = "rgba(255,255,255,0.4)";
                }}
              >
                Back Home
              </Link>
            </div>
          </>
        )}
      </div>

      {/* ═══ Animations + Responsive ═══ */}
      <style>{`
        @keyframes confirmFadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes confirmPop {
          from { opacity: 0; transform: scale(0.6); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes confirmCheck {
          to { stroke-dashoffset: 0; }
        }
        @keyframes confirmSpin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 600px) {
          .confirm-steps { display: none !important; }
          .confirm-actions {
            flex-direction: column !important;
            align-items: stretch !important;
          }
          .confirm-actions a {
            justify-content: center !important;
          }
        }
      `}</style>
    </div>
  );
}

/* ── Helpers ── */

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        marginBottom: 8,
        fontFamily: "var(--font-body)",
        fontSize: 13,
        color: "rgba(255,255,255,0.4)",
        fontWeight: 300,
      }}
    >
      <span>{label}</span>
      <span style={{ color: highlight ? "#E8D5A3" : "#fff", fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function stepDot(state: "done" | "active"): React.CSSProperties {
  const base: React.CSSProperties = {
    width: 24, height: 24, borderRadius: "50%",
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    fontSize: 11, fontWeight: 700, fontFamily: "var(--font-body)",
  };
  if (state === "done") return { ...base, background: "rgba(201,160,80,0.12)", color: "#C9A050", border: "1px solid rgba(201,160,80,0.25)" };
  return { ...base, background: "#C9A050", color: "#080603", border: "1px solid #C9A050", boxShadow: "0 0 16px rgba(201,160,80,0.2)" };
}

function stepLine(done: boolean): React.CSSProperties {
  return { width: 32, height: 1, background: done ? "rgba(201,160,80,0.25)" : "rgba(255,255,255,0.05)", display: "inline-block" };
}