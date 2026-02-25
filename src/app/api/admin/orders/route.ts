export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";

export async function GET(req: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return NextResponse.json(
      { ok: false, error: guard.error },
      { status: guard.status }
    );
  }

  const { searchParams } = new URL(req.url);
  const take = Math.min(Math.max(Number(searchParams.get("take") ?? 50), 1), 200);
  const skip = Math.max(Number(searchParams.get("skip") ?? 0), 0);

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take,
    skip,
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

  return NextResponse.json({ ok: true, orders, page: { take, skip } });
}