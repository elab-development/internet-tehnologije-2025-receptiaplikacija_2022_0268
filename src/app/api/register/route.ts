export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const roleRaw = body?.role;

    let role: "KUPAC" | "KUVAR" = "KUPAC";
    if (roleRaw === "KUVAR") {
      role = "KUVAR";
    }

    const emailRaw = typeof body?.email === "string" ? body.email : "";
    const password = typeof body?.password === "string" ? body.password : "";

    const firstName =
      typeof body?.firstName === "string" ? body.firstName.trim() : null;
    const lastName =
      typeof body?.lastName === "string" ? body.lastName.trim() : null;
    const phone = typeof body?.phone === "string" ? body.phone.trim() : null;

    const email = emailRaw.toLowerCase().trim();

    // osnovne validacije
    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { ok: false, error: "Neispravan email." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { ok: false, error: "Lozinka mora imati minimum 8 karaktera." },
        { status: 400 }
      );
    }

    if (phone && phone.length < 6) {
      return NextResponse.json(
        { ok: false, error: "Broj telefona nije validan." },
        { status: 400 }
      );
    }

    // (opciono) provera pre create — lepo za poruke, ali nije obavezno
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { ok: false, error: "Email je već registrovan." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role,
        firstName,
        lastName,
        phone,
      },
      select: { id: true, email: true, role: true },
    });


    return NextResponse.json({ ok: true, user }, { status: 201 });
  } catch (err: any) {
    console.error("REGISTER ERROR:", err);

    // Prisma poznate greške (npr. unique constraint)
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2002") {
        return NextResponse.json(
          { ok: false, error: "Email ili telefon je već registrovan." },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { ok: false, error: "Greška u bazi.", code: err.code },
        { status: 500 }
      );
    }

    // sve ostalo
    return NextResponse.json(
      { ok: false, error: "Server error.", message: err?.message },
      { status: 500 }
    );
  }
}
