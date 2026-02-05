"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { RECIPES } from "@/lib/recipes";
import { useCart } from "@/context/CartContext";
import ReviewsSection from "@/components/ReviewsSection";
import NutritionSearch from "@/components/NutritionSearch";

const FAV_LS_KEY = "favoriteRecipeIds";
const PREMIUM_LS_KEY = "purchasedPremiumRecipeIds";

export default function RecipeDetailsPage() {
  const params = useParams<{ id: string }>();
  const id = decodeURIComponent(params?.id ?? "").trim();

  const recipe = RECIPES.find((r) => r.id.trim() === id);

  const [favorites, setFavorites] = useState<string[]>([]);
  const [purchased, setPurchased] = useState<string[]>([]);

  const { addToCart } = useCart();

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
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="rounded-3xl border bg-white p-8 shadow-sm">
          <p className="text-gray-700">Recept nije pronađen.</p>
          <Link href="/recipes" className="mt-3 inline-block rounded-full border px-4 py-2 text-sm hover:bg-gray-50">
            ← Nazad
          </Link>
        </div>
      </main>
    );
  }

  const isFav = favorites.includes(id);
  const isBought = purchased.includes(id);
  const locked = recipe.isPremium && !isBought;

  const priceRsd = recipe.isPremium ? Number((recipe as any).priceRsd ?? 0) : 0;
  const imageUrl = (recipe as any).imageUrl ?? null;

  const addRecipeToCart = () => {
    if (locked) return;

    addToCart(
      {
        id: recipe.id,
        kind: "RECIPE",
        title: recipe.title,
        priceRsd,
        image: imageUrl ?? undefined,
      },
      1
    );
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <Link href="/recipes" className="inline-flex items-center gap-2 text-sm text-gray-700 hover:underline">
        ← Nazad na recepte
      </Link>

      {/* HERO */}
      <div className="mt-5 overflow-hidden rounded-3xl border bg-white shadow-sm">
        <div className="relative h-64 w-full bg-gradient-to-br from-amber-100 to-rose-100">
          {imageUrl ? (
            <img src={imageUrl} alt={recipe.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-5xl">🍲</div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />

          {/* top badges */}
          <div className="absolute left-4 top-4 flex flex-wrap items-center gap-2">
            {recipe.isPremium && (
              <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-amber-900 shadow">
                ⭐ Premium • {priceRsd} RSD
              </span>
            )}
            {locked && (
              <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-gray-900 shadow">
                🔒 Zaključano
              </span>
            )}
          </div>

          {/* favorite */}
          <button
            onClick={toggleFavorite}
            className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-white/90 shadow hover:bg-white transition"
            title="Omiljeni"
          >
            {isFav ? "❤️" : "🤍"}
          </button>

          {/* title */}
          <div className="absolute bottom-4 left-4 right-4">
            <h1 className="text-3xl font-semibold tracking-tight text-white drop-shadow">
              {recipe.title}
            </h1>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-white/95">
              <span className="rounded-full bg-white/15 px-3 py-1">⏱ {recipe.timeMin} min</span>
              <span className="rounded-full bg-white/15 px-3 py-1">⚡ {recipe.difficulty}</span>
              <span className="rounded-full bg-white/15 px-3 py-1">🏷 {recipe.category}</span>
            </div>
          </div>
        </div>

        {/* quick actions + ukratko */}
        <div className="p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-gray-700">
              <span className="font-medium">Ukratko:</span> {recipe.short}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {recipe.isPremium && (
                <button
                  onClick={addRecipeToCart}
                  disabled={locked}
                  className={[
                    "rounded-full px-4 py-2 text-sm font-semibold transition",
                    locked
                      ? "cursor-not-allowed bg-gray-200 text-gray-500"
                      : "bg-amber-500 text-white hover:bg-amber-600",
                  ].join(" ")}
                >
                  Dodaj u korpu
                </button>
              )}

              {recipe.isPremium && (
                <Link href="/cart" className="rounded-full border bg-white px-4 py-2 text-sm hover:bg-gray-50 transition">
                  Korpa →
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PREMIUM LOCK */}
      {locked ? (
        <div className="mt-6 rounded-3xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Premium sadržaj</h2>
          <p className="mt-2 text-gray-700">
            Ovaj recept je premium. Kupi da bi video/la opis, sastojke i pripremu.
          </p>

          <button
            onClick={buyPremium}
            className="mt-4 rounded-full bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 transition"
          >
            Kupi premium recept ({priceRsd} RSD)
          </button>

          <div className="mt-6 rounded-2xl border bg-amber-50 px-4 py-3 text-sm text-gray-700">
            Recenzije su dostupne nakon kupovine premium sadržaja.
          </div>
        </div>
      ) : (
        <>
          {/* OPIS */}
          <div className="mt-6 rounded-3xl border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Opis</h2>
            <p className="mt-2 text-gray-700 leading-relaxed">{recipe.description}</p>
          </div>

          {/* SASTOJCI */}
          <div className="mt-6 rounded-3xl border bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-semibold">Sastojci</h2>

              <Link
                href="/sastojci"
                className="inline-flex items-center justify-center rounded-full border bg-white px-4 py-2 text-sm hover:bg-gray-50 transition"
              >
                Kupi sastojke →
              </Link>
            </div>

            <ul className="mt-4 space-y-2">
              {recipe.ingredients.map((ing, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-3 rounded-2xl bg-amber-50/60 px-4 py-3 text-sm text-gray-800"
                >
                  <span className="mt-0.5">✅</span>
                  <span>{ing}</span>
                </li>
              ))}
            </ul>

            <div className="mt-5 rounded-2xl border bg-white p-4">
              <div className="text-sm font-semibold text-gray-900">Nutritivne vrednosti (OpenFoodFacts)</div>
              <NutritionSearch />
            </div>
          </div>

          {/* PRIPREMA */}
          <div className="mt-6 rounded-3xl border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Priprema</h2>

            <ol className="mt-4 space-y-3">
              {recipe.steps.map((step, idx) => (
                <li key={idx} className="flex gap-3">
                  <div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-amber-500 text-xs font-bold text-white">
                    {idx + 1}
                  </div>
                  <div className="rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-800">
                    {step}
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* REVIEWS */}
          <div className="mt-6 rounded-3xl border bg-white p-6 shadow-sm">
            <ReviewsSection recipeId={recipe.id} />
          </div>
        </>
      )}
    </main>
  );
}