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

