import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET() {
  const userId = await getSession();
  if (!userId) return NextResponse.json({ ok: true, isPremium: false });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isPremium: true, isBlocked: true },
  });

  if (!user || user.isBlocked) return NextResponse.json({ ok: true, isPremium: false });

  return NextResponse.json({ ok: true, isPremium: user.isPremium });
}
