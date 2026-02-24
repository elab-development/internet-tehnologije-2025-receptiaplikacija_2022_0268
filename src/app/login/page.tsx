"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-client";
import Link from "next/link";
import { apiFetch } from "@/lib/apiFetch";

export default function LoginPage() {
  const router = useRouter();
  const { refresh } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      email: email.trim(),
      password,
    };

    const res = await apiFetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || !data?.ok) {
      setError(data?.error ?? "Greška pri prijavi");
      setLoading(false);
      return;
    }

    await refresh();
    router.push("/");
    setLoading(false);
  };

  return (
    <form onSubmit={onSubmit} className="max-w-sm mx-auto mt-10 space-y-4">
      <h1 className="text-xl font-semibold">Prijava</h1>

      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        autoComplete="email"
        className="w-full border p-2"
      />

      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Lozinka"
        autoComplete="current-password"
        className="w-full border p-2"
      />

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <button disabled={loading} className="w-full border p-2 hover:bg-gray-50">
        {loading ? "Prijavljivanje..." : "Prijava"}
      </button>

      <p className="text-sm text-center">
        Nemate nalog?{" "}
        <Link href="/registracija" className="text-blue-600 hover:underline">
          Registrujte se
        </Link>
      </p>
    </form>
  );
}