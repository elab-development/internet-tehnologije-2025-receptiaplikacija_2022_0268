"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";

export default function CartPage() {
  const { items, setQty, removeFromCart, clearCart, totalItems } = useCart();


  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Korpa</h1>
          <p className="text-sm text-gray-600">
            Ukupno stavki: {totalItems}
          </p>
        </div>

        <Link href="/recipes" className="underline">
          ← Nazad na recepte
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="mt-8 text-gray-700">Korpa je prazna.</p>
      ) : (
        <>
          <div className="mt-8 space-y-4">
          {items.map((item) => (
  <div
    key={item.id}
    className="rounded-lg border bg-white p-4"
  >
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="text-lg font-medium">{item.title}</h2>
      </div>

      <button
        onClick={() => removeFromCart(item.id)}
        className="text-sm underline"
      >
        Ukloni
      </button>
    </div>

    <div className="mt-4 flex items-center gap-3">
      <button
        onClick={() => setQty(item.id, Math.max(1, item.qty - 1))}
        className="rounded-md border px-3 py-1"
      >
        -
      </button>

      <span className="min-w-[24px] text-center">{item.qty}</span>

      <button
        onClick={() => setQty(item.id, item.qty + 1)}
        className="rounded-md border px-3 py-1"
      >
        +
      </button>
    </div>
  </div>
))}

          </div>

          <button
            onClick={clearCart}
            className="mt-6 rounded-md border px-4 py-2"
          >
            Isprazni korpu
          </button>
        </>
      )}
    </main>
  );
}
