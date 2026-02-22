export const runtime = "nodejs";

import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch("https://www.themealdb.com/api/json/v1/1/random.php", {
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { ok: false, error: "Ne mogu da učitam predlog dana." },
        { status: 502 }
      );
    }

    const data = await res.json().catch(() => null);
    const meal = data?.meals?.[0];

    if (!meal) {
      return NextResponse.json(
        { ok: false, error: "Nema podatka o receptu." },
        { status: 404 }
      );
    }

    
    return NextResponse.json(
      {
        ok: true,
        meal: {
          id: String(meal.idMeal),
          title: String(meal.strMeal ?? ""),
          category: String(meal.strCategory ?? ""),
          area: String(meal.strArea ?? ""),
          imageUrl: String(meal.strMealThumb ?? ""),
          sourceUrl: String(meal.strSource ?? ""),
          youtubeUrl: String(meal.strYoutube ?? ""),
        },
      },
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: "Server error.", message: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}