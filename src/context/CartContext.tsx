"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "@/lib/auth-client";


export type CartItem = {
  id: string;
  kind: "RECIPE" | "INGREDIENT";
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

    return parsed.filter(
      (x) =>
        x &&
        typeof x.id === "string" &&
        (x.kind === "RECIPE" || x.kind === "INGREDIENT")
    );
  } catch {
    return [];
  }
}

function writeStorage(key: string, items: CartItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(items));
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

  /* učitaj korpu */
  useEffect(() => {
    setItems(readStorage(storageKey));
  }, [storageKey]);

  /* snimi korpu */
  useEffect(() => {
    writeStorage(storageKey, items);
  }, [storageKey, items]);



  const addToCart: CartCtx["addToCart"] = (item, qty = 1) => {
    const addQty = Math.max(1, qty);

    setItems((prev) => {
      const idx = prev.findIndex(
        (p) => p.id === item.id && p.kind === item.kind
      );

      if (idx === -1) {
        return [...prev, { ...item, qty: addQty }];
      }

      const next = [...prev];
      next[idx] = {
        ...next[idx],
        qty: next[idx].qty + addQty,
      };

      return next;
    });
  };

  const removeFromCart = (id: string) => {
    setItems((prev) => prev.filter((p) => p.id !== id));
  };

  const setQty = (id: string, qty: number) => {
    const q = Math.max(1, qty);
    setItems((prev) =>
      prev.map((p) => (p.id === id ? { ...p, qty: q } : p))
    );
  };

  const clearCart = () => setItems([]);


  const totalItems = useMemo(
    () => items.reduce((sum, it) => sum + it.qty, 0),
    [items]
  );

  const value: CartCtx = {
    items,
    totalItems,
    addToCart,
    removeFromCart,
    setQty,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}


export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart mora biti korišćen unutar <CartProvider>");
  }
  return ctx;
}