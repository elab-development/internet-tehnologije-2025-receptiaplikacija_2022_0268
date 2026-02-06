"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-client";

type RecipeRow = {
  id: string;
  title: string;
  description: string;
  prepTimeMinutes: number;
  difficulty: number;
  imageUrl: string | null;
  isPremium: boolean;
  priceRSD: number;
  category: { name: string } | null;
};

const FAV_LS_KEY = "favoriteRecipeIds";

export default function RecipesPage() {
  const router = useRouter();
  const pathname = usePathname();

  const auth = useAuth();
  const user = auth?.user ?? null;
  const loadingAuth = auth?.loading ?? false;

  const [q, setQ] = useState("");
  const [category, setCategory] = useState("SVE");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recipes, setRecipes] = useState<RecipeRow[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(FAV_LS_KEY);
    if (saved) setFavorites(JSON.parse(saved));
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      setErr(null);
      const res = await fetch("/api/recipes", { cache: "no-store" });
      const data = await res.json().catch(() => null);
      if (!alive) return;

      if (!res.ok || !data?.ok) {
        setErr(data?.error || "Ne mogu da učitam recepte.");
        setRecipes([]);
        return;
      }

      setRecipes(data.recipes || []);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const toggleFavorite = (id: string) => {
 
    if (loadingAuth) return;
    if (!user?.id) {
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    setFavorites((prev) => {
      const updated = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      localStorage.setItem(FAV_LS_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const r of recipes) set.add(String(r.category?.name ?? "Ostalo"));
    return ["SVE", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [recipes]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return recipes.filter((r) => {
      const catName = String(r.category?.name ?? "Ostalo");
      const catOk = category === "SVE" ? true : catName === category;

      if (!query) return catOk;

      const hay = [r.title, r.description, catName, String(r.difficulty)]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return catOk && hay.includes(query);
    });
  }, [recipes, q, category]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight">Recepti</h1>
          <p className="mt-1 text-sm text-gray-600">
            Pronađi ideju za ručak, večeru ili nešto slatko.
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Pretraga (npr. pasta, piletina...)"
            className="w-full rounded-2xl border bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-300 sm:w-80"
          />

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-2xl border bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-300 sm:w-56"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {err && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {err}
        </div>
      )}

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((r) => {
          const isFav = favorites.includes(r.id);
          const catName = String(r.category?.name ?? "Ostalo");

          return (
            <div
              key={r.id}
              className="group overflow-hidden rounded-3xl border bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              <Link href={`/recipes/${encodeURIComponent(r.id)}`} className="block">
                <div className="relative h-48 w-full bg-gradient-to-br from-amber-100 to-rose-100">
                  {r.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={r.imageUrl}
                      alt={r.title}
                      className="h-full w-full object-cover transition group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-4xl">🍲</div>
                  )}

                  <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/40 to-transparent" />

                  {r.isPremium && (
                    <div className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-amber-900 shadow">
                      ⭐ Premium • {Number(r.priceRSD ?? 0)} RSD
                    </div>
                  )}

                  <button
                    type="button"
                    className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-white/90 shadow hover:bg-white transition"
                    title={!user?.id ? "Prijavi se da dodaš u omiljene" : "Omiljeni"}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleFavorite(r.id);
                    }}
                  >
                    {isFav ? "❤️" : "🤍"}
                  </button>
                </div>
              </Link>

              <div className="p-5">
                <Link href={`/recipes/${encodeURIComponent(r.id)}`} className="block">
                  <h2 className="text-lg font-semibold leading-snug tracking-tight">{r.title}</h2>
                </Link>

                <p className="mt-2 line-clamp-3 text-sm text-gray-700">{r.description}</p>

                <div className="mt-4 flex flex-wrap gap-2 text-xs text-gray-800">
                  <span className="rounded-full bg-amber-100/70 px-3 py-1">
                    ⏱ {r.prepTimeMinutes} min
                  </span>
                  <span className="rounded-full bg-amber-100/70 px-3 py-1">
                    ⚡ Težina: {r.difficulty}
                  </span>
                  <span className="rounded-full bg-amber-100/70 px-3 py-1">🏷 {catName}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && !err && (
        <div className="mt-10 rounded-3xl border bg-white p-8 text-center shadow-sm">
          <p className="text-gray-700">Nema rezultata za ovu pretragu.</p>
          <button
            onClick={() => {
              setQ("");
              setCategory("SVE");
            }}
            className="mt-4 rounded-full bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 transition"
          >
            Resetuj filtere
          </button>
        </div>
      )}
    </main>
  );
}
    