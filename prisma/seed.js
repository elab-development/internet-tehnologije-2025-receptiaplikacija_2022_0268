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
  "lovorov list": { unit: "g", qty: 20 },
  "čili": { unit: "g", qty: 50 },
  "paprika začinska": { unit: "g", qty: 100 },
  "cimet": { unit: "g", qty: 50 },
  "muškatni oraščić": { unit: "g", qty: 20 },
  "soda bikarbona": { unit: "g", qty: 200 },

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


const PRICE_RSD = {
  "mleko": 170,
  "jogurt": 220,
  "kiselo mleko": 150,
  "kefir": 180,
  "pavlaka": 160,
  "slatka pavlaka": 220,
  "maslac": 330,
  "puter": 300,
  "sir": 450,
  "mladi sir": 380,
  "feta sir": 360,
  "mozzarella": 200,
  "parmezan": 250,
  "krem sir": 220,
  "jaja": 280,

  "piletina": 450,
  "ćuretina": 600,
  "junetina": 800,
  "svinjetina": 550,
  "mleveno meso": 650,
  "slanina": 420,
  "kobasica": 380,
  "šunka": 420,

  "tuna": 260,
  "losos": 900,
  "oslić": 500,
  "škampi": 900,
  "lignje": 650,

  "krompir": 160,
  "luk": 180,
  "beli luk": 120,
  "šargarepa": 180,
  "paradajz": 250,
  "paprika": 300,
  "krastavac": 80,
  "tikvica": 90,
  "brokoli": 180,
  "karfiol": 170,
  "kupus": 120,
  "spanać": 180,
  "pečurke": 250,

  "jabuka": 50,
  "banana": 60,
  "kruška": 60,
  "limun": 70,
  "narandža": 60,
  "mandarina": 50,
  "jagoda": 450,
  "malina": 400,
  "borovnica": 500,
  "grožđe": 300,
  "kajsija": 350,

  "brašno": 120,
  "pirinač": 220,
  "testenina": 160,
  "špagete": 170,
  "makarone": 160,
  "kus-kus": 260,
  "ovsene pahuljice": 180,
  "hleb": 80,
  "prezle": 120,

  "so": 60,
  "biber": 220,
  "origano": 150,
  "bosiljak": 160,
  "peršun": 80,
  "lovorov list": 120,
  "čili": 120,
  "paprika začinska": 160,
  "cimet": 160,
  "muškatni oraščić": 180,
  "soda bikarbona": 120,

  "maslinovo ulje": 1200,
  "suncokretovo ulje": 260,
  "sirće": 180,
  "balzamiko": 450,
  "senf": 150,
  "kečap": 220,
  "majonez": 260,
  "paradajz sos": 220,

  "šećer": 140,
  "vanilin šećer": 30,
  "med": 450,
  "kakao": 220,
  "čokolada": 180,
  "prašak za pecivo": 25,
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

async function seedIngredients() {

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
      const priceRsd = PRICE_RSD[name] ?? null;

      await prisma.ingredient.create({
        data: {
          name,
          categoryId,
          defaultUnit: meta?.unit ?? null,
          defaultQty: meta?.qty ?? null,
          priceRsd, 
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
  await seedIngredients();
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });