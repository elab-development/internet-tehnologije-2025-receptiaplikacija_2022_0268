export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

const SESSION_COOKIE = "session";

async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    select: {
      expiresAt: true,
      user: { select: { id: true, role: true, email: true, name: true } },
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
  title: string;
  qty: number;
  priceRsd: number;
};

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

  const body = await req.json().catch(() => null);

  const address = String(body?.address ?? "").trim();
  const phone = String(body?.phone ?? "").trim();
  const paymentMethodRaw = String(body?.paymentMethod ?? "").trim();
  const items = (body?.items ?? []) as CartItemDto[];

  const paymentMethod = paymentMethodRaw as PaymentMethod;
  const allowedPayments: PaymentMethod[] = ["CASH_ON_DELIVERY", "CARD"];

  if (!address || !phone || !paymentMethodRaw) {
    return NextResponse.json(
      { ok: false, error: "Nisu uneti svi podaci za dostavu." },
      { status: 400 }
    );
  }

  if (!allowedPayments.includes(paymentMethod)) {
    return NextResponse.json(
      { ok: false, error: "Neispravan način plaćanja." },
      { status: 400 }
    );
  }

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ ok: false, error: "Korpa je prazna." }, { status: 400 });
  }

  let totalRsd = 0;

  for (const it of items) {
    const qty = Number(it.qty);
    const unit = Number(it.priceRsd);

    const kindOk = it?.kind === "RECIPE" || it?.kind === "INGREDIENT";
    if (!kindOk || !it?.id || !it?.title) {
      return NextResponse.json(
        { ok: false, error: "Neispravne stavke u korpi." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(qty) || qty < 1) {
      return NextResponse.json(
        { ok: false, error: "Neispravna količina u korpi." },
        { status: 400 }
      );
    }
    if (!Number.isFinite(unit) || unit < 0) {
      return NextResponse.json(
        { ok: false, error: "Neispravna cena u korpi." },
        { status: 400 }
      );
    }

    totalRsd += qty * unit;
  }

  try {
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        address,
        phone,
        paymentMethod: paymentMethod as any,
        totalRsd,
        items: {
          create: items.map((it) => {
            const qty = Number(it.qty);
            const unit = Number(it.priceRsd);
            return {
              kind: it.kind,
              productId: it.id,
              title: it.title,
              qty,
              unitPriceRsd: unit,
              lineTotalRsd: qty * unit,
            };
          }),
        },
      },
      select: { id: true },
    });

    return NextResponse.json({
      ok: true,
      message: "Narudžbina je uspešno kreirana.",
      orderId: order.id,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: "Sistem ne može da kreira narudžbinu." },
      { status: 500 }
    );
  }
}

