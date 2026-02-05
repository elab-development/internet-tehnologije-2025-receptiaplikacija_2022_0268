"use client";

import { useMemo, useState } from "react";
import IngredientQty from "@/components/IngredientQty";
import { useCart } from "@/context/CartContext";

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

const CATEGORY_ICON: Record<string, string> = {
  "Mlečni proizvodi i jaja": "🥛",
  "Meso i suhomesnato": "🥩",
  "Riba i morski plodovi": "🐟",
  "Povrće": "🥦",
  "Voće": "🍎",
  "Žitarice i testenine": "🍞",
  "Mahune / proteinsko biljno": "🫘",
  "Začini": "🧂",
  "Ulja i sosovi": "🫒",
  "Slatko": "🍫",
  "Ostalo": "📦",
};

function iconForCategory(name: string) {
  return CATEGORY_ICON[name] ?? "🍽️";
}


function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/đ/g, "dj")
    .replace(/č/g, "c")
    .replace(/ć/g, "c")
    .replace(/ž/g, "z")
    .replace(/š/g, "s")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function formatPack(qty: number | null, unit: string | null) {
  if (qty == null || !unit) return null;
  return `${qty} ${unit}`;
}

function formatPrice(price: number | null) {
  if (price == null) return null;
  return `${price} RSD`;
}

export default function SastojciClient({ groups }: { groups: Group[] }) {
  const [q, setQ] = useState("");
  const cart = useCart();

  const filteredGroups = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return groups;

    return groups
      .map((g) => ({
        ...g,
        items: g.items.filter((it) => it.name.toLowerCase().includes(query)),
      }))
      .filter((g) => g.items.length > 0);
  }, [groups, q]);

  const allCount = useMemo(
    () => groups.reduce((sum, g) => sum + g.items.length, 0),
    [groups]
  );

  const filteredCount = useMemo(
    () => filteredGroups.reduce((sum, g) => sum + g.items.length, 0),
    [filteredGroups]
  );

  const categories = useMemo(
    () =>
      groups.map((g) => ({
        name: g.categoryName,
        id: slugify(g.categoryName),
        count: g.items.length,
      })),
    [groups]
  );

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[260px_1fr_280px]">
      {}
      <aside className="hidden lg:block">
        <div className="sticky top-24 rounded-3xl border bg-white p-4 shadow-sm">
          <div className="text-sm font-semibold text-gray-900">Kategorije</div>
          <div className="mt-3 space-y-2">
            {categories.map((c) => (
              <a
                key={c.id}
                href={`#${c.id}`}
                className="flex items-center justify-between rounded-2xl px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
              >
                <span className="flex min-w-0 items-center gap-2">
  <span className="text-base">{iconForCategory(c.name)}</span>
  <span className="truncate">{c.name}</span>
</span>

                <span className="ml-2 rounded-full bg-amber-100/70 px-2 py-0.5 text-xs font-semibold text-amber-900">
                  {c.count}
                </span>
              </a>
            ))}
          </div>
        </div>
      </aside>

      {}
      <section>
        {}
        <div className="rounded-3xl border bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-semibold text-gray-900">Pretraga</div>
              <div className="mt-1 text-xs text-gray-600">
                Prikazano {filteredCount} / {allCount} sastojaka
              </div>
            </div>

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="npr. mleko, luk, cimet..."
                className="w-full rounded-2xl border bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-300 sm:w-72"
              />
              {q.trim() && (
                <button
                  type="button"
                  onClick={() => setQ("")}
                  className="rounded-2xl border bg-white px-4 py-2.5 text-sm font-semibold hover:bg-gray-50 transition"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>

        {}
        {filteredGroups.length === 0 ? (
          <div className="mt-6 rounded-3xl border bg-white p-10 text-center shadow-sm">
            <div className="text-5xl">🔎</div>
            <div className="mt-3 text-lg font-semibold">Nema rezultata</div>
            <p className="mt-1 text-sm text-gray-600">
              Probaj drugi pojam (npr. “sir”, “testenina”, “so”).
            </p>
            <button
              onClick={() => setQ("")}
              className="mt-4 rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 transition"
            >
              Očisti pretragu
            </button>
          </div>
        ) : (
          <div className="mt-6 space-y-10">
            {filteredGroups.map((g) => {
              const sectionId = slugify(g.categoryName);
              return (
                <section key={g.categoryName} id={sectionId}>
                  <div className="mb-4 flex items-center justify-between gap-3">
                   <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
  <span className="text-xl">{iconForCategory(g.categoryName)}</span>
  <span>{g.categoryName}</span>
</h2>

                    <span className="rounded-full bg-amber-100/70 px-3 py-1 text-xs font-semibold text-amber-900">
                      {g.items.length} stavki
                    </span>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {g.items.map((it) => {
                      const pack = formatPack(it.defaultQty, it.defaultUnit);
                      const price = formatPrice(it.priceRsd);

                      return (
                        <div
                          key={it.id}
                          className="flex flex-col rounded-2xl border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="truncate text-sm font-semibold text-gray-900">
                                {it.name}
                              </div>

                              <div className="mt-2 flex flex-wrap gap-2">
                                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                                  📦 {pack ?? "—"}
                                </span>

                                <span className="rounded-full bg-amber-100/70 px-3 py-1 text-xs font-semibold text-amber-900">
                                  💰 {price ?? "—"}
                                </span>
                              </div>
                            </div>

                            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-amber-50 text-amber-900">
                              🛒
                            </div>
                          </div>

                          <div className="mt-4 h-px w-full bg-gray-100" />

                          <div className="mt-4">
                            <IngredientQty id={it.id} title={it.name} priceRsd={it.priceRsd} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </section>

      {}
      <aside className="hidden lg:block">
        <div className="sticky top-24 rounded-3xl border bg-white p-5 shadow-sm">
          <div className="text-sm font-semibold text-gray-900">Korpa</div>
          <div className="mt-2 text-xs text-gray-600">
            Ukupno stavki: <b>{cart.totalItems}</b>
          </div>

          <a
            href="/cart"
            className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 transition"
          >
            Idi u korpu →
          </a>

          <div className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-xs text-gray-700">
            Tip: Dodaj prvo osnovne stvari (so, ulje, luk), pa ostalo.
          </div>
        </div>
      </aside>
    </div>
  );
}
