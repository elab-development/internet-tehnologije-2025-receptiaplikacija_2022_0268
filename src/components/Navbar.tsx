"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-client";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  // ✅ "optional" ponašanje bez useAuthOptional exporta
  let auth: ReturnType<typeof useAuth> | null = null;
  try {
    auth = useAuth();
  } catch {
    auth = null;
  }

  const user = auth?.user ?? null;
  const loading = auth?.loading ?? false;

  async function onLogout() {
    try {
      await auth?.logout?.();
    } finally {
      router.refresh();
      if (pathname !== "/") router.push("/");
    }
  }

  return (
    <nav className="w-full border-b bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-semibold">
          Recepti aplikacija
        </Link>

        <div className="flex items-center gap-4">
          <Link href="/recipes" className="hover:underline">
            Recepti
          </Link>

          <Link href="/cart" className="hover:underline">
            Korpa
          </Link>

          {loading ? (
            <span className="text-sm text-gray-500">Učitavanje...</span>
          ) : user ? (
            <>
              <Link href="/profile" className="hover:underline">
                Profil
              </Link>

              <button
                type="button"
                onClick={onLogout}
                className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
              >
                Odjava
              </button>
            </>

          ) : (
            <Link href="/login" className="hover:underline">
              Prijava
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
