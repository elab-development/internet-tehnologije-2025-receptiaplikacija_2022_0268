import { prisma } from "../../lib/prisma";
import IngredientQty from "@/components/IngredientQty";

type GroupedItem = {
  id: string;
  name: string;
  defaultUnit: string | null;
  defaultQty: number | null;
  priceRsd: number | null;
};

export default async function SastojciPage() {
  const ingredients = await prisma.ingredient.findMany({
    include: {
      category: true,
    },
    orderBy: [
      { category: { name: "asc" } },
      { name: "asc" },
    ],
  });

  const grouped: Record<string, GroupedItem[]> = {};

  for (const ing of ingredients) {
    const categoryName = ing.category?.name ?? "Ostalo";

    if (!grouped[categoryName]) {
      grouped[categoryName] = [];
    }

    grouped[categoryName].push({
      id: ing.id,
      name: ing.name,
      defaultUnit: ing.defaultUnit ?? null,
      defaultQty: ing.defaultQty ?? null,
      priceRsd: ing.priceRsd ?? null,
    });
  }

  const categories = Object.keys(grouped);

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="mb-8 text-4xl font-bold">Sastojci</h1>

      {categories.length === 0 ? (
        <p>Nema sastojaka u bazi.</p>
      ) : (
        categories.map((category) => (
          <section key={category} className="mb-10">
            <h2 className="mb-4 text-2xl font-semibold">{category}</h2>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {grouped[category].map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-2xl border p-5"
                >
                  {}
                  <div className="min-w-0">
                    {}
                    <div className="text-lg font-semibold">
                      {item.name}
                    </div>

                    {}
                    <div className="text-sm text-gray-600">
                      {item.defaultQty != null && item.defaultUnit != null
                        ? `${item.defaultQty} ${item.defaultUnit}`
                        : "Nema podrazumevane količine"}
                    </div>

                    {}
                    <div className="text-sm text-gray-800 font-medium mt-1">
                      {item.priceRsd != null
                        ? `${item.priceRsd} RSD`
                        : "Cena nije definisana"}
                    </div>
                  </div>

                  {}
                  <IngredientQty
                    id={item.id}
                    title={item.name}
                    priceRsd={item.priceRsd ?? 0}
                  />
                </div>
              ))}
            </div>
          </section>
        ))
      )}
    </main>
  );
}