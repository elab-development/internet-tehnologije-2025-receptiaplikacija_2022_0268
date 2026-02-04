export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/authz";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
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
      where: { id: params.id },
      data: { name },
      select: { id: true, name: true },
    });

    return NextResponse.json({ ok: true, category });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Neuspešna izmena (kategorija ne postoji ili naziv već postoji)." },
      { status: 409 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json(
      { ok: false, error: "Nemate admin prava." },
      { status: 403 }
    );
  }

  try {
    await prisma.categoryRecipe.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Brisanje nije uspelo (kategorija ne postoji ili je u upotrebi)." },
      { status: 409 }
    );
  }
}