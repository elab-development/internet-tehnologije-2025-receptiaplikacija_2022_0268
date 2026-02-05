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
    ctx: { params: { id: string } }
) {
    const recipeId = decodeURIComponent(ctx.params.id);

    
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
                { ok: false, error: "Recept nije pronađen." },
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

        const bought = await prisma.recipePurchase.findUnique({
            where: { userId_recipeId: { userId: user.id, recipeId } },
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
    } catch {
        return NextResponse.json(
            { ok: false, error: "Ne mogu da učitam recept." },
            { status: 500 }
        );
    }
}

export async function PUT(req: Request, ctx: { params: { id: string } }) {
  const recipeId = decodeURIComponent(ctx.params.id);

  try {
    const me = await getCurrentUserLite();
    if (!me) return NextResponse.json({ ok: false, error: "NO_SESSION" }, { status: 401 });
    if (!(me.role === "KUVAR" || me.role === "ADMIN")) {
      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
    }

    const existing = await prisma.recipe.findUnique({
      where: { id: recipeId },
      select: { id: true, authorId: true },
    });
    if (!existing) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });

    // KUVAR može samo svoje
    if (me.role === "KUVAR" && existing.authorId !== me.id) {
      return NextResponse.json({ ok: false, error: "FORBIDDEN_OWNER" }, { status: 403 });
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

    // Najsigurnije: obriši stare steps/ingredients i ubaci nove
    await prisma.step.deleteMany({ where: { recipeId } });
    await prisma.recipeIngredient.deleteMany({ where: { recipeId } });

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
        isPublished,
        categoryId,

        steps: {
          create: steps
            .map((s: any) => String(s?.text ?? "").trim())
            .filter(Boolean)
            .map((text: string, idx: number) => ({
              stepNumber: idx + 1,
              text,
            })),
        },
        ingredients: {
          create: ingredients
            .filter((x: any) => x && x.ingredientId)
            .map((x: any) => ({
              quantity: String(x.quantity ?? "").trim(),
              unit: String(x.unit ?? "").trim(),
              ingredientId: String(x.ingredientId),
            })),
        },
      },
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: false, error: "Ne mogu da izmenim recept." }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: { params: { id: string } }) {
  const recipeId = decodeURIComponent(ctx.params.id);

  try {
    const me = await getCurrentUserLite();
    if (!me) return NextResponse.json({ ok: false, error: "NO_SESSION" }, { status: 401 });
    if (!(me.role === "KUVAR" || me.role === "ADMIN")) {
      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
    }

    const existing = await prisma.recipe.findUnique({
      where: { id: recipeId },
      select: { id: true, authorId: true },
    });
    if (!existing) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });

    if (me.role === "KUVAR" && existing.authorId !== me.id) {
      return NextResponse.json({ ok: false, error: "FORBIDDEN_OWNER" }, { status: 403 });
    }

    await prisma.recipe.delete({ where: { id: recipeId } });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: false, error: "Ne mogu da obrišem recept." }, { status: 500 });
  }
}

