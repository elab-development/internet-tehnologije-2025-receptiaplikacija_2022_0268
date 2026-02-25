export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { cleanText } from "@/lib/sanitize";

/**
 * @swagger
 * /api/register:
 *   post:
 *     summary: Registracija korisnika
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       201: { description: Uspešna registracija }
 *       400: { description: Neispravni podaci }
 */

function normalizePhone(v: string) {
  const cleaned = v.replace(/[^\d+]/g, "");
  if (cleaned.length < 6 || cleaned.length > 20) return "";
  return cleaned;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ ok: false, error: "Neispravan JSON." }, { status: 400 });
    }

    const roleRaw = (body as any)?.role;
    let role: "KUPAC" | "KUVAR" = "KUPAC";
    if (roleRaw === "KUVAR") role = "KUVAR";

    const emailRaw = typeof (body as any)?.email === "string" ? (body as any).email : "";
    const password = typeof (body as any)?.password === "string" ? (body as any).password : "";

    const name = typeof (body as any)?.name === "string" ? cleanText(String((body as any).name), 120) : null;
    const firstName =
      typeof (body as any)?.firstName === "string" ? cleanText(String((body as any).firstName), 80) : null;
    const lastName =
      typeof (body as any)?.lastName === "string" ? cleanText(String((body as any).lastName), 80) : null;

    const phoneRaw = typeof (body as any)?.phone === "string" ? cleanText(String((body as any).phone), 30) : null;
    const phone = phoneRaw ? normalizePhone(phoneRaw) : null;

    const email = cleanText(emailRaw.toLowerCase().trim(), 254);

    if (!email || !email.includes("@") || email.length > 254) {
      return NextResponse.json({ ok: false, error: "Neispravan email." }, { status: 400 });
    }

    if (password.length < 8 || password.length > 200) {
      return NextResponse.json(
        { ok: false, error: "Lozinka mora imati minimum 8 karaktera." },
        { status: 400 }
      );
    }

    if (phoneRaw && !phone) {
      return NextResponse.json({ ok: false, error: "Broj telefona nije validan." }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ ok: false, error: "Email je već registrovan." }, { status: 409 });
    }
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role,
        name,
        firstName,
        lastName,
        phone,
      },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        firstName: true,
        lastName: true,
        phone: true,
      },
    });

    return NextResponse.json({ ok: true, user }, { status: 201 });
  } catch (err: any) {
    console.error("REGISTER ERROR:", err);

    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2002") {
        return NextResponse.json(
          { ok: false, error: "Email ili telefon je već registrovan." },
          { status: 409 }
        );
      }
      return NextResponse.json({ ok: false, error: "Greška u bazi." }, { status: 500 });
    }

    return NextResponse.json({ ok: false, error: "Server error." }, { status: 500 });
  }
}