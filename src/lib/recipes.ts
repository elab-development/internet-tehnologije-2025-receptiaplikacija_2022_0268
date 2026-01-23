export type Recipe = {
    id: string;
    title: string;
    description: string;
    timeMin: number;
    difficulty: "Lako" | "Srednje" | "Teško";
  };
  
  export const RECIPES: Recipe[] = [
    {
      id: "pasta-carbonara",
      title: "Pasta Carbonara",
      description: "Brza italijanska pasta sa jajima, sirom i slaninom.",
      timeMin: 20,
      difficulty: "Lako",
    },
    {
      id: "pileca-salata",
      title: "Pileća salata",
      description: "Proteinska salata sa piletinom, povrćem i dresingom.",
      timeMin: 15,
      difficulty: "Lako",
    },
    {
      id: "palacinke",
      title: "Palačinke",
      description: "Klasične palačinke — slatke ili slane.",
      timeMin: 25,
      difficulty: "Lako",
    },
    {
      id: "gulas",
      title: "Gulaš",
      description: "Domaći gulaš koji se krčka polako i bude top.",
      timeMin: 120,
      difficulty: "Srednje",
    },
    {
      id: "tiramisu",
      title: "Tiramisu",
      description: "Kremasti desert sa piškotama i kafom.",
      timeMin: 45,
      difficulty: "Srednje",
    },
    {
      id: "sarma",
      title: "Sarma",
      description: "Tradicionalna sarma — klasika.",
      timeMin: 180,
      difficulty: "Teško",
    },
  ];
  