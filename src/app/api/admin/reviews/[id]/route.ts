export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return NextResponse.json(
      { ok: false, error: guard.error },
      { status: guard.status }
    );
  }

  try {
    const review = await prisma.review.findUnique({
      where: { id: params.id },
      select: { id: true, recipeId: true },
    });

    if (!review) {
      return NextResponse.json(
        { ok: false, error: "Recenzija nije pronađena." },
        { status: 404 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.review.delete({ where: { id: params.id } });

      const agg = await tx.review.aggregate({
        where: { recipeId: review.recipeId },
        _avg: { rating: true },
        _count: { rating: true },
      });

      const avgRating = Number(agg._avg.rating ?? 0);
      const reviewsCount = Number(agg._count.rating ?? 0);

      await tx.recipe.update({
        where: { id: review.recipeId },
        data: { avgRating, reviewsCount },
      });
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Brisanje recenzije nije uspelo." },
      { status: 500 }
    );
  }
}