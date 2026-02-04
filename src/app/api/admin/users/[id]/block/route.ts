export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";

export async function PATCH(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return NextResponse.json(
      { ok: false, error: guard.error },
      { status: guard.status }
    );
  }

  if (params.id === guard.user.id) {
    return NextResponse.json(
      { ok: false, error: "Ne možete blokirati sopstveni nalog." },
      { status: 400 }
    );
  }

  const updated = await prisma.user.update({
    where: { id: params.id },
    data: { isBlocked: true },
    select: { id: true, email: true, role: true, isBlocked: true },
  });

  await prisma.session.deleteMany({ where: { userId: params.id } });

  return NextResponse.json({ ok: true, user: updated });
}
