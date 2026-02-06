"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { RECIPES } from "@/lib/recipes";

const LS_KEY = "favoriteRecipeIds";

type MeUser = {
  id: string;
  email: string;
  role: "KUPAC" | "KUVAR" | "ADMIN";
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
};

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
      if (data?.error === "PHONE_TAKEN")
        setMsg("Telefon već postoji kod drugog korisnika.");
      else if (res.status === 401) setMsg("Nisi ulogovana.");
      else if (res.status === 403) setMsg("Nalog nije dostupan.");
      else setMsg("Neuspešno čuvanje.");
    }

    setSaving(false);
  }

  async function changePassword() {
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
      else setPwdMsg("Greška pri promeni lozinke.");
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Profil</h1>
          <p className="text-sm text-gray-600">Tvoji podaci i omiljeni recepti.</p>
        </div>

        <Link
          href="/recipes"
          className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
        >
          ← Nazad na recepte
        </Link>
      </div>

      <section className="mb-10 rounded-2xl border bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Podaci naloga</h2>

          
        </div>

        {loadingMe ? (
          <p className="text-sm text-gray-600">Učitavanje...</p>
        ) : !me ? (
          <p className="text-sm text-gray-600">Nisi ulogovana.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-1 text-sm text-gray-700">
              <p>
                <span className="font-medium">Email:</span> {me.email}
              </p>
              <p>
                <span className="font-medium">Uloga:</span> {me.role}
              </p>
              
            </div>

            <div className="grid gap-4">
              <label className="grid gap-1">
                <span className="text-sm text-gray-600">Korisničko ime</span>
                <input
                  className="rounded-md border px-3 py-2 focus:border-black focus:outline-none"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                />
              </label>

              <label className="grid gap-1">
                <span className="text-sm text-gray-600">Telefon</span>
                <input
                  className="rounded-md border px-3 py-2 focus:border-black focus:outline-none"
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                />
              </label>

              <label className="grid gap-1">
                <span className="text-sm text-gray-600">Ime</span>
                <input
                  className="rounded-md border px-3 py-2 focus:border-black focus:outline-none"
                  value={form.firstName}
                  onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
                />
              </label>

              <label className="grid gap-1">
                <span className="text-sm text-gray-600">Prezime</span>
                <input
                  className="rounded-md border px-3 py-2 focus:border-black focus:outline-none"
                  value={form.lastName}
                  onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
                />
              </label>

              <div className="flex items-center gap-4 pt-2">
                <button
                  onClick={saveProfile}
                  disabled={saving}
                  className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                >
                  {saving ? "Čuvanje..." : "Sačuvaj izmene"}
                </button>

                {msg && <span className="text-sm text-gray-700">{msg}</span>}
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="mb-10 rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">Promena lozinke</h2>

        <div className="grid max-w-md gap-4">
          <input
            type="password"
            placeholder="Trenutna lozinka"
            className="rounded-md border px-3 py-2 focus:border-black focus:outline-none"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
          />

          <input
            type="password"
            placeholder="Nova lozinka (min 6 karaktera)"
            className="rounded-md border px-3 py-2 focus:border-black focus:outline-none"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />

          <button
            onClick={changePassword}
            className="w-fit rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Promeni lozinku
          </button>

          {pwdMsg && <p className="text-sm text-gray-700">{pwdMsg}</p>}
        </div>
      </section>

      <h2 className="text-lg font-medium">❤️ Omiljeni</h2>

      {favoriteRecipes.length === 0 ? (
        <p className="mt-2 text-sm text-gray-600">
          Nemaš omiljene recepte još. Idi na recepte i klikni 🤍.
        </p>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {favoriteRecipes.map((r) => (
            <div key={r.id} className="rounded-lg border bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-medium">{r.title}</h3>

                <button
                  onClick={() => removeFavorite(r.id)}
                  className="text-xl"
                  title="Ukloni iz omiljenih"
                >
                  ❤️
                </button>
              </div>

              <p className="mt-2 text-sm text-gray-700">{r.description}</p>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm text-gray-600">⏱ {r.timeMin} min</span>
                <Link
                  href={`/recipes/${encodeURIComponent(r.id)}`}
                  className="text-sm font-medium hover:underline"
                >
                  Pogledaj detalje →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
