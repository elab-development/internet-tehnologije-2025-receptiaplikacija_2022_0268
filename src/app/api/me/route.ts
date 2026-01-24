export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { Prisma } from "@prisma/client";

export async function GET() {
  try {
    const store: any = await cookies();
    const session = store?.get?.("session")?.value;

    if (!session) {
      return NextResponse.json(
        { ok: false, error: "Nisi ulogovan (nema session cookie)." },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session },
      select: { id: true, email: true, role: true },
    });

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Sesija nevažeća (user ne postoji)." },
        { status: 401 }
      );
    }

    return NextResponse.json({ ok: true, user }, { status: 200 });
  } catch (err: any) {
    // Prisma init / konekcija
    if (err instanceof Prisma.PrismaClientInitializationError) {
      return NextResponse.json(
        {
          ok: false,
          error: "Ne mogu da se povežem na bazu (Prisma init). Proveri DATABASE_URL i da li je Postgres upaljen.",
          message: err.message,
        },
        { status: 500 }
      );
    }

    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        { ok: false, error: "Prisma query error.", code: err.code, message: err.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { ok: false, error: "Server error u /api/me", message: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}
