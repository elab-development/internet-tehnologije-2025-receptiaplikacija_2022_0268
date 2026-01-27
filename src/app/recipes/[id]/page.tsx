"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { RECIPES } from "@/lib/recipes";

const LS_KEY = "favoriteRecipeIds";

export default function RecipeDetailsPage() {
  const params = useParams<{ id: string }>();
  const id = decodeURIComponent(params?.id ?? "");
  const recipe = RECIPES.find((r) => r.id === id);

  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(LS_KEY);
    if (saved) setFavorites(JSON.parse(saved));
  }, []);

  const toggleFavorite = () => {
    setFavorites((prev) => {
      const updated = prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id];
      localStorage.setItem(LS_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  if (!recipe) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <p>Recept nije pronađen.</p>
        <Link href="/recipes">Nazad</Link>
      </main>
    );
  }

  const isFav = favorites.includes(id);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/recipes" className="underline">
        ← Nazad
      </Link>

      <div className="mt-4 flex items-center justify-between">
        <h1 className="text-3xl font-semibold">{recipe.title}</h1>

        <button onClick={toggleFavorite} className="text-2xl">
          {isFav ? "❤️" : "🤍"}
        </button>
      </div>

      <div className="mt-2 flex gap-3 text-sm text-gray-600">
        <span>⏱ {recipe.timeMin} min</span>
        <span>⚡ {recipe.difficulty}</span>
        <span>🏷 {recipe.category}</span>
        {recipe.isPremium && <span>⭐ PREMIUM</span>}
      </div>

      <p className="mt-6">{recipe.short}</p>

      <h2 className="mt-6 font-medium">Sastojci</h2>
      <ul className="list-disc pl-5">
        {recipe.ingredients.map((i, idx) => (
          <li key={idx}>{i}</li>
        ))}
      </ul>

      <h2 className="mt-6 font-medium">Priprema</h2>
      <ol className="list-decimal pl-5">
        {recipe.steps.map((s, idx) => (
          <li key={idx}>{s}</li>
        ))}
      </ol>
    </main>
  );
}
