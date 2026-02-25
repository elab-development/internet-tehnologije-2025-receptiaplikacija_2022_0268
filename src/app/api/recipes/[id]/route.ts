export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyCsrf } from "@/lib/csrf";
import { cleanText } from "@/lib/sanitize";

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

/**
 * @swagger
 * /api/recipes/{id}:
 *   get:
 *     summary: Detalji recepta
 *     tags: [Recipes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Detalji recepta }
 *       404: { description: Recept nije pronađen }
 *   put:
 *     summary: Izmena recepta (kuvar/admin)
 *     tags: [Recipes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Polja za izmenu recepta
 *     responses:
 *       200: { description: Recept izmenjen }
 *       401: { description: Nije prijavljen }
 *       403: { description: Nema prava }
 *       404: { description: Nije pronađen }
 *   delete:
 *     summary: Brisanje recepta (admin ili vlasnik)

 *     tags: [Recipes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Recept obrisan }
 *       401: { description: Nije prijavljen }
 *       403: { description: Nema prava }
 *       404: { description: Nije pronađen }
 */

function badRequest(error: string) {
  return NextResponse.json({ ok: false, error }, { status: 400 });
}

function safeDecodeId(id: string | undefined | null) {
  try {
    const v = decodeURIComponent(String(id ?? "")).trim();
    return v || null;
  } catch {
    return null;
  }
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const recipeId = safeDecodeId(id);
  if (!recipeId) return badRequest("BAD_ID");

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
      return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }

    if (!recipe.isPremium) {
      return NextResponse.json({ ok: true, locked: false, recipe });
    }

    const user = await getCurrentUserLite();

    if (!user) {
      const { author, ...rest } = recipe;
      return NextResponse.json({
        ok: true,
        locked: true,
        recipe: {
          ...rest,
          description: "",
          ingredients: [],
          steps: [],
          author: { id: author.id, name: author.name },
        },
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
      const { author, ...rest } = recipe;
      return NextResponse.json({
        ok: true,
        locked: true,
        recipe: {
          ...rest,
          description: "",
          ingredients: [],
          steps: [],
          author: { id: author.id, name: author.name }, 
        },
      });
    }

    return NextResponse.json({ ok: true, locked: false, recipe });
  } catch (e) {
    console.error("RECIPE_GET_ERROR", e);
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const me = await getCurrentUserLite();
  if (!me) return NextResponse.json({ ok: false, error: "NO_SESSION" }, { status: 401 });
  if (!(me.role === "KUVAR" || me.role === "ADMIN")) {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  if (!(await verifyCsrf(req))) {
    return NextResponse.json({ ok: false, error: "CSRF_BLOCKED" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const recipeId = safeDecodeId(id);
  if (!recipeId) return badRequest("BAD_ID");

  try {
    const existing = await prisma.recipe.findUnique({
      where: { id: recipeId },
      select: { id: true, authorId: true },
    });

    if (!existing) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });

    if (me.role === "KUVAR" && existing.authorId !== me.id) {
      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return badRequest("INVALID_JSON");

    const title = cleanText(String((body as any).title ?? ""), 120);
    const description = cleanText(String((body as any).description ?? ""), 5000);

    const prepTimeMinutes = Number((body as any).prepTimeMinutes ?? 0);
    const difficulty = Number((body as any).difficulty ?? 0);

    const imageUrlRaw = (body as any).imageUrl ? String((body as any).imageUrl) : null;
    const imageUrl = imageUrlRaw ? cleanText(imageUrlRaw, 500) : null;

    const isPremium = Boolean((body as any).isPremium ?? false);
    const priceRSD = isPremium ? Number((body as any).priceRSD ?? 0) : 0;

    const categoryId = cleanText(String((body as any).categoryId ?? ""), 100);
    const isPublished = Boolean((body as any).isPublished ?? false);

    const ingredients = Array.isArray((body as any).ingredients) ? (body as any).ingredients : [];
    const steps = Array.isArray((body as any).steps) ? (body as any).steps : [];

    if (!title || !description || !categoryId) return badRequest("INVALID_INPUT");
    if (!Number.isFinite(prepTimeMinutes) || prepTimeMinutes <= 0) return badRequest("INVALID_TIME");
    if (!Number.isFinite(difficulty) || difficulty <= 0) return badRequest("INVALID_DIFFICULTY");
    if (isPremium && (!Number.isFinite(priceRSD) || priceRSD <= 0)) return badRequest("PRICE_REQUIRED");
    if (steps.length > 200) return badRequest("TOO_MANY_STEPS");
    if (ingredients.length > 200) return badRequest("TOO_MANY_INGREDIENTS");

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

      await tx.step.deleteMany({ where: { recipeId } });

      const stepRows = steps
        .map((s: any) => cleanText(String(s?.text ?? ""), 1000))
        .filter(Boolean)
        .map((text: string, idx: number) => ({
          recipeId,
          stepNumber: idx + 1,
          text,
        }));

      if (stepRows.length) {
        await tx.step.createMany({ data: stepRows });
      }

      await tx.recipeIngredient.deleteMany({ where: { recipeId } });

      for (const x of ingredients) {
        const ingredientId = String(x?.ingredientId ?? "").trim();
        const nameFromClient = cleanText(String(x?.name ?? ""), 120);
        const qty = Number(x?.quantity);
        const unit = cleanText(String(x?.unit ?? ""), 30);

        if (!unit || !Number.isFinite(qty) || qty <= 0) continue;

        let ingId: string | null = null;

        if (ingredientId) {
          const ing = await tx.ingredient.findUnique({ where: { id: ingredientId }, select: { id: true } });
          if (ing) ingId = ing.id;
        }

        if (!ingId && nameFromClient) {
          const ing = await tx.ingredient.upsert({
            where: { name: nameFromClient },
            update: {},
            create: { name: nameFromClient },
            select: { id: true },
          });
          ingId = ing.id;
        }

        if (!ingId) continue;

        await tx.recipeIngredient.create({
          data: {
            recipeId,
            ingredientId: ingId,
            quantity: qty,
            unit,
          },
        });
      }
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    console.error("RECIPE_PUT_ERROR", e);
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const me = await getCurrentUserLite();
  if (!me) return NextResponse.json({ ok: false, error: "NO_SESSION" }, { status: 401 });
  if (!(me.role === "KUVAR" || me.role === "ADMIN")) {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  if (!(await verifyCsrf(_req))) {
    return NextResponse.json({ ok: false, error: "CSRF_BLOCKED" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const recipeId = safeDecodeId(id);
  if (!recipeId) return badRequest("BAD_ID");

  try {
    const existing = await prisma.recipe.findUnique({
      where: { id: recipeId },
      select: { id: true, authorId: true },
    });

    if (!existing) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });

    if (me.role === "KUVAR" && existing.authorId !== me.id) {
      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.step.deleteMany({ where: { recipeId } });
      await tx.recipeIngredient.deleteMany({ where: { recipeId } });

      await tx.recipePurchase.deleteMany({ where: { recipeId } });

      await tx.recipe.delete({ where: { id: recipeId } });
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    console.error("RECIPE_DELETE_ERROR", e);
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}