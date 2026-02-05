"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";

function formatRsd(n: number) {
  const val = Number(n || 0);
  return `${val.toLocaleString("sr-RS")} RSD`;
}

export default function CartPage() {
  const { items, setQty, removeFromCart, clearCart, totalItems, totalPriceRsd } =
    useCart();

  const canCheckout = items.length > 0;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Korpa</h1>
          <p className="mt-1 text-sm text-gray-600">
            Ukupno stavki:{" "}
            <span className="font-semibold text-gray-900">{totalItems}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/sastojci"
            className="inline-flex items-center justify-center rounded-full border bg-white px-4 py-2 text-sm transition hover:bg-gray-50"
          >
            ← Nazad na sastojke
          </Link>

          <Link
            href="/recipes"
            className="inline-flex items-center justify-center rounded-full border bg-white px-4 py-2 text-sm transition hover:bg-gray-50"
          >
            Recepti →
          </Link>
        </div>
      </div>

      {/* CONTENT GRID */}
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* LEFT: ITEMS */}
        <section className="min-w-0">
          {items.length === 0 ? (
            <div className="rounded-3xl border bg-white p-8 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-100 text-2xl">
                  🛒
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Korpa je prazna</h2>
                  <p className="mt-1 text-sm text-gray-600">
                    Dodaj sastojke ili premium recept, pa se vrati ovde da poručiš.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      href="/sastojci"
                      className="rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-600"
                    >
                      Idi na sastojke →
                    </Link>
                    <Link
                      href="/recipes"
                      className="rounded-full border bg-white px-5 py-2.5 text-sm transition hover:bg-gray-50"
                    >
                      Pregled recepata
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => {
                const lineTotal =
                  Number(item.priceRsd || 0) * Number(item.qty || 0);

                const initial = (item.title?.trim()?.[0] || "?").toUpperCase();

                return (
                  <div
                    key={`${item.kind}-${item.id}`}
                    className="overflow-hidden rounded-3xl border bg-white shadow-sm"
                  >
                    <div className="p-5 sm:p-6">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        {}
                        <div className="flex min-w-0 gap-4">
                          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-amber-100">
                            {item.image ? (
                              
                              <img
                                src={item.image}
                                alt={item.title}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="grid h-full w-full place-items-center text-lg font-semibold text-amber-800">
                                {initial}
                              </div>
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h2 className="truncate text-lg font-semibold">
                                {item.title}
                              </h2>

                              <span className="rounded-full bg-amber-100/70 px-3 py-1 text-xs text-amber-900">
                                {item.kind === "INGREDIENT" ? "Sastojak" : "Recept"}
                              </span>
                            </div>

                            <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-700">
                              <span className="rounded-full bg-gray-100 px-3 py-1">
                                💰 {formatRsd(item.priceRsd)} / kom
                              </span>
                              <span className="rounded-full bg-gray-100 px-3 py-1">
                                🧾 Ukupno: <b>{formatRsd(lineTotal)}</b>
                              </span>
                            </div>
                          </div>
                        </div>

                        {}
                        <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end sm:justify-start">
                          <button
                            onClick={() => removeFromCart(item.id, item.kind)}
                            className="rounded-full border bg-white px-4 py-2 text-sm transition hover:bg-gray-50"
                          >
                            Ukloni
                          </button>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                setQty(item.id, item.kind, Math.max(1, item.qty - 1))
                              }
                              className="grid h-10 w-10 place-items-center rounded-2xl border bg-white text-lg transition hover:bg-gray-50"
                              aria-label="Smanji količinu"
                            >
                              –
                            </button>

                            <div className="grid h-10 min-w-[44px] place-items-center rounded-2xl bg-amber-50 text-sm font-semibold text-gray-900">
                              {item.qty}
                            </div>

                            <button
                              onClick={() => setQty(item.id, item.kind, item.qty + 1)}
                              className="grid h-10 w-10 place-items-center rounded-2xl border bg-white text-lg transition hover:bg-gray-50"
                              aria-label="Povećaj količinu"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {}
        <aside className="h-fit lg:sticky lg:top-24">
          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold">Pregled porudžbine</h3>

            <div className="mt-4 space-y-2 text-sm text-gray-700">
              <div className="flex items-center justify-between">
                <span>Stavki</span>
                <span className="font-semibold text-gray-900">{totalItems}</span>
              </div>

              <div className="flex items-center justify-between">
                <span>Ukupno</span>
                <span className="font-semibold text-gray-900">
                  {formatRsd(totalPriceRsd)}
                </span>
              </div>

              <div className="mt-3 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-gray-800">
                Kreiraj porudžbinu klikom na dugme ispod.
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-2">
              <Link
                href="/checkout"
                aria-disabled={!canCheckout}
                className={[
                  "inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition",
                  canCheckout
                    ? "bg-amber-500 text-white hover:bg-amber-600"
                    : "pointer-events-none bg-gray-200 text-gray-500",
                ].join(" ")}
              >
                Poruči →
              </Link>

              <button
                onClick={clearCart}
                className={[
                  "rounded-full border px-5 py-2.5 text-sm transition",
                  items.length > 0
                    ? "hover:bg-gray-50"
                    : "cursor-not-allowed opacity-50",
                ].join(" ")}
                disabled={items.length === 0}
              >
                Isprazni korpu
              </button>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}