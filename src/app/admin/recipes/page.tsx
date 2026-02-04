import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/authz";
import { cookies } from "next/headers";

type AdminRecipeRow = {
  id: string;
  title: string;
  isPublished: boolean;
  isPremium: boolean;
  priceRSD: number;
  avgRating: number;
  reviewsCount: number;
  createdAt: string;
  author: { email: string; name: string | null };
  category: { name: string };
};

async function fetchRecipes(cookieHeader: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const res = await fetch(`${base}/api/admin/recipes`, {
    headers: cookieHeader ? { cookie: cookieHeader } : {},
    cache: "no-store",
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.ok) throw new Error(data?.error || "Ne mogu da učitam recepte.");
  return data.recipes as AdminRecipeRow[];
}

export default async function AdminRecipesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/");

  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value ?? "";
  const cookieHeader = token ? `session=${token}` : "";

  let recipes: AdminRecipeRow[] = [];
  try {
    recipes = await fetchRecipes(cookieHeader);
  } catch {
    recipes = [];
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin • Recepti</h1>
        <a href="/admin" className="underline">← Nazad</a>
      </div>

      <div className="mt-6 overflow-x-auto rounded border">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-3 py-2">Naslov</th>
              <th className="px-3 py-2">Kategorija</th>
              <th className="px-3 py-2">Autor</th>
              <th className="px-3 py-2">Objavljen</th>
              <th className="px-3 py-2">Premium</th>
              <th className="px-3 py-2">Ocena</th>
              <th className="px-3 py-2">Akcije</th>
            </tr>
          </thead>
          <tbody>
            {recipes.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-3 py-2">{r.title}</td>
                <td className="px-3 py-2">{r.category?.name ?? "-"}</td>
                <td className="px-3 py-2">{r.author?.email ?? "-"}</td>
                <td className="px-3 py-2">{r.isPublished ? "DA" : "NE"}</td>
                <td className="px-3 py-2">{r.isPremium ? `DA (${r.priceRSD} RSD)` : "NE"}</td>
                <td className="px-3 py-2">{r.avgRating.toFixed(2)} ({r.reviewsCount})</td>
                <td className="px-3 py-2">
                  <form action="/admin/recipes/actions" method="post">
                    <input type="hidden" name="recipeId" value={r.id} />
                    <input type="hidden" name="action" value="delete" />
                    <button className="rounded border px-2 py-1 hover:bg-gray-50">
                      Obriši
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {recipes.length === 0 && (
              <tr>
                <td className="px-3 py-6 text-center text-gray-500" colSpan={7}>
                  Nema recepata ili nije uspelo učitavanje.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
