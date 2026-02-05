export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const guard = await requireAdmin();
  if (!guard.ok) {
    return NextResponse.json(
      { ok: false, error: guard.error },
      { status: guard.status }
    );
  }

  try {
    const review = await prisma.review.findUnique({
      where: { id },
      select: { recipeId: true },
    });

    if (!review) {
      return NextResponse.json(
        { ok: false, error: "Recenzija ne postoji." },
        { status: 404 }
      );
    }

    await prisma.review.delete({ where: { id } });

    const stats = await prisma.review.aggregate({
      where: { recipeId: review.recipeId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await prisma.recipe.update({
      where: { id: review.recipeId },
      data: {
        avgRating: stats._avg.rating ?? 0,
        reviewsCount: stats._count.rating,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: "Greška pri brisanju recenzije." },
      { status: 500 }
    );
  }
}
