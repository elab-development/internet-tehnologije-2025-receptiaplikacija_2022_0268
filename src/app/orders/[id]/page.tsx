"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

type OrderItemDto = {
  id: string;
  kind: string;
  productId: string;
  title: string;
  qty: number;
  unitPriceRsd: number;
  lineTotalRsd: number;
};

type OrderStatus = "CREATED" | "PAID" | "CANCELLED";


type OrderDto = {
  id: string;
  address: string;
  phone: string;
  paymentMethod: string;
  totalRsd: number;
  status: OrderStatus;
  createdAt: string;
  items: OrderItemDto[];
};

export default function OrderDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id ?? "";

  const [order, setOrder] = useState<OrderDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [canceling, setCanceling] = useState(false);
  const [cancelMsg, setCancelMsg] = useState<string | null>(null);
  const [cancelErr, setCancelErr] = useState<string | null>(null);

  async function loadOrder(orderId: string) {
    setLoading(true);
    setErr(null);

    const res = await fetch(`/api/orders/${orderId}`, { cache: "no-store" });
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      setErr(data?.error ?? "Ne mogu da učitam porudžbinu.");
      setOrder(null);
      setLoading(false);
      return;
    }

    setOrder(data?.order ?? null);
    setLoading(false);
  }

  useEffect(() => {
    if (id) loadOrder(id);
  }, [id]);

  async function cancelOrder() {
    if (!order) return;

    setCancelMsg(null);
    setCancelErr(null);

    const ok = confirm("Da li si sigurna da želiš da otkažeš porudžbinu?");
    if (!ok) return;

    setCanceling(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/cancel`, {
        method: "POST",
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setCancelErr(data?.error ?? "Porudžbina se ne može otkazati.");
        return;
      }

      setCancelMsg("Porudžbina je otkazana.");
      await loadOrder(order.id);
      router.refresh();
    } catch {
      setCancelErr("Greška u mreži.");
    } finally {
      setCanceling(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <div>Učitavam...</div>
      </main>
    );
  }

  if (err || !order) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="text-red-700">{err ?? "Porudžbina nije pronađena."}</div>
        <Link href="/" className="mt-6 inline-block underline">
          ← Nazad na početnu
        </Link>
      </main>
    );
  }

  const statusLabel =
  order.status === "CREATED"
    ? "Kreirana"
    : order.status === "PAID"
    ? "Plaćena"
    : "Otkazana";


  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Detalji porudžbine</h1>

      <p className="mt-2 text-gray-600">
        Broj porudžbine: <span className="font-medium">{order.id}</span>
      </p>

      <div className="mt-2 text-sm">
        Status: <span className="font-medium">{statusLabel}</span>
      </div>

      <div className="mt-6 rounded-lg border bg-white p-4 space-y-2">
        <div>
          <span className="font-medium">Adresa:</span> {order.address}
        </div>
        <div>
          <span className="font-medium">Telefon:</span> {order.phone}
        </div>
        <div>
          <span className="font-medium">Način plaćanja:</span>{" "}
          {order.paymentMethod === "CARD" ? "Kartica" : "Pouzećem"}
        </div>
        <div className="text-sm text-gray-500">
          Kreirano: {new Date(order.createdAt).toLocaleString("sr-RS")}
        </div>

        {order.status === "CREATED" && (
          <div className="pt-2">
            <button
              type="button"
              onClick={cancelOrder}
              disabled={canceling}
              className="rounded border border-red-600 px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              {canceling ? "Otkazujem..." : "Otkaži porudžbinu"}
            </button>
          </div>
        )}

        {cancelMsg && <div className="text-sm text-green-700">{cancelMsg}</div>}
        {cancelErr && <div className="text-sm text-red-700">{cancelErr}</div>}
      </div>

      <div className="mt-6 rounded-lg border bg-white p-4">
        <h2 className="text-lg font-medium">Stavke</h2>
        <div className="mt-3 space-y-2">
          {order.items.map((it) => (
            <div key={it.id} className="flex items-center justify-between gap-3">
              <div>
                <div className="font-medium">{it.title}</div>
                <div className="text-sm text-gray-600">
                  {it.qty} × {it.unitPriceRsd} RSD
                </div>
              </div>
              <div className="font-medium">{it.lineTotalRsd} RSD</div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between border-t pt-4">
          <div className="font-semibold">Ukupno</div>
          <div className="text-lg font-semibold">{order.totalRsd} RSD</div>
        </div>
      </div>

      <div className="mt-8 flex gap-3">
        <Link href="/" className="rounded bg-black px-5 py-2 text-white">
          Nazad na početnu
        </Link>
        <Link href="/recipes" className="rounded-md border px-5 py-2">
          Nastavi sa receptima
        </Link>
      </div>
    </main>
  );
}
