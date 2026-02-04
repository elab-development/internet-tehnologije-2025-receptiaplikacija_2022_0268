export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { Prisma } from "@prisma/client";

async function getUserIdFromSession() {
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

export async function GET() {
  try {
    const userId = await getUserIdFromSession();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Nisi ulogovan." }, { status: 401 });
    }

    const cart = await prisma.cart.findUnique({
      where: { userId },
      select: {
        id: true,
        updatedAt: true,
        items: { select: { id: true, name: true, quantity: true, unit: true } },
      },
    });

    return NextResponse.json({ ok: true, cart: cart ?? { items: [] } }, { status: 200 });
  } catch (err: any) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json({ ok: false, error: "Prisma error.", message: err.message }, { status: 500 });
    }
    return NextResponse.json({ ok: false, error: "Server error /api/cart", message: String(err?.message ?? err) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const userId = await getUserIdFromSession();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Nisi ulogovan." }, { status: 401 });
    }

    const body = await req.json();
    const name = String(body?.name ?? "").trim();
    const quantity = Number(body?.quantity ?? 1);
    const unit = String(body?.unit ?? "kom").trim() || "kom";

    if (!name) {
      return NextResponse.json({ ok: false, error: "Nedostaje name." }, { status: 400 });
    }
    if (!Number.isFinite(quantity) || quantity <= 0) {
      return NextResponse.json({ ok: false, error: "Neispravna quantity." }, { status: 400 });
    }

    const cart = await prisma.cart.upsert({
      where: { userId },
      update: {},
      create: { userId },
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
      return NextResponse.json({ ok: false, error: "Prisma error.", message: err.message }, { status: 500 });
    }
    return NextResponse.json({ ok: false, error: "Server error /api/cart POST", message: String(err?.message ?? err) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const userId = await getUserIdFromSession();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Nisi ulogovan." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get("itemId");

    if (!itemId) {
      return NextResponse.json({ ok: false, error: "Nedostaje itemId." }, { status: 400 });
    }

    const cart = await prisma.cart.findUnique({
      where: { userId },
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
      return NextResponse.json({ ok: false, error: "Prisma error.", message: err.message }, { status: 500 });
    }
    return NextResponse.json({ ok: false, error: "Server error /api/cart DELETE", message: String(err?.message ?? err) }, { status: 500 });
  }
}
