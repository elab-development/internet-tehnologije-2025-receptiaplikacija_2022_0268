"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { RECIPES } from "@/lib/recipes";

type Filter =
  | "svi"
  | "vegan"
  | "proteinsko"
  | "tradicionalno"
  | "premium"
  | "omiljeni";

const LS_KEY = "favoriteRecipeIds";

export default function RecipesPage() {
  const [aktivnaKategorija, setAktivnaKategorija] = useState<Filter>("svi");
  const [favorites, setFavorites] = useState<string[]>([]);

  // Učitaj omiljene iz localStorage
  useEffect(() => {
    const saved = localStorage.getItem(LS_KEY);
    if (saved) setFavorites(JSON.parse(saved));
  }, []);

  // Sačuvaj omiljene
  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const filtriraniRecepti = useMemo(() => {
    return RECIPES.filter((r) => {
      if (aktivnaKategorija === "svi") return true;
      if (aktivnaKategorija === "premium") return r.isPremium;
      if (aktivnaKategorija === "omiljeni") return favorites.includes(r.id);
      return r.category === aktivnaKategorija;
    });
  }, [aktivnaKategorija, favorites]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Recepti</h1>
        <p className="text-sm text-gray-600">Izaberi recept i otvori detalje.</p>

        <div className="mt-4 flex flex-wrap gap-3">
          <button onClick={() => setAktivnaKategorija("svi")}>Svi</button>
          <button onClick={() => setAktivnaKategorija("vegan")}>🥗 Vegan</button>
          <button onClick={() => setAktivnaKategorija("proteinsko")}>🍗 Proteinsko</button>
          <button onClick={() => setAktivnaKategorija("tradicionalno")}>🥘 Tradicionalno</button>
          <button onClick={() => setAktivnaKategorija("premium")}>⭐ Premium</button>
          <button onClick={() => setAktivnaKategorija("omiljeni")}>❤️ Omiljeni</button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {filtriraniRecepti.map((r) => (
          <div key={r.id} className="rounded-lg border bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-medium">{r.title}</h2>

              <div className="flex gap-2">
                <button onClick={() => toggleFavorite(r.id)}>
                  {favorites.includes(r.id) ? "❤️" : "🤍"}
                </button>

                {r.isPremium && <span className="text-xs">⭐ PREMIUM</span>}
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
