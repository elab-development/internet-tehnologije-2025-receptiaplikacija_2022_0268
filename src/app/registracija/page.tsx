"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/apiFetch";

export default function RegistracijaPage() {
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [role, setRole] = useState<"KUPAC" | "KUVAR">("KUPAC");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const emailNorm = email.trim();
    const phoneNorm = phone.trim().replace(/\s+/g, "");

    if (password.length < 8) {
      setError("Lozinka mora imati minimum 8 karaktera.");
      return;
    }

    if (password !== password2) {
      setError("Lozinke se ne poklapaju.");
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phoneNorm,
          email: emailNorm,
          password,
          role,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        setError(data?.error ?? "Greška pri registraciji.");
        return;
      }

      router.push("/login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border bg-black/40 backdrop-blur p-6 shadow-lg">
        <h1 className="text-2xl font-semibold">Registracija</h1>
        <p className="text-sm text-gray-300 mt-1">
          Napravi nalog da bi mogao/la da koristiš prodavnicu recepata.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="firstName" className="text-sm text-gray-200">Ime</label>
              <input
                id="firstName"
                name="firstName"
                className="mt-1 w-full rounded-lg border bg-transparent p-2"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                autoComplete="given-name"
              />
            </div>

            <div>
              <label htmlFor="lastName" className="text-sm text-gray-200">Prezime</label>
              <input
                id="lastName"
                name="lastName"
                className="mt-1 w-full rounded-lg border bg-transparent p-2"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                autoComplete="family-name"
              />
            </div>
          </div>

          <div>
            <label htmlFor="phone" className="text-sm text-gray-200">Broj telefona</label>
            <input
              id="phone"
              name="phone"
              className="mt-1 w-full rounded-lg border bg-transparent p-2"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+3816xxxxxxx"
              autoComplete="tel"
            />
          </div>

          <div>
            <span className="text-sm text-gray-200">Prijavljujem se kao</span>
            <div className="mt-2 flex gap-3">
              <label htmlFor="role-kupac" className="flex items-center gap-2 rounded-lg border bg-transparent p-2 cursor-pointer">
                <input
                  id="role-kupac"
                  type="radio"
                  name="role"
                  checked={role === "KUPAC"}
                  onChange={() => setRole("KUPAC")}
                />
                Kupac
              </label>

              <label htmlFor="role-kuvar" className="flex items-center gap-2 rounded-lg border bg-transparent p-2 cursor-pointer">
                <input
                  id="role-kuvar"
                  type="radio"
                  name="role"
                  checked={role === "KUVAR"}
                  onChange={() => setRole("KUVAR")}
                />
                Kuvar
              </label>
            </div>
          </div>

          <div>
            <label htmlFor="email" className="text-sm text-gray-200">Email</label>
            <input
              id="email"
              name="email"
              className="mt-1 w-full rounded-lg border bg-transparent p-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@gmail.com"
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="password" className="text-sm text-gray-200">Lozinka</label>
            <input
              id="password"
              name="password"
              type="password"
              className="mt-1 w-full rounded-lg border bg-transparent p-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 8 karaktera"
              autoComplete="new-password"
            />
          </div>

          <div>
            <label htmlFor="password2" className="text-sm text-gray-200">Potvrdi lozinku</label>
            <input
              id="password2"
              name="password2"
              type="password"
              className="mt-1 w-full rounded-lg border bg-transparent p-2"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              placeholder="Ponovi lozinku"
              autoComplete="new-password"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 border border-red-500/40 bg-red-500/10 rounded-lg p-2">
              {error}
            </p>
          )}

          <button
            disabled={loading}
            className="w-full rounded-xl border p-2 font-medium hover:bg-white/10 disabled:opacity-60"
          >
            {loading ? "Kreiram nalog..." : "Registruj se"}
          </button>

          <p className="text-sm text-center text-gray-200">
            Imaš nalog?{" "}
            <Link href="/login" className="text-blue-400 hover:underline">
              Prijavi se
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}