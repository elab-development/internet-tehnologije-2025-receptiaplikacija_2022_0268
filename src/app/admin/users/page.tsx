import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/authz";
import { cookies } from "next/headers";

type AdminUserRow = {
  id: string;
  email: string;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  role: "KUPAC" | "KUVAR" | "ADMIN";
  isBlocked: boolean;
  isPremium: boolean;
  createdAt: string;
};

async function fetchUsers(cookieHeader: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const res = await fetch(`${base}/api/admin/users`, {
    headers: cookieHeader ? { cookie: cookieHeader } : {},
    cache: "no-store",
  });

  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.ok) {
    throw new Error(data?.error || "Ne mogu da učitam korisnike.");
  }
  return data.users as AdminUserRow[];
}

export default async function AdminUsersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/");

  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value ?? "";
  const cookieHeader = token ? `session=${token}` : "";

  let users: AdminUserRow[] = [];
  try {
    users = await fetchUsers(cookieHeader);
  } catch {
    users = [];
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin • Korisnici</h1>
        <a href="/admin" className="underline">
          ← Nazad
        </a>
      </div>

      <p className="mt-2 text-sm text-gray-600">
        Ovde možeš da blokiraš/reaktiviraš/obrišeš korisnike.
      </p>

      <div className="mt-6 overflow-x-auto rounded border">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Ime</th>
              <th className="px-3 py-2">Uloga</th>
              <th className="px-3 py-2">Premium</th>
              <th className="px-3 py-2">Blokiran</th>
              <th className="px-3 py-2">Akcije</th>
            </tr>
          </thead>

          <tbody>
            {users.map((u) => {
              const fullName = [u.firstName ?? "", u.lastName ?? ""]
                .join(" ")
                .trim();
              const displayName = u.name?.trim() || fullName || "-";

              const isSelf = u.id === user.id;

              const blockTitle = isSelf
                ? "Ne možete blokirati sopstveni nalog"
                : u.isBlocked
                ? "Reaktiviraj korisnika"
                : "Blokiraj korisnika";

              const deleteTitle = isSelf
                ? "Ne možete obrisati sopstveni nalog"
                : "Obriši korisnika";

              const disabledBtnClass =
                "opacity-50 cursor-not-allowed hover:bg-transparent";

              return (
                <tr key={u.id} className="border-t">
                  <td className="px-3 py-2">{u.email}</td>
                  <td className="px-3 py-2">{displayName}</td>
                  <td className="px-3 py-2">{u.role}</td>
                  <td className="px-3 py-2">{u.isPremium ? "DA" : "NE"}</td>
                  <td className="px-3 py-2">{u.isBlocked ? "DA" : "NE"}</td>

                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <form action="/admin/users/actions" method="post">
                        <input type="hidden" name="userId" value={u.id} />
                        <input
                          type="hidden"
                          name="action"
                          value={u.isBlocked ? "reactivate" : "block"}
                        />
                        <button
                          type="submit"
                          disabled={isSelf}
                          title={blockTitle}
                          className={`rounded border px-2 py-1 hover:bg-gray-50 ${
                            isSelf ? disabledBtnClass : ""
                          }`}
                        >
                          {u.isBlocked ? "Reaktiviraj" : "Blokiraj"}
                        </button>
                      </form>
                      <form action="/admin/users/actions" method="post">
                        <input type="hidden" name="userId" value={u.id} />
                        <input type="hidden" name="action" value="delete" />
                        <button
                          type="submit"
                          disabled={isSelf}
                          title={deleteTitle}
                          className={`rounded border px-2 py-1 hover:bg-gray-50 ${
                            isSelf ? disabledBtnClass : ""
                          }`}
                        >
                          Obriši
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}

            {users.length === 0 && (
              <tr>
                <td className="px-3 py-6 text-center text-gray-500" colSpan={6}>
                  Nema korisnika ili nije uspelo učitavanje.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
