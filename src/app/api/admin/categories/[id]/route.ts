export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/authz";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json(
      { ok: false, error: "Nemate admin prava." },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => null);
  const name = body?.name?.trim();

  if (!name) {
    return NextResponse.json(
      { ok: false, error: "Nedostaje naziv kategorije." },
      { status: 400 }
    );
  }

  if (name.length < 2) {
    return NextResponse.json(
      { ok: false, error: "Naziv kategorije je prekratak." },
      { status: 400 }
    );
  }

  try {
    const category = await prisma.categoryRecipe.update({
      where: { id },
      data: { name },
      select: { id: true, name: true },
    });

    return NextResponse.json({ ok: true, category });
  } catch (e: any) {
    if (e?.code === "P2025") {
      return NextResponse.json(
        { ok: false, error: "Kategorija nije pronađena." },
        { status: 404 }
      );
    }

    if (e?.code === "P2002") {
      return NextResponse.json(
        { ok: false, error: "Naziv kategorije već postoji." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { ok: false, error: "Neuspešna izmena kategorije." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json(
      { ok: false, error: "Nemate admin prava." },
      { status: 403 }
    );
  }

  try {
    const usedCount = await prisma.recipe.count({ where: { categoryId: id } });
    if (usedCount > 0) {
      return NextResponse.json(
        {
          ok: false,
          error: `Ne možete obrisati kategoriju jer je u upotrebi (${usedCount} recepata).`,
        },
        { status: 409 }
      );
    }

    await prisma.categoryRecipe.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e?.code === "P2025") {
      return NextResponse.json(
        { ok: false, error: "Kategorija nije pronađena." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { ok: false, error: "Brisanje nije uspelo." },
      { status: 409 }
    );
  }
}
