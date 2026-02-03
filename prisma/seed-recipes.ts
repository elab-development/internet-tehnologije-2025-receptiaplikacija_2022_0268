// @ts-nocheck
import { PrismaClient, Role } from "@prisma/client";
import { RECIPES } from "../src/lib/recipes";

const prisma = new PrismaClient();

const DIFF_MAP: Record<string, number> = {
  Lako: 1,
  Srednje: 2,
  Teško: 3,
};

const CATEGORY_MAP: Record<string, string> = {
  tradicionalno: "Tradicionalno",
  proteinsko: "Proteinsko",
  vegan: "Vegan",
};

const ING_SYNONYMS: Record<string, string> = {
  pasta: "testenina",
  paste: "testenina",
  parmezana: "parmezan",
  slanina: "slanina",
  "file lososa": "losos",
  "pileći file": "piletina",
  "pileci file": "piletina",
  "crni luk": "luk",
  "beli luk": "beli luk",
  "aleva paprika": "paprika začinska",
  paprika: "paprika",
  kafa: "kafa",
};

function norm(s: string) {
  return (s ?? "")
    .toLowerCase()
    .replace(/[()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function splitByComma(s: string): string[] {
  return s.split(",").map((x) => x.trim()).filter(Boolean);
}

function parseIngredientLine(line: string): { name: string; quantity: number; unit: string }[] {
  const parts = splitByComma(line);

  return parts.map((raw) => {
    const s = raw.trim();
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
          else if (u.startsWith("kaš") || u.startsWith("kas")) unit = "kašika";
          else unit = maybeUnit;
        } else {
          unit = "kom";
        }
      }
    }

    namePart = namePart.split("—")[0].trim();
    namePart = namePart.replace(/\s*\(.*?\)\s*/g, " ").trim();
    namePart = namePart.replace(/\s*\/\s*/g, " ").trim();

    let name = norm(namePart);
    name = name.replace(/^(konzerva|glavice|glavica|file|kriška|kriska)\s+/g, "").trim();

    if (ING_SYNONYMS[name]) name = ING_SYNONYMS[name];
    if (name.includes("mlevenog mesa")) name = "mleveno meso";
    if (name.includes("mesa")) name = name.replace("mesa", "meso").trim();
    if (!name) name = norm(raw);

    const q = Number.isFinite(quantity) ? quantity : 1;
    const u2 = unit && unit.trim().length > 0 ? unit : "kom";

    return { name, quantity: q, unit: u2 };
  });
}

async function getOrCreateIngredientId(name: string) {
  const clean = name.trim();
  if (!clean) return null;

  const existing = await prisma.ingredient.findFirst({
    where: { name: { equals: clean, mode: "insensitive" } },
    select: { id: true },
  });

  if (existing) return existing.id;

  const created = await prisma.ingredient.create({
    data: { name: clean },
    select: { id: true },
  });

  return created.id;
}

async function upsertCategoryId(label: string) {
  const cat = await prisma.categoryRecipe.upsert({
    where: { name: label },
    update: {},
    create: { name: label },
    select: { id: true },
  });
  return cat.id;
}

async function main() {
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
    const label = CATEGORY_MAP[key];
    catIds[key] = await upsertCategoryId(label);
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

  for (const r of RECIPES_ANY) {
    const categoryKey = String(r.category ?? "tradicionalno");
    const categoryId = catIds[categoryKey] ?? catIds["tradicionalno"];
    const difficulty = typeof r.difficulty === "number" ? r.difficulty : (DIFF_MAP[String(r.difficulty)] ?? 1);

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
        const ingredientId = await getOrCreateIngredientId(p.name);
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

    const steps = (r.steps ?? []) as any[];
    if (steps.length > 0) {
      await prisma.step.createMany({
        data: steps
          .map((t: any, i: number) => ({ text: String(t ?? "").trim(), stepNumber: i + 1 }))
          .filter((x: any) => x.text.length > 0)
          .map((x: any) => ({
            recipeId: recipe.id,
            stepNumber: x.stepNumber,
            text: x.text,
          })),
        skipDuplicates: true,
      });
    }

    created++;
  }

  console.log(`Ubaceno recepata: ${created}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
