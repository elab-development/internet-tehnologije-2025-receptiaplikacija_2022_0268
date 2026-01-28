"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { RECIPES } from "@/lib/recipes";

export default function RecipesPage() {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("SVE");

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const r of RECIPES) set.add(String(r.category ?? "Ostalo"));
    return ["SVE", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return RECIPES.filter((r) => {
      const catOk = category === "SVE" ? true : String(r.category) === category;

      if (!query) return catOk;

      const hay = [
        r.title,
        r.short,
        r.description,
        r.category,
        r.difficulty,
        (r.ingredients ?? []).join(" "),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return catOk && hay.includes(query);
    });
  }, [q, category]);

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

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((r) => (
          <Link
            key={r.id}
            href={`/recipes/${encodeURIComponent(r.id)}`}
            className="rounded-lg border bg-white p-4 transition hover:shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-semibold leading-snug">{r.title}</h2>
              {r.isPremium && (
                <span className="shrink-0 rounded-full border px-2 py-1 text-xs">
                  ⭐ PREMIUM
                </span>
              )}
            </div>

            <p className="mt-2 line-clamp-3 text-sm text-gray-700">{r.short}</p>

            <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-600">
              <span className="rounded-md border px-2 py-1">⏱ {r.timeMin} min</span>
              <span className="rounded-md border px-2 py-1">⚡ {r.difficulty}</span>
              <span className="rounded-md border px-2 py-1">🏷 {r.category}</span>
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
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
