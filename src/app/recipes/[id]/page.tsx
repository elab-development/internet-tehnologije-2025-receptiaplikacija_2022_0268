"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { RECIPES } from "@/lib/recipes";

function normalizeId(s: string) {
  return (s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

const CART_KEY = "cartRecipeIds";

function addToCart(id: string) {
  const raw = localStorage.getItem(CART_KEY);
  const cart: string[] = raw ? JSON.parse(raw) : [];

  if (!cart.includes(id)) {
    cart.push(id);
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }
}


export default function RecipeDetailsPage() {
  const params = useParams();
  const rawId = (params as any)?.id;
  const id = decodeURIComponent(Array.isArray(rawId) ? rawId[0] : rawId || "");

  const recipe = RECIPES.find(
    (r) => normalizeId(r.id) === normalizeId(id)
  );

  if (!recipe) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-red-500">Recept nije pronađen.</p>
        <Link href="/recipes" className="underline">
          Nazad
        </Link>
      </main>
    );
  }

  const locked = recipe.isPremium;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/recipes" className="underline text-sm">
        ← Nazad na recepte
      </Link>

      <h1 className="mt-4 text-3xl font-bold">{recipe.title}</h1>

      <div className="mt-2 text-sm text-gray-500">
        ⏱ {recipe.timeMin} min • ⚡ {recipe.difficulty}
      </div>

      <p className="mt-4 text-gray-700">{recipe.short}</p>

      {locked ? (
        <div className="mt-6 rounded-lg border p-4">
          <p className="font-medium">
            ⭐ Premium recept — {recipe.priceRsd} RSD
          </p>
          <p className="mt-2 text-sm text-gray-600">
            Kupi da bi video sastojke i pripremu.
          </p>

          <button
            className="mt-4 rounded-md border px-4 py-2"
            onClick={() => addToCart(recipe.id)}
          >
            Dodaj u korpu
          </button>
        </div>
      ) : (
        <>
          <div className="mt-6">
            <h2 className="text-xl font-semibold">Sastojci</h2>
            <ul className="mt-2 list-disc pl-5">
              {recipe.ingredients.map((i, idx) => (
                <li key={idx}>{i}</li>
              ))}
            </ul>
          </div>

          <div className="mt-6">
            <h2 className="text-xl font-semibold">Priprema</h2>
            <ol className="mt-2 list-decimal pl-5 space-y-1">
              {recipe.steps.map((s, idx) => (
                <li key={idx}>{s}</li>
              ))}
            </ol>
          </div>
        </>
      )}
    </main>
  );
}
