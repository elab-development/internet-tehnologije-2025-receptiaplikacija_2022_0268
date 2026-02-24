export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";
import { verifyCsrf } from "@/lib/csrf";

export async function DELETE(
  req: Request,
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

  if (!(await verifyCsrf(req))) {
    return NextResponse.json({ ok: false, error: "CSRF blocked." }, { status: 403 });
  }

  try {
    const ok = await prisma.$transaction(async (tx) => {
      const review = await tx.review.findUnique({
        where: { id },
        select: { recipeId: true },
      });

      if (!review) return { ok: false as const, status: 404 as const, recipeId: null as any };

      await tx.review.deleteMany({ where: { id } });

      const stats = await tx.review.aggregate({
        where: { recipeId: review.recipeId },
        _avg: { rating: true },
        _count: { rating: true },
      });

      await tx.recipe.updateMany({
        where: { id: review.recipeId },
        data: {
          avgRating: stats._avg.rating ?? 0,
          reviewsCount: stats._count.rating,
        },
      });

      return { ok: true as const, status: 200 as const, recipeId: review.recipeId };
    });

    if (!ok.ok) {
      return NextResponse.json(
        { ok: false, error: "Recenzija ne postoji." },
        { status: ok.status }
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Greška pri brisanju recenzije." },
      { status: 500 }
    );
  }
}
