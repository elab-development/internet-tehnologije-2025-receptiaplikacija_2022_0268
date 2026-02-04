import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/authz";
import { cookies } from "next/headers";

type OrderItemRow = {
  id: string;
  kind: string;
  productId: string;
  title: string;
  qty: number;
  unitPriceRsd: number;
  lineTotalRsd: number;
};

type AdminOrderRow = {
  id: string;
  status: "CREATED" | "PAID" | "CANCELLED";
  totalRsd: number;
  address: string;
  phone: string;
  paymentMethod: "CASH_ON_DELIVERY" | "CARD";
  createdAt: string;
  user: { id: string; email: string; name: string | null };
  items: OrderItemRow[];
};

async function fetchOrders(cookieHeader: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const res = await fetch(`${base}/api/admin/orders`, {
    headers: cookieHeader ? { cookie: cookieHeader } : {},
    cache: "no-store",
  });

  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.ok) throw new Error(data?.error || "Ne mogu da učitam narudžbine.");
  return data.orders as AdminOrderRow[];
}

export default async function AdminOrdersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/");

  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value ?? "";
  const cookieHeader = token ? `session=${token}` : "";

  let orders: AdminOrderRow[] = [];
  try {
    orders = await fetchOrders(cookieHeader);
  } catch {
    orders = [];
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin • Narudžbine</h1>
        <a href="/admin" className="underline">
          ← Nazad
        </a>
      </div>

      <p className="mt-2 text-sm text-gray-600">
        Pregled svih narudžbina u sistemu (admin).
      </p>

      <div className="mt-6 space-y-4">
        {orders.map((o) => (
          <div key={o.id} className="rounded border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm">
                <div>
                  <span className="font-semibold">ID:</span> {o.id}
                </div>
                <div>
                  <span className="font-semibold">Korisnik:</span>{" "}
                  {o.user?.email ?? "-"} {o.user?.name ? `(${o.user.name})` : ""}
                </div>
                <div>
                  <span className="font-semibold">Status:</span> {o.status}
                </div>
                <div>
                  <span className="font-semibold">Plaćanje:</span> {o.paymentMethod}
                </div>
              </div>

              <div className="text-sm text-right">
                <div>
                  <span className="font-semibold">Ukupno:</span> {o.totalRsd} RSD
                </div>
                <div className="text-gray-600">
                  {new Date(o.createdAt).toLocaleString()}
                </div>
              </div>
            </div>

            <div className="mt-3 text-sm">
              <div>
                <span className="font-semibold">Adresa:</span> {o.address}
              </div>
              <div>
                <span className="font-semibold">Telefon:</span> {o.phone}
              </div>
            </div>

            <div className="mt-4 overflow-x-auto rounded border">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left">
                  <tr>
                    <th className="px-3 py-2">Stavka</th>
                    <th className="px-3 py-2">Tip</th>
                    <th className="px-3 py-2">Količina</th>
                    <th className="px-3 py-2">Cena</th>
                    <th className="px-3 py-2">Ukupno</th>
                  </tr>
                </thead>
                <tbody>
                  {o.items.map((it) => (
                    <tr key={it.id} className="border-t">
                      <td className="px-3 py-2">{it.title}</td>
                      <td className="px-3 py-2">{it.kind}</td>
                      <td className="px-3 py-2">{it.qty}</td>
                      <td className="px-3 py-2">{it.unitPriceRsd} RSD</td>
                      <td className="px-3 py-2">{it.lineTotalRsd} RSD</td>
                    </tr>
                  ))}

                  {o.items.length === 0 && (
                    <tr>
                      <td className="px-3 py-4 text-center text-gray-500" colSpan={5}>
                        Nema stavki.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        {orders.length === 0 && (
          <div className="rounded border p-6 text-center text-gray-500">
            Nema narudžbina ili nije uspelo učitavanje.
          </div>
        )}
      </div>
    </main>
  );
}
