"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type RecipeRow = {
  id: string;
  title: string;
  description: string;
  prepTimeMinutes: number;
  difficulty: number;
  imageUrl: string | null;
  isPremium: boolean;
  priceRSD: number;
  category: { name: string } | null;
};

const FAV_LS_KEY = "favoriteRecipeIds";

export default function RecipesPage() {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("SVE");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recipes, setRecipes] = useState<RecipeRow[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(FAV_LS_KEY);
    if (saved) setFavorites(JSON.parse(saved));
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      setErr(null);
      const res = await fetch("/api/recipes", { cache: "no-store" });
      const data = await res.json().catch(() => null);
      if (!alive) return;

      if (!res.ok || !data?.ok) {
        setErr(data?.error || "Ne mogu da učitam recepte.");
        setRecipes([]);
        return;
      }

      setRecipes(data.recipes || []);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const updated = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      localStorage.setItem(FAV_LS_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const r of recipes) set.add(String(r.category?.name ?? "Ostalo"));
    return ["SVE", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [recipes]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return recipes.filter((r) => {
      const catName = String(r.category?.name ?? "Ostalo");
      const catOk = category === "SVE" ? true : catName === category;

      if (!query) return catOk;

      const hay = [r.title, r.description, catName, String(r.difficulty)]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return catOk && hay.includes(query);
    });
  }, [recipes, q, category]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Recepti</h1>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Pretraga (npr. pasta, piletina...)"
            className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 sm:w-72"
          />

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 sm:w-52"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {err && (
        <div className="mt-6 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {err}
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((r) => {
          const isFav = favorites.includes(r.id);
          const catName = String(r.category?.name ?? "Ostalo");

          return (
            <div key={r.id} className="rounded-lg border bg-white p-4 transition hover:shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <Link href={`/recipes/${encodeURIComponent(r.id)}`} className="min-w-0 flex-1">
                  <h2 className="text-lg font-semibold leading-snug">{r.title}</h2>
                </Link>

                <div className="flex items-center gap-2">
                  {r.isPremium && (
                    <span className="shrink-0 rounded-full border px-2 py-1 text-xs">
                      ⭐ PREMIUM • {Number(r.priceRSD ?? 0)} RSD
                    </span>
                  )}

                  <button
                    type="button"
                    className="text-xl"
                    title="Omiljeni"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleFavorite(r.id);
                    }}
                  >
                    {isFav ? "❤️" : "🤍"}
                  </button>
                </div>
              </div>

              <p className="mt-2 line-clamp-3 text-sm text-gray-700">{r.description}</p>

              <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-600">
                <span className="rounded-md border px-2 py-1">⏱ {r.prepTimeMinutes} min</span>
                <span className="rounded-md border px-2 py-1">⚡ {r.difficulty}</span>
                <span className="rounded-md border px-2 py-1">🏷 {catName}</span>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && !err && (
        <div className="mt-10 rounded-lg border bg-white p-6 text-center">
          <p className="text-gray-700">Nema rezultata za ovu pretragu.</p>
          <button
            onClick={() => {
              setQ("");
              setCategory("SVE");
            }}
            className="mt-3 rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
          >
            Resetuj filtere
          </button>
        </div>
      )}
    </main>
  );
}
