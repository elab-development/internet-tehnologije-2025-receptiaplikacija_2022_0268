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

  try {
    const updated = await prisma.user.updateMany({
      where: { id },
      data: { isBlocked: false },
    });

    if (updated.count === 0) {
      return NextResponse.json(
        { ok: false, error: "Korisnik nije pronađen." },
        { status: 404 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, role: true, isBlocked: true },
    });

    return NextResponse.json({ ok: true, user });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Greška pri reaktivaciji korisnika." },
      { status: 500 }
    );
  }
}