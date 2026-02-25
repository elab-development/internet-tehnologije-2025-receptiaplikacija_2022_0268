export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/authz";
import { verifyCsrf } from "@/lib/csrf";
import { cleanText } from "@/lib/sanitize";

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

  if (!(await verifyCsrf(req))) {
    return NextResponse.json({ ok: false, error: "CSRF blocked." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const rawName = String(body?.name ?? "");
  const name = cleanText(rawName, 80);

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
    const updated = await prisma.categoryRecipe.updateMany({
      where: { id },
      data: { name },
    });

    if (updated.count === 0) {
      return NextResponse.json(
        { ok: false, error: "Kategorija nije pronađena." },
        { status: 404 }
      );
    }

    const category = await prisma.categoryRecipe.findUnique({
      where: { id },
      select: { id: true, name: true },
    });

    return NextResponse.json({ ok: true, category });
  } catch (e: any) {
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

  if (!(await verifyCsrf(req))) {
    return NextResponse.json({ ok: false, error: "CSRF blocked." }, { status: 403 });
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

    const deleted = await prisma.categoryRecipe.deleteMany({ where: { id } });
    if (deleted.count === 0) {
      return NextResponse.json(
        { ok: false, error: "Kategorija nije pronađena." },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Brisanje nije uspelo." },
      { status: 500 }
    );
  }
}