export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

const SESSION_COOKIE = "session";

async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    select: {
      expiresAt: true,
      user: { select: { id: true, role: true, email: true, name: true } },
    },
  });

  if (!session) return null;
  if (session.expiresAt < new Date()) return null;

  return session.user;
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id: recipeId } = await ctx.params;

  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
    select: { id: true },
  });

  if (!recipe) {
    return NextResponse.json(
      { ok: false, error: "Recept nije pronađen." },
      { status: 404 }
    );
  }

  const reviews = await prisma.review.findMany({
    where: { recipeId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      rating: true,
      comment: true,
      createdAt: true,
      user: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json({ ok: true, reviews });
}


export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id: recipeId } = await ctx.params;

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Morate biti prijavljeni." },
      { status: 401 }
    );
  }

  if (user.role !== "KUPAC") {
    return NextResponse.json(
      { ok: false, error: "Samo kupac može da ostavi recenziju." },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => null);
  const rating = Number(body?.rating);
  const commentRaw = body?.comment;

  if (!Number.isFinite(rating)) {
    return NextResponse.json(
      { ok: false, error: "Nedostaje ocena." },
      { status: 400 }
    );
  }

  if (rating < 1 || rating > 5) {
    return NextResponse.json(
      { ok: false, error: "Uneta ocena nije validna." },
      { status: 400 }
    );
  }

  const comment =
    typeof commentRaw === "string" && commentRaw.trim().length > 0
      ? commentRaw.trim()
      : null;

  try {
    const result = await prisma.$transaction(async (tx) => {

      const recipe = await tx.recipe.findUnique({
        where: { id: recipeId },
        select: { id: true },
      });

      if (!recipe) {
        return { status: 404 as const, payload: { ok: false, error: "Recept nije pronađen." } };
      }

      await tx.review.upsert({
        where: { userId_recipeId: { userId: user.id, recipeId } },
        update: { rating, comment },
        create: { userId: user.id, recipeId, rating, comment },
      });

      const agg = await tx.review.aggregate({
        where: { recipeId },
        _avg: { rating: true },
        _count: { rating: true },
      });

      const avgRating = Number(agg._avg.rating ?? 0);
      const reviewsCount = Number(agg._count.rating ?? 0);

      await tx.recipe.update({
        where: { id: recipeId },
        data: { avgRating, reviewsCount },
      });

      return {
        status: 200 as const,
        payload: { ok: true, message: "Recenzija je uspešno ostavljena." },
      };
    });

    return NextResponse.json(result.payload, { status: result.status });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: "Sistem trenutno ne može da sačuva recenziju." },
      { status: 500 }
    );
  }
}
