export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

const SESSION_COOKIE = "session";

async function getMe() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    select: {
      expiresAt: true,
      user: { select: { id: true, role: true, isBlocked: true } },
    },
  });

  if (!session) return null;
  if (session.expiresAt < new Date()) return null;
  if (session.user.isBlocked) return null;
  return session.user;
}

export async function GET() {
  try {
    const me = await getMe();
    if (!me) return NextResponse.json({ ok: false, error: "NO_SESSION" }, { status: 401 });
    if (!(me.role === "KUVAR" || me.role === "ADMIN"))
      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });

    const recipes = await prisma.recipe.findMany({
      orderBy: { createdAt: "desc" },
      where: me.role === "ADMIN" ? {} : { authorId: me.id },
      select: {
        id: true,
        title: true,
        isPublished: true,
        isPremium: true,
        priceRSD: true,
        createdAt: true,
        category: { select: { name: true } },
      },
    });

    return NextResponse.json({ ok: true, recipes });
  } catch {
    return NextResponse.json({ ok: false, error: "Ne mogu da učitam KUVAR recepte." }, { status: 500 });
  }
}
