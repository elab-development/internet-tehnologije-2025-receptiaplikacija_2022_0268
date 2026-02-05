export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const categories = await prisma.categoryRecipe.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });
    return NextResponse.json({ ok: true, categories });
  } catch {
    return NextResponse.json({ ok: false, error: "Ne mogu da učitam kategorije." }, { status: 500 });
  }
}
