"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";

type PaymentMethod = "CASH_ON_DELIVERY" | "CARD";
type Kind = "RECIPE" | "INGREDIENT";

export default function CheckoutPage() {
  const router = useRouter();

  const { items, totalPriceRsd, clearCart } = useCart() as any;

  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("CASH_ON_DELIVERY");

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return (
      !saving &&
      (items?.length ?? 0) > 0 &&
      address.trim().length > 0 &&
      phone.trim().length > 0
    );
  }, [saving, items, address, phone]);

  async function submit() {
    setMsg(null);
    setErr(null);

    const addressTrim = address.trim();
    const phoneTrim = phone.trim();

    if (!addressTrim || !phoneTrim) {
      setErr("Nisu uneti svi podaci za dostavu.");
      return;
    }

    if (!items || items.length === 0) {
      setErr("Korpa je prazna.");
      return;
    }

    const payload = {
      address: addressTrim,
      phone: phoneTrim,
      paymentMethod,
      items: items.map((i: any) => {
        const qty = Number(i.qty ?? i.quantity ?? 1);

        const priceRsd = Number(i.priceRsd ?? i.unitPriceRsd ?? 0);

        const id = String(i.id ?? "");

        const kind = String(i.kind ?? "").toUpperCase() as Kind;

        return {
          kind,
          id,
          title: String(i.title ?? ""),
          qty,
          priceRsd,
        };
      }),
    };

    setSaving(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setErr(data?.error ?? "Sistem ne može da kreira narudžbinu.");
        return;
      }

      const orderId = data?.orderId as string | undefined;
      if (!orderId) {
        setErr("Narudžbina je kreirana, ali nedostaje ID porudžbine.");
        return;
      }

      setMsg("Narudžbina je uspešno kreirana.");
      clearCart?.();

      router.push(`/orders/${orderId}`);
      router.refresh();
    } catch (e) {
      setErr("Greška u mreži. Pokušaj ponovo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Checkout</h1>
          <p className="text-sm text-gray-600">
            Unesi podatke za dostavu i potvrdi narudžbinu.
          </p>
        </div>

        <Link href="/cart" className="text-sm underline">
          ← Nazad u korpu
        </Link>
      </div>

      <div className="mt-6 rounded-lg border bg-white p-4">
        <div className="flex items-center justify-between">
          <div className="font-medium">Ukupno</div>
          <div className="text-lg font-semibold">
            {Number(totalPriceRsd ?? 0)} RSD
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium">Adresa *</label>
            <input
              className="mt-1 w-full rounded border p-2"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Ulica i broj, grad"
              disabled={saving}
              autoComplete="street-address"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Kontakt telefon *</label>
            <input
              className="mt-1 w-full rounded border p-2"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+381..."
              disabled={saving}
              inputMode="tel"
              autoComplete="tel"
            />
          </div>

          <div>
            <label htmlFor="paymentMethod" className="text-sm font-medium">
              Način plaćanja
            </label>

            <select
              id="paymentMethod"
              className="mt-1 w-full rounded border p-2"
              value={paymentMethod}
              onChange={(e) =>
                setPaymentMethod(e.currentTarget.value as PaymentMethod)
              }
              disabled={saving}
            >
              <option value="CASH_ON_DELIVERY">Pouzećem</option>
              <option value="CARD">Kartica</option>
            </select>
          </div>

          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit}
            className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
          >
            {saving ? "Kreiram..." : "Potvrdi narudžbinu"}
          </button>

          {msg && <div className="text-sm text-green-700">{msg}</div>}
          {err && <div className="text-sm text-red-700">{err}</div>}
        </div>
      </div>

      <div className="mt-6 rounded-lg border bg-white p-4">
        <h2 className="text-lg font-medium">Stavke</h2>

        {!items || items.length === 0 ? (
          <div className="mt-2 text-sm text-gray-600">Korpa je prazna.</div>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {items.map((i: any) => {
              const qty = Number(i.qty ?? i.quantity ?? 1);
              const price = Number(i.priceRsd ?? 0);

              return (
                <li
                  key={`${i.kind}-${i.id}`}
                  className="flex justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="font-medium truncate">{i.title}</div>
                    <div className="text-gray-600">
                      {i.kind} • {qty} kom
                    </div>
                  </div>

                  <div className="font-medium whitespace-nowrap">
                    {qty * price} RSD
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
