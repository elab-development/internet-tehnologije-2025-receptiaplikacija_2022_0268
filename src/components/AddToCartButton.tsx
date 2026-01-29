"use client";

import { useCart } from "@/context/CartContext";

type Props = {
  id: string;
  title: string;
  price: number;
  image?: string;
};

export default function AddToCartButton({
  id,
  title,
  price,
  image,
}: Props) {
  const { addToCart } = useCart();

  const handleAdd = () => {
    addToCart(
      {
        id,
        kind: "RECIPE",
        title,
        price,
        image,
      },
      1
    );
  };

  return (
    <button
      type="button"
      onClick={handleAdd}
      className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
    >
      Dodaj u korpu
    </button>
  );
}