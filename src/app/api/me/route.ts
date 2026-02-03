export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

async function getUserIdFromToken() {
  const store: any = await cookies();
  const token = store?.get?.("session")?.value;
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
        isPremium: true,
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

    const body = await req.json().catch(() => ({}));

    const name = typeof body.name === "string" ? body.name.trim() : null;
    const firstName = typeof body.firstName === "string" ? body.firstName.trim() : null;
    const lastName = typeof body.lastName === "string" ? body.lastName.trim() : null;
    const phoneRaw = typeof body.phone === "string" ? body.phone.trim() : "";
    const phone = phoneRaw.length > 0 ? phoneRaw : null;

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

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { name, firstName, lastName, phone },
      select: {
        id: true,
        email: true,
        role: true,
        isPremium: true,
        name: true,
        firstName: true,
        lastName: true,
        phone: true,
      },
    });

    return NextResponse.json({ ok: true, user: updated }, { status: 200 });
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
