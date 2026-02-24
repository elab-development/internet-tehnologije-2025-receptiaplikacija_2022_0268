export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyCsrf } from "@/lib/csrf";

const SESSION_COOKIE = "session";

async function getUserId() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    select: {
      expiresAt: true,
      user: { select: { id: true, isBlocked: true, role: true } },
    },
  });

  if (!session) return null;
  if (session.expiresAt < new Date()) return null;
  if (session.user.isBlocked) return null;
  if (session.user.role !== "KUPAC") return null;

  return session.user.id;
}

function badRequest(msg: string) {
  return NextResponse.json({ ok: false, error: msg }, { status: 400 });
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  if (!(await verifyCsrf(req))) {
    return NextResponse.json({ ok: false, error: "CSRF blocked." }, { status: 403 });
  }

  const { id } = await ctx.params;

  let recipeId = "";
  try {
    recipeId = decodeURIComponent(id).trim();
  } catch {
    return badRequest("Neispravan ID recepta.");
  }
  if (!recipeId) return badRequest("Neispravan ID recepta.");

  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json(
      { ok: false, error: "Moraš biti ulogovana kao kupac." },
      { status: 401 }
    );
  }

  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
    select: { id: true, isPremium: true, priceRSD: true, isPublished: true as any },
  });

  if (!recipe) {
    return NextResponse.json(
      { ok: false, error: "Recept nije pronađen." },
      { status: 404 }
    );
  }

  if ((recipe as any).isPublished === false) {
    return badRequest("Recept nije dostupan za kupovinu.");
  }

  if (!recipe.isPremium) {
    return badRequest("Ovaj recept nije premium.");
  }

  const price = Number(recipe.priceRSD ?? 0);
  if (!Number.isFinite(price) || price <= 0) {
    return badRequest("Premium recept nema validnu cenu.");
  }

  await prisma.recipePurchase.upsert({
    where: { userId_recipeId: { userId, recipeId } },
    update: {}, 
    create: { userId, recipeId, priceRsd: price },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function GET() {
  return NextResponse.json(
    { ok: false, error: "Koristi POST." },
    { status: 405 }
  );
}