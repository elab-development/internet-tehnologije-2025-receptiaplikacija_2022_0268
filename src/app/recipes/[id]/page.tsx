"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { RECIPES } from "@/lib/recipes";

export default function RecipeDetailsPage() {
  const params = useParams<{ id: string }>();
  const urlId = decodeURIComponent(params?.id ?? "").trim();

  const recipe = RECIPES.find((r) => r.id.trim() === urlId);

  if (!recipe) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <p className="font-medium">Recept nije pronađen.</p>
        <Link href="/recipes" className="mt-4 inline-block underline">
          Nazad na recepte
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/recipes" className="text-sm underline">
        ← Nazad na recepte
      </Link>

      <div className="mt-4 flex items-start justify-between gap-3">
        <h1 className="text-3xl font-semibold">{recipe.title}</h1>
        {recipe.isPremium && (
          <span className="rounded-full border px-2 py-1 text-xs">
            ⭐ PREMIUM
          </span>
        )}
      </div>

      <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-600">
        <span>⏱ {recipe.timeMin} min</span>
        <span>⚡ {recipe.difficulty}</span>
        <span>🏷 {recipe.category}</span>
      </div>

      {/* UKRATKO */}
      <div className="mt-6 rounded-lg border bg-white p-4">
        <h2 className="text-lg font-medium">Ukratko</h2>
        <p className="mt-2 text-gray-700">{recipe.short}</p>
      </div>

      {/* OPIS */}
      <p className="mt-6 text-gray-700">{recipe.description}</p>

      {/* SASTOJCI */}
      <div className="mt-8 rounded-lg border bg-white p-4">
        <h2 className="text-lg font-medium">Sastojci</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-gray-700">
          {recipe.ingredients.map((ing, idx) => (
            <li key={idx}>{ing}</li>
          ))}
        </ul>
      </div>

      {/* KORACI */}
      <div className="mt-6 rounded-lg border bg-white p-4">
        <h2 className="text-lg font-medium">Priprema</h2>
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-gray-700">
          {recipe.steps.map((step, idx) => (
            <li key={idx}>{step}</li>
          ))}
        </ol>
      </div>
    </main>
  );
}
