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
    await prisma.recipeIngredient.deleteMany({ where: { recipeId: id } });
    await prisma.step.deleteMany({ where: { recipeId: id } });
    await prisma.review.deleteMany({ where: { recipeId: id } });
    await prisma.favorite.deleteMany({ where: { recipeId: id } });
    await prisma.recipePurchase.deleteMany({ where: { recipeId: id } });

    await prisma.recipe.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e?.code === "P2025") {
      return NextResponse.json(
        { ok: false, error: "Recept nije pronađen." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { ok: false, error: "Brisanje recepta nije uspelo." },
      { status: 409 }
    );
  }
}

 
