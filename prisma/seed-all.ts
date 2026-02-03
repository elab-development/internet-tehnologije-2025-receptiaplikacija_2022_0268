import "dotenv/config";
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { RECIPES } from "../src/lib/recipes";

const prisma = new PrismaClient();



function norm(s: string) {
  return (s ?? "")
    .toLowerCase()
    .replace(/[()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function splitByComma(s: string): string[] {
  return (s ?? "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}


 
const CANONICAL_MAP: Record<string, string> = {
  // tvoje poruke / preskoci
  "2 jaja": "jaja",
  "1 avokado": "avokado",
  "crni pasulj": "pasulj",
  "kisele kupus": "kiseli kupus",
  "kiseli kupus": "kiseli kupus",
  lovor: "lovorov list",
  luka: "luk",
  mesa: "meso",
  ulje: "suncokretovo ulje",
  tikvice: "tikvica",
  tunjevine: "tuna",
  "pilećeg filea": "piletina",
  "pileci file": "piletina",
  "pileći file": "piletina",
  slanine: "slanina",
  "grčkog jogurta": "grčki jogurt",
  "grcki jogurt": "grčki jogurt",
  kari: "kari",
  "curry začin": "kari",
  "soja sos": "soja sos",
  "kokosovo mleko": "kokosovo mleko",
  pasta: "testenina",
  paste: "testenina",
  parmezana: "parmezan",
  "file lososa": "losos",
  "crni luk": "luk",
  "aleva paprika": "paprika začinska",
  "đumbi": "đumbir",
};


function cleanupNamePart(namePart: string) {
  let s = (namePart ?? "").trim();

 
  s = s.split("—")[0].trim();
  s = s.replace(/\s*\(.*?\)\s*/g, " ").trim();


  s = s.replace(/^(konzerva|glavice|glavica|file|kriška|kriska)\s+/gi, "").trim();

  s = norm(s);


  if (CANONICAL_MAP[s]) s = CANONICAL_MAP[s];

  
  if (s === "jaja") return "jaja";
  if (s.endsWith("ine") && s === "slanine") return "slanina";
  if (s.includes("mlevenog mesa")) return "mleveno meso";

  return s;
}


function parseIngredientLine(line: string): { name: string; quantity: number; unit: string }[] {
  const parts = splitByComma(line);

  return parts.map((raw) => {
    const s = raw.trim();
    // broj + jedinica + ostatak
    const m = s.match(/^(\d+(?:[.,]\d+)?)\s*([a-zA-ZčćžšđČĆŽŠĐ]+)?\s*(.*)$/);

    let quantity = 1;
    let unit = "kom";
    let namePart = s;

    if (m) {
      const num = m[1] ?? "";
      const maybeUnit = m[2] ?? "";
      const rest = (m[3] ?? "").trim();

     
      if (rest.length > 0) {
        quantity = Number((num || "1").replace(",", "."));
        namePart = rest;

        if (maybeUnit.length > 0) {
          const u = norm(maybeUnit);
          if (u === "g" || u === "gr" || u === "gram" || u === "grama") unit = "g";
          else if (u === "kg") unit = "kg";
          else if (u === "ml") unit = "ml";
          else if (u === "l") unit = "l";
          else if (u.startsWith("kas") || u.startsWith("kaš")) unit = "kašika";
          else unit = maybeUnit;
        } else {
          unit = "kom";
        }
      } else {
      
        namePart = s;
      }
    }

    const name = cleanupNamePart(namePart);
    const q = Number.isFinite(quantity) ? quantity : 1;
    const u2 = unit && unit.trim().length > 0 ? unit : "kom";

    return { name: name || cleanupNamePart(raw), quantity: q, unit: u2 };
  });
}


async function getOrCreateIngredientId(name: string) {
  const clean = (name ?? "").trim();
  if (!clean) return null;

  const existing = await prisma.ingredient.findFirst({
    where: { name: { equals: clean, mode: "insensitive" } },
    select: { id: true, name: true },
  });

  if (existing) return existing.id;

  const created = await prisma.ingredient.create({
    data: { name: clean },
    select: { id: true },
  });

  return created.id;
}



async function seedUsers() {
  const passwordHash = await bcrypt.hash("123456", 10);

  const users = [
    { email: "kupac@test.com", role: Role.KUPAC },
    { email: "kuvar@test.com", role: Role.KUVAR },
    { email: "admin@test.com", role: Role.ADMIN },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { passwordHash, role: u.role },
      create: { email: u.email, passwordHash, role: u.role },
    });
  }

  console.log("✅ Seeded users");
}

 
const INGREDIENT_GROUPS: Record<string, string[]> = {
  "Mlečni proizvodi i jaja": [
    "mleko", "jogurt", "kiselo mleko", "kefir",
    "pavlaka", "slatka pavlaka",
    "maslac", "puter",
    "sir", "mladi sir", "feta sir", "mozzarella", "parmezan",
    "krem sir",
    "jaja",
    "grčki jogurt",
    "kokosovo mleko",
  ],
  "Meso i suhomesnato": [
    "piletina", "ćuretina", "junetina", "svinjetina",
    "mleveno meso",
    "slanina", "kobasica", "šunka",
    "meso",
  ],
  "Riba i morski plodovi": [
    "tuna", "losos", "oslić",
    "škampi", "lignje",
  ],
  "Povrće": [
    "krompir", "luk", "beli luk", "šargarepa",
    "paradajz", "paprika", "krastavac",
    "tikvica", "brokoli", "karfiol",
    "kupus", "spanać", "pečurke",
    "avokado",
    "zelena salata",
    "bundeva",
    "đumbir",
    "kiseli kupus",
  ],
  "Voće": [
    "jabuka", "banana", "kruška",
    "limun", "narandža", "mandarina",
    "jagoda", "malina", "borovnica",
    "grožđe", "kajsija",
  ],
  "Žitarice i testenine": [
    "brašno", "pirinač",
    "testenina", "špagete", "makarone", "kus-kus",
    "ovsene pahuljice", "hleb", "prezle",
    "integralni hleb",
    "tortilja",
    "kinoa",
  ],
  "Mahune / proteinsko biljno": [
    "pasulj",
    "leblebije",
    "tofu",
    "indijski orah",
    "susam",
  ],
  "Začini": [
    "so", "biber", "origano", "bosiljak", "peršun",
    "lovorov list", "čili",
    "paprika začinska",
    "cimet", "muškatni oraščić",
    "soda bikarbona",
    "kari",
    "začini",
  ],
  "Ulja i sosovi": [
    "maslinovo ulje", "suncokretovo ulje",
    "sirće", "balzamiko",
    "senf", "kečap", "majonez",
    "paradajz sos",
    "soja sos",
    "humus",
  ],
  "Slatko": [
    "šećer", "vanilin šećer",
    "med", "kakao", "čokolada",
    "prašak za pecivo",
  ],
};

type Meta = { unit?: string | null; qty?: number | null; priceRsd?: number | null };


const INGREDIENT_META: Record<string, Meta> = {
  // mlečno
  mleko: { unit: "ml", qty: 1000, priceRsd: 180 },
  jogurt: { unit: "ml", qty: 1000, priceRsd: 220 },
  "kiselo mleko": { unit: "ml", qty: 500, priceRsd: 140 },
  kefir: { unit: "ml", qty: 500, priceRsd: 170 },
  pavlaka: { unit: "ml", qty: 200, priceRsd: 110 },
  "slatka pavlaka": { unit: "ml", qty: 200, priceRsd: 140 },
  maslac: { unit: "g", qty: 250, priceRsd: 250 },
  puter: { unit: "g", qty: 250, priceRsd: 240 },
  sir: { unit: "g", qty: 300, priceRsd: 300 },
  "mladi sir": { unit: "g", qty: 300, priceRsd: 280 },
  "feta sir": { unit: "g", qty: 200, priceRsd: 260 },
  mozzarella: { unit: "g", qty: 125, priceRsd: 170 },
  parmezan: { unit: "g", qty: 50, priceRsd: 160 },
  "krem sir": { unit: "g", qty: 200, priceRsd: 220 },
  jaja: { unit: "kom", qty: 10, priceRsd: 260 },
  "grčki jogurt": { unit: "g", qty: 400, priceRsd: 220 },
  "kokosovo mleko": { unit: "ml", qty: 400, priceRsd: 260 },

  // meso
  piletina: { unit: "g", qty: 500, priceRsd: 420 },
  "ćuretina": { unit: "g", qty: 500, priceRsd: 520 },
  junetina: { unit: "g", qty: 500, priceRsd: 650 },
  svinjetina: { unit: "g", qty: 500, priceRsd: 500 },
  "mleveno meso": { unit: "g", qty: 500, priceRsd: 520 },
  slanina: { unit: "g", qty: 300, priceRsd: 360 },
  kobasica: { unit: "g", qty: 300, priceRsd: 380 },
  "šunka": { unit: "g", qty: 300, priceRsd: 330 },
  meso: { unit: "g", qty: 500, priceRsd: 520 },

  // riba
  tuna: { unit: "g", qty: 200, priceRsd: 240 },
  losos: { unit: "g", qty: 300, priceRsd: 900 },
  "oslić": { unit: "g", qty: 500, priceRsd: 420 },
  "škampi": { unit: "g", qty: 300, priceRsd: 780 },
  lignje: { unit: "g", qty: 400, priceRsd: 650 },

  // povrće
  krompir: { unit: "g", qty: 1000, priceRsd: 140 },
  luk: { unit: "g", qty: 1000, priceRsd: 160 },
  "beli luk": { unit: "g", qty: 100, priceRsd: 120 },
  "šargarepa": { unit: "g", qty: 1000, priceRsd: 170 },
  paradajz: { unit: "g", qty: 1000, priceRsd: 260 },
  paprika: { unit: "g", qty: 500, priceRsd: 220 },
  "paprika začinska": { unit: "g", qty: 100, priceRsd: 120 },
  krastavac: { unit: "kom", qty: 1, priceRsd: 80 },
  tikvica: { unit: "kom", qty: 1, priceRsd: 90 },
  brokoli: { unit: "kom", qty: 1, priceRsd: 220 },
  karfiol: { unit: "kom", qty: 1, priceRsd: 240 },
  kupus: { unit: "kom", qty: 1, priceRsd: 180 },
  spanać: { unit: "g", qty: 300, priceRsd: 200 },
  pečurke: { unit: "g", qty: 300, priceRsd: 260 },
  avokado: { unit: "kom", qty: 1, priceRsd: 180 },
  "zelena salata": { unit: "kom", qty: 1, priceRsd: 120 },
  bundeva: { unit: "g", qty: 1000, priceRsd: 220 },
  đumbir: { unit: "g", qty: 100, priceRsd: 120 },
  "kiseli kupus": { unit: "g", qty: 1000, priceRsd: 220 },

  // voće
  jabuka: { unit: "kom", qty: 1, priceRsd: 35 },
  banana: { unit: "kom", qty: 1, priceRsd: 45 },
  "kruška": { unit: "kom", qty: 1, priceRsd: 50 },
  limun: { unit: "kom", qty: 1, priceRsd: 60 },
  narandža: { unit: "kom", qty: 1, priceRsd: 55 },
  mandarina: { unit: "kom", qty: 1, priceRsd: 30 },
  jagoda: { unit: "g", qty: 500, priceRsd: 450 },
  malina: { unit: "g", qty: 250, priceRsd: 420 },
  borovnica: { unit: "g", qty: 250, priceRsd: 480 },
  grožđe: { unit: "g", qty: 500, priceRsd: 260 },
  kajsija: { unit: "g", qty: 500, priceRsd: 300 },

  // žitarice
  brašno: { unit: "g", qty: 1000, priceRsd: 120 },
  pirinač: { unit: "g", qty: 1000, priceRsd: 260 },
  testenina: { unit: "g", qty: 500, priceRsd: 140 },
  "špagete": { unit: "g", qty: 500, priceRsd: 150 },
  makarone: { unit: "g", qty: 500, priceRsd: 150 },
  "kus-kus": { unit: "g", qty: 500, priceRsd: 220 },
  "ovsene pahuljice": { unit: "g", qty: 500, priceRsd: 220 },
  hleb: { unit: "kom", qty: 1, priceRsd: 90 },
  "integralni hleb": { unit: "kom", qty: 1, priceRsd: 120 },
  prezle: { unit: "g", qty: 200, priceRsd: 80 },
  tortilja: { unit: "kom", qty: 6, priceRsd: 220 },
  kinoa: { unit: "g", qty: 500, priceRsd: 450 },

  // mahune / proteinsko
  pasulj: { unit: "g", qty: 500, priceRsd: 180 },
  leblebije: { unit: "g", qty: 500, priceRsd: 220 },
  tofu: { unit: "g", qty: 200, priceRsd: 220 },
  "indijski orah": { unit: "g", qty: 200, priceRsd: 420 },
  susam: { unit: "g", qty: 100, priceRsd: 160 },

  // začini
  so: { unit: "g", qty: 1000, priceRsd: 80 },
  biber: { unit: "g", qty: 50, priceRsd: 140 },
  origano: { unit: "g", qty: 20, priceRsd: 90 },
  bosiljak: { unit: "g", qty: 20, priceRsd: 90 },
  peršun: { unit: "g", qty: 20, priceRsd: 60 },
  "lovorov list": { unit: "g", qty: 20, priceRsd: 70 },
  "čili": { unit: "g", qty: 20, priceRsd: 90 },
  cimet: { unit: "g", qty: 30, priceRsd: 110 },
  "muškatni oraščić": { unit: "g", qty: 20, priceRsd: 160 },
  "soda bikarbona": { unit: "g", qty: 200, priceRsd: 80 },
  kari: { unit: "g", qty: 50, priceRsd: 160 },
  začini: { unit: "g", qty: 50, priceRsd: 120 },

  // ulja i sosovi
  "maslinovo ulje": { unit: "ml", qty: 1000, priceRsd: 1200 },
  "suncokretovo ulje": { unit: "ml", qty: 1000, priceRsd: 260 },
  sirće: { unit: "ml", qty: 1000, priceRsd: 150 },
  balzamiko: { unit: "ml", qty: 250, priceRsd: 350 },
  senf: { unit: "g", qty: 200, priceRsd: 160 },
  "kečap": { unit: "g", qty: 500, priceRsd: 220 },
  majonez: { unit: "g", qty: 500, priceRsd: 260 },
  "paradajz sos": { unit: "ml", qty: 500, priceRsd: 180 },
  "soja sos": { unit: "ml", qty: 250, priceRsd: 250 },
  humus: { unit: "g", qty: 200, priceRsd: 220 },

  // slatko
  "šećer": { unit: "g", qty: 1000, priceRsd: 140 },
  "vanilin šećer": { unit: "g", qty: 10, priceRsd: 25 },
  med: { unit: "g", qty: 300, priceRsd: 420 },
  kakao: { unit: "g", qty: 100, priceRsd: 190 },
  čokolada: { unit: "g", qty: 100, priceRsd: 160 },
  "prašak za pecivo": { unit: "g", qty: 12, priceRsd: 25 },
};

async function seedIngredientsWithMeta() {
  // 1) categories upsert
  const categoryNameToId = new Map<string, string>();

  for (const categoryName of Object.keys(INGREDIENT_GROUPS)) {
    const cat = await prisma.categoryIngredient.upsert({
      where: { name: categoryName },
      update: {},
      create: { name: categoryName },
    });

    categoryNameToId.set(categoryName, cat.id);
  }

  // 2) ingredients upsert
  let upserted = 0;

  for (const [categoryName, items] of Object.entries(INGREDIENT_GROUPS)) {
    const categoryId = categoryNameToId.get(categoryName)!;

    for (const rawName of items) {
      const canonical = cleanupNamePart(rawName);

      const meta = INGREDIENT_META[canonical] ?? null;

      await prisma.ingredient.upsert({
        where: { name: canonical },
        update: {
          categoryId,
          defaultUnit: meta?.unit ?? null,
          defaultQty: meta?.qty ?? null,
          priceRsd: meta?.priceRsd ?? null,
        },
        create: {
          name: canonical,
          categoryId,
          defaultUnit: meta?.unit ?? null,
          defaultQty: meta?.qty ?? null,
          priceRsd: meta?.priceRsd ?? null,
        },
      });

      upserted++;
    }
  }

 
  const all = await prisma.ingredient.findMany({
    select: { id: true, name: true, priceRsd: true, defaultQty: true, defaultUnit: true, categoryId: true },
  });

  let patched = 0;

  for (const ing of all) {
    const canonical = cleanupNamePart(ing.name);
    const meta = INGREDIENT_META[canonical];

    if (!meta) continue;

    const needs =
      ing.priceRsd == null ||
      ing.defaultQty == null ||
      ing.defaultUnit == null;

    if (!needs) continue;

    await prisma.ingredient.update({
      where: { id: ing.id },
      data: {
    
        defaultUnit: ing.defaultUnit ?? meta.unit ?? null,
        defaultQty: ing.defaultQty ?? meta.qty ?? null,
        priceRsd: ing.priceRsd ?? meta.priceRsd ?? null,
      },
    });

    patched++;
  }

  console.log("✅ Upserted ingredient categories:", Object.keys(INGREDIENT_GROUPS).length);
  console.log("✅ Upserted ingredients:", upserted);
  console.log("✅ Patched existing ingredients with meta:", patched);
}



const DIFF_MAP: Record<string, number> = { Lako: 1, Srednje: 2, Teško: 3 };

const CATEGORY_MAP: Record<string, string> = {
  tradicionalno: "Tradicionalno",
  proteinsko: "Proteinsko",
  vegan: "Vegan",
};

async function upsertRecipeCategoryId(label: string) {
  const cat = await prisma.categoryRecipe.upsert({
    where: { name: label },
    update: {},
    create: { name: label },
    select: { id: true },
  });
  return cat.id;
}

async function seedRecipes() {

  const chef = await prisma.user.upsert({
    where: { email: "kuvar@test.com" },
    update: { role: Role.KUVAR, isBlocked: false },
    create: {
      email: "kuvar@test.com",
      name: "Kuvar",
      passwordHash: "seed",
      role: Role.KUVAR,
      isBlocked: false,
      isPremium: true,
    },
    select: { id: true },
  });

 
  const catIds: Record<string, string> = {};
  for (const key of Object.keys(CATEGORY_MAP)) {
    catIds[key] = await upsertRecipeCategoryId(CATEGORY_MAP[key]);
  }


  const old = await prisma.recipe.findMany({
    where: { authorId: chef.id },
    select: { id: true },
  });
  const oldIds = old.map((x) => x.id);

  if (oldIds.length > 0) {
    await prisma.recipeIngredient.deleteMany({ where: { recipeId: { in: oldIds } } });
    await prisma.step.deleteMany({ where: { recipeId: { in: oldIds } } });
    await prisma.recipe.deleteMany({ where: { id: { in: oldIds } } });
  }

  const RECIPES_ANY = RECIPES as any[];
  let created = 0;


  const skipped = new Set<string>();

  for (const r of RECIPES_ANY) {
    const categoryKey = String(r.category ?? "tradicionalno");
    const categoryId = catIds[categoryKey] ?? catIds["tradicionalno"];
    const difficulty =
      typeof r.difficulty === "number"
        ? r.difficulty
        : (DIFF_MAP[String(r.difficulty)] ?? 1);

    const recipe = await prisma.recipe.create({
      data: {
        title: String(r.title ?? ""),
        description: String(r.description ?? r.short ?? ""),
        difficulty,
        prepTimeMinutes: Number(r.timeMin ?? 10),
        imageUrl: r.imageUrl ?? null,
        isPublished: true,
        isPremium: Boolean(r.isPremium),
        authorId: chef.id,
        categoryId,
      },
      select: { id: true },
    });

    
    const ingLines = (r.ingredients ?? []) as any[];
    for (const line of ingLines) {
      const parsed = parseIngredientLine(String(line ?? ""));

      for (const p of parsed) {
        const canonical = cleanupNamePart(p.name);
        if (!canonical) continue;

      
        const inGroups = Object.values(INGREDIENT_GROUPS).some((arr) =>
          arr.some((x) => cleanupNamePart(x) === canonical)
        );
        if (!inGroups) skipped.add(canonical);

        const ingredientId = await getOrCreateIngredientId(canonical);
        if (!ingredientId) continue;

        await prisma.recipeIngredient.create({
          data: {
            recipeId: recipe.id,
            ingredientId,
            quantity: p.quantity,
            unit: p.unit,
          },
        });
      }
    }

    // steps
    const steps = (r.steps ?? []) as any[];
    if (steps.length > 0) {
      await prisma.step.createMany({
        data: steps
          .map((t: any, i: number) => ({
            recipeId: recipe.id,
            stepNumber: i + 1,
            text: String(t ?? "").trim(),
          }))
          .filter((x: any) => x.text.length > 0),
        skipDuplicates: true,
      });
    }

    created++;
  }

  console.log(`✅ Ubaceno recepata: ${created}`);

  if (skipped.size > 0) {
    console.log("⚠️ Preskočeni sastojci (nisu u tvojoj listi INGREDIENT_GROUPS):");
    console.log(Array.from(skipped).sort().join(", "));
    console.log("➡️ Ako želiš, dodaj ih u INGREDIENT_GROUPS + INGREDIENT_META pa pokreni seed opet.");
  }
}


async function main() {
  await seedUsers();
  await seedIngredientsWithMeta();
  await seedRecipes();
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });