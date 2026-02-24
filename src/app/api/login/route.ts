export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { ensureCsrfToken } from "@/lib/csrf";

const MAX_ATTEMPTS = 10;
const WINDOW_MS = 10 * 60 * 1000; 
const attempts = new Map<string, { count: number; resetAt: number }>();

function getIp(req: Request) {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0].trim();
  return "unknown";
}

function isRateLimited(ip: string) {
  const now = Date.now();
  const rec = attempts.get(ip);
  if (!rec || rec.resetAt < now) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  rec.count += 1;
  attempts.set(ip, rec);
  return rec.count > MAX_ATTEMPTS;
}

function normalizeEmail(v: any) {
  const s = String(v ?? "").trim().toLowerCase();

  if (!s.includes("@") || s.length > 254) return "";
  return s;
}

/**
 * @swagger
 * /api/login:
 *   post:
 *     summary: Prijava korisnika
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200: { description: Uspešna prijava }
 *       401: { description: Neispravni kredencijali }
 */

/**
 * @swagger
 * /api/login:
 *   post:
 *     summary: Prijava korisnika
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200: { description: Uspešna prijava }
 *       401: { description: Neispravni kredencijali }
 */

export async function POST(req: Request) {
  const ip = getIp(req);
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { ok: false, error: "Previše pokušaja. Pokušaj ponovo kasnije." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const email = normalizeEmail(body?.email);
  const password = String(body?.password ?? "");

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

  await ensureCsrfToken();

  return res;
}