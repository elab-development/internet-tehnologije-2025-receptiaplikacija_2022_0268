"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-client";
import { useCart } from "@/context/CartContext";

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      className={[
        "rounded-full px-3 py-1.5 text-sm transition",
        active
          ? "bg-amber-100 text-amber-900 font-semibold"
          : "text-gray-700 hover:bg-gray-100",
      ].join(" ")}
    >
      {children}
    </Link>
  );
}

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
    <nav className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur">
      <div className="container-app flex items-center justify-between py-3">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Recepti aplikacija
        </Link>

        <div className="flex items-center gap-2">
          <NavLink href="/recipes">Recepti</NavLink>
          <NavLink href="/sastojci">Sastojci</NavLink>

          <div className="relative">
            <NavLink href="/cart">Korpa</NavLink>

            {cart.totalItems > 0 && (
              <span className="pointer-events-none absolute -right-1 -top-1 inline-flex min-w-[22px] items-center justify-center rounded-full bg-amber-500 px-2 py-0.5 text-xs font-semibold text-white">
                {cart.totalItems}
              </span>
            )}
          </div>

          <div className="ml-2 flex items-center gap-2">
            {loading ? (
              <span className="text-sm text-gray-500">Učitavanje...</span>
            ) : user ? (
              <>
                {user.role === "KUVAR" && (
                  <NavLink href="/kuvar/recipes">Kuvar panel</NavLink>
                )}

                <NavLink href="/profile">Profil</NavLink>

                <button type="button" onClick={onLogout} className="btn">
                  Odjava
                </button>
              </>
            ) : (
              <NavLink href="/login">Prijava</NavLink>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
