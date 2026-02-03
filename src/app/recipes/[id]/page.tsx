"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { RECIPES } from "@/lib/recipes";

const FAV_LS_KEY = "favoriteRecipeIds";
const PREMIUM_LS_KEY = "purchasedPremiumRecipeIds";

export default function RecipeDetailsPage() {
  const params = useParams<{ id: string }>();
  const id = decodeURIComponent(params?.id ?? "").trim();

  const recipe = RECIPES.find((r) => r.id.trim() === id);

  const [favorites, setFavorites] = useState<string[]>([]);
  const [purchased, setPurchased] = useState<string[]>([]);

  useEffect(() => {
    const savedFav = localStorage.getItem(FAV_LS_KEY);
    if (savedFav) setFavorites(JSON.parse(savedFav));

    const savedPremium = localStorage.getItem(PREMIUM_LS_KEY);
    if (savedPremium) setPurchased(JSON.parse(savedPremium));
  }, []);

  const toggleFavorite = () => {
    setFavorites((prev) => {
      const updated = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      localStorage.setItem(FAV_LS_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const buyPremium = () => {
    setPurchased((prev) => {
      if (prev.includes(id)) return prev;
      const updated = [...prev, id];
      localStorage.setItem(PREMIUM_LS_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  if (!recipe) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <p>Recept nije pronađen.</p>
        <Link href="/recipes" className="underline">
          Nazad
        </Link>
      </main>
    );
  }

  const isFav = favorites.includes(id);
  const isBought = purchased.includes(id);
  const locked = recipe.isPremium && !isBought;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/recipes" className="text-sm underline">
        ← Nazad na recepte
      </Link>

      <div className="mt-4 flex items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold">{recipe.title}</h1>
        <button onClick={toggleFavorite} className="text-2xl" title="Omiljeni">
          {isFav ? "❤️" : "🤍"}
        </button>
      </div>

      <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-600">
        <span>⏱ {recipe.timeMin} min</span>
        <span>⚡ {recipe.difficulty}</span>
        <span>🏷 {recipe.category}</span>
        {recipe.isPremium && <span>⭐ PREMIUM</span>}
        {recipe.isPremium && isBought && <span>✅ Kupljeno</span>}
      </div>

      <div className="mt-6 rounded-lg border bg-white p-4">
        <h2 className="text-lg font-medium">Ukratko</h2>
        <p className="mt-2 text-gray-700">{recipe.short}</p>
      </div>

      {locked ? (
        <div className="mt-6 rounded-lg border bg-white p-4">
          <h2 className="text-lg font-medium">Premium sadržaj</h2>
          <p className="mt-2 text-gray-700">
            Ovaj recept je premium. Kupi da bi video/la opis, sastojke i pripremu.
          </p>
          <button
            onClick={buyPremium}
            className="mt-4 rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
          >
            Kupi premium recept
          </button>
        </div>
      ) : (
        <>
          <p className="mt-6 text-gray-700">{recipe.description}</p>

          <div className="mt-8 rounded-lg border bg-white p-4">
            <h2 className="text-lg font-medium">Sastojci</h2>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-gray-700">
              {recipe.ingredients.map((ing, idx) => (
                <li key={idx}>{ing}</li>
              ))}
            </ul>
          </div>

          <div className="mt-6 rounded-lg border bg-white p-4">
            <h2 className="text-lg font-medium">Priprema</h2>
            <ol className="mt-3 list-decimal space-y-1 pl-5 text-gray-700">
              {recipe.steps.map((step, idx) => (
                <li key={idx}>{step}</li>
              ))}
            </ol>
          </div>
        </>
      )}
    </main>
  );
}
