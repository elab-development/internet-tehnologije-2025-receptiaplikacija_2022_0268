import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ✅ fallback bez auth-a:
// 1) ako postoji kupac@test.com koristi njega
// 2) inače uzmi najnovijeg korisnika (poslednje kreiranog)
async function getCurrentUserFallback() {
  const byEmail = await prisma.user.findUnique({
    where: { email: "kupac@test.com" },
    select: { id: true, name: true, email: true },
  });
  if (byEmail) return byEmail;

  const latest = await prisma.user.findFirst({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, email: true },
  });

  return latest;
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params; // ✅ Next 15
    const recipeId = decodeURIComponent(id);

    const reviews = await prisma.review.findMany({
      where: { recipeId },
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ reviews }, { status: 200 });
  } catch (e) {
    return NextResponse.json(
      { error: "Server error", details: String(e) },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params; // ✅ Next 15
    const recipeId = decodeURIComponent(id);

    const body = await req.json().catch(() => null);
    const rating = Number(body?.rating);
    const comment =
      typeof body?.comment === "string" && body.comment.trim().length > 0
        ? body.comment.trim()
        : null;

    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Ocena mora biti 1-5." }, { status: 400 });
    }

    const user = await getCurrentUserFallback();
    if (!user) {
      return NextResponse.json(
        { error: "Nema nijednog korisnika u bazi." },
        { status: 401 }
      );
    }

    // (opciono) proveri da recept postoji da ne praviš review za nepostojeći id
    const recipeExists = await prisma.recipe.findUnique({
      where: { id: recipeId },
      select: { id: true },
    });
    if (!recipeExists) {
      return NextResponse.json({ error: "Recept ne postoji." }, { status: 404 });
    }

    const created = await prisma.review.create({
      data: {
        recipeId,
        userId: user.id,
        rating,
        comment,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(
      { message: "Recenzija je uspešno ostavljena.", review: created },
      { status: 201 }
    );
  } catch (e) {
    console.error("REVIEWS POST ERROR:", e);
    return NextResponse.json(
      { error: "Server error", details: String(e) },
      { status: 500 }
    );
  }
}