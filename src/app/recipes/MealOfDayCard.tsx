"use client";

import { useEffect, useState } from "react";

type MealDto = {
  id: string;
  title: string;
  category: string;
  area: string;
  imageUrl: string;
  sourceUrl: string;
  youtubeUrl: string;
};

export default function MealOfDayCard() {
  const [meal, setMeal] = useState<MealDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      setError(null);

     
      const res = await fetch("/api/meal-of-day", {
        cache: "no-store",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        setMeal(null);
        setError(data?.error ?? "Ne mogu da učitam predlog dana.");
        return;
      }

      setMeal(data.meal ?? null);
    } catch (e: any) {
      setMeal(null);
      setError(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <section className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">🍽️ Predlog dana</h2>

        <button
          onClick={load}
          className="rounded-full border px-3 py-1 text-sm hover:bg-gray-50"
          type="button"
        >
          Osveži
        </button>
      </div>

      {loading && <p className="mt-3 text-sm text-gray-600">Učitavam...</p>}

      {!loading && error && (
        <p className="mt-3 text-sm text-red-600">
          {error}
        </p>
      )}

      {!loading && meal && (
        <div className="mt-4 flex flex-col gap-4 sm:flex-row">
          {meal.imageUrl ? (
        
            <img
              src={meal.imageUrl}
              alt={meal.title}
              className="h-44 w-full rounded-xl object-cover sm:w-72"
            />
          ) : null}

          <div className="flex-1">
            <p className="text-xl font-bold">{meal.title}</p>

            <p className="mt-1 text-sm text-gray-600">
              {meal.category ? `Kategorija: ${meal.category}` : null}
              {meal.area ? ` • Poreklo: ${meal.area}` : null}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {meal.sourceUrl ? (
                <a
                  href={meal.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-gray-900 px-3 py-1 text-sm text-white hover:opacity-90"
                >
                  Izvor recepta
                </a>
              ) : null}

              {meal.youtubeUrl ? (
                <a
                  href={meal.youtubeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-red-600 px-3 py-1 text-sm text-white hover:opacity-90"
                >
                  YouTube
                </a>
              ) : null}
            </div>

            <p className="mt-3 text-xs text-gray-500">
              
            </p>
          </div>
        </div>
      )}
    </section>
  );
}