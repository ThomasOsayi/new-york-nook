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
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 76,
          maxWidth: 1440,
          margin: "0 auto",
          padding: "0 clamp(20px,4vw,48px)",
        }}
      >
        {/* ── Left: Logo + Back ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          {/* Logo */}
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 12 }}>
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
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#fff",
                  letterSpacing: 2.5,
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

          {/* Back link */}
          <Link
            href="/"
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
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#C9A050")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.45)")}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M19 12H5m0 0l7 7m-7-7l7-7" />
            </svg>
            <span className="order-back-text">Back to Menu</span>
          </Link>
        </div>

        {/* ── Right: Pickup badge + Cart ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* Pickup badge */}
          <div
            className="order-pickup-badge"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "9px 18px",
              background: "rgba(201,160,80,0.05)",
              border: "1px solid rgba(201,160,80,0.12)",
              borderRadius: 40,
              fontSize: 12,
              fontFamily: "var(--font-body)",
              color: "rgba(255,255,255,0.5)",
              letterSpacing: 0.5,
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#C9A050" strokeWidth="1.5">
              <path d="M12 6v6l4 2" />
              <circle cx="12" cy="12" r="10" />
            </svg>
            Pickup in{" "}
            <span style={{ color: "#E8D5A3", fontWeight: 600 }}>25–35 min</span>
          </div>

          {/* Cart button */}
          <button
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "11px 24px",
              background: "linear-gradient(135deg, #C9A050, #B8903E)",
              border: "none",
              borderRadius: 40,
              fontFamily: "var(--font-body)",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 1.5,
              textTransform: "uppercase",
              color: "rgb(var(--bg-primary))",
              cursor: "pointer",
              transition: "all 0.35s cubic-bezier(0.16,1,0.3,1)",
              boxShadow: "0 4px 20px rgba(201,160,80,0.25)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 8px 30px rgba(201,160,80,0.35)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 20px rgba(201,160,80,0.25)";
            }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
            View Order
            {totalItems > 0 && (
              <span
                style={{
                  background: "rgb(var(--bg-primary))",
                  color: "#C9A050",
                  fontSize: 11,
                  fontWeight: 800,
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
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
        @media (max-width: 600px) {
          .order-back-text { display: none; }
          .order-pickup-badge { display: none !important; }
        }
      `}</style>
    </header>
  );
}