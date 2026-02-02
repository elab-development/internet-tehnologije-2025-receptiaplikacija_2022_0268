export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";

type Ctx = { params: Promise<{ id: string }> }; 

export async function GET(_req: Request, { params }: Ctx) {
  const { id: recipeId } = await params; 

  const reviews = await prisma.review.findMany({
    where: { recipeId },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ ok: true, reviews });
}

export async function POST(req: Request, { params }: Ctx) {
  const { id: recipeId } = await params;

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Moraš biti prijavljen da ostaviš recenziju." },
      { status: 401 }
    );
  }

  const body = await req.json().catch(() => null);
  const rating = Number(body?.rating);
  const comment = (body?.comment ?? "").toString().trim();

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json(
      { ok: false, error: "Ocena mora biti ceo broj 1–5." },
      { status: 400 }
    );
  }

  if (comment.length > 1000) {
    return NextResponse.json(
      { ok: false, error: "Komentar je predugačak (max 1000)." },
      { status: 400 }
    );
  }

  const recipeExists = await prisma.recipe.findUnique({
    where: { id: recipeId },
    select: { id: true },
  });

  if (!recipeExists) {
    return NextResponse.json(
      { ok: false, error: "Recept ne postoji u bazi (nema isti id)." },
      { status: 404 }
    );
  }

  const review = await prisma.review.upsert({
    where: { userId_recipeId: { userId: user.id, recipeId } },
    update: { rating, comment: comment || null },
    create: { userId: user.id, recipeId, rating, comment: comment || null },
  });

  return NextResponse.json({ ok: true, review });
}

