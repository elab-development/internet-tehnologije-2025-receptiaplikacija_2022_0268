import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";

export default async function MyReviewsPage() {
  const user = await getCurrentUser();
  if (!user) return <div className="p-6">Moraš biti prijavljen.</div>;

  const reviews = await prisma.review.findMany({
    where: { userId: user.id },
    include: { recipe: { select: { id: true, title: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Moje recenzije</h1>

      {reviews.length === 0 ? (
        <p className="mt-4 text-sm text-gray-600">Još nemaš recenzije.</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {reviews.map((r) => (
            <li key={r.id} className="rounded border p-4">
              <div className="flex items-center justify-between">
                <Link className="underline" href={`/recipes/${r.recipe.id}`}>
                  {r.recipe.title}
                </Link>
                <span className="text-sm">Ocena: {r.rating}/5</span>
              </div>
              {r.comment && <p className="mt-2 text-sm">{r.comment}</p>}
              <p className="mt-2 text-xs text-gray-500">
                {new Date(r.createdAt).toLocaleString("sr-RS")}
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
