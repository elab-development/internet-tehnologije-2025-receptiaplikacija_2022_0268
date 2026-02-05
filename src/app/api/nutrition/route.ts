import { NextResponse } from "next/server";

type Nutrition = {
  productName: string;
  source: string;
  kcal_100g: number | null;
  protein_100g: number | null;
  fat_100g: number | null;
  carbs_100g: number | null;
};

function numOrNull(v: unknown): number | null {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();

    if (!q) {
      return NextResponse.json({ found: false, error: "Unesi q." }, { status: 400 });
    }

   
    const url =
      "https://world.openfoodfacts.org/cgi/search.pl" +
      `?search_terms=${encodeURIComponent(q)}` +
      "&search_simple=1" +
      "&action=process" +
      "&json=1" +
      "&page_size=1";

    const r = await fetch(url, {
     
      headers: { "User-Agent": "recepti-aplikacija/1.0" },
      cache: "no-store",
    });

    if (!r.ok) {
      return NextResponse.json(
        { found: false, error: `OpenFoodFacts error: ${r.status}` },
        { status: 502 }
      );
    }

    const raw = await r.json();
    const product = raw?.products?.[0];

    if (!product) {
      return NextResponse.json({ found: false }, { status: 200 });
    }

    const nutr = product.nutriments ?? {};

    const nutrition: Nutrition = {
      productName: product.product_name ?? product.generic_name ?? q,
      source: "OpenFoodFacts",
      kcal_100g: numOrNull(nutr["energy-kcal_100g"] ?? nutr["energy-kcal"]),
      protein_100g: numOrNull(nutr["proteins_100g"] ?? nutr["proteins"]),
      fat_100g: numOrNull(nutr["fat_100g"] ?? nutr["fat"]),
      carbs_100g: numOrNull(nutr["carbohydrates_100g"] ?? nutr["carbohydrates"]),
    };

    return NextResponse.json({ found: true, nutrition });
  } catch (e: any) {
    return NextResponse.json(
      { found: false, error: e?.message ?? "Server error" },
      { status: 500 }
    );
  }
}