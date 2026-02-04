"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-client";
import { useCart } from "@/context/CartContext";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  let auth: ReturnType<typeof useAuth> | null = null;
  try {
    auth = useAuth();
  } catch {
    auth = null;
  }

  const user = auth?.user ?? null;
  const loading = auth?.loading ?? false;

  const cart = useCart();

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

          <Link href="/sastojci" className="hover:underline">
            Sastojci
          </Link>

          <Link href="/cart" className="relative hover:underline">
            Korpa
            {cart.totalItems > 0 && (
              <span className="ml-2 inline-flex min-w-[20px] items-center justify-center rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">
                {cart.totalItems}
              </span>
            )}
          </Link>

          {loading ? (
            <span className="text-sm text-gray-500">Učitavanje...</span>
          ) : user ? (
            <>
              {/* admin */}
              {user.role === "ADMIN" && (
                <Link href="/admin" className="hover:underline font-semibold text-red-600">
                  Admin
                </Link>
              )}

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
