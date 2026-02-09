"use client";

import { useCart, type CartItem } from "@/components/order/Cartcontext";
import { useScrollY } from "@/hooks/useScrollY";
import Link from "next/link";

export default function OrderHeader() {
  const { items } = useCart();
  const scrollY = useScrollY();
  const scrolled = scrollY > 40;

  const totalItems = items.reduce((sum: number, i: CartItem) => sum + i.qty, 0);

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: scrolled ? "rgba(8,6,3,0.96)" : "rgba(8,6,3,0.88)",
        backdropFilter: "blur(24px) saturate(1.4)",
        borderBottom: `1px solid rgba(183,143,82,${scrolled ? 0.12 : 0.06})`,
        transition: "all 0.5s cubic-bezier(0.22,1,0.36,1)",
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingLeft: "env(safe-area-inset-left)",
        paddingRight: "env(safe-area-inset-right)",
      }}
    >
      <div
        className="order-header-inner"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "clamp(60px, 8vw, 76px)",
          maxWidth: 1440,
          margin: "0 auto",
          padding: "0 clamp(12px, 3vw, 48px)",
        }}
      >
        {/* ── Left: Logo + Back ── */}
        <div style={{ display: "flex", alignItems: "center", gap: "clamp(14px, 3vw, 32px)" }}>
          {/* Logo */}
          <Link
            href="/"
            style={{
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "clamp(8px, 1.5vw, 12px)",
            }}
          >
            <div
              style={{
                width: "clamp(26px, 3.5vw, 32px)",
                height: "clamp(26px, 3.5vw, 32px)",
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
                  fontSize: "clamp(11px, 1.5vw, 14px)",
                  color: "#C9A050",
                  fontWeight: 700,
                }}
              >
                N
              </span>
            </div>
            <div className="order-logo-text">
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(12px, 1.8vw, 16px)",
                  fontWeight: 700,
                  color: "#fff",
                  letterSpacing: "clamp(1.5px, 0.3vw, 2.5px)",
                  display: "block",
                  lineHeight: 1,
                }}
              >
                NEW YORK NOOK
              </span>
              <span
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 7,
                  fontWeight: 400,
                  letterSpacing: 3.5,
                  color: "rgba(183,143,82,0.6)",
                  textTransform: "uppercase",
                }}
              >
                Fine Russian Cuisine
              </span>
            </div>
          </Link>

          {/* Back link — arrow always visible, text hides on mobile */}
          <Link
            href="/"
            aria-label="Back to home"
            className="order-back-link"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontFamily: "var(--font-body)",
              fontSize: 11,
              fontWeight: 400,
              letterSpacing: 2,
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.45)",
              textDecoration: "none",
              transition: "color 0.3s",
              minHeight: 44,
              minWidth: 44,
              justifyContent: "center",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.color = "#C9A050")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.color =
                "rgba(255,255,255,0.45)")
            }
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M19 12H5m0 0l7 7m-7-7l7-7" />
            </svg>
            <span className="order-back-text">Back to Menu</span>
          </Link>
        </div>

        {/* ── Right: Pickup badge + Cart ── */}
        <div style={{ display: "flex", alignItems: "center", gap: "clamp(8px, 1.5vw, 16px)" }}>
          {/* Pickup badge — desktop only */}
          <div
            className="order-pickup-badge"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "9px clamp(12px, 1.8vw, 18px)",
              background: "rgba(201,160,80,0.05)",
              border: "1px solid rgba(201,160,80,0.12)",
              borderRadius: 40,
              fontSize: "clamp(10px, 1.3vw, 12px)",
              fontFamily: "var(--font-body)",
              color: "rgba(255,255,255,0.5)",
              letterSpacing: 0.5,
              whiteSpace: "nowrap",
            }}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#C9A050"
              strokeWidth="1.5"
            >
              <path d="M12 6v6l4 2" />
              <circle cx="12" cy="12" r="10" />
            </svg>
            Pickup in{" "}
            <span style={{ color: "#E8D5A3", fontWeight: 600 }}>25–35 min</span>
          </div>

          {/* Desktop cart button — hidden on mobile */}
          <button
            className="order-cart-btn-desktop"
            aria-label={`View order, ${totalItems} items`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "clamp(6px, 1vw, 10px)",
              padding: "clamp(9px, 1.2vw, 11px) clamp(14px, 2.5vw, 24px)",
              background: "linear-gradient(135deg, #C9A050, #B8903E)",
              border: "none",
              borderRadius: 40,
              fontFamily: "var(--font-body)",
              fontSize: "clamp(10px, 1.2vw, 11px)",
              fontWeight: 700,
              letterSpacing: 1.5,
              textTransform: "uppercase",
              color: "rgb(var(--bg-primary))",
              cursor: "pointer",
              transition: "all 0.35s cubic-bezier(0.16,1,0.3,1)",
              boxShadow: "0 4px 20px rgba(201,160,80,0.25)",
              minHeight: 44,
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow =
                "0 8px 30px rgba(201,160,80,0.35)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow =
                "0 4px 20px rgba(201,160,80,0.25)";
            }}
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
            <span>View Order</span>
            {totalItems > 0 && (
              <span
                style={{
                  background: "rgb(var(--bg-primary))",
                  color: "#C9A050",
                  fontSize: 11,
                  fontWeight: 800,
                  minWidth: 22,
                  height: 22,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0 4px",
                }}
              >
                {totalItems}
              </span>
            )}
          </button>

          {/* Mobile cart icon button — visible only on mobile */}
          <button
            className="order-cart-btn-mobile"
            aria-label={`View cart, ${totalItems} items`}
            onClick={() => window.dispatchEvent(new CustomEvent("open-cart-sheet"))}
            style={{
              display: "none", /* shown via media query */
              position: "relative",
              width: 44,
              height: 44,
              borderRadius: 12,
              border: "1px solid rgba(201,160,80,0.25)",
              background: "rgba(201,160,80,0.06)",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(201,160,80,0.7)" strokeWidth="1.5">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
            {totalItems > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: -4,
                  right: -4,
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: "#C9A050",
                  color: "#080603",
                  fontSize: 10,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "var(--font-body)",
                }}
              >
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Responsive ── */}
      <style>{`
        /* Mobile: compact header 56px */
        @media (max-width: 900px) {
          .order-header-inner {
            height: 56px !important;
          }
          .order-pickup-badge {
            display: none !important;
          }
          .order-cart-btn-desktop {
            display: none !important;
          }
          .order-cart-btn-mobile {
            display: flex !important;
          }
        }

        @media (max-width: 600px) {
          .order-back-text {
            display: none;
          }
          .order-logo-text {
            display: none;
          }
        }

        @media (min-width: 601px) and (max-width: 900px) {
          .order-back-text {
            display: none;
          }
        }

        @media (hover: none) and (pointer: coarse) {
          .order-cart-btn-mobile:active {
            background: rgba(201,160,80,0.15) !important;
          }
        }
      `}</style>
    </header>
  );
}