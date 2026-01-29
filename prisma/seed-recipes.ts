import { PrismaClient } from "@prisma/client";

// ✅ PROMENI OVO ako ti je RECIPES u drugom fajlu:
import { RECIPES } from "../src/lib/recipes";

const prisma = new PrismaClient();

const DIFF_MAP: Record<string, number> = {
    "Lako": 1,
    "Srednje": 2,
    "Teško": 3,
};

const CATEGORY_MAP: Record<string, string> = {
    tradicionalno: "Tradicionalno",
    proteinsko: "Proteinsko",
    vegan: "Vegan",
};

const ING_SYNONYMS: Record<string, string> = {
    "pasta": "testenina",
    "paste": "testenina",
    "parmezana": "parmezan",
    "slanina": "slanina",
    "file lososa": "losos",
    "pileći file": "piletina",
    "pileci file": "piletina",
    "crni luk": "luk",
    "beli luk": "beli luk",
    "aleva paprika": "paprika začinska",
    "paprika": "paprika",
    "kafa": "kafa",
};

function norm(s: string) {
    return (s ?? "")
        .toLowerCase()
        .replace(/[()]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function splitByComma(s: string): string[] {
    // "So, biber" -> ["So", "biber"]
    return s.split(",").map(x => x.trim()).filter(Boolean);
}

function parseIngredientLine(line: string): { name: string; quantity: number; unit: string }[] {
    // Može da vrati više sastojaka ako je "So, biber"
    const parts = splitByComma(line);

    return parts.map((raw) => {
        let s = raw.trim();

        // 1) pokušaj "200g X" ili "200 g X"
        //    i "2 X"
        //    i "150ml X"
        const m = s.match(/^(\d+(?:[.,]\d+)?)\s*([a-zA-ZčćžšđČĆŽŠĐ]+)?\s*(.*)$/);
        let quantity = 1;
        let unit = "kom";
        let namePart = s;

        if (m) {
            const num = m[1];
            const maybeUnit = m[2];
            const rest = (m[3] ?? "").trim();

            // ako ima broj + ostatak teksta, tretiramo kao količinu
            if (rest) {
                quantity = Number(num.replace(",", "."));
                namePart = rest;

                if (maybeUnit) {
                    const u = norm(maybeUnit);

                    // standardizuj par čestih jedinica
                    if (u === "g" || u === "gr" || u === "gram" || u === "grama") unit = "g";
                    else if (u === "kg") unit = "kg";
                    else if (u === "ml") unit = "ml";
                    else if (u === "l") unit = "l";
                    else if (u.startsWith("kaš") || u.startsWith("kas")) unit = "kašika";
                    else unit = maybeUnit; // ostavi kako je
                } else {
                    // nema unit, pretpostavi "kom" za npr. "2 jaja"
                    unit = "kom";
                }
            }
        }

        // očisti opise tipa "600g mesa (junetina/svinjetina)"
        namePart = namePart.split("—")[0].trim();
        namePart = namePart.replace(/\/.*/g, (x) => x); // ostavi slash deo, ali kasnije čistimo
        namePart = namePart.replace(/\s*\(.*?\)\s*/g, " ").trim();
        namePart = namePart.replace(/\s*\/\s*/g, " ").trim();

        let name = norm(namePart);

        // ukloni "1 konzerva", "2 glavice" itd ako ostane na početku
        name = name.replace(/^(konzerva|glavice|glavica|file|kriška|kriska)\s+/g, "").trim();

        // primeni sinonime
        if (ING_SYNONYMS[name]) name = ING_SYNONYMS[name];

        // neke česte fraze iz tvojih recepata
        if (name.includes("mlevenog mesa")) name = "mleveno meso";
        if (name.includes("mesa")) name = name.replace("mesa", "meso").trim();

        // poslednja sigurnosna korekcija
        if (!name) name = norm(raw);

        return { name, quantity: Number.isFinite(quantity) ? quantity : 1, unit: unit || "kom" };
    });
}

async function getOrCreateIngredientId(name: string) {
    const clean = name.trim();
    if (!clean) return null;

    const existing = await prisma.ingredient.findFirst({
        where: { name: { equals: clean, mode: "insensitive" } },
        select: { id: true, name: true },
    });

    if (existing) return existing.id;

    // ako ne postoji, kreiraj ga (ne dira tvoje postojeće)
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
    // autor recepta (kuvar)
    const chef = await prisma.user.findUnique({ where: { email: "kuvar@test.com" } });
    if (!chef) throw new Error("Nema user-a kuvar@test.com. Pokreni tvoj postojeći seedUsers prvo.");

    // napravi/uzmi kategorije recepata
    const catIds: Record<string, string> = {};
    for (const key of Object.keys(CATEGORY_MAP)) {
        const label = CATEGORY_MAP[key];
        catIds[key] = await upsertCategoryId(label);
    }

    // ⚠️ da seed bude ponovljiv: brišemo samo recepte i njihove veze
    await prisma.recipeIngredient.deleteMany({});
    await prisma.step.deleteMany({});
    await prisma.recipe.deleteMany({});

    let created = 0;

    for (const r of RECIPES as any[]) {
        const categoryKey = (r.category ?? "tradicionalno") as string;
        const categoryId = catIds[categoryKey] ?? catIds["tradicionalno"];

        const difficulty = DIFF_MAP[r.difficulty] ?? 1;

        const recipe = await prisma.recipe.create({
            data: {
                title: r.title,
                description: r.description ?? r.short ?? "",
                difficulty,
                prepTimeMinutes: Number(r.timeMin ?? 10),
                imageUrl: null,
                isPublished: true,
                isPremium: Boolean(r.isPremium),
                authorId: chef.id,
                categoryId,
            },
            select: { id: true },
        });

        // sastojci
        for (const line of (r.ingredients ?? []) as string[]) {
            const parsed = parseIngredientLine(line);

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

        // koraci
        const steps = (r.steps ?? []) as string[];
        for (let i = 0; i < steps.length; i++) {
            const text = steps[i]?.trim();
            if (!text) continue;

            await prisma.step.create({
                data: {
                    recipeId: recipe.id,
                    stepNumber: i + 1,
                    text,
                },
            });
        }

        created++;
    }

    console.log(`✅ Ubaceno recepata: ${created}`);
    console.log("✅ Sastojci nisu brisani. Ako neki nije postojao, dodat je automatski.");
}

main()
    .catch((e) => {
        console.error("❌ Seed error:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
