export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

async function getCurrentUserIdFromSession() {
  const store = await cookies();
  const token = store.get("session")?.value;

  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    select: { userId: true, expiresAt: true },
  });

  if (!session) return null;
  if (session.expiresAt < new Date()) return null;

  return session.userId;
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const recipeId = decodeURIComponent(id);

    const reviews = await prisma.review.findMany({
      where: { recipeId },
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ reviews }, { status: 200 });
  } catch (e) {
    return NextResponse.json(
      { error: "Server error", details: String(e) },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const recipeId = decodeURIComponent(id);

    const body = await req.json().catch(() => null);
    const rating = Number(body?.rating);
    const comment =
      typeof body?.comment === "string" && body.comment.trim().length > 0
        ? body.comment.trim()
        : null;

    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Ocena mora biti 1-5." },
        { status: 400 }
      );
    }

    const userId = await getCurrentUserIdFromSession();
    if (!userId) {
      return NextResponse.json(
        { error: "Niste prijavljeni ili je sesija istekla." },
        { status: 401 }
      );
    }

    const recipeExists = await prisma.recipe.findUnique({
      where: { id: recipeId },
      select: { id: true },
    });
    if (!recipeExists) {
      return NextResponse.json({ error: "Recept ne postoji." }, { status: 404 });
    }

    const already = await prisma.review.findUnique({
      where: { userId_recipeId: { userId, recipeId } },
      select: { id: true },
    });
    if (already) {
      return NextResponse.json(
        { error: "Već si ostavio recenziju za ovaj recept." },
        { status: 400 }
      );
    }

    const created = await prisma.review.create({
      data: {
        recipeId,
        userId,
        rating,
        comment,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    const stats = await prisma.review.aggregate({
      where: { recipeId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await prisma.recipe.update({
      where: { id: recipeId },
      data: {
        avgRating: stats._avg.rating ?? 0,
        reviewsCount: stats._count.rating,
      },
    });

    return NextResponse.json(
      { message: "Recenzija je uspešno ostavljena.", review: created },
      { status: 201 }
    );
  } catch (e: any) {
    if (String(e?.message || "").includes("Unique constraint")) {
      return NextResponse.json(
        { error: "Već si ostavio recenziju za ovaj recept." },
        { status: 400 }
      );
    }

    console.error("REVIEWS POST ERROR:", e);
    return NextResponse.json(
      { error: "Server error", details: String(e) },
      { status: 500 }
    );
  }
}
