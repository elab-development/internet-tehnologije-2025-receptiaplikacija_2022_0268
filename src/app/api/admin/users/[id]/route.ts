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

  if (id === guard.user.id) {
    return NextResponse.json(
      { ok: false, error: "Ne možete obrisati sopstveni nalog." },
      { status: 400 }
    );
  }

  try {
    await prisma.session.deleteMany({ where: { userId: id } });
    await prisma.cart.deleteMany({ where: { userId: id } });
    await prisma.favorite.deleteMany({ where: { userId: id } });
    await prisma.review.deleteMany({ where: { userId: id } });
    await prisma.recipePurchase.deleteMany({ where: { userId: id } });
    await prisma.order.deleteMany({ where: { userId: id } });

    const recipeIds = (
      await prisma.recipe.findMany({
        where: { authorId: id },
        select: { id: true },
      })
    ).map((r) => r.id);

    if (recipeIds.length > 0) {
      await prisma.recipeIngredient.deleteMany({
        where: { recipeId: { in: recipeIds } },
      });
      await prisma.step.deleteMany({
        where: { recipeId: { in: recipeIds } },
      });

      await prisma.review.deleteMany({
        where: { recipeId: { in: recipeIds } },
      });
      await prisma.favorite.deleteMany({
        where: { recipeId: { in: recipeIds } },
      });
      await prisma.recipePurchase.deleteMany({
        where: { recipeId: { in: recipeIds } },
      });

      await prisma.recipe.deleteMany({ where: { id: { in: recipeIds } } });
    }

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e?.code === "P2025") {
      return NextResponse.json(
        { ok: false, error: "Korisnik nije pronađen." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error:
          "Ne mogu da obrišem korisnika zbog povezanih podataka (FK). Pošalji error iz terminala ako se ponovi.",
      },
      { status: 409 }
    );
  }
}
