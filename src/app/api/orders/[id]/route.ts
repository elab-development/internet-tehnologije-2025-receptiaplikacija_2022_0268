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

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Morate biti prijavljeni." }, { status: 401 });
  }

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        orderBy: { id: "asc" },
        select: {
          id: true,
          kind: true,
          productId: true,
          title: true,
          qty: true,
          unitPriceRsd: true,
          lineTotalRsd: true,
        },
      },
    },
  });

  if (!order) {
    return NextResponse.json({ ok: false, error: "Porudžbina nije pronađena." }, { status: 404 });
  }

  if (user.role !== "ADMIN" && order.userId !== user.id) {
    return NextResponse.json({ ok: false, error: "Nemate pristup ovoj porudžbini." }, { status: 403 });
  }

  return NextResponse.json({
  ok: true,
  order: {
    id: order.id,
    address: order.address,
    phone: order.phone,
    paymentMethod: order.paymentMethod,
    totalRsd: order.totalRsd,
    status: order.status,
    createdAt: order.createdAt,
    items: order.items,
  },
});

}
