require("dotenv").config();

const { PrismaClient, Role } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const INGREDIENT_GROUPS = {
  "Mlečni proizvodi i jaja": [
    "mleko", "jogurt", "kiselo mleko", "kefir",
    "pavlaka", "slatka pavlaka",
    "maslac", "puter",
    "sir", "mladi sir", "feta sir", "mozzarella", "parmezan",
    "krem sir",
    "jaja",
  ],
  "Meso i suhomesnato": [
    "piletina", "ćuretina", "junetina", "svinjetina",
    "mleveno meso",
    "slanina", "kobasica", "šunka",
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
  ],
  "Začini": [
    "so", "biber", "origano", "bosiljak", "peršun",
    "lovorov list", "čili",
    "paprika začinska",
    "cimet", "muškatni oraščić",
    "soda bikarbona",
  ],
  "Ulja i sosovi": [
    "maslinovo ulje", "suncokretovo ulje",
    "sirće", "balzamiko",
    "senf", "kečap", "majonez",
    "paradajz sos",
  ],
  "Slatko": [
    "šećer", "vanilin šećer",
    "med", "kakao", "čokolada",
    "prašak za pecivo",
  ],
};

const INGREDIENT_META = {
  "mleko": { unit: "ml", qty: 1000 },
  "jogurt": { unit: "ml", qty: 1000 },
  "kiselo mleko": { unit: "ml", qty: 500 },
  "kefir": { unit: "ml", qty: 500 },
  "pavlaka": { unit: "ml", qty: 200 },
  "slatka pavlaka": { unit: "ml", qty: 200 },
  "maslac": { unit: "g", qty: 250 },
  "puter": { unit: "g", qty: 250 },
  "sir": { unit: "g", qty: 300 },
  "mladi sir": { unit: "g", qty: 300 },
  "feta sir": { unit: "g", qty: 200 },
  "mozzarella": { unit: "g", qty: 125 },
  "parmezan": { unit: "g", qty: 50 },
  "krem sir": { unit: "g", qty: 200 },
  "jaja": { unit: "kom", qty: 10 },

  "piletina": { unit: "g", qty: 500 },
  "ćuretina": { unit: "g", qty: 500 },
  "junetina": { unit: "g", qty: 500 },
  "svinjetina": { unit: "g", qty: 500 },
  "mleveno meso": { unit: "g", qty: 500 },
  "slanina": { unit: "g", qty: 300 },
  "kobasica": { unit: "g", qty: 300 },
  "šunka": { unit: "g", qty: 300 },

  "tuna": { unit: "g", qty: 200 },
  "losos": { unit: "g", qty: 300 },
  "oslić": { unit: "g", qty: 500 },
  "škampi": { unit: "g", qty: 300 },
  "lignje": { unit: "g", qty: 400 },

  "krompir": { unit: "g", qty: 1000 },
  "luk": { unit: "g", qty: 1000 },
  "beli luk": { unit: "g", qty: 100 },
  "šargarepa": { unit: "g", qty: 1000 },
  "paradajz": { unit: "g", qty: 1000 },
  "paprika": { unit: "g", qty: 500 },
  "krastavac": { unit: "kom", qty: 1 },
  "tikvica": { unit: "kom", qty: 1 },
  "brokoli": { unit: "kom", qty: 1 },
  "karfiol": { unit: "kom", qty: 1 },
  "kupus": { unit: "kom", qty: 1 },
  "spanać": { unit: "g", qty: 300 },
  "pečurke": { unit: "g", qty: 300 },

  "jabuka": { unit: "kom", qty: 1 },
  "banana": { unit: "kom", qty: 1 },
  "kruška": { unit: "kom", qty: 1 },
  "limun": { unit: "kom", qty: 1 },
  "narandža": { unit: "kom", qty: 1 },
  "mandarina": { unit: "kom", qty: 1 },
  "jagoda": { unit: "g", qty: 500 },
  "malina": { unit: "g", qty: 250 },
  "borovnica": { unit: "g", qty: 250 },
  "grožđe": { unit: "g", qty: 500 },
  "kajsija": { unit: "g", qty: 500 },

  "brašno": { unit: "g", qty: 1000 },
  "pirinač": { unit: "g", qty: 1000 },
  "testenina": { unit: "g", qty: 500 },
  "špagete": { unit: "g", qty: 500 },
  "makarone": { unit: "g", qty: 500 },
  "kus-kus": { unit: "g", qty: 500 },
  "ovsene pahuljice": { unit: "g", qty: 500 },
  "hleb": { unit: "kom", qty: 1 },
  "prezle": { unit: "g", qty: 200 },

  "so": { unit: "g", qty: 100 },
  "biber": { unit: "g", qty: 100 },
  "origano": { unit: "g", qty: 100 },
  "bosiljak": { unit: "g", qty: 100 },
  "peršun": { unit: "g", qty: 100 },
  "lovorov list": { unit: "g", qty: 100 },
  "čili": { unit: "g", qty: 100 },
  "paprika začinska": { unit: "g", qty: 100 },
  "cimet": { unit: "g", qty: 100 },
  "muškatni oraščić": { unit: "g", qty: 100 },
  "soda bikarbona": { unit: "g", qty: 100 },

  "maslinovo ulje": { unit: "ml", qty: 1000 },
  "suncokretovo ulje": { unit: "ml", qty: 1000 },
  "sirće": { unit: "ml", qty: 1000 },
  "balzamiko": { unit: "ml", qty: 250 },
  "senf": { unit: "g", qty: 200 },
  "kečap": { unit: "g", qty: 300 },
  "majonez": { unit: "g", qty: 300 },
  "paradajz sos": { unit: "ml", qty: 500 },

  "šećer": { unit: "g", qty: 1000 },
  "vanilin šećer": { unit: "g", qty: 10 },
  "med": { unit: "g", qty: 300 },
  "kakao": { unit: "g", qty: 100 },
  "čokolada": { unit: "g", qty: 100 },
  "prašak za pecivo": { unit: "g", qty: 12 },
};

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

async function seedIngredientCategoriesAndIngredients() {
  await prisma.ingredient.deleteMany({});
  await prisma.categoryIngredient.deleteMany({});

 
  const categoryNameToId = {};
  for (const categoryName of Object.keys(INGREDIENT_GROUPS)) {
    const cat = await prisma.categoryIngredient.create({ data: { name: categoryName } });
    categoryNameToId[categoryName] = cat.id;
  }


  let count = 0;

  for (const [categoryName, items] of Object.entries(INGREDIENT_GROUPS)) {
    const categoryId = categoryNameToId[categoryName];

    for (const name of items) {
      const meta = INGREDIENT_META[name] ?? null;

      await prisma.ingredient.create({
        data: {
          name,
          categoryId,
          defaultUnit: meta?.unit ?? null,
          defaultQty: meta?.qty ?? null,
        },
      });

      count++;
    }
  }

  console.log("✅ Seeded ingredient categories:", Object.keys(INGREDIENT_GROUPS).length);
  console.log("✅ Seeded ingredients:", count);
}

async function main() {
  await seedUsers();
  await seedIngredientCategoriesAndIngredients();
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });