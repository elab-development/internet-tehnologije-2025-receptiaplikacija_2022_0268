import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function POST() {
  const userId = await getSession();

  if (!userId) {
    return NextResponse.json(
      { ok: false, error: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, isBlocked: true, isPremium: true },
  });

  if (!user || user.isBlocked) {
    return NextResponse.json(
      { ok: false, error: "FORBIDDEN" },
      { status: 403 }
    );
  }

  if (user.isPremium) {
    return NextResponse.json({ ok: true, already: true });
  }

  await prisma.user.update({
    where: { id: userId },
    data: { isPremium: true },
  });

  return NextResponse.json({ ok: true });
}
