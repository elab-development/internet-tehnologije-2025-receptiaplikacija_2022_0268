import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const key = req.headers.get("x-admin-seed-key") || "";
  if (!process.env.ADMIN_SEED_KEY || key !== process.env.ADMIN_SEED_KEY) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const mod = await import("../../../../../prisma/seed-all");
    await mod.seedAll();

    return NextResponse.json({ ok: true, message: "Seed completed" });
  } catch (e: any) {
    console.error("Seed error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Seed failed" },
      { status: 500 }
    );
  }
}