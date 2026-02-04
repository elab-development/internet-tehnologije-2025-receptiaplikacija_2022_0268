export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return NextResponse.json(
      { ok: false, error: guard.error },
      { status: guard.status }
    );
  }

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      totalRsd: true,
      address: true,
      phone: true,
      paymentMethod: true,
      createdAt: true,
      user: { select: { id: true, email: true, name: true } },
      items: {
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

  return NextResponse.json({ ok: true, orders });
}
