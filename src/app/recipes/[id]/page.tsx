import Link from "next/link";
import { RECIPES } from "@/lib/recipes";
import AddToCartButton from "@/components/AddToCartButton";




type Props = {
  params: {
    id: string;
  };
};

export default async function RecipeDetailsPage({ params }: Props) {

    console.log("ID iz URL:", params.id);
console.log("Svi ID-jevi:", RECIPES.map(r => r.id));

const { id } = await params;
const recipe = RECIPES.find((r) => r.id === id);


  if (!recipe) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-xl font-semibold">Recept nije pronađen</h1>
        <Link href="/recipes" className="mt-4 inline-block underline">
          ← Nazad na recepte
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/recipes" className="text-sm underline">
        ← Nazad na recepte
      </Link>

      <h1 className="mt-4 text-3xl font-semibold">{recipe.title}</h1>

      <div className="mt-2 flex gap-4 text-sm text-gray-600">
        <span>⏱ {recipe.timeMin} min</span>
        <span>Težina: {recipe.difficulty}</span>
      </div>

      <p className="mt-6 text-gray-800">{recipe.description}</p>

      <div className="mt-8 rounded-lg border bg-white p-4">
        <h2 className="text-lg font-medium">Napomena</h2>
        <p className="mt-2 text-sm text-gray-600">
          Ovde će kasnije ići sastojci i koraci pripreme.
        </p>
      </div>

      <AddToCartButton recipe={recipe} />

    </main>
  );
}
