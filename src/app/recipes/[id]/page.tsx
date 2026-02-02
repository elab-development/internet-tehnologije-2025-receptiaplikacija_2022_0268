"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { RECIPES } from "@/lib/recipes";
import ReviewForm from "@/components/ReviewForm";

const FAV_LS_KEY = "favoriteRecipeIds";

type ReviewDto = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  userId: string;
};

export default function RecipeDetailsPage() {
  const params = useParams<{ id: string }>();
  const id = decodeURIComponent(params?.id ?? "").trim();

  const recipe = RECIPES.find((r) => r.id.trim() === id);

  const [favorites, setFavorites] = useState<string[]>([]);

  const [user, setUser] = useState<{ id: string } | null>(null);
  const [reviews, setReviews] = useState<ReviewDto[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(FAV_LS_KEY);
    if (saved) setFavorites(JSON.parse(saved));
  }, []);

  const toggleFavorite = () => {
    setFavorites((prev) => {
      const updated = prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id];
      localStorage.setItem(FAV_LS_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  useEffect(() => {
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setUser(data?.user ?? null))
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    if (!id) return;

    setReviewsLoading(true);
    setReviewsError(null);

    fetch(`/api/recipes/${encodeURIComponent(id)}/reviews`, { cache: "no-store" as any })
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.ok) {
          throw new Error(data?.error || "Ne mogu da učitam recenzije.");
        }
        setReviews(data.reviews ?? []);
      })
      .catch((e) => setReviewsError(e?.message || "Greška."))
      .finally(() => setReviewsLoading(false));
  }, [id]);

  const avg = useMemo(() => {
    if (!reviews.length) return null;
    const sum = reviews.reduce((s, r) => s + r.rating, 0);
    return sum / reviews.length;
  }, [reviews]);

  const myReview = useMemo(() => {
    if (!user) return null;
    return reviews.find((r) => r.userId === user.id) ?? null;
  }, [reviews, user]);

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
      </div>

      {/* Prosečna ocena */}
      <div className="mt-4 text-sm text-gray-600">
        {avg === null ? "Još nema ocena." : `Prosečna ocena: ${avg.toFixed(1)}/5 (${reviews.length})`}
      </div>

      <div className="mt-6 rounded-lg border bg-white p-4">
        <h2 className="text-lg font-medium">Ukratko</h2>
        <p className="mt-2 text-gray-700">{recipe.short}</p>
      </div>

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

      {/* FORMA za recenzije */}
      {user ? (
        <ReviewForm
          recipeId={id}
          initialRating={myReview?.rating ?? 5}
          initialComment={myReview?.comment ?? ""}
        />
      ) : (
        <p className="mt-6 text-sm text-gray-600">
          Moraš biti prijavljen da ostaviš recenziju.
        </p>
      )}

      {/* LISTA recenzija */}
      <div className="mt-6 rounded-lg border bg-white p-4">
        <h2 className="text-lg font-medium">Recenzije</h2>

        {reviewsLoading ? (
          <p className="mt-2 text-sm text-gray-600">Učitavam...</p>
        ) : reviewsError ? (
          <p className="mt-2 text-sm text-red-700">{reviewsError}</p>
        ) : reviews.length === 0 ? (
          <p className="mt-2 text-sm text-gray-600">Nema recenzija.</p>
        ) : (
          <ul className="mt-3 space-y-4">
            {reviews.map((r) => {
              const name =
                (r.user.firstName || r.user.lastName)
                  ? `${r.user.firstName ?? ""} ${r.user.lastName ?? ""}`.trim()
                  : r.user.email;

              return (
                <li key={r.id} className="rounded border p-3">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{name}</div>
                    <div className="text-sm">Ocena: {r.rating}/5</div>
                  </div>
                  {r.comment && <p className="mt-2 text-sm text-gray-700">{r.comment}</p>}
                  <p className="mt-2 text-xs text-gray-500">
                    {new Date(r.createdAt).toLocaleString("sr-RS")}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
