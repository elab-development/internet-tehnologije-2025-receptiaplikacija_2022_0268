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
      user: {
        select: {
          id: true,
          role: true,
          email: true,
          name: true,
        },
      },
    },
  });

  if (!session) return null;
  if (session.expiresAt < new Date()) return null;

  return session.user;
}

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Morate biti prijavljeni." },
      { status: 401 }
    );
  }

  if (user.role !== "KUPAC") {
    return NextResponse.json(
      { ok: false, error: "Samo kupac može da vidi porudžbine." },
      { status: 403 }
    );
  }

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      createdAt: true,
      totalRsd: true,
      paymentMethod: true,
      _count: { select: { items: true } },
    },
  });

  return NextResponse.json({ ok: true, orders });
}
