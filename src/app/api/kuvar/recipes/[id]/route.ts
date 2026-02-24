export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyCsrf } from "@/lib/csrf";
import { cleanText } from "@/lib/sanitize";

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

function canManage(me: { id: string; role: string }, authorId: string) {
  return me.role === "ADMIN" || (me.role === "KUVAR" && me.id === authorId);
}

async function getRecipeForEdit(me: { id: string; role: string }, recipeId: string) {
  const where =
    me.role === "ADMIN"
      ? { id: recipeId }
      : { id: recipeId, authorId: me.id };

  return prisma.recipe.findFirst({
    where,
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
      authorId: true,
      categoryId: true,
      category: { select: { id: true, name: true } },
      steps: {
        orderBy: { stepNumber: "asc" },
        select: { id: true, stepNumber: true, text: true },
      },
      ingredients: {
        select: {
          ingredientId: true,
          quantity: true,
          unit: true,
          ingredient: { select: { id: true, name: true } },
        },
      },
    },
  });
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const me = await getMe();
    if (!me) return NextResponse.json({ ok: false, error: "NO_SESSION" }, { status: 401 });
    if (!(me.role === "KUVAR" || me.role === "ADMIN"))
      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });

    const { id } = await ctx.params;
    const recipeId = decodeURIComponent(id ?? "").trim();

    const recipe = await getRecipeForEdit(me, recipeId);
    if (!recipe) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });

    if (!canManage(me, recipe.authorId))
      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });

    return NextResponse.json({ ok: true, recipe }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: "SERVER_ERROR", message: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const me = await getMe();
    if (!me) return NextResponse.json({ ok: false, error: "NO_SESSION" }, { status: 401 });
    if (!(me.role === "KUVAR" || me.role === "ADMIN"))
      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });

    if (!(await verifyCsrf(req))) {
      return NextResponse.json({ ok: false, error: "CSRF blocked." }, { status: 403 });
    }

    const { id } = await ctx.params;
    const recipeId = decodeURIComponent(id ?? "").trim();

    const existing = await prisma.recipe.findFirst({
      where: me.role === "ADMIN" ? { id: recipeId } : { id: recipeId, authorId: me.id },
      select: { id: true, authorId: true },
    });
    if (!existing) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });

    if (!canManage(me, existing.authorId))
      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });

    const body = await req.json().catch(() => ({}));

    const title = cleanText(String(body.title ?? ""), 120);
    const description = cleanText(String(body.description ?? ""), 5000);

    const prepTimeMinutes = Number(body.prepTimeMinutes ?? 0);
    const difficulty = Number(body.difficulty ?? 0);
    const imageUrl = body.imageUrl ? cleanText(String(body.imageUrl).trim(), 500) : null;

    const isPremium = me.role === "ADMIN" ? Boolean(body.isPremium ?? false) : false;
    const priceRSD = isPremium ? Number(body.priceRSD ?? 0) : 0;

    const isPublished = Boolean(body.isPublished ?? false);

    const categoryId = String(body.categoryId ?? "").trim();

    const steps = Array.isArray(body.steps) ? body.steps : [];
    const ingredients = Array.isArray(body.ingredients) ? body.ingredients : [];

    if (!title || !description || !categoryId) {
      return NextResponse.json({ ok: false, error: "INVALID_INPUT" }, { status: 400 });
    }
    if (!Number.isFinite(prepTimeMinutes) || prepTimeMinutes <= 0 || prepTimeMinutes > 24 * 60) {
      return NextResponse.json({ ok: false, error: "INVALID_TIME" }, { status: 400 });
    }
    if (!Number.isFinite(difficulty) || difficulty <= 0 || difficulty > 5) {
      return NextResponse.json({ ok: false, error: "INVALID_DIFFICULTY" }, { status: 400 });
    }
    if (isPremium && (!Number.isFinite(priceRSD) || priceRSD <= 0)) {
      return NextResponse.json({ ok: false, error: "PRICE_REQUIRED" }, { status: 400 });
    }

    const stepTexts: string[] = steps
      .map((s: any) => cleanText(String(s?.text ?? ""), 1000))
      .filter(Boolean);

    if (stepTexts.length === 0) {
      return NextResponse.json({ ok: false, error: "STEPS_REQUIRED" }, { status: 400 });
    }

    const ingRows = ingredients
      .map((x: any) => {
        const raw = cleanText(String(x?.ingredientId ?? ""), 120); 
        const quantity = Number(x?.quantity);
        const unit = cleanText(String(x?.unit ?? ""), 20);

        if (!raw) return null;
        if (!unit) return null;
        if (!Number.isFinite(quantity) || quantity <= 0 || quantity > 100000) return null;
        return { raw, quantity, unit };
      })
      .filter(Boolean) as Array<{ raw: string; quantity: number; unit: string }>;

    if (ingRows.length === 0) {
      return NextResponse.json({ ok: false, error: "INGREDIENTS_REQUIRED" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      const updated = await tx.recipe.updateMany({
        where: me.role === "ADMIN" ? { id: recipeId } : { id: recipeId, authorId: me.id },
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

      if (updated.count === 0) {
        throw new Error("NOT_FOUND_OR_FORBIDDEN");
      }

      await tx.step.deleteMany({ where: { recipeId } });
      await tx.recipeIngredient.deleteMany({ where: { recipeId } });

      await tx.step.createMany({
        data: stepTexts.map((text, idx) => ({
          recipeId,
          stepNumber: idx + 1,
          text,
        })),
      });

      for (const row of ingRows) {
        let ing = await tx.ingredient.findUnique({ where: { id: row.raw } }).catch(() => null);

        if (!ing) {
          ing = await tx.ingredient
            .findFirst({ where: { name: row.raw } })
            .catch(() => null);
        }

        if (!ing) {
          ing = await tx.ingredient.create({ data: { name: row.raw } });
        }

        await tx.recipeIngredient.create({
          data: {
            recipeId,
            ingredientId: ing.id,
            quantity: row.quantity,
            unit: row.unit,
          },
        });
      }
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    const msg = String(e?.message ?? e);
    if (msg === "NOT_FOUND_OR_FORBIDDEN") {
      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
    }
    return NextResponse.json(
      { ok: false, error: "SERVER_ERROR", message: msg },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const me = await getMe();
    if (!me) return NextResponse.json({ ok: false, error: "NO_SESSION" }, { status: 401 });
    if (!(me.role === "KUVAR" || me.role === "ADMIN"))
      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });

    if (!(await verifyCsrf(req))) {
      return NextResponse.json({ ok: false, error: "CSRF blocked." }, { status: 403 });
    }

    const { id } = await ctx.params;
    const recipeId = decodeURIComponent(id ?? "").trim();

    const recipe = await prisma.recipe.findFirst({
      where: me.role === "ADMIN" ? { id: recipeId } : { id: recipeId, authorId: me.id },
      select: { id: true, authorId: true },
    });

    if (!recipe) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    if (!canManage(me, recipe.authorId))
      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });

    const deletedCount = await prisma.$transaction(async (tx) => {
     
      await tx.recipeIngredient.deleteMany({ where: { recipeId } });
      await tx.step.deleteMany({ where: { recipeId } });
      await tx.review.deleteMany({ where: { recipeId } });
      await tx.favorite.deleteMany({ where: { recipeId } });
      await tx.recipePurchase.deleteMany({ where: { recipeId } });

      const del = await tx.recipe.deleteMany({
        where: me.role === "ADMIN" ? { id: recipeId } : { id: recipeId, authorId: me.id },
      });

      return del.count;
    });

    if (deletedCount === 0) {
      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: "SERVER_ERROR", message: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}