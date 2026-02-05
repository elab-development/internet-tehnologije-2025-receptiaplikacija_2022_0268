"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Category = { id: string; name: string };

export default function EditRecipePage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const id = decodeURIComponent(params?.id ?? "");

    const [cats, setCats] = useState<Category[]>([]);
    const [err, setErr] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [prepTimeMinutes, setPrepTimeMinutes] = useState(30);
    const [difficulty, setDifficulty] = useState(1);
    const [imageUrl, setImageUrl] = useState("");
    const [categoryId, setCategoryId] = useState("");

    const [isPremium, setIsPremium] = useState(false);
    const [priceRSD, setPriceRSD] = useState(0);
    const [isPublished, setIsPublished] = useState(false);

    const [stepsText, setStepsText] = useState("");
    const [ingredientsText, setIngredientsText] = useState("");

    useEffect(() => {
        (async () => {
            const res = await fetch("/api/categories", { cache: "no-store" });
            const data = await res.json().catch(() => null);
            if (res.ok && data?.ok) setCats(data.categories ?? []);
        })();
    }, []);

    useEffect(() => {
        (async () => {
            setLoading(true);
            setErr(null);

            const res = await fetch(`/api/recipes/${encodeURIComponent(id)}`, { cache: "no-store" });
            const data = await res.json().catch(() => null);

            if (!res.ok || !data?.ok) {
                setErr(data?.error ?? "Ne mogu da učitam recept.");
                setLoading(false);
                return;
            }

            const r = data.recipe;

            setTitle(r.title ?? "");
            setDescription(r.description ?? "");
            setPrepTimeMinutes(Number(r.prepTimeMinutes ?? 30));
            setDifficulty(Number(r.difficulty ?? 1));
            setImageUrl(r.imageUrl ?? "");
            setCategoryId(r.category?.id ?? r.categoryId ?? "");
            setIsPremium(Boolean(r.isPremium));
            setPriceRSD(Number(r.priceRSD ?? 0));
            setIsPublished(Boolean(r.isPublished));

            const steps = Array.isArray(r.steps) ? r.steps : [];
            setStepsText(steps.map((s: any) => String(s.text ?? "")).join("\n"));

            const ing = Array.isArray(r.ingredients) ? r.ingredients : [];
            setIngredientsText(
                ing
                    .map((x: any) => {
                        const ingId = x?.ingredient?.id ?? x?.ingredientId ?? "";
                        const qty = x?.quantity ?? "";
                        const unit = x?.unit ?? "";
                        return `${ingId} | ${qty} | ${unit}`;
                    })
                    .join("\n")
            );

            setLoading(false);
        })();
    }, [id]);

    function parseSteps() {
        return stepsText
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean)
            .map((text) => ({ text }));
    }

    function parseIngredients() {
        return ingredientsText
            .split("\n")
            .map((l) => l.trim())
            .filter(Boolean)
            .map((l) => {
                const parts = l.split("|").map((x) => (x ?? "").trim());
                const ingredientId = parts[0] ?? "";
                const quantityNum = Number(parts[1] ?? "");
                const unit = parts[2] ?? "";
                return { ingredientId, quantity: quantityNum, unit };
            })
            .filter((x) => x.ingredientId && Number.isFinite(x.quantity) && x.quantity > 0 && x.unit);
    }

    async function submit() {
        setErr(null);

        if (!title.trim()) return setErr("Naslov je obavezan.");
        if (!description.trim()) return setErr("Opis je obavezan.");
        if (!categoryId) return setErr("Kategorija je obavezna.");
        if (!Number.isFinite(prepTimeMinutes) || prepTimeMinutes <= 0) return setErr("Vreme pripreme mora biti > 0.");
        if (!Number.isFinite(difficulty) || difficulty <= 0) return setErr("Težina mora biti >= 1.");
        if (isPremium && (!Number.isFinite(priceRSD) || priceRSD <= 0)) return setErr("Za premium recept cena mora biti > 0.");

        const steps = parseSteps();
        const ingredients = parseIngredients();
        if (steps.length === 0) return setErr("Unesi bar 1 korak pripreme.");
        if (ingredients.length === 0) return setErr("Unesi bar 1 sastojak (ingredientId | qty | unit).");

        const body = {
            title: title.trim(),
            description: description.trim(),
            prepTimeMinutes,
            difficulty,
            imageUrl: imageUrl.trim() ? imageUrl.trim() : null,
            categoryId,
            isPremium,
            priceRSD: isPremium ? priceRSD : 0,
            isPublished,
            steps,
            ingredients,
        };

        const res = await fetch(`/api/recipes/${encodeURIComponent(id)}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });

        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.ok) {
            setErr(data?.error ?? "Ne mogu da izmenim recept.");
            return;
        }

        router.refresh();
        router.push("/kuvar/recipes");
    }

    if (loading) {
        return <main className="mx-auto max-w-3xl px-4 py-8">Učitavam...</main>;
    }

    return (
        <main className="mx-auto max-w-3xl px-4 py-8">
            <h1 className="text-2xl font-semibold">Izmeni recept</h1>

            {err && <p className="mt-4 text-sm text-red-700">{err}</p>}

            <div className="mt-6 grid gap-4">
                <input className="rounded-md border px-3 py-2" value={title} onChange={(e) => setTitle(e.target.value)} />
                <textarea className="rounded-md border px-3 py-2" value={description} onChange={(e) => setDescription(e.target.value)} />

                <div className="grid grid-cols-2 gap-3">
                    <input type="number" className="rounded-md border px-3 py-2" value={prepTimeMinutes} onChange={(e) => setPrepTimeMinutes(Number(e.target.value))} />
                    <input type="number" className="rounded-md border px-3 py-2" value={difficulty} onChange={(e) => setDifficulty(Number(e.target.value))} />
                </div>

                <input className="rounded-md border px-3 py-2" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />

                <select className="rounded-md border px-3 py-2" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                    {cats.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>

                <label className="flex items-center gap-2">
                    <input type="checkbox" checked={isPremium} onChange={(e) => setIsPremium(e.target.checked)} />
                    Premium
                </label>

                {isPremium && (
                    <input type="number" className="rounded-md border px-3 py-2" value={priceRSD} onChange={(e) => setPriceRSD(Number(e.target.value))} />
                )}

                <label className="flex items-center gap-2">
                    <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} />
                    Objavi
                </label>

                <textarea className="rounded-md border px-3 py-2" value={stepsText} onChange={(e) => setStepsText(e.target.value)} rows={7} />
                <textarea className="rounded-md border px-3 py-2" value={ingredientsText} onChange={(e) => setIngredientsText(e.target.value)} rows={6} />

                <button onClick={submit} className="w-fit rounded-md bg-black px-4 py-2 text-sm font-medium text-white">
                    Sačuvaj izmene
                </button>
            </div>
        </main>
    );
}
