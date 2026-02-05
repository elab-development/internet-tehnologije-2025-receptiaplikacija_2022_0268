import Link from "next/link";
import { prisma } from "../../lib/prisma";
import SastojciClient from "./SastojciClient";

type GroupedItem = {
  id: string;
  name: string;
  defaultUnit: string | null;
  defaultQty: number | null;
  priceRsd: number | null;
};

type Group = {
  categoryName: string;
  items: GroupedItem[];
};

export default async function SastojciPage() {
  const ingredients = await prisma.ingredient.findMany({
    include: { category: true },
    orderBy: [{ category: { name: "asc" } }, { name: "asc" }],
  });

  const groupsMap = new Map<string, GroupedItem[]>();

  for (const it of ingredients) {
    const catName = it.category?.name ?? "Ostalo";
    const item: GroupedItem = {
      id: it.id,
      name: it.name,
      defaultUnit: it.defaultUnit ?? null,
      defaultQty: it.defaultQty ?? null,
      priceRsd: it.priceRsd ?? null,
    };

    const arr = groupsMap.get(catName) ?? [];
    arr.push(item);
    groupsMap.set(catName, arr);
  }

  const groups: Group[] = Array.from(groupsMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([categoryName, items]) => ({ categoryName, items }));

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          
  <h1 className="text-4xl font-bold tracking-tight">Sastojci</h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/recipes"
            className="inline-flex items-center justify-center rounded-full border bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition"
          >
            ← Recepti
          </Link>

          <Link
            href="/cart"
            className="inline-flex items-center justify-center rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 transition"
          >
            Korpa →
          </Link>
        </div>
      </div>

      {}
      <SastojciClient groups={groups} />
    </main>
  );
}
