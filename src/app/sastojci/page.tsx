import { prisma } from "../../lib/prisma";

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

  // grupisanje po kategoriji iz BAZE
  const grouped: Record<string, { id: string; name: string }[]> = {};

  for (const ing of ingredients) {
    const categoryName = ing.category?.name ?? "Ostalo";

    if (!grouped[categoryName]) {
      grouped[categoryName] = [];
    }

    grouped[categoryName].push({
      id: ing.id,
      name: ing.name,
    });
  }

  const categories = Object.keys(grouped);

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="mb-8 text-4xl font-bold">Sastojci</h1>

      {categories.map((category) => (
        <section key={category} className="mb-10">
          <h2 className="mb-4 text-2xl font-semibold">{category}</h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {grouped[category].map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-2xl border p-5"
              >
                <span className="text-lg font-semibold">{item.name}</span>
                <button className="rounded-xl border px-3 py-2 text-sm">
                  Dodaj
                </button>
              </div>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}