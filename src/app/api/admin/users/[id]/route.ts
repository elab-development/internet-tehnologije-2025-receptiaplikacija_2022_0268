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

  if (id === guard.user.id) {
    return NextResponse.json(
      { ok: false, error: "Ne možete obrisati sopstveni nalog." },
      { status: 400 }
    );
  }

  try {
    const deletedCount = await prisma.$transaction(async (tx) => {
      await tx.session.deleteMany({ where: { userId: id } });
      await tx.cart.deleteMany({ where: { userId: id } });
      await tx.favorite.deleteMany({ where: { userId: id } });
      await tx.review.deleteMany({ where: { userId: id } });
      await tx.recipePurchase.deleteMany({ where: { userId: id } });
      await tx.order.deleteMany({ where: { userId: id } });

      const recipeIds = (
        await tx.recipe.findMany({
          where: { authorId: id },
          select: { id: true },
        })
      ).map((r) => r.id);

      if (recipeIds.length > 0) {
        await tx.recipeIngredient.deleteMany({
          where: { recipeId: { in: recipeIds } },
        });
        await tx.step.deleteMany({
          where: { recipeId: { in: recipeIds } },
        });

        await tx.review.deleteMany({
          where: { recipeId: { in: recipeIds } },
        });
        await tx.favorite.deleteMany({
          where: { recipeId: { in: recipeIds } },
        });
        await tx.recipePurchase.deleteMany({
          where: { recipeId: { in: recipeIds } },
        });

        await tx.recipe.deleteMany({ where: { id: { in: recipeIds } } });
      }

      const deleted = await tx.user.deleteMany({ where: { id } });
      return deleted.count;
    });

    if (deletedCount === 0) {
      return NextResponse.json(
        { ok: false, error: "Korisnik nije pronađen." },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Ne mogu da obrišem korisnika zbog povezanih podataka (FK). ",
      },
      { status: 409 }
    );
  }
}