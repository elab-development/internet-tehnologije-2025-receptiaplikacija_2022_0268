export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyCsrf } from "@/lib/csrf";
import { cleanText } from "@/lib/sanitize";

async function getUserIdFromToken() {
  const store = await cookies();
  const token = store.get("session")?.value;
  if (!token) return null;

  const dbSession = await prisma.session.findUnique({
    where: { token },
    select: { userId: true, expiresAt: true },
  });

  if (!dbSession) return null;
  if (dbSession.expiresAt && dbSession.expiresAt < new Date()) return null;

  return dbSession.userId;
}

function isUniqueConstraintError(err: any) {
  if (!err) return false;
  if (err.code === "P2002") return true;
  const msg = String(err.message ?? "");
  return msg.toLowerCase().includes("unique");
}

function normalizePhone(v: string | null) {
  if (!v) return null;
  const cleaned = v.replace(/[^\d+]/g, "");
  if (cleaned.length < 6 || cleaned.length > 20) return null;
  return cleaned;
}

export async function GET() {
  try {
    const userId = await getUserIdFromToken();

    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "Nisi ulogovan (sesija nevažeća)." },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        firstName: true,
        lastName: true,
        phone: true,
        isBlocked: true,
      },
    });

    if (!user || user.isBlocked) {
      return NextResponse.json(
        { ok: false, error: "Nalog nije dostupan." },
        { status: 403 }
      );
    }

    return NextResponse.json({ ok: true, user }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: "Server error u GET /api/me", message: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const userId = await getUserIdFromToken();

    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "Nisi ulogovan (sesija nevažeća)." },
        { status: 401 }
      );
    }

    if (!(await verifyCsrf(req))) {
      return NextResponse.json({ ok: false, error: "CSRF blocked." }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));

    const name = body.name ? cleanText(String(body.name), 120) : null;
    const firstName = body.firstName ? cleanText(String(body.firstName), 80) : null;
    const lastName = body.lastName ? cleanText(String(body.lastName), 80) : null;

    const phoneRaw = typeof body.phone === "string" ? body.phone.trim() : "";
    const phone = normalizePhone(phoneRaw);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, isBlocked: true },
    });

    if (!user || user.isBlocked) {
      return NextResponse.json(
        { ok: false, error: "Nalog nije dostupan." },
        { status: 403 }
      );
    }

    const updated = await prisma.user.updateMany({
      where: { id: userId },
      data: { name, firstName, lastName, phone },
    });

    if (updated.count === 0) {
      return NextResponse.json(
        { ok: false, error: "Nalog nije pronađen." },
        { status: 404 }
      );
    }

    const fresh = await prisma.user.findUnique({
      where: { id: userId },
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

    return NextResponse.json({ ok: true, user: fresh }, { status: 200 });
  } catch (err: any) {
    if (isUniqueConstraintError(err)) {
      return NextResponse.json({ ok: false, error: "PHONE_TAKEN" }, { status: 409 });
    }

    return NextResponse.json(
      { ok: false, error: "Server error u PUT /api/me", message: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}