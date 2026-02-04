export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const recipes = await prisma.recipe.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        prepTimeMinutes: true,
        difficulty: true,
        imageUrl: true,
        isPremium: true,
        priceRSD: true,
        category: { select: { name: true } },
      },
    });

    return NextResponse.json({ ok: true, recipes });
  } catch {
    return NextResponse.json({ ok: false, error: "Ne mogu da učitam recepte." }, { status: 500 });
  }
}
