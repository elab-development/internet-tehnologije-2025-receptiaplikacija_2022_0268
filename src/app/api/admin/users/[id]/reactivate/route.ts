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

  const updated = await prisma.user.update({
    where: { id: params.id },
    data: { isBlocked: false },
    select: { id: true, email: true, role: true, isBlocked: true },
  });

  return NextResponse.json({ ok: true, user: updated });
}
