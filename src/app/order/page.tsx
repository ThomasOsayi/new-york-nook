"use client";

import { CartProvider } from "@/components/order/Cartcontext";
import OrderHeader from "@/components/order/OrderHeader";
import OrderHero from "@/components/order/OrderHero";
import Menubrowser from "@/components/order/Menubrowser";
import CartSidebar from "@/components/order/CartSidebar";

export default function OrderPage() {
  return (
    <CartProvider>
      <div style={{ background: "rgb(var(--bg-primary))", minHeight: "100vh", overflow: "hidden" }}>
        <OrderHeader />
        <OrderHero />

        {/* ── Two-column layout: menu + cart ── */}
        <div
          className="order-layout"
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) 380px",
            maxWidth: "100vw",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <Menubrowser />
          <CartSidebar />
        </div>
      </div>

      {/* ── Responsive override ── */}
      <style>{`
        @media (max-width: 900px) {
          .order-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </CartProvider>
  );
}