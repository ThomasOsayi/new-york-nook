"use client";

import { createContext, useContext, useState, useCallback } from "react";

export interface CartItem {
  name: string;
  price: number;
  img: string;
  categoryKey: string;
  desc?: string;
  qty: number;
}

interface CartContextValue {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "qty">) => void;
  updateQty: (name: string, categoryKey: string, qty: number) => void;
  removeItem: (name: string, categoryKey: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

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

  const updateQty = useCallback((name: string, categoryKey: string, qty: number) => {
    if (qty <= 0) {
      setItems((prev) =>
        prev.filter((i) => !(i.name === name && i.categoryKey === categoryKey))
      );
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        i.name === name && i.categoryKey === categoryKey ? { ...i, qty } : i
      )
    );
  }, []);

  const removeItem = useCallback((name: string, categoryKey: string) => {
    setItems((prev) =>
      prev.filter((i) => !(i.name === name && i.categoryKey === categoryKey))
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  return (
    <CartContext.Provider value={{ items, addItem, updateQty, removeItem, clearCart }}>
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