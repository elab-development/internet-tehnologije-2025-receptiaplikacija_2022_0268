"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { RECIPES } from "@/lib/recipes";

const LS_KEY = "favoriteRecipeIds";

export default function ProfilePage() {
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(LS_KEY);
    if (saved) setFavorites(JSON.parse(saved));
  }, []);

  const favoriteRecipes = useMemo(
    () => RECIPES.filter((r) => favorites.includes(r.id)),
    [favorites]
  );

  const removeFavorite = (id: string) => {
    const updated = favorites.filter((x) => x !== id);
    setFavorites(updated);
    localStorage.setItem(LS_KEY, JSON.stringify(updated));
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Profil</h1>
          <p className="text-sm text-gray-600">Ovde su tvoji omiljeni recepti.</p>
        </div>

        <Link
          href="/recipes"
          className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
        >
          ← Nazad na recepte
        </Link>
      </div>

      <h2 className="text-lg font-medium">❤️ Omiljeni</h2>

      {favoriteRecipes.length === 0 ? (
        <p className="mt-2 text-sm text-gray-600">
          Nemaš omiljene recepte još. Idi na recepte i klikni 🤍.
        </p>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {favoriteRecipes.map((r) => (
            <div key={r.id} className="rounded-lg border bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-medium">{r.title}</h3>

                <button
                  onClick={() => removeFavorite(r.id)}
                  className="text-xl"
                  title="Ukloni iz omiljenih"
                >
                  ❤️
                </button>
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
      )}
    </main>
  );
}
