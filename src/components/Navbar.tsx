"use client";

import Link from "next/link";
import CartBadge from "./CartBadge";

export default function Navbar() {
  return (
    <nav className="w-full border-b bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-semibold">
          Recepti aplikacija
        </Link>

        <div className="flex gap-4">
          <Link href="/recipes" className="hover:underline">
            Recepti
          </Link>

          <CartBadge />

          <Link href="/login" className="hover:underline">
            Prijava
          </Link>
        </div>
      </div>
    </nav>
  );
}


