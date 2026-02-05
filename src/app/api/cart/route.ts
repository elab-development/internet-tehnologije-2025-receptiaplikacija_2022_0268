export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { Prisma } from "@prisma/client";

async function getUserFromSession() {
  const store = await cookies();
  const token = store.get("session")?.value;
  if (!token) return null;

  const dbSession = await prisma.session.findUnique({
    where: { token },
    select: { userId: true, expiresAt: true },
  });

  if (!dbSession) return null;
  if (dbSession.expiresAt && dbSession.expiresAt < new Date()) return null;

  const user = await prisma.user.findUnique({
    where: { id: dbSession.userId },
    select: { id: true, role: true },
  });

  return user ? { id: user.id, role: user.role } : null;
}

function forbidAdmin(role: any) {
  return role === "ADMIN"
    ? NextResponse.json(
        { ok: false, error: "Admin ne može da kupuje." },
        { status: 403 }
      )
    : null;
}

export async function GET() {
  try {
    const user = await getUserFromSession();
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Nisi ulogovan." },
        { status: 401 }
      );
    }

    const blocked = forbidAdmin(user.role);
    if (blocked) return blocked;

    const cart = await prisma.cart.findUnique({
      where: { userId: user.id },
      select: {
        id: true,
        updatedAt: true,
        items: { select: { id: true, name: true, quantity: true, unit: true } },
      },
    });

    return NextResponse.json(
      { ok: true, cart: cart ?? { items: [] } },
      { status: 200 }
    );
  } catch (err: any) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        { ok: false, error: "Prisma error.", message: err.message },
        { status: 500 }
      );
    }
    return NextResponse.json(
      {
        ok: false,
        error: "Server error /api/cart",
        message: String(err?.message ?? err),
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getUserFromSession();
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Nisi ulogovan." },
        { status: 401 }
      );
    }

    const blocked = forbidAdmin(user.role);
    if (blocked) return blocked;

    const body = await req.json().catch(() => null);
    const name = String(body?.name ?? "").trim();
    const quantity = Number(body?.quantity ?? 1);
    const unit = String(body?.unit ?? "kom").trim() || "kom";

    if (!name) {
      return NextResponse.json(
        { ok: false, error: "Nedostaje name." },
        { status: 400 }
      );
    }
    if (!Number.isFinite(quantity) || quantity <= 0) {
      return NextResponse.json(
        { ok: false, error: "Neispravna quantity." },
        { status: 400 }
      );
    }

    const cart = await prisma.cart.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
      select: { id: true },
    });

    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        name,
        quantity,
        unit,
      },
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err: any) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        { ok: false, error: "Prisma error.", message: err.message },
        { status: 500 }
      );
    }
    return NextResponse.json(
      {
        ok: false,
        error: "Server error /api/cart POST",
        message: String(err?.message ?? err),
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getUserFromSession();
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Nisi ulogovan." },
        { status: 401 }
      );
    }

    const blocked = forbidAdmin(user.role);
    if (blocked) return blocked;

    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get("itemId");

    if (!itemId) {
      return NextResponse.json(
        { ok: false, error: "Nedostaje itemId." },
        { status: 400 }
      );
    }

    const cart = await prisma.cart.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    if (!cart) {
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    await prisma.cartItem.deleteMany({
      where: { id: itemId, cartId: cart.id },
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err: any) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        { ok: false, error: "Prisma error.", message: err.message },
        { status: 500 }
      );
    }
    return NextResponse.json(
      {
        ok: false,
        error: "Server error /api/cart DELETE",
        message: String(err?.message ?? err),
      },
      { status: 500 }
    );
  }
}
