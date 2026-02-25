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
    const result = await prisma.$transaction(async (tx) => {
      await tx.recipeIngredient.deleteMany({ where: { recipeId: id } });
      await tx.step.deleteMany({ where: { recipeId: id } });
      await tx.review.deleteMany({ where: { recipeId: id } });
      await tx.favorite.deleteMany({ where: { recipeId: id } });
      await tx.recipePurchase.deleteMany({ where: { recipeId: id } });

      const deleted = await tx.recipe.deleteMany({ where: { id } });
      return deleted.count;
    });

    if (result === 0) {
      return NextResponse.json(
        { ok: false, error: "Recept nije pronađen." },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Brisanje recepta nije uspelo." },
      { status: 500 }
    );
  }
}

 
