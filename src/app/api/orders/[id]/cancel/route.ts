export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

const SESSION_COOKIE = "session";

async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    select: {
      expiresAt: true,
      user: { select: { id: true, role: true } },
    },
  });

  if (!session) return null;
  if (session.expiresAt < new Date()) return null;

  return session.user;
}

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Morate biti prijavljeni." },
      { status: 401 }
    );
  }

  const order = await prisma.order.findUnique({
    where: { id },
    select: { id: true, userId: true, status: true },
  });

  if (!order) {
    return NextResponse.json(
      { ok: false, error: "Porudžbina nije pronađena." },
      { status: 404 }
    );
  }

  if (user.role !== "ADMIN" && order.userId !== user.id) {
    return NextResponse.json(
      { ok: false, error: "Nemate pristup ovoj porudžbini." },
      { status: 403 }
    );
  }

  if (order.status !== "CREATED") {
    return NextResponse.json(
      { ok: false, error: "Porudžbina se ne može otkazati." },
      { status: 400 }
    );
  }

  await prisma.order.update({
    where: { id: order.id },
    data: { status: "CANCELLED" },
  });

  return NextResponse.json({ ok: true });
}
