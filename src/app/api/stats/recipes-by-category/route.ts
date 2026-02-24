import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const grouped = await prisma.recipe.groupBy({
    by: ["categoryId"],
    _count: { _all: true },
  });

  const categoryIds = grouped
    .map((g) => g.categoryId)
    .filter((id): id is string => Boolean(id));

  const categories = await prisma.categoryRecipe.findMany({
    where: { id: { in: categoryIds } },
    select: { id: true, name: true },
  });

  const idToName = new Map(categories.map((c) => [c.id, c.name]));

  const data = grouped.map((g) => ({
    categoryId: g.categoryId,
    categoryName: g.categoryId ? idToName.get(g.categoryId) ?? "Nepoznata" : "Bez kategorije",
    count: g._count._all,
  }));

  return NextResponse.json({ data });
}