export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";

export async function PATCH(
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
    const updated = await prisma.user.update({
      where: { id },
      data: { isBlocked: false },
      select: { id: true, email: true, role: true, isBlocked: true },
    });

    return NextResponse.json({ ok: true, user: updated });
  } catch (e: any) {
    if (e?.code === "P2025") {
      return NextResponse.json(
        { ok: false, error: "Korisnik nije pronađen." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { ok: false, error: "Greška pri reaktivaciji korisnika." },
      { status: 500 }
    );
  }
}
