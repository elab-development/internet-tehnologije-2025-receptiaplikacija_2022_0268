export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { Prisma } from "@prisma/client";

export async function GET() {
  try {
    const store: any = await cookies();
    const token = store?.get?.("session")?.value;

    if (!token) {
      return NextResponse.json(
        { ok: false, error: "Nisi ulogovan (nema session cookie)." },
        { status: 401 }
      );
    }

    // 1) Cookie sadrži TOKEN -> tražimo ga u Session tabeli
    const dbSession = await prisma.session.findUnique({
      where: { token },
      select: { userId: true, expiresAt: true },
    });

    if (!dbSession) {
      return NextResponse.json(
        { ok: false, error: "Sesija nevažeća (token ne postoji)." },
        { status: 401 }
      );
    }

    // 2) (opciono) provera isteka
    if (dbSession.expiresAt && dbSession.expiresAt < new Date()) {
      return NextResponse.json(
        { ok: false, error: "Sesija je istekla." },
        { status: 401 }
      );
    }

    // 3) Dohvati usera po userId
    const user = await prisma.user.findUnique({
      where: { id: dbSession.userId },
      select: { id: true, email: true, role: true, isPremium: true },
    });

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Sesija nevažeća (user ne postoji)." },
        { status: 401 }
      );
    }

    return NextResponse.json({ ok: true, user }, { status: 200 });
  } catch (err: any) {
    if (err instanceof Prisma.PrismaClientInitializationError) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Ne mogu da se povežem na bazu (Prisma init). Proveri DATABASE_URL i da li je Postgres upaljen.",
          message: err.message,
        },
        { status: 500 }
      );
    }

    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        {
          ok: false,
          error: "Prisma query error.",
          code: err.code,
          message: err.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: "Server error u /api/me",
        message: String(err?.message ?? err),
      },
      { status: 500 }
    );
  }
}
