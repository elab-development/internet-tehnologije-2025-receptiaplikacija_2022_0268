"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Row = {
  id: string;
  title: string;
  isPublished: boolean;
  isPremium: boolean;
  priceRSD: number;
  category: { name: string } | null;
};

export default function KuvarRecipesPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setErr(null);

    const res = await fetch("/api/kuvar/recipes", { cache: "no-store" });
    const data = await res.json().catch(() => null);

    if (!res.ok || !data?.ok) {
      setRows([]);
      setErr(data?.error ?? "Ne mogu da učitam recepte.");
      setLoading(false);
      return;
    }

    setRows(data.recipes ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function del(id: string) {
    if (!confirm("Obriši recept?")) return;

    const res = await fetch(`/api/kuvar/recipes/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    const data = await res.json().catch(() => null);

    if (!res.ok || !data?.ok) {
      alert(data?.error ?? "Ne mogu da obrišem recept.");
      return;
    }

    load();
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">KUVAR • Recepti</h1>

        <Link
          href="/kuvar/recipes/new"
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white"
        >
          + Dodaj recept
        </Link>
      </div>

      {loading ? (
        <p className="mt-6 text-sm text-gray-600">Učitavam...</p>
      ) : err ? (
        <p className="mt-6 text-sm text-red-700">{err}</p>
      ) : rows.length === 0 ? (
        <p className="mt-6 text-sm text-gray-600">Nema recepata.</p>
      ) : (
        <div className="mt-6 space-y-2">
          {rows.map((r) => (
            <div
              key={r.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-white p-4"
            >
              <div className="min-w-0">
                <div className="font-medium">{r.title}</div>
                <div className="text-sm text-gray-600">
                  {r.category?.name ?? "Ostalo"} •{" "}
                  {r.isPublished ? "Objavljen" : "Nije objavljen"}
                  {r.isPremium ? ` • PREMIUM (${r.priceRSD} RSD)` : ""}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href={`/kuvar/recipes/${encodeURIComponent(r.id)}/edit`}
                  className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
                >
                  Izmeni
                </Link>

                <button
                  onClick={() => del(r.id)}
                  className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
                >
                  Obriši
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
