export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const recipes = await prisma.recipe.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        prepTimeMinutes: true,
        difficulty: true,
        imageUrl: true,
        isPremium: true,
        priceRSD: true,
        category: { select: { name: true } },
      },
    });

    return NextResponse.json({ ok: true, recipes });
  } catch {
    return NextResponse.json({ ok: false, error: "Ne mogu da učitam recepte." }, { status: 500 });
  }
}

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

export async function POST(req: Request) {
  try {
    const me = await getCurrentUserLite();
    if (!me) {
      return NextResponse.json({ ok: false, error: "NO_SESSION" }, { status: 401 });
    }
    if (!(me.role === "KUVAR" || me.role === "ADMIN")) {
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

    const created = await prisma.recipe.create({
      data: {
        title,
        description,
        prepTimeMinutes,
        difficulty,
        imageUrl,
        isPremium,
        priceRSD,
        isPublished,
        authorId: me.id,
        categoryId,

        steps: {
          create: steps
            .map((s: any, idx: number) => String(s?.text ?? "").trim())
            .filter(Boolean)
            .map((text: string, idx: number) => ({
              stepNumber: idx + 1,
              text,
            })),
        },

        ingredients: {
          create: ingredients
            .map((x: any) => {
              const ingredientId = x?.ingredientId ? String(x.ingredientId).trim() : "";
              const ingredientName = x?.name ? String(x.name).trim() : "";

              const qty = Number(x?.quantity);
              const unit = String(x?.unit ?? "").trim();

              if (!unit) return null;
              if (!Number.isFinite(qty) || qty <= 0) return null;

              if (ingredientId) {
                return { quantity: qty, unit, ingredientId };
              }

              if (ingredientName) {
                return {
                  quantity: qty,
                  unit,
                  ingredient: {
                    connectOrCreate: {
                      where: { name: ingredientName },
                      create: { name: ingredientName },
                    },
                  },
                };
              }
              return null;
            })
            .filter(Boolean) as any,
        },
      },
      select: { id: true },
    });

    return NextResponse.json({ ok: true, recipeId: created.id }, { status: 201 });
  } catch {
    return NextResponse.json({ ok: false, error: "Ne mogu da kreiram recept." }, { status: 500 });
  }
}