import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/authz";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/");

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Admin panel</h1>

      <div className="mt-6 grid gap-3">
        <Link className="rounded border p-3 hover:bg-gray-50" href="/admin/users">
          Korisnici
        </Link>
        <Link className="rounded border p-3 hover:bg-gray-50" href="/admin/categories">
          Kategorije (recepti)
        </Link>
        <Link className="rounded border p-3 hover:bg-gray-50" href="/admin/recipes">
          Recepti
        </Link>
        <Link className="rounded border p-3 hover:bg-gray-50" href="/admin/orders">
          Narudžbine
        </Link>
      </div>
    </main>
  );
}
