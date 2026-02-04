import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const recipeId = params.id;

  const reviews = await prisma.review.findMany({
    where: { recipeId },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ reviews });
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const recipeId = params.id;

  const body = await req.json();
  const { rating, comment } = body;

  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json(
      { error: "Ocena mora biti između 1 i 5." },
      { status: 400 }
    );
  }

  // ⚠️ TEMP korisnik (pošto nemamo auth sistem)
  const user = await prisma.user.findFirst();

  if (!user) {
    return NextResponse.json(
      { error: "Ne postoji korisnik." },
      { status: 400 }
    );
  }

  await prisma.review.create({
    data: {
      rating,
      comment,
      recipeId,
      userId: user.id,
    },
  });

  return NextResponse.json({
    message: "Recenzija uspešno sačuvana.",
  });
}