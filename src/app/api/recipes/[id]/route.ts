export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

const SESSION_COOKIE = "session";

async function getCurrentUserLite() {
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

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const recipeId = decodeURIComponent(id ?? "").trim();

  try {
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
      select: {
        id: true,
        title: true,
        description: true,
        difficulty: true,
        prepTimeMinutes: true,
        imageUrl: true,
        isPublished: true,
        isPremium: true,
        priceRSD: true,
        avgRating: true,
        reviewsCount: true,
        createdAt: true,
        author: { select: { id: true, name: true, email: true } },
        category: { select: { id: true, name: true } },
        ingredients: {
          select: {
            quantity: true,
            unit: true,
            ingredient: { select: { id: true, name: true } },
          },
        },
        steps: {
          orderBy: { stepNumber: "asc" },
          select: { id: true, stepNumber: true, text: true },
        },
      },
    });

    if (!recipe) {
      return NextResponse.json(
        { ok: false, error: "NOT_FOUND" },
        { status: 404 }
      );
    }

    if (!recipe.isPremium) {
      return NextResponse.json({ ok: true, locked: false, recipe });
    }

    const user = await getCurrentUserLite();
    if (!user) {
      return NextResponse.json({
        ok: true,
        locked: true,
        recipe: { ...recipe, description: "", ingredients: [], steps: [] },
      });
    }

    if (user.role === "KUVAR" || user.role === "ADMIN") {
      return NextResponse.json({ ok: true, locked: false, recipe });
    }

    const bought = await prisma.recipePurchase.findUnique({
      where: { userId_recipeId: { userId: user.id, recipeId: recipe.id } },
      select: { id: true },
    });

    if (!bought) {
      return NextResponse.json({
        ok: true,
        locked: true,
        recipe: { ...recipe, description: "", ingredients: [], steps: [] },
      });
    }

    return NextResponse.json({ ok: true, locked: false, recipe });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: "SERVER_ERROR", message: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}
export async function PUT(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const me = await getCurrentUserLite();
  if (!me) {
    return NextResponse.json({ ok: false, error: "NO_SESSION" }, { status: 401 });
  }
  if (!(me.role === "KUVAR" || me.role === "ADMIN")) {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const recipeId = decodeURIComponent(id ?? "").trim();

  try {
    const existing = await prisma.recipe.findUnique({
      where: { id: recipeId },
      select: { id: true, authorId: true },
    });

    if (!existing) {
      return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }

    // KUVAR može samo svoje; ADMIN može sve
    if (me.role === "KUVAR" && existing.authorId !== me.id) {
      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
    }

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

    if (!title || !description || !categoryId) {
      return NextResponse.json({ ok: false, error: "INVALID_INPUT" }, { status: 400 });
    }
    if (!Number.isFinite(prepTimeMinutes) || prepTimeMinutes <= 0) {
      return NextResponse.json({ ok: false, error: "INVALID_TIME" }, { status: 400 });
    }
    if (!Number.isFinite(difficulty) || difficulty <= 0) {
      return NextResponse.json({ ok: false, error: "INVALID_DIFFICULTY" }, { status: 400 });
    }
    if (isPremium && (!Number.isFinite(priceRSD) || priceRSD <= 0)) {
      return NextResponse.json({ ok: false, error: "PRICE_REQUIRED" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.recipe.update({
        where: { id: recipeId },
        data: {
          title,
          description,
          prepTimeMinutes,
          difficulty,
          imageUrl,
          isPremium,
          priceRSD,
          isPublished,
          categoryId,
        },
      });

      // reset steps
      await tx.step.deleteMany({ where: { recipeId } });
      await tx.step.createMany({
        data: steps
          .map((s: any) => String(s?.text ?? "").trim())
          .filter(Boolean)
          .map((text: string, idx: number) => ({
            recipeId,
            stepNumber: idx + 1,
            text,
          })),
      });

      // reset ingredients (join tabela)
      await tx.recipeIngredient.deleteMany({ where: { recipeId } });

      // ponovno ubaci sastojke (isti princip kao u POST)
      for (const x of ingredients) {
        const name = String(x?.ingredientId ?? "").trim(); // kod tebe je ovo NAZIV
        const qty = Number(x?.quantity);
        const unit = String(x?.unit ?? "").trim();
        if (!name || !unit || !Number.isFinite(qty) || qty <= 0) continue;

        const ing = await tx.ingredient.upsert({
          where: { name },
          update: {},
          create: { name },
          select: { id: true },
        });

        await tx.recipeIngredient.create({
          data: {
            recipeId,
            ingredientId: ing.id,
            quantity: qty,
            unit,
          },
        });
      }
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: "SERVER_ERROR", message: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const me = await getCurrentUserLite();
  if (!me) {
    return NextResponse.json({ ok: false, error: "NO_SESSION" }, { status: 401 });
  }
  if (!(me.role === "KUVAR" || me.role === "ADMIN")) {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const recipeId = decodeURIComponent(id ?? "").trim();

  try {
    const existing = await prisma.recipe.findUnique({
      where: { id: recipeId },
      select: { id: true, authorId: true },
    });

    if (!existing) {
      return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }

    if (me.role === "KUVAR" && existing.authorId !== me.id) {
      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
    }

    await prisma.recipe.delete({ where: { id: recipeId } });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: "SERVER_ERROR", message: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}


