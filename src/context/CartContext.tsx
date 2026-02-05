"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-client";

export type CartItem = {
  id: string;
  kind: "RECIPE" | "INGREDIENT";
  title: string;
  qty: number;
  priceRsd: number;
  image?: string;
};

type CartCtx = {
  items: CartItem[];
  totalItems: number;
  totalPriceRsd: number;

  addToCart: (item: Omit<CartItem, "qty">, qty?: number) => void;
  removeFromCart: (id: string, kind: CartItem["kind"]) => void;
  setQty: (id: string, kind: CartItem["kind"], qty: number) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartCtx | null>(null);

function readStorage(key: string): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((x: any) => x && typeof x.id === "string")
      .map((x: any): CartItem => ({
        id: String(x.id),
        kind: x.kind === "RECIPE" ? "RECIPE" : "INGREDIENT",
        title: String(x.title ?? ""),
        qty: Number(x.qty ?? 1),
        priceRsd: Number(x.priceRsd ?? x.price ?? 0),
        image: x.image ? String(x.image) : undefined,
      }));
  } catch {
    return [];
  }
}

function writeStorage(key: string, items: CartItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch {}
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  let auth: ReturnType<typeof useAuth> | null = null;
  try {
    auth = useAuth();
  } catch {
    auth = null;
  }

  const userId = auth?.user?.id ?? null;
  const storageKey = userId ? `cart:user:${userId}` : "cart:guest";

  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    setItems(readStorage(storageKey));
  }, [storageKey]);

  useEffect(() => {
    writeStorage(storageKey, items);
  }, [storageKey, items]);

  const addToCart: CartCtx["addToCart"] = (item, qty = 1) => {
    const addQty = Math.max(1, Number(qty) || 1);

    setItems((prev) => {
      const idx = prev.findIndex((p) => p.id === item.id && p.kind === item.kind);
      if (idx === -1) return [...prev, { ...item, qty: addQty }];

      const next = [...prev];
      next[idx] = { ...next[idx], qty: next[idx].qty + addQty };
      return next;
    });
  };

  const removeFromCart: CartCtx["removeFromCart"] = (id, kind) => {
    setItems((prev) => prev.filter((p) => !(p.id === id && p.kind === kind)));
  };

  const setQty: CartCtx["setQty"] = (id, kind, qty) => {
    const q = Math.max(1, Number(qty) || 1);
    setItems((prev) =>
      prev.map((p) => (p.id === id && p.kind === kind ? { ...p, qty: q } : p))
    );
  };

  const clearCart = () => setItems([]);

  const totalItems = useMemo(
    () => items.reduce((sum, it) => sum + (it.qty || 0), 0),
    [items]
  );

  const totalPriceRsd = useMemo(
    () => items.reduce((sum, it) => sum + (Number(it.priceRsd) || 0) * (Number(it.qty) || 0), 0),
    [items]
  );

  const value: CartCtx = {
    items,
    totalItems,
    totalPriceRsd,
    addToCart,
    removeFromCart,
    setQty,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart mora biti korišćen unutar <CartProvider>");
  return ctx;
}