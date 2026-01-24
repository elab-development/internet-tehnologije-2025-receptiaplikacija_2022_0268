"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-client";

export type CartItem = {
  id: string; // id proizvoda / recepta
  title: string;
  price: number;
  qty: number;
  image?: string;
};

type CartCtx = {
  items: CartItem[];
  totalItems: number;
  addToCart: (item: Omit<CartItem, "qty">, qty?: number) => void;
  removeFromCart: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartCtx | null>(null);

function readStorage(key: string): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // minimalna validacija
    return parsed
      .filter((x) => x && typeof x.id === "string")
      .map((x) => ({
        id: String(x.id),
        title: String(x.title ?? ""),
        price: Number(x.price ?? 0),
        qty: Number(x.qty ?? 1),
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
  } catch {
    // ignore
  }
}

function mergeItems(a: CartItem[], b: CartItem[]) {
  // spajanje po id, sabira qty
  const map = new Map<string, CartItem>();
  for (const it of a) map.set(it.id, { ...it });
  for (const it of b) {
    const prev = map.get(it.id);
    if (!prev) map.set(it.id, { ...it });
    else map.set(it.id, { ...prev, qty: prev.qty + it.qty });
  }
  return Array.from(map.values());
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  // ✅ auth može biti null (ako provider nije mountovan ili dok se ne učita)
  let auth: ReturnType<typeof useAuth> | null = null;
  try {
    auth = useAuth();
  } catch {
    auth = null;
  }
  const userId = auth?.user?.id ?? null;

  // guest vs user storage key
  const storageKey = userId ? `cart:user:${userId}` : "cart:guest";

  const [items, setItems] = useState<CartItem[]>([]);

  // učitaj korpu kad se promeni storageKey (npr. login/logout)
  useEffect(() => {
    const next = readStorage(storageKey);
    setItems(next);
  }, [storageKey]);

  // opcionalno: kad se user uloguje, spoji guest korpu u user korpu
  useEffect(() => {
    if (!userId) return;

    const guestKey = "cart:guest";
    const guest = readStorage(guestKey);
    if (!guest.length) return;

    const userKey = `cart:user:${userId}`;
    const currentUser = readStorage(userKey);

    const merged = mergeItems(currentUser, guest);
    writeStorage(userKey, merged);
    localStorage.removeItem(guestKey);
    setItems(merged);
  }, [userId]);

  // upis u storage na svaku promenu items
  useEffect(() => {
    writeStorage(storageKey, items);
  }, [storageKey, items]);

  const addToCart: CartCtx["addToCart"] = (item, qty = 1) => {
    const addQty = Math.max(1, qty);
    setItems((prev) => {
      const idx = prev.findIndex((p) => p.id === item.id);
      if (idx === -1) return [...prev, { ...item, qty: addQty }];
      const next = [...prev];
      next[idx] = { ...next[idx], qty: next[idx].qty + addQty };
      return next;
    });
  };

  const removeFromCart: CartCtx["removeFromCart"] = (id) => {
    setItems((prev) => prev.filter((p) => p.id !== id));
  };

  const setQty: CartCtx["setQty"] = (id, qty) => {
    const q = Math.max(1, Number(qty) || 1);
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, qty: q } : p)));
  };

  const clearCart = () => setItems([]);

  const totalItems = useMemo(
    () => items.reduce((sum, it) => sum + (Number(it.qty) || 0), 0),
    [items]
  );

  const value: CartCtx = useMemo(
    () => ({ items, totalItems, addToCart, removeFromCart, setQty, clearCart }),
    [items, totalItems]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
