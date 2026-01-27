"use client";

import Link from "next/link";
import { useState } from "react";
import { RECIPES } from "@/lib/recipes";

type FilterKategorija =
  | "svi"
  | "vegan"
  | "proteinsko"
  | "tradicionalno"
  | "premium";

export default function RecipesPage() {
  const [aktivnaKategorija, setAktivnaKategorija] =
    useState<FilterKategorija>("svi");

  const filtriraniRecepti = RECIPES.filter((r) => {
    if (aktivnaKategorija === "svi") return true;
    if (aktivnaKategorija === "premium") return r.isPremium;
    return r.category === aktivnaKategorija;
  });

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Recepti</h1>
          <p className="text-sm text-gray-600">Izaberi recept i otvori detalje.</p>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={() => setAktivnaKategorija("svi")}
              className="rounded-md border px-3 py-1 text-sm"
            >
              Svi
            </button>
            <button
              onClick={() => setAktivnaKategorija("vegan")}
              className="rounded-md border px-3 py-1 text-sm"
            >
              🥗 Vegan
            </button>
            <button
              onClick={() => setAktivnaKategorija("proteinsko")}
              className="rounded-md border px-3 py-1 text-sm"
            >
              🍗 Proteinsko
            </button>
            <button
              onClick={() => setAktivnaKategorija("tradicionalno")}
              className="rounded-md border px-3 py-1 text-sm"
            >
              🥘 Tradicionalno
            </button>
            <button
              onClick={() => setAktivnaKategorija("premium")}
              className="rounded-md border px-3 py-1 text-sm"
            >
              ⭐ Premium
            </button>
          </div>
        </div>

        <Link
          href="/cart"
          className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
        >
          Idi u korpu →
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {filtriraniRecepti.map((r) => (
          <div key={r.id} className="rounded-lg border bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-medium">{r.title}</h2>

              <div className="flex flex-wrap items-center justify-end gap-2">
                {r.isPremium && (
                  <span className="rounded-full border px-2 py-1 text-xs">
                    ⭐ PREMIUM
                  </span>
                )}
                <span className="rounded-full border px-2 py-1 text-xs">
                  {r.difficulty}
                </span>
              </div>
            </div>

            <p className="mt-2 text-sm text-gray-700">{r.description}</p>

            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-gray-600">⏱ {r.timeMin} min</span>

              <Link
                href={`/recipes/${encodeURIComponent(r.id)}`}
                className="text-sm font-medium hover:underline"
              >
                Pogledaj detalje →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
