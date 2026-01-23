"use client";

import { useCart } from "@/context/CartContext";
import type { Recipe } from "@/lib/recipes";

export default function AddToCartButton({ recipe }: { recipe: Recipe }) {
  const { addToCart, totalItems } = useCart();

  return (
    <button
      onClick={() => {
        console.log("CLICK AddToCartButton", recipe);
        addToCart(recipe);
        console.log("AFTER addToCart, totalItems:", totalItems);
      }}
      className="mt-6 rounded-md border px-4 py-2 hover:bg-gray-50"
    >
      Dodaj u korpu
    </button>
  );
}



