export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyCsrf } from "@/lib/csrf";

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

function badRequest(error: string) {
  return NextResponse.json({ ok: false, error }, { status: 400 });
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const me = await getMe();
    if (!me) {
      return NextResponse.json({ ok: false, error: "NO_SESSION" }, { status: 401 });
    }

    if (!(await verifyCsrf(req))) {
      return NextResponse.json({ ok: false, error: "CSRF_BLOCKED" }, { status: 403 });
    }

    const { id } = await ctx.params;

    let recipeId = "";
    try {
      recipeId = decodeURIComponent(id ?? "").trim();
    } catch {
      return badRequest("BAD_ID");
    }
    if (!recipeId) return badRequest("BAD_ID");

    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
      select: { id: true, isPremium: true, priceRSD: true, isPublished: true as any },
    });

    if (!recipe) {
      return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }

    if ((recipe as any).isPublished === false) {
      return badRequest("NOT_AVAILABLE");
    }

    if (!recipe.isPremium) {
      return badRequest("NOT_PREMIUM");
    }

    const price = Number(recipe.priceRSD ?? 0);
    if (!Number.isFinite(price) || price <= 0) {
      return badRequest("BAD_PRICE");
    }

    await prisma.recipePurchase.upsert({
      where: { userId_recipeId: { userId: me.id, recipeId: recipe.id } },
      update: {},
      create: {
        userId: me.id,
        recipeId: recipe.id,
        priceRsd: price,
      },
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e: any) {
    console.error("RECIPE_PURCHASE_ERROR", e);
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}