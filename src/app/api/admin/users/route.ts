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
  const q = (searchParams.get("q") ?? "").trim();

  const where =
    q.length > 0
      ? {
          OR: [
            { email: { contains: q, mode: "insensitive" as const } },
            { name: { contains: q, mode: "insensitive" as const } },
            { firstName: { contains: q, mode: "insensitive" as const } },
            { lastName: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {};

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take,
    skip,
    select: {
      id: true,
      email: true,
      name: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
      isBlocked: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ ok: true, users, page: { take, skip, q } });
}