export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const ingredients = await prisma.ingredient.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, defaultUnit: true, priceRsd: true },
    });
    return NextResponse.json({ ok: true, ingredients });
  } catch {
    return NextResponse.json({ ok: false, error: "Ne mogu da učitam sastojke." }, { status: 500 });
  }
}
