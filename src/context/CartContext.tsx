"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Recipe } from "@/lib/recipes";

type CartItem = {
  recipe: Recipe;
  qty: number;
};

type CartContextValue = {
  items: CartItem[];
  addToCart: (recipe: Recipe) => void;
  removeFromCart: (id: string) => void;
  increase: (id: string) => void;
  decrease: (id: string) => void;
  clearCart: () => void;
  totalItems: number;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  // 1) Učitaj iz localStorage kad se app startuje
  useEffect(() => {
    try {
      const raw = localStorage.getItem("cart");
      if (!raw) return;
  
      const parsed = JSON.parse(raw);
  
      if (Array.isArray(parsed)) {
        setItems(parsed);
      } else {
        localStorage.removeItem("cart");
        setItems([]);
      }
    } catch {
      localStorage.removeItem("cart");
      setItems([]);
    }
  }, []);
  

  // 2) Snimi u localStorage kad se items promene
  useEffect(() => {
    console.log("✅ SAVING TO localStorage cart =", items);
    localStorage.setItem("cart", JSON.stringify(items));
  }, [items]);
  

  const addToCart = (recipe: Recipe) => {
    console.log("✅ addToCart CALLED, recipe.id =", recipe?.id);
  
    setItems((prev) => {
      const existing = prev.find((i) => i.recipe.id === recipe.id);
      const next = existing
        ? prev.map((i) =>
            i.recipe.id === recipe.id ? { ...i, qty: i.qty + 1 } : i
          )
        : [...prev, { recipe, qty: 1 }];
  
      console.log("✅ CART NEXT =", next);
      return next;
    });
  };
  
  const removeFromCart = (id: string) => {
    setItems((prev) => prev.filter((i) => i.recipe.id !== id));
  };

  const increase = (id: string) => {
    setItems((prev) =>
      prev.map((i) => (i.recipe.id === id ? { ...i, qty: i.qty + 1 } : i))
    );
  };

  const decrease = (id: string) => {
    setItems((prev) =>
      prev
        .map((i) => (i.recipe.id === id ? { ...i, qty: i.qty - 1 } : i))
        .filter((i) => i.qty > 0)
    );
  };

  const clearCart = () => setItems([]);

  const totalItems = useMemo(
    () => items.reduce((sum, i) => sum + i.qty, 0),
    [items]
  );

  const value: CartContextValue = {
    items,
    addToCart,
    removeFromCart,
    increase,
    decrease,
    clearCart,
    totalItems,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
    const ctx = useContext(CartContext);
  
    if (!ctx) {
      throw new Error("useCart must be used within CartProvider");
    }
  
    return ctx;
  }
  
  
  
