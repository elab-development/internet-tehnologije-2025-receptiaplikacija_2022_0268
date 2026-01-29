"use client";

import { useCart } from "@/context/CartContext";

type Props = {
  id: string;
  title: string;
};

export default function IngredientQty({ id, title }: Props) {
  const { items, addToCart, setQty, removeFromCart } = useCart();

  const inCart = items.find((x) => x.id === id);
  const qty = inCart?.qty ?? 0;

  const plus = () => {
    addToCart({ id, kind: "INGREDIENT", title, price: 0 }, 1);
  };

  const minus = () => {
    if (qty <= 1) {
      removeFromCart(id); // kad padne na 0 -> izbaci
    } else {
      setQty(id, qty - 1);
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