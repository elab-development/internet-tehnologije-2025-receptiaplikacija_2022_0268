import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/authz";
import { cookies } from "next/headers";

type CategoryRow = { id: string; name: string };

async function fetchCategories(cookieHeader: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const res = await fetch(`${base}/api/admin/categories`, {
    headers: cookieHeader ? { cookie: cookieHeader } : {},
    cache: "no-store",
  });

  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.ok) {
    throw new Error(data?.error || "Ne mogu da učitam kategorije.");
  }
  return data.categories as CategoryRow[];
}

export default async function AdminCategoriesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/");

  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value ?? "";
  const cookieHeader = token ? `session=${token}` : "";

  let categories: CategoryRow[] = [];
  try {
    categories = await fetchCategories(cookieHeader);
  } catch {
    categories = [];
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin • Kategorije recepata</h1>
        <a href="/admin" className="underline">
          ← Nazad
        </a>
      </div>

      <p className="mt-2 text-sm text-gray-600">
        Dodavanje, izmena i brisanje kategorija recepata.
      </p>

      {/* dodavanjeee */}
      <form
        action="/admin/categories/actions"
        method="post"
        className="mt-6 flex gap-2"
      >
        <input type="hidden" name="action" value="create" />

        {/*  */}
        <label className="sr-only" htmlFor="create-category-name">
          Naziv nove kategorije
        </label>
        <input
          id="create-category-name"
          name="name"
          placeholder="Nova kategorija (npr. Testenine)"
          title="Naziv nove kategorije"
          className="w-full rounded border px-3 py-2 text-sm"
        />

        <button className="rounded border px-3 py-2 text-sm hover:bg-gray-50">
          Dodaj
        </button>
      </form>

      {/* llista */}
      <div className="mt-6 overflow-x-auto rounded border">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-3 py-2">Naziv</th>
              <th className="px-3 py-2">Akcije</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="px-3 py-2">
                  {/*  */}
                  <form
                    action="/admin/categories/actions"
                    method="post"
                    className="flex gap-2"
                  >
                    <input type="hidden" name="action" value="rename" />
                    <input type="hidden" name="id" value={c.id} />

                    {/* accessibility */}
                    <label className="sr-only" htmlFor={`rename-${c.id}`}>
                      Izmeni naziv kategorije
                    </label>
                    <input
                      id={`rename-${c.id}`}
                      name="name"
                      defaultValue={c.name}
                      placeholder="Novi naziv kategorije"
                      title="Novi naziv kategorije"
                      className="w-full rounded border px-3 py-1 text-sm"
                    />

                    <button className="rounded border px-2 py-1 hover:bg-gray-50">
                      Sačuvaj
                    </button>
                  </form>
                </td>

                <td className="px-3 py-2">
                  <form action="/admin/categories/actions" method="post">
                    <input type="hidden" name="action" value="delete" />
                    <input type="hidden" name="id" value={c.id} />
                    <button className="rounded border px-2 py-1 hover:bg-gray-50">
                      Obriši
                    </button>
                  </form>
                </td>
              </tr>
            ))}

            {categories.length === 0 && (
              <tr>
                <td
                  className="px-3 py-6 text-center text-gray-500"
                  colSpan={2}
                >
                  Nema kategorija ili nije uspelo učitavanje.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
