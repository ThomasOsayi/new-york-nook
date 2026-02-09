"use client";

import OrderHeader from "@/components/order/OrderHeader";
import OrderHero from "@/components/order/OrderHero";
import Menubrowser from "@/components/order/Menubrowser";
import CartSidebar from "@/components/order/CartSidebar";

export default function OrderPage() {
  return (
    <div style={{ background: "rgb(var(--bg-primary))", minHeight: "100vh", overflowX: "clip" }}>
      <OrderHeader />
      <OrderHero />

      <div
        className="order-layout"
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) 380px",
          maxWidth: "100vw",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Menubrowser />
        <CartSidebar />
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .order-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}