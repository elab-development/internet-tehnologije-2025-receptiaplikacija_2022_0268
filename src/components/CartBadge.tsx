"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";

export default function CartBadge() {
  const { totalItems } = useCart();

  return (
    <Link href="/cart" className="relative hover:underline">
      Korpa
      {totalItems > 0 && (
        <span className="ml-2 inline-flex min-w-[20px] items-center justify-center rounded-full border px-2 text-xs leading-5">
          {totalItems}
        </span>
      )}
    </Link>
  );
}
