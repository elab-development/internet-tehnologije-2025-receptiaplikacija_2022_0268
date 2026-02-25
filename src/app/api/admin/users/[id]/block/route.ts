export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";
import { verifyCsrf } from "@/lib/csrf";

export async function PATCH(
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
      { ok: false, error: "Ne možete blokirati sopstveni nalog." },
      { status: 400 }
    );
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.user.updateMany({
        where: { id },
        data: { isBlocked: true },
      });

      if (updated.count === 0) {
        return { ok: false as const, status: 404 as const, user: null };
      }

      await tx.session.deleteMany({ where: { userId: id } });

      const user = await tx.user.findUnique({
        where: { id },
        select: { id: true, email: true, role: true, isBlocked: true },
      });

      return { ok: true as const, status: 200 as const, user };
    });

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: "Korisnik nije pronađen." },
        { status: result.status }
      );
    }

    return NextResponse.json({ ok: true, user: result.user });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Greška pri blokiranju korisnika." },
      { status: 500 }
    );
  }
}