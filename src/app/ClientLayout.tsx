"use client";

import React from "react";
import { AuthProvider } from "@/lib/auth-client";
import { CartProvider } from "@/context/CartContext";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>{children}</CartProvider>
    </AuthProvider>
  );
}
