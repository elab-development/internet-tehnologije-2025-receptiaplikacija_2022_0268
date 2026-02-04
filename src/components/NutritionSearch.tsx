"use client";

import { useState } from "react";

type Nutrition = {
  productName: string;
  source: string;
  kcal_100g: number | null;
  protein_100g: number | null;
  fat_100g: number | null;
  carbs_100g: number | null;
};

export default function NutritionSearch() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Nutrition | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSearch = async () => {
    const query = q.trim();
    if (!query) {
      setError("Unesi sastojak.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`/api/nutrition?q=${encodeURIComponent(query)}`, {
        cache: "no-store",
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data?.error ?? "Greška pri pretrazi");
      } else if (!data?.found) {
        setError("Nema rezultata.");
      } else {
        setResult(data.nutrition as Nutrition);
      }
    } catch (e: any) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-3 space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Upiši sastojak (npr. mleko, pasulj...)"
          className="w-full rounded-md border px-3 py-2 text-sm"
        />

        <button
          type="button"
          onClick={onSearch}
          disabled={loading}
          className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
        >
          {loading ? "Tražim..." : "Pretraži"}
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {result && (
        <div className="rounded-md border p-3 text-sm">
          <div className="font-semibold">{result.productName}</div>
          <div className="text-gray-600">Izvor: {result.source}</div>

          <div className="mt-2 grid grid-cols-2 gap-2">
            <div>Kcal/100g: <b>{result.kcal_100g ?? "?"}</b></div>
            <div>Proteini/100g: <b>{result.protein_100g ?? "?"}</b></div>
            <div>Masti/100g: <b>{result.fat_100g ?? "?"}</b></div>
            <div>UH/100g: <b>{result.carbs_100g ?? "?"}</b></div>
          </div>
        </div>
      )}
    </div>
  );
}