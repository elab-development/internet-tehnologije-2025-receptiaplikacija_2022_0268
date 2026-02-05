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

async function canAccessRecipe(meId: string, role: string, recipeId: string) {
  const r = await prisma.recipe.findUnique({
    where: { id: recipeId },
    select: { id: true, authorId: true },
  });
  if (!r) return { ok: false as const, recipe: null };
  if (role === "ADMIN") return { ok: true as const, recipe: r };
  return { ok: r.authorId === meId, recipe: r };
}

export async function GET(_req: Request, ctx: { params: { id: string } }) {
  const recipeId = decodeURIComponent(ctx.params.id);
  try {
    const me = await getMe();
    if (!me) return NextResponse.json({ ok: false, error: "NO_SESSION" }, { status: 401 });
    if (!(me.role === "KUVAR" || me.role === "ADMIN"))
      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });

    const access = await canAccessRecipe(me.id, me.role, recipeId);
    if (!access.recipe) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    if (!access.ok) return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });

    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
      select: {
        id: true,
        title: true,
        description: true,
        prepTimeMinutes: true,
        difficulty: true,
        imageUrl: true,
        isPremium: true,
        priceRSD: true,
        isPublished: true,
        categoryId: true,
        ingredients: { select: { ingredientId: true, quantity: true, unit: true } },
        steps: { orderBy: { stepNumber: "asc" }, select: { stepNumber: true, text: true } },
      },
    });

    return NextResponse.json({ ok: true, recipe });
  } catch {
    return NextResponse.json({ ok: false, error: "Ne mogu da učitam recept za izmenu." }, { status: 500 });
  }
}

export async function PUT(req: Request, ctx: { params: { id: string } }) {
  const recipeId = decodeURIComponent(ctx.params.id);
  try {
    const me = await getMe();
    if (!me) return NextResponse.json({ ok: false, error: "NO_SESSION" }, { status: 401 });
    if (!(me.role === "KUVAR" || me.role === "ADMIN"))
      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });

    const access = await canAccessRecipe(me.id, me.role, recipeId);
    if (!access.recipe) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    if (!access.ok) return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });

    const body = await req.json().catch(() => ({}));

    const title = String(body.title ?? "").trim();
    const description = String(body.description ?? "").trim();
    const prepTimeMinutes = Number(body.prepTimeMinutes ?? 0);
    const difficulty = Number(body.difficulty ?? 0);
    const imageUrl = body.imageUrl ? String(body.imageUrl) : null;

    const isPremium = Boolean(body.isPremium ?? false);
    const priceRSD = isPremium ? Number(body.priceRSD ?? 0) : 0;
    const categoryId = String(body.categoryId ?? "").trim();
    const isPublished = Boolean(body.isPublished ?? false);

    const ingredients = Array.isArray(body.ingredients) ? body.ingredients : [];
    const steps = Array.isArray(body.steps) ? body.steps : [];

    if (!title || !description || !categoryId)
      return NextResponse.json({ ok: false, error: "INVALID_INPUT" }, { status: 400 });

    // BRISANJE STARIH steps/ingredients pa upis novih (najjednostavnije)
    await prisma.recipeIngredient.deleteMany({ where: { recipeId } });
    await prisma.step.deleteMany({ where: { recipeId } });

    await prisma.recipe.update({
      where: { id: recipeId },
      data: {
        title,
        description,
        prepTimeMinutes,
        difficulty,
        imageUrl,
        isPremium,
        priceRSD,
        categoryId,
        isPublished,

        steps: {
          create: steps
            .map((s: any) => String(s?.text ?? "").trim())
            .filter(Boolean)
            .map((text: string, idx: number) => ({ stepNumber: idx + 1, text })),
        },

        ingredients: {
          create: ingredients
            .filter((x: any) => x && x.ingredientId)
            .map((x: any) => ({
              ingredientId: String(x.ingredientId),
              quantity: Number(x.quantity ?? 0),
              unit: String(x.unit ?? "").trim(),
            })),
        },
      },
      select: { id: true },
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: false, error: "Ne mogu da sačuvam izmene." }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: { params: { id: string } }) {
  const recipeId = decodeURIComponent(ctx.params.id);
  try {
    const me = await getMe();
    if (!me) return NextResponse.json({ ok: false, error: "NO_SESSION" }, { status: 401 });
    if (!(me.role === "KUVAR" || me.role === "ADMIN"))
      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });

    const access = await canAccessRecipe(me.id, me.role, recipeId);
    if (!access.recipe) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    if (!access.ok) return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });

    await prisma.recipe.delete({ where: { id: recipeId } });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: false, error: "Ne mogu da obrišem recept." }, { status: 500 });
  }
}
