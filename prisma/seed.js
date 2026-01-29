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

  console.log("✅ Seeded users:", users.map((u) => u.email).join(", "));
}

async function seedIngredientCategoriesAndIngredients() {
  
  await prisma.ingredient.deleteMany({});
  await prisma.categoryIngredient.deleteMany({});

 
  const categoryNameToId = {};

  for (const categoryName of Object.keys(INGREDIENT_GROUPS)) {
    const cat = await prisma.categoryIngredient.create({
      data: { name: categoryName },
    });
    categoryNameToId[categoryName] = cat.id;
  }

  
  let count = 0;

  for (const [categoryName, items] of Object.entries(INGREDIENT_GROUPS)) {
    const categoryId = categoryNameToId[categoryName];

    for (const name of items) {
      await prisma.ingredient.create({
        data: { name, categoryId },
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