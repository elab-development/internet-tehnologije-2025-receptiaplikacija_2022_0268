import { NextResponse } from "next/server";

type Nutrition = {
  productName: string;
  source: string;
  kcal_100g: number | null;
  protein_100g: number | null;
  fat_100g: number | null;
  carbs_100g: number | null;
};

function num(v: any): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();

  if (!q) {
    return NextResponse.json({ error: "Missing query param q" }, { status: 400 });
  }

  const url =
    "https://world.openfoodfacts.org/cgi/search.pl" +
    `?search_terms=${encodeURIComponent(q)}` +
    "&search_simple=1" +
    "&action=process" +
    "&json=1" +
    "&page_size=10";

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      return NextResponse.json({ error: "OpenFoodFacts request failed" }, { status: 502 });
    }

    const data = await res.json();

    const products: any[] = Array.isArray(data?.products) ? data.products : [];
    if (products.length === 0) {
      return NextResponse.json({ found: false, q }, { status: 200 });
    }

    const p =
      products.find((x) => x?.nutriments?.["energy-kcal_100g"] != null) ?? products[0];

    const n = p?.nutriments ?? {};

    const out: Nutrition = {
      productName: String(p?.product_name ?? p?.generic_name ?? q),
      source: "OpenFoodFacts",
      kcal_100g: num(n["energy-kcal_100g"]),
      protein_100g: num(n["proteins_100g"]),
      fat_100g: num(n["fat_100g"]),
      carbs_100g: num(n["carbohydrates_100g"]),
    };

    return NextResponse.json({ found: true, q, nutrition: out }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: "Server error", details: String(e) }, { status: 500 });
  }
}