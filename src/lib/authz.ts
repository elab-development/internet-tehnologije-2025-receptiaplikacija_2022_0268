import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

const SESSION_COOKIE = "session";

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    select: {
      expiresAt: true,
      user: { select: { id: true, role: true, email: true, name: true, isBlocked: true } },
    },
  });

  if (!session) return null;
  if (session.expiresAt < new Date()) return null;
  if (session.user.isBlocked) return null;

  return session.user;
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, status: 401, error: "Morate biti prijavljeni." };
  if (user.role !== "ADMIN") return { ok: false as const, status: 403, error: "Nemate admin prava." };
  return { ok: true as const, user };
}
