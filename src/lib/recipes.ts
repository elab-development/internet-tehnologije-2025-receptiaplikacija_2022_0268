export type Recipe = {
  id: string;
  title: string;
  short: string; // UKRATKO (za detalje)
  description: string;
  timeMin: number;
  difficulty: "Lako" | "Srednje" | "Teško";
  category: "vegan" | "proteinsko" | "tradicionalno";
  isPremium: boolean;
  ingredients: string[];
  steps: string[];
};

export const RECIPES: Recipe[] = [
  // ================= TRADICIONALNO =================
  {
    id: "pasta-carbonara",
    title: "Pasta Carbonara",
    short: "Kremasta pasta bez pavlake: jaja + sir + slanina + brza tehnika mešanja.",
    description: "Brza italijanska pasta sa jajima, sirom i slaninom.",
    timeMin: 20,
    difficulty: "Lako",
    category: "tradicionalno",
    isPremium: false,
    ingredients: ["200g paste", "2 jaja", "100g slanine", "50g parmezana", "So, biber"],
    steps: [
      "Skuvati pastu u slanoj vodi.",
      "Ispržiti slaninu dok ne postane hrskava.",
      "Umutiti žumanca i parmezan.",
      "Pomešati pastu sa slaninom i skloniti sa vatre.",
      "Dodati smesu od jaja i brzo promešatina tihoj vatri."
    ]
  },
  {
    id: "sarma",
    title: "Sarma",
    short: "Kupus + meso + pirinač, dugo krčkanje na tihoj vatri.",
    description: "Tradicionalna sarma — klasika.",
    timeMin: 180,
    difficulty: "Teško",
    category: "tradicionalno",
    isPremium: true,
    ingredients: ["Kiseli kupus", "500g mlevenog mesa", "Pirinač", "Crni luk", "So, biber"],
    steps: [
      "Umešati meso, pirinač i začine.",
      "Uviti smesu u listove kupusa.",
      "Kuvati na tihoj vatri oko 3 sata."
    ]
  },
  {
    id: "gulas",
    title: "Domaći gulaš",
    short: "Sporo kuvanje za pun ukus: luk + meso + začini, krčka se dugo.",
    description: "Domaći gulaš koji se krčka polako i bude top.",
    timeMin: 120,
    difficulty: "Srednje",
    category: "tradicionalno",
    isPremium: false,
    ingredients: ["600g mesa (junetina/svinjetina)", "2 glavice luka", "Aleva paprika", "So, biber", "Lovor"],
    steps: [
      "Prodinstati luk dok ne omekša.",
      "Dodati meso i zapeći sa svih strana.",
      "Dodati začine i malo vode.",
      "Krčkati 1.5–2h uz povremeno dolivanje vode."
    ]
  },
  {
    id: "pasulj-prebranac",
    title: "Prebranac",
    short: "Pasulj zapečen u rerni sa lukom i paprikom — klasično jelo.",
    description: "Zapečeni pasulj sa lukom i začinima, odličan i sutradan.",
    timeMin: 90,
    difficulty: "Srednje",
    category: "tradicionalno",
    isPremium: true,
    ingredients: ["Pasulj", "2 glavice luka", "Aleva paprika", "Lovor", "So, biber", "Ulje"],
    steps: [
      "Skuvati pasulj (ili koristiti već kuvani).",
      "Prodinstati luk, dodati alevu papriku.",
      "Pomešati pasulj i luk, prebaciti u pleh.",
      "Zapeći 30–40 min na 200°C."
    ]
  },

  // ================= PROTEINSKO =================
  {
    id: "pileca-salata",
    title: "Pileća salata",
    short: "Brz proteinski obrok: piletina + salata + maslinovo ulje.",
    description: "Proteinska salata sa piletinom, povrćem i dresingom.",
    timeMin: 15,
    difficulty: "Lako",
    category: "proteinsko",
    isPremium: false,
    ingredients: ["200g pilećeg filea", "Zelena salata", "Paradajz", "Maslinovo ulje"],
    steps: ["Ispeći piletinu na tiganju.", "Iseckati povrće.", "Sve sjediniti i dodati dresing."]
  },
  {
    id: "losos-sa-povrcem",
    title: "Losos sa povrćem",
    short: "Pečeni losos + povrće iz rerne, jako zasitno i zdravo.",
    description: "Pečeni losos bogat proteinima uz sezonsko povrće.",
    timeMin: 35,
    difficulty: "Srednje",
    category: "proteinsko",
    isPremium: true,
    ingredients: ["File lososa", "Tikvice", "Paprika", "Maslinovo ulje", "So, biber"],
    steps: ["Začiniti lososa.", "Ispeći u rerni 20 minuta.", "Ispeći povrće i poslužiti zajedno."]
  },
  {
    id: "jaja-avokado-toast",
    title: "Proteinski tost sa jajima i avokadom",
    short: "Doručak za 10 min: tost + jaja + avokado.",
    description: "Brz i zasitan doručak pun proteina.",
    timeMin: 10,
    difficulty: "Lako",
    category: "proteinsko",
    isPremium: false,
    ingredients: ["2 jaja", "1 avokado", "Integralni hleb", "So, biber"],
    steps: ["Ispeći jaja.", "Izgnječiti avokado.", "Sve staviti na tost i začiniti."]
  },
  {
    id: "wrap-od-tunjevine",
    title: "Wrap od tunjevine",
    short: "Tunjevina + grčki jogurt + povrće u tortilji — brz proteinski ručak.",
    description: "Proteinski wrap koji se sprema brzo i lako.",
    timeMin: 12,
    difficulty: "Lako",
    category: "proteinsko",
    isPremium: true,
    ingredients: ["1 konzerva tunjevine", "2 kašike grčkog jogurta", "Tortilja", "Zelena salata", "Krastavac", "So, biber"],
    steps: [
      "Pomešati tunjevinu i grčki jogurt, začiniti.",
      "Dodati salatu i povrće na tortilju.",
      "Urolati i preseći."
    ]
  },
  {
    id: "piletina-teriyaki",
    title: "Piletina teriyaki",
    short: "Piletina u soja-đumbir sosu, super ukusno i proteinski.",
    description: "Inspirisano azijskom kuhinjom, brzo se sprema u tiganju.",
    timeMin: 25,
    difficulty: "Srednje",
    category: "proteinsko",
    isPremium: false,
    ingredients: ["Pileći file", "Soja sos", "Med (ili šećer)", "Đumbir", "Beli luk", "Susam (opciono)"],
    steps: [
      "Iseći piletinu na trakice.",
      "Zapeći piletinu na tiganju.",
      "Dodati soja sos + malo meda + đumbir + beli luk.",
      "Krčkati 3–5 min dok se sos ne zgusne."
    ]
  },

  // ================= VEGAN =================
  {
    id: "tofu-bowl",
    title: "Vegan tofu bowl",
    short: "Tofu + pirinač + brokoli, proteinski vegan klasik.",
    description: "Proteinski veganski obrok sa tofuom i povrćem.",
    timeMin: 30,
    difficulty: "Lako",
    category: "vegan",
    isPremium: false,
    ingredients: ["Tofu", "Pirinač", "Brokoli", "Soja sos"],
    steps: ["Ispržiti tofu.", "Skuvati pirinač.", "Sjediniti sve sastojke."]
  },
  {
    id: "veganska-pasta-pesto",
    title: "Veganska pasta sa pestom",
    short: "Pasta + pesto od bosiljka i indijskog oraha, brzo i mirisno.",
    description: "Brza veganska pasta sa domaćim pestom.",
    timeMin: 25,
    difficulty: "Lako",
    category: "vegan",
    isPremium: true,
    ingredients: ["Pasta", "Bosiljak", "Beli luk", "Maslinovo ulje", "Indijski orah"],
    steps: ["Skuvati pastu.", "Izblendati pesto.", "Pomešati pastu sa pestom."]
  },
  {
    id: "leblebije-curry",
    title: "Curry od leblebija",
    short: "Leblebije u kokos mleku sa curry začinom — jelo na kašiku.",
    description: "Začinjen veganski obrok na kašiku.",
    timeMin: 40,
    difficulty: "Srednje",
    category: "vegan",
    isPremium: false,
    ingredients: ["Leblebije", "Kokosovo mleko", "Curry začin", "Crni luk"],
    steps: ["Prodinstati luk.", "Dodati leblebije i začine.", "Dodati kokosovo mleko i kuvati."]
  },
  {
    id: "veganski-burger",
    title: "Veganski burger od pasulja",
    short: "Pljeskavice od pasulja + ovsene pahuljice, pečeno u tiganju.",
    description: "Zdrav veganski burger.",
    timeMin: 35,
    difficulty: "Srednje",
    category: "vegan",
    isPremium: true,
    ingredients: ["Crni pasulj", "Ovsene pahuljice", "Crni luk", "Začini"],
    steps: ["Izgnječiti pasulj.", "Dodati ostale sastojke.", "Formirati pljeskavice i ispeći."]
  },

  // +++ DODATNI VEGAN (4 komada full) +++
  {
    id: "humus-sendvic",
    title: "Humus sendvič",
    short: "Humus + povrće u hlebu/tortilji — ultra brzo i ukusno.",
    description: "Veganski sendvič sa humusom i svežim povrćem.",
    timeMin: 8,
    difficulty: "Lako",
    category: "vegan",
    isPremium: false,
    ingredients: ["Humus", "Integralni hleb ili tortilja", "Krastavac", "Paradajz", "Zelena salata", "So, biber"],
    steps: [
      "Namazati humus na hleb/tortilju.",
      "Dodati povrće.",
      "Preklopiti i poslužiti."
    ]
  },
  {
    id: "salata-kinoa",
    title: "Kinoa salata",
    short: "Kinoa + povrće + limun, lagano i hranljivo.",
    description: "Osvežavajuća veganska salata sa kinoom.",
    timeMin: 25,
    difficulty: "Lako",
    category: "vegan",
    isPremium: true,
    ingredients: ["Kinoa", "Paradajz", "Krastavac", "Limun", "Maslinovo ulje", "So, biber"],
    steps: [
      "Skuvati kino u slanoj vodi i ohladiti.",
      "Iseckati povrće.",
      "Pomešati i dodati limun + ulje."
    ]
  },
  {
    id: "krem-corba-bundeva",
    title: "Krem čorba od bundeve",
    short: "Bundeva + šargarepa + začini, izblendano kremasto.",
    description: "Topla veganska čorba, idealna za zimu.",
    timeMin: 35,
    difficulty: "Srednje",
    category: "vegan",
    isPremium: false,
    ingredients: ["Bundeva", "Šargarepa", "Crni luk", "So, biber", "Maslinovo ulje"],
    steps: [
      "Prodinstati luk.",
      "Dodati bundevu i šargarepu, naliti vodom.",
      "Kuvati 20–25 min.",
      "Izblendati i začiniti."
    ]
  },
  {
    id: "pečeni-krompir-i-paprika",
    title: "Pečeni krompir i paprika",
    short: "Rerna obrok: krompir + paprika + začini, bez muke.",
    description: "Jednostavan veganski obrok iz rerne.",
    timeMin: 45,
    difficulty: "Lako",
    category: "vegan",
    isPremium: true,
    ingredients: ["Krompir", "Paprika", "Maslinovo ulje", "So, biber", "Aleva paprika"],
    steps: [
      "Iseći krompir i papriku.",
      "Začiniti i dodati malo ulja.",
      "Peći 35–40 min na 200°C."
    ]
  }
];
