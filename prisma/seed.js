require("dotenv").config();

const { PrismaClient, Role } = require("@prisma/client");
const bcrypt = require("bcryptjs");



const prisma = new PrismaClient();

async function main() {
  const email = "test@test.com";
  const password = "123456";

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { email },
    update: { passwordHash },
    create: {
      email,
      passwordHash,
      role: Role.KUPAC,
    },
  });

  console.log("Seeded user:", email);

 const INGREDIENT_GROUPS = {
  "Mlečni proizvodi": [
    "mleko",
    "jogurt",
    "kiselo mleko",
    "kefir",
    "pavlaka",
    "slatka pavlaka",
    "kajmak",
    "maslac",
    "puter",
    "sir",
    "mladi sir",
    "feta sir",
    "mozzarella",
    "gauda",
    "parmezan",
    "krem sir",
    "rikota",
  ],

  "Meso i suhomesnato": [
    "piletina",
    "ćuretina",
    "junetina",
    "svinjetina",
    "teletina",
    "mleveno meso",
    "slanina",
    "kobasica",
    "šunka",
    "pršuta",
    "kulen",
    "pileća prsa",
  ],

  "Riba i morski plodovi": [
    "losos",
    "tuna",
    "oslić",
    "skuša",
    "pastrmka",
    "bakalar",
    "sardina",
    "škampi",
    "lignje",
    "dagnje",
  ],

  "Voće": [
    "jabuka",
    "banana",
    "kruška",
    "limun",
    "narandža",
    "mandarina",
    "grejp",
    "jagoda",
    "malina",
    "borovnica",
    "breskva",
    "kajsija",
    "ananas",
    "grožđe",
    "dinja",
  ],

  "Povrće": [
    "krompir",
    "luk",
    "beli luk",
    "šargarepa",
    "celer",
    "praziluk",
    "paradajz",
    "paprika",
    "krastavac",
    "tikvica",
    "patlidžan",
    "brokoli",
    "karfiol",
    "kupus",
    "kiseli kupus",
    "spanać",
    "blitva",
    "zelena salata",
    "pečurke",
  ],

  "Žitarice i testenine": [
    "brašno",
    "kukuruzno brašno",
    "griz",
    "pirinač",
    "testenina",
    "špagete",
    "makarone",
    "kus-kus",
    "bulgur",
    "ovsene pahuljice",
    "hleb",
    "tortilje",
    "prezle",
  ],

  "Mahunarke": [
    "pasulj",
    "sočivo",
    "leblebija",
    "grašak",
    "boranija",
    "crveni pasulj",
  ],

  "Začini i bilje": [
    "so",
    "biber",
    "origano",
    "bosiljak",
    "peršun",
    "ruzmarin",
    "majčina dušica",
    "lovorov list",
    "čili",
    "kurkuma",
    "kari",
    "paprika začinska",
    "beli luk u prahu",
    "cimet",
    "muškatni oraščić",
    "soda bikarbona",
  ],

  "Ulja, sirća i sosovi": [
    "maslinovo ulje",
    "suncokretovo ulje",
    "kokosovo ulje",
    "sirće",
    "balzamiko",
    "soja sos",
    "senf",
    "kečap",
    "majonez",
    "paradajz sos",
  ],

  "Slatki dodaci": [
    "šećer",
    "vanilin šećer",
    "med",
    "kakao",
    "čokolada",
    "prašak za pecivo",
    "puding",
    "nutela",
  ],

  "Orašasti plodovi i semenke": [
    "orasi",
    "lešnici",
    "bademi",
    "kikiriki",
    "pistaći",
    "susam",
    "lan",
    "chia",
    "suncokretove semenke",
    "bundeva semenke",
  ],

  "Konzervirano i iz tegle": [
    "pelat",
    "paradajz pire",
    "kukuruz",
    "masline",
    "krastavci kiseli",
    "ajvar",
    "tuna u konzervi",
    "pasulj iz konzerve",
  ],

  "Pića": [
    "voda",
    "mineralna voda",
    "sok od narandže",
    "mleko biljno",
    "kafa",
    "čaj",
  ],
};


  const allIngredients = Object.values(INGREDIENT_GROUPS).flat();

  for (const name of allIngredients) {
    await prisma.ingredient.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log("Seeded ingredients:", allIngredients.length);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

