"use client";

import { CartProvider } from "@/components/order/Cartcontext";

export default function OrderLayout({ children }: { children: React.ReactNode }) {
  return <CartProvider>{children}</CartProvider>;
}