"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

export interface CartItem {
  name: string;
  price: number;
  img: string;
  categoryKey: string;
  desc?: string;
  qty: number;
}

export interface PromoState {
  code: string;
  type: "percent" | "fixed";
  value: number;
  discount: number; // calculated dollar amount off
}

interface CartContextValue {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "qty">) => void;
  updateQty: (name: string, categoryKey: string, qty: number) => void;
  removeItem: (name: string, categoryKey: string) => void;
  clearCart: () => void;
  promo: PromoState | null;
  promoLoading: boolean;
  promoError: string;
  applyPromo: (code: string, subtotal: number) => Promise<boolean>;
  removePromo: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [promo, setPromo] = useState<PromoState | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState("");

  const addItem = useCallback((item: Omit<CartItem, "qty">) => {
    setItems((prev) => {
      const existing = prev.find(
        (i) => i.name === item.name && i.categoryKey === item.categoryKey
      );
      if (existing) {
        return prev.map((i) =>
          i.name === item.name && i.categoryKey === item.categoryKey
            ? { ...i, qty: i.qty + 1 }
            : i
        );
      }
      return [...prev, { ...item, qty: 1 }];
    });
  }, []);

  const updateQty = useCallback(
    (name: string, categoryKey: string, qty: number) => {
      if (qty <= 0) {
        setItems((prev) =>
          prev.filter(
            (i) => !(i.name === name && i.categoryKey === categoryKey)
          )
        );
        return;
      }
      setItems((prev) =>
        prev.map((i) =>
          i.name === name && i.categoryKey === categoryKey
            ? { ...i, qty }
            : i
        )
      );
    },
    []
  );

  const removeItem = useCallback((name: string, categoryKey: string) => {
    setItems((prev) =>
      prev.filter(
        (i) => !(i.name === name && i.categoryKey === categoryKey)
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setPromo(null);
    setPromoError("");
  }, []);

  /* ── Apply promo code: validate against Firestore promoCodes collection ── */
  const applyPromo = useCallback(
    async (code: string, subtotal: number): Promise<boolean> => {
      const trimmed = code.trim().toUpperCase();
      if (!trimmed) {
        setPromoError("Enter a promo code");
        return false;
      }

      setPromoLoading(true);
      setPromoError("");

      try {
        // Query Firestore for the promo code
        const q = query(
          collection(db, "promoCodes"),
          where("code", "==", trimmed)
        );
        const snap = await getDocs(q);

        if (snap.empty) {
          setPromoError("Invalid promo code");
          setPromoLoading(false);
          return false;
        }

        const promoDoc = snap.docs[0];
        const data = promoDoc.data();

        // Check if active
        if (!data.active) {
          setPromoError("This promo code is no longer active");
          setPromoLoading(false);
          return false;
        }

        // Check expiry
        if (data.expiresAt && new Date(data.expiresAt) < new Date()) {
          setPromoError("This promo code has expired");
          setPromoLoading(false);
          return false;
        }

        // Check usage limit
        if (
          data.usageLimit !== null &&
          data.usageCount >= data.usageLimit
        ) {
          setPromoError("This promo code has reached its usage limit");
          setPromoLoading(false);
          return false;
        }

        // Check minimum order
        if (data.minOrder && subtotal < data.minOrder) {
          setPromoError(
            `Minimum order of $${data.minOrder} required`
          );
          setPromoLoading(false);
          return false;
        }

        // Calculate discount
        let discount = 0;
        if (data.type === "percent") {
          discount = subtotal * (data.value / 100);
        } else {
          // fixed
          discount = Math.min(data.value, subtotal); // don't exceed subtotal
        }
        discount = Math.round(discount * 100) / 100; // round to cents

        setPromo({
          code: trimmed,
          type: data.type,
          value: data.value,
          discount,
        });

        setPromoLoading(false);
        return true;
      } catch (err) {
        console.error("Promo validation failed:", err);
        setPromoError("Something went wrong. Try again.");
        setPromoLoading(false);
        return false;
      }
    },
    []
  );

  const removePromo = useCallback(() => {
    setPromo(null);
    setPromoError("");
  }, []);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        updateQty,
        removeItem,
        clearCart,
        promo,
        promoLoading,
        promoError,
        applyPromo,
        removePromo,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return ctx;
}