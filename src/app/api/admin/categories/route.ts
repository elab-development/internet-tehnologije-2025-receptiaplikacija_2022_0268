export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/authz";
import { verifyCsrf } from "@/lib/csrf";
import { cleanText } from "@/lib/sanitize";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json(
      { ok: false, error: "Nemate admin prava." },
      { status: 403 }
    );
  }

  const categories = await prisma.categoryRecipe.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return NextResponse.json({ ok: true, categories });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json(
      { ok: false, error: "Nemate admin prava." },
      { status: 403 }
    );
  }

  if (!verifyCsrf(req)) {
    return NextResponse.json({ ok: false, error: "CSRF blocked." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const rawName = String(body?.name ?? "");
  const name = cleanText(rawName, 80); 

  if (!name) {
    return NextResponse.json(
      { ok: false, error: "Nedostaje naziv kategorije." },
      { status: 400 }
    );
  }

  try {
    const category = await prisma.categoryRecipe.create({
      data: { name },
      select: { id: true, name: true },
    });

    return NextResponse.json({ ok: true, category }, { status: 201 });
  } catch (e: any) {
    if (e?.code === "P2002") {
      return NextResponse.json(
        { ok: false, error: "Kategorija sa tim nazivom već postoji." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { ok: false, error: "Greška pri kreiranju kategorije." },
      { status: 500 }
    );
  }
}