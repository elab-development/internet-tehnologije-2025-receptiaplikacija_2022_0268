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

  const recipes = await prisma.recipe.findMany({
    orderBy: { createdAt: "desc" },
    take,
    skip,
    select: {
      id: true,
      title: true,
      isPublished: true,
      isPremium: true,
      priceRSD: true,
      avgRating: true,
      reviewsCount: true,
      createdAt: true,
      author: { select: { id: true, email: true, name: true } },
      category: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ ok: true, recipes, page: { take, skip } });
}