"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";


console.log("AUTH CLIENT LOADED");
console.log("AUTH-CLIENT MODULE LOADED");


type User = { id: string; email: string; role: string };

type AuthCtx = {
  user: User | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  console.log("AUTH PROVIDER RENDER");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/me", { credentials: "include" });
      const data = await r.json().catch(() => null);
      if (r.ok && data?.ok) setUser(data.user);
      else setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await fetch("/api/logout", { method: "POST", credentials: "include" });
    setUser(null);
  };

  useEffect(() => {
    refresh();
  }, []);

  const value = useMemo(() => ({ user, loading, refresh, logout }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
