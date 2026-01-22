"use client";

import { useMemo, useState } from "react";
import Input from "@/components/Input";
import Card from "@/components/Card";
import Button from "@/components/Button";

const MOCK_RECIPES = [
  { id: 1, title: "Pasta Carbonara", tag: "italijansko" },
  { id: 2, title: "Grčka salata", tag: "salata" },
  { id: 3, title: "Pileći kari", tag: "azijsko" },
  { id: 4, title: "Palenta sa sirom", tag: "domaće" },
  { id: 5, title: "Tuna sendvič", tag: "brzo" },
  { id: 6, title: "Čorba od povrća", tag: "domaće" },
];

const PAGE_SIZE = 3;

export default function RecipesPage() {
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState("sve");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MOCK_RECIPES.filter((r) => {
      const matchesQuery = q === "" || r.title.toLowerCase().includes(q);
      const matchesTag = tag === "sve" || r.tag === tag;
      return matchesQuery && matchesTag;
    });
  }, [query, tag]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="text-2xl font-semibold">Recepti</h1>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <Input
          label="Pretraga"
          placeholder="npr. pasta..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
        />

        <label className="block">
          <span className="mb-1 block text-sm">Filter</span>
          <select
            className="w-full rounded border px-3 py-2"
            value={tag}
            onChange={(e) => {
              setTag(e.target.value);
              setPage(1);
            }}
          >
            <option value="sve">Sve</option>
            <option value="domaće">Domaće</option>
            <option value="italijansko">Italijansko</option>
            <option value="azijsko">Azijsko</option>
            <option value="salata">Salata</option>
            <option value="brzo">Brzo</option>
          </select>
        </label>

        <div className="flex items-end gap-2">
          <Button
            onClick={() => {
              setQuery("");
              setTag("sve");
              setPage(1);
            }}
          >
            Reset
          </Button>
          <div className="text-sm text-gray-600">Ukupno: {filtered.length}</div>
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {pageItems.map((r) => (
          <Card key={r.id} title={r.title}>
            Tag: {r.tag}
          </Card>
        ))}
      </div>

      <div className="mt-6 flex items-center gap-2">
        <Button onClick={() => setPage((p) => Math.max(1, p - 1))}>
          Prethodna
        </Button>
        <span className="text-sm">
          Strana {page} / {totalPages}
        </span>
        <Button onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
          Sledeća
        </Button>
      </div>
    </main>
  );
}
