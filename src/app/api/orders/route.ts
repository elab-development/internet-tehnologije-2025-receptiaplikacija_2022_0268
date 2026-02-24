export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyCsrf } from "@/lib/csrf";
import { cleanText } from "@/lib/sanitize";

const SESSION_COOKIE = "session";

async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    select: {
      expiresAt: true,
      user: { select: { id: true, role: true } },
    },
  });

  if (!session) return null;
  if (session.expiresAt < new Date()) return null;

  return session.user;
}

type PaymentMethod = "CASH_ON_DELIVERY" | "CARD";
type CartItemDto = {
  kind: "RECIPE" | "INGREDIENT";
  id: string;
  qty: number;
};

function normalizePhone(v: string) {
  const cleaned = v.replace(/[^\d+]/g, "");
  if (cleaned.length < 6 || cleaned.length > 20) return "";
  return cleaned;
}

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Kreira porudžbinu (kupovina)
 *     tags: [Orders]
 *     responses:
 *       201: { description: Porudžbina kreirana }
 *       401: { description: Nije prijavljen }
 */

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Morate biti prijavljeni." },
      { status: 401 }
    );
  }
  if (user.role !== "KUPAC") {
    return NextResponse.json(
      { ok: false, error: "Samo kupac može da kreira narudžbinu." },
      { status: 403 }
    );
  }

  if (!(await verifyCsrf(req))) {
    return NextResponse.json({ ok: false, error: "CSRF blocked." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);

  const address = cleanText(String(body?.address ?? ""), 500);
  const phoneRaw = cleanText(String(body?.phone ?? ""), 30);
  const phone = normalizePhone(phoneRaw);

  const paymentMethod = String(body?.paymentMethod ?? "").trim() as PaymentMethod;
  const allowedPayments: PaymentMethod[] = ["CASH_ON_DELIVERY", "CARD"];

  const items = (Array.isArray(body?.items) ? body.items : []) as CartItemDto[];

  if (!address || !phone || !allowedPayments.includes(paymentMethod)) {
    return NextResponse.json(
      { ok: false, error: "Neispravni podaci za porudžbinu." },
      { status: 400 }
    );
  }

  if (items.length === 0) {
    return NextResponse.json({ ok: false, error: "Korpa je prazna." }, { status: 400 });
  }

  let totalRsd = 0;
  const orderItems: Array<{
    kind: "RECIPE" | "INGREDIENT";
    productId: string;
    title: string;
    qty: number;
    unitPriceRsd: number;
    lineTotalRsd: number;
  }> = [];

  for (const it of items) {
    const kindOk = it?.kind === "RECIPE" || it?.kind === "INGREDIENT";
    const id = String(it?.id ?? "").trim();
    const qty = Number(it?.qty);

    if (!kindOk || !id) {
      return NextResponse.json(
        { ok: false, error: "Neispravne stavke u korpi." },
        { status: 400 }
      );
    }
    if (!Number.isFinite(qty) || qty < 1 || qty > 1000) {
      return NextResponse.json(
        { ok: false, error: "Neispravna količina u korpi." },
        { status: 400 }
      );
    }

    if (it.kind === "RECIPE") {
      const recipe = await prisma.recipe.findUnique({
        where: { id },
        select: { id: true, title: true, isPremium: true, priceRSD: true },
      });

      if (!recipe) {
        return NextResponse.json(
          { ok: false, error: "Recept ne postoji." },
          { status: 400 }
        );
      }

      const price = recipe.isPremium ? recipe.priceRSD : 0;

      totalRsd += qty * price;

      orderItems.push({
        kind: "RECIPE",
        productId: recipe.id,
        title: recipe.title,
        qty,
        unitPriceRsd: price,
        lineTotalRsd: qty * price,
      });
    } else {
      const ingredient = await prisma.ingredient.findUnique({
        where: { id },
        select: { id: true, name: true, priceRsd: true },
      });

      if (!ingredient) {
        return NextResponse.json(
          { ok: false, error: "Sastojak ne postoji." },
          { status: 400 }
        );
      }

      if (ingredient.priceRsd == null) {
        return NextResponse.json(
          { ok: false, error: "Sastojak nema definisanu cenu." },
          { status: 400 }
        );
      }

      const price = ingredient.priceRsd;

      totalRsd += qty * price;

      orderItems.push({
        kind: "INGREDIENT",
        productId: ingredient.id,
        title: ingredient.name,
        qty,
        unitPriceRsd: price,
        lineTotalRsd: qty * price,
      });
    }
  }

  try {
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        address,
        phone,
        paymentMethod,
        totalRsd,
        items: { create: orderItems },
      },
      select: { id: true },
    });

    return NextResponse.json(
      {
        ok: true,
        message: "Narudžbina je uspešno kreirana.",
        orderId: order.id,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: "Sistem ne može da kreira narudžbinu." },
      { status: 500 }
    );
  }
}