import { prisma } from "../../lib/prisma";

const INGREDIENT_GROUPS: Record<string, string[]> = {
  "Mlečni proizvodi": [
    "mleko",
    "jogurt",
    "kiselo mleko",
    "pavlaka",
    "slatka pavlaka",
    "maslac",
    "puter",
    "sir",
    "feta sir",
    "mozzarella",
    "parmezan",
    "kajmak",
  ],
  "Meso i suhomesnato": [
    "piletina",
    "ćuretina",
    "juneće meso",
    "svinjsko meso",
    "teletina",
    "mleveno meso",
    "slanina",
    "šunka",
    "kobasica",
  ],
  "Riba i morski plodovi": ["losos", "tuna", "oslić", "bakalar", "škampi", "lignje"],
  "Voće": ["jabuka", "banana", "pomorandža", "limun", "jagoda", "malina", "borovnica", "grožđe", "kruška"],
  "Povrće": [
    "krompir",
    "luk",
    "beli luk",
    "šargarepa",
    "paprika",
    "paradajz",
    "krastavac",
    "tikvica",
    "patlidžan",
    "brokoli",
    "karfiol",
    "kupus",
    "zelena salata",
    "spanać",
    "pečurke",
  ],
  "Žitarice i testenine": ["brašno", "kukuruzno brašno", "pirinač", "testenina", "špagete", "ovsene pahuljice", "hleb", "prezle"],
  "Mahunarke": ["pasulj", "sočivo", "leblebija", "grašak", "boranija"],
  "Začini i bilje": ["so", "biber", "origano", "bosiljak", "peršun", "ruzmarin", "majčina dušica", "paprika začinska", "čili", "kurkuma", "kari", "cimet"],
  "Ulja, sirća i sosovi": ["maslinovo ulje", "suncokretovo ulje", "sirće", "balzamiko", "soja sos", "senf", "kečap", "majonez"],
  "Slatki dodaci": ["šećer", "vanilin šećer", "med", "kakao", "čokolada", "prašak za pecivo", "soda bikarbona"],
  "Orašasti plodovi i semenke": ["orasi", "lešnici", "bademi", "kikiriki", "susam", "lan", "chia"],
  "Konzervirano i iz tegle": ["pelat", "paradajz sos", "kukuruz", "masline", "krastavci kiseli", "ajvar"],
};

function buildCategoryByNameMap(groups: Record<string, string[]>) {
  const map = new Map<string, string>();
  for (const [cat, names] of Object.entries(groups)) {
    for (const n of names) map.set(n.toLowerCase(), cat);
  }
  return map;
}

export default async function SastojciPage() {
  const ingredients = await prisma.ingredient.findMany({ orderBy: { name: "asc" } });

  const categoryByName = buildCategoryByNameMap(INGREDIENT_GROUPS);

  const grouped: Record<string, { id: string; name: string }[]> = {};
  const OTHER = "Ostalo";

  for (const ing of ingredients) {
    const cat = categoryByName.get(ing.name.toLowerCase()) ?? OTHER;
    grouped[cat] ??= [];
    grouped[cat].push({ id: ing.id, name: ing.name });
  }

  const categoriesInOrder = [
    ...Object.keys(INGREDIENT_GROUPS),
    OTHER,
  ].filter((c) => (grouped[c]?.length ?? 0) > 0);

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="mb-8 text-4xl font-bold">Sastojci</h1>

      {ingredients.length === 0 ? (
        <div className="rounded-2xl border p-6">
          Trenutno nema sastojaka u bazi. Pokreni seed ili dodaj preko Prisma Studio.
        </div>
      ) : (
        <div className="space-y-10">
          {categoriesInOrder.map((cat) => (
            <section key={cat}>
              <h2 className="mb-4 text-2xl font-semibold">{cat}</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {grouped[cat].map((i) => (
                  <div key={i.id} className="flex items-center justify-between rounded-2xl border p-5">
                    <span className="text-lg font-semibold">{i.name}</span>
                    <button className="rounded-xl border px-3 py-2 text-sm">Dodaj</button>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
