"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { RECIPES } from "@/lib/recipes";

const LS_KEY = "favoriteRecipeIds";

type MeUser = {
  id: string;
  email: string;
  role: "KUPAC" | "KUVAR" | "ADMIN";
  isPremium: boolean;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
};

type MyOrderRow = {
  id: string;
  createdAt: string;
  totalRsd: number;
  paymentMethod: "CASH_ON_DELIVERY" | "CARD";
  _count: { items: number };
};

function formatRsd(n: number) {
  const val = Number(n || 0);
  return `${val.toLocaleString("sr-RS")} RSD`;
}

function roleLabel(role: MeUser["role"]) {
  if (role === "ADMIN") return "Admin";
  if (role === "KUVAR") return "Kuvar";
  return "Kupac";
}

export default function ProfilePage() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [me, setMe] = useState<MeUser | null>(null);
  const [loadingMe, setLoadingMe] = useState(true);

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    firstName: "",
    lastName: "",
    phone: "",
  });

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwdMsg, setPwdMsg] = useState<string | null>(null);
  const [pwdSaving, setPwdSaving] = useState(false);

  const [orders, setOrders] = useState<MyOrderRow[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [ordersErr, setOrdersErr] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(LS_KEY);
    if (saved) setFavorites(JSON.parse(saved));
  }, []);

  useEffect(() => {
    (async () => {
      setLoadingMe(true);
      setMsg(null);

      const res = await fetch("/api/me");
      if (!res.ok) {
        setMe(null);
        setLoadingMe(false);
        return;
      }

      const data = await res.json();
      const u: MeUser = data.user;

      setMe(u);
      setForm({
        name: u.name ?? "",
        firstName: u.firstName ?? "",
        lastName: u.lastName ?? "",
        phone: u.phone ?? "",
      });

      setLoadingMe(false);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      setLoadingOrders(true);
      setOrdersErr(null);

      try {
        const res = await fetch("/api/my-orders", { cache: "no-store" });
        const data = await res.json().catch(() => null);

        if (!res.ok) {
          setOrders([]);
          setOrdersErr(data?.error ?? "Ne mogu da učitam porudžbine.");
          return;
        }

        setOrders(data?.orders ?? []);
      } catch {
        setOrders([]);
        setOrdersErr("Greška u mreži.");
      } finally {
        setLoadingOrders(false);
      }
    })();
  }, []);

  const favoriteRecipes = useMemo(
    () => RECIPES.filter((r) => favorites.includes(r.id)),
    [favorites]
  );

  const removeFavorite = (id: string) => {
    const updated = favorites.filter((x) => x !== id);
    setFavorites(updated);
    localStorage.setItem(LS_KEY, JSON.stringify(updated));
  };

  async function saveProfile() {
    setSaving(true);
    setMsg(null);

    const res = await fetch("/api/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      const data = await res.json();
      setMe(data.user);
      setMsg("Sačuvano.");
    } else {
      const data = await res.json().catch(() => null);
      if (data?.error === "PHONE_TAKEN") setMsg("Telefon već postoji kod drugog korisnika.");
      else if (res.status === 401) setMsg("Nisi ulogovana.");
      else if (res.status === 403) setMsg("Nalog nije dostupan.");
      else setMsg("Neuspešno čuvanje.");
    }

    setSaving(false);
  }

  async function changePassword() {
    setPwdSaving(true);
    setPwdMsg(null);

    const res = await fetch("/api/me/password", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oldPassword, newPassword }),
    });

    if (res.ok) {
      setPwdMsg("Lozinka je uspešno promenjena.");
      setOldPassword("");
      setNewPassword("");
    } else {
      const data = await res.json().catch(() => null);
      if (data?.error === "WRONG_PASSWORD") setPwdMsg("Pogrešna trenutna lozinka.");
      else if (data?.error === "INVALID_INPUT") setPwdMsg("Nova lozinka mora imati bar 6 karaktera.");
      else if (data?.error === "NO_SESSION" || res.status === 401) setPwdMsg("Nisi ulogovana.");
      else setPwdMsg("Greška pri promeni lozinke.");
    }

    setPwdSaving(false);
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Profil</h1>
          <p className="mt-1 text-sm text-gray-600">Tvoji podaci, porudžbine i omiljeni recepti.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/recipes"
            className="inline-flex items-center justify-center rounded-full border bg-white px-4 py-2 text-sm hover:bg-gray-50 transition"
          >
            ← Recepti
          </Link>
          <Link
            href="/sastojci"
            className="inline-flex items-center justify-center rounded-full border bg-white px-4 py-2 text-sm hover:bg-gray-50 transition"
          >
            Sastojci →
          </Link>
        </div>
      </div>

      {}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {}
        <section className="rounded-3xl border bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Podaci naloga</h2>
              <p className="mt-1 text-sm text-gray-600">Ažuriraj osnovne podatke naloga.</p>
            </div>

            {me?.isPremium ? (
              <span className="w-fit rounded-full bg-amber-100/80 px-3 py-1 text-xs font-semibold text-amber-900">
                ⭐ Premium korisnik
              </span>
            ) : null}
          </div>

          <div className="mt-6">
            {loadingMe ? (
              <div className="rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-700">Učitavanje...</div>
            ) : !me ? (
              <div className="rounded-2xl border bg-amber-50 px-4 py-3 text-sm text-gray-800">Nisi ulogovana.</div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {}
                <div className="space-y-3">
                  <div className="rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-800">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Email</span>
                      <span className="font-semibold">{me.email}</span>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-800">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Uloga</span>
                      <span className="font-semibold">{roleLabel(me.role)}</span>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-800">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Premium</span>
                      <span className="font-semibold">{me.isPremium ? "Da" : "Ne"}</span>
                    </div>
                  </div>

                  {msg && (
                    <div className="rounded-2xl border bg-white px-4 py-3 text-sm text-gray-800">{msg}</div>
                  )}
                </div>

                {/* RIGHT */}
                <div className="grid gap-4">
                  <label className="grid gap-1">
                    <span className="text-sm text-gray-600">Korisničko ime</span>
                    <input
                      className="rounded-2xl border bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-300"
                      value={form.name}
                      onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    />
                  </label>

                  <label className="grid gap-1">
                    <span className="text-sm text-gray-600">Telefon</span>
                    <input
                      className="rounded-2xl border bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-300"
                      value={form.phone}
                      onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                    />
                  </label>

                  {}
                  <div className="grid gap-4">
                    <label className="grid gap-1">
                      <span className="text-sm text-gray-600">Ime</span>
                      <input
                        className="rounded-2xl border bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-300"
                        value={form.firstName}
                        onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
                      />
                    </label>

                    <label className="grid gap-1">
                      <span className="text-sm text-gray-600">Prezime</span>
                      <input
                        className="rounded-2xl border bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-300"
                        value={form.lastName}
                        onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
                      />
                    </label>
                  </div>
                  {}

                  <div className="pt-2">
                    <button
                      onClick={saveProfile}
                      disabled={saving}
                      className={[
                        "inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition",
                        saving
                          ? "cursor-not-allowed bg-gray-200 text-gray-500"
                          : "bg-amber-500 text-white hover:bg-amber-600",
                      ].join(" ")}
                    >
                      {saving ? "Čuvanje..." : "Sačuvaj izmene"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {}
        <section className="rounded-3xl border bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-xl font-semibold">Promena lozinke</h2>
            <p className="mt-1 text-sm text-gray-600">Preporuka: minimum 6 karaktera.</p>
          </div>

          <div className="mt-6 grid gap-3">
            <input
              type="password"
              placeholder="Trenutna lozinka"
              className="rounded-2xl border bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-300"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
            />

            <input
              type="password"
              placeholder="Nova lozinka (min 6 karaktera)"
              className="rounded-2xl border bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-300"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={changePassword}
                disabled={pwdSaving}
                className={[
                  "inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition",
                  pwdSaving
                    ? "cursor-not-allowed bg-gray-200 text-gray-500"
                    : "bg-gray-900 text-white hover:bg-gray-800",
                ].join(" ")}
              >
                {pwdSaving ? "Menjam..." : "Promeni lozinku"}
              </button>

              {pwdMsg && <span className="text-sm text-gray-700">{pwdMsg}</span>}
            </div>
          </div>
        </section>
      </div>

      {}
      <section className="mt-6 rounded-3xl border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Moje porudžbine</h2>
            <p className="mt-1 text-sm text-gray-600">Pregled poslednjih porudžbina.</p>
          </div>

          <div className="text-sm text-gray-600">
            {orders.length > 0 ? (
              <span className="rounded-full bg-amber-100/70 px-3 py-1 text-xs text-amber-900">
                Ukupno: {orders.length}
              </span>
            ) : null}
          </div>
        </div>

        <div className="mt-5">
          {loadingOrders ? (
            <div className="rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-700">Učitavam porudžbine...</div>
          ) : ordersErr ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {ordersErr}
            </div>
          ) : orders.length === 0 ? (
            <div className="rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-700">Još nemaš porudžbina.</div>
          ) : (
            <ul className="space-y-3">
              {orders.map((o) => (
                <li key={o.id} className="rounded-2xl border p-4 hover:bg-gray-50 transition">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="font-semibold">Porudžbina #{o.id.slice(0, 8)}</div>
                        <span className="rounded-full bg-amber-100/70 px-3 py-1 text-xs text-amber-900">
                          {o.paymentMethod === "CARD" ? "Kartica" : "Pouzećem"}
                        </span>
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
                          {o._count.items} stavki
                        </span>
                      </div>

                      <div className="mt-1 text-sm text-gray-600">
                        {new Date(o.createdAt).toLocaleString("sr-RS")}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-900">
                        {formatRsd(Number(o.totalRsd))}
                      </div>

                      <Link
                        href={`/orders/${o.id}`}
                        className="inline-flex items-center justify-center rounded-full border bg-white px-4 py-2 text-sm hover:bg-gray-50 transition"
                      >
                        Detalji →
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {}
      <section className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Omiljeni</h2>
          <span className="text-sm text-gray-600">{favoriteRecipes.length} recepta</span>
        </div>

        {favoriteRecipes.length === 0 ? (
          <div className="mt-4 rounded-3xl border bg-white p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-100 text-2xl">❤️</div>
              <div>
                <div className="font-semibold">Nema omiljenih recepata</div>
                <div className="mt-1 text-sm text-gray-600">Idi na recepte i klikni 🤍 da dodaš omiljene.</div>
                <div className="mt-4">
                  <Link
                    href="/recipes"
                    className="inline-flex items-center justify-center rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 transition"
                  >
                    Idi na recepte →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {favoriteRecipes.map((r) => (
              <div
                key={r.id}
                className="rounded-3xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="min-w-0 truncate text-lg font-semibold">{r.title}</h3>

                  <button
                    onClick={() => removeFavorite(r.id)}
                    className="grid h-10 w-10 place-items-center rounded-full bg-amber-50 text-xl hover:bg-amber-100 transition"
                    title="Ukloni iz omiljenih"
                  >
                    ❤️
                  </button>
                </div>

                <p className="mt-2 line-clamp-3 text-sm text-gray-700">{r.description}</p>

                <div className="mt-4 flex items-center justify-between gap-2">
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
                    ⏱ {r.timeMin} min
                  </span>

                  <Link
                    href={`/recipes/${encodeURIComponent(r.id)}`}
                    className="text-sm font-semibold text-gray-900 hover:underline"
                  >
                    Detalji →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}