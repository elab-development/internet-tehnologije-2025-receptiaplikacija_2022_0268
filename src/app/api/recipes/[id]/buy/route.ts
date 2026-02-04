export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

const SESSION_COOKIE = "session";

async function getUserId() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    select: { expiresAt: true, user: { select: { id: true, isBlocked: true, role: true } } },
  });

  if (!session) return null;
  if (session.expiresAt < new Date()) return null;
  if (session.user.isBlocked) return null;
  if (session.user.role !== "KUPAC") return null;

  return session.user.id;
}

export async function POST(_req: Request, ctx: { params: { id: string } }) {
  const recipeId = decodeURIComponent(ctx.params.id);

  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Moraš biti ulogovana kao kupac." }, { status: 401 });
  }

  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
    select: { id: true, isPremium: true, priceRSD: true },
  });

  if (!recipe) {
    return NextResponse.json({ ok: false, error: "Recept nije pronađen." }, { status: 404 });
  }

  if (!recipe.isPremium) {
    return NextResponse.json({ ok: false, error: "Ovaj recept nije premium." }, { status: 400 });
  }

  const price = Number(recipe.priceRSD ?? 0);

  await prisma.recipePurchase.upsert({
    where: { userId_recipeId: { userId, recipeId } },
    update: {},
    create: { userId, recipeId, priceRsd: price },
  });

  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ ok: false, error: "Koristi POST." }, { status: 405 });
}

