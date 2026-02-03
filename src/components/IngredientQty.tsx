"use client";

import { useCart } from "@/context/CartContext";

type Props = {
  id: string;
  title: string;
  priceRsd: number | null; 
};

export default function IngredientQty({ id, title, priceRsd }: Props) {
  const { items, addToCart, setQty, removeFromCart } = useCart();

  const inCart = items.find((x) => x.id === id && x.kind === "INGREDIENT");
  const qty = inCart?.qty ?? 0;

  const plus = () => {
    addToCart(
      {
        id,
        kind: "INGREDIENT",
        title,
        priceRsd: priceRsd ?? 0, 
      },
      1
    );
  };

  const minus = () => {
    if (qty <= 1) {
      removeFromCart(id, "INGREDIENT");
    } else {
      setQty(id, "INGREDIENT", qty - 1);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={minus}
        disabled={qty === 0}
        className="h-9 w-9 rounded-xl border text-lg disabled:opacity-40"
      >
        −
      </button>

      <span className="min-w-[24px] text-center font-semibold">{qty}</span>

      <button
        type="button"
        onClick={plus}
        className="h-9 w-9 rounded-xl border text-lg hover:bg-gray-50"
      >
        +
      </button>
    </div>
  );
}