export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const email = body?.email?.toLowerCase?.().trim?.();
  const password = body?.password;

  if (!email || !password) {
    return NextResponse.json(
      { ok: false, error: "Nedostaje email ili lozinka." },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Pogrešan email ili lozinka." },
      { status: 401 }
    );
  }

  if (user.isBlocked) {
    await prisma.session.deleteMany({ where: { userId: user.id } });

    return NextResponse.json(
      { ok: false, error: "Nalog je blokiran." },
      { status: 403 }
    );
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return NextResponse.json(
      { ok: false, error: "Pogrešan email ili lozinka." },
      { status: 401 }
    );
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); 

  await prisma.session.create({
    data: {
      token,
      userId: user.id,
      expiresAt,
    },
  });

  const res = NextResponse.json(
    {
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isPremium: user.isPremium,
      },
    },
    { status: 200 }
  );

  res.cookies.set("session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return res;
}

