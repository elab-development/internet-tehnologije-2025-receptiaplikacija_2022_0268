export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";

export async function POST(req: Request) {
  try {
    console.log("REGISTER: DATABASE_URL =", process.env.DATABASE_URL);

    const body = await req.json().catch(() => null);

    const emailRaw = typeof body?.email === "string" ? body.email : "";
    const password = typeof body?.password === "string" ? body.password : "";

    const email = emailRaw.toLowerCase().trim();

    if (!email || !email.includes("@") || password.length < 8) {
      return NextResponse.json(
        { ok: false, error: "Neispravan email ili lozinka (min 8)." },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { ok: false, error: "Email je već registrovan." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { email, passwordHash, role: "KUPAC" },
      select: { id: true, email: true, role: true },
    });

    return NextResponse.json({ ok: true, user }, { status: 201 });
  } catch (err: any) {
    console.error("REGISTER ERROR:", err);

    // Prisma poznate greške (npr. unique constraint, connect error...)
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      // npr. P2002 = Unique constraint failed
      if (err.code === "P2002") {
        return NextResponse.json(
          { ok: false, error: "Email je već registrovan." },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { ok: false, error: "Greška u bazi.", code: err.code },
        { status: 500 }
      );
    }

    if (err instanceof Prisma.PrismaClientInitializationError) {
      return NextResponse.json(
        {
          ok: false,
          error: "Ne mogu da se povežem na bazu (Prisma init). Proveri DATABASE_URL i Postgres.",
          message: err.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { ok: false, error: "Server error.", message: err?.message },
      { status: 500 }
    );
  }
}
