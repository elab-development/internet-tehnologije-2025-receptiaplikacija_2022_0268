import Link from "next/link";
import { RECIPES } from "@/lib/recipes";



export default function RecipesPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Recepti</h1>
          <p className="text-sm text-gray-600">
            Izaberi recept i otvori detalje (sledeći korak pravimo stranicu detalja).
          </p>
        </div>

        <Link
          href="/cart"
          className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
        >
          Idi u korpu →
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {RECIPES.map((r) => (
          <div key={r.id} className="rounded-lg border bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-medium">{r.title}</h2>
              <span className="rounded-full border px-2 py-1 text-xs">
                {r.difficulty}
              </span>
            </div>

            <p className="mt-2 text-sm text-gray-700">{r.description}</p>

            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-gray-600">⏱ {r.timeMin} min</span>

              {/* Za sada vodi na placeholder, kasnije pravimo /recipes/[id] */}
              <Link
                href={`/recipes/${r.id}`}
                className="text-sm font-medium hover:underline"
              >
                Pogledaj detalje →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

