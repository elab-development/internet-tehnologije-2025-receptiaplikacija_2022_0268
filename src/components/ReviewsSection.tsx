"use client";

import { useEffect, useState } from "react";

type ReviewDto = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: { id: string; name: string | null; email: string };
};

function Stars({ value }: { value: number }) {
  const full = Math.round(value);
  return (
    <span aria-label={`${value} stars`}>
      {"★".repeat(full)}
      {"☆".repeat(Math.max(0, 5 - full))}
    </span>
  );
}

function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`text-2xl leading-none focus:outline-none ${
            n <= value ? "text-yellow-500" : "text-gray-300"
          }`}
          aria-label={`${n} stars`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function ReviewsSection({ recipeId }: { recipeId: string }) {
  const [reviews, setReviews] = useState<ReviewDto[]>([]);
  const [loading, setLoading] = useState(true);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);

    const res = await fetch(`/api/recipes/${recipeId}/reviews`, {
      cache: "no-store",
    });

    const text = await res.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }

    if (!res.ok) {
      setErr(data?.error ?? text ?? "Ne mogu da učitam recenzije.");
      setReviews([]);
      setLoading(false);
      return;
    }

    setReviews(data?.reviews ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipeId]);

  async function submit() {
    setMsg(null);
    setErr(null);

    if (!rating) {
      setErr("Nedostaje ocena (klikni na zvezdice).");
      return;
    }
    if (rating < 1 || rating > 5) {
      setErr("Uneta ocena nije validna.");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch(`/api/recipes/${recipeId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment }),
      });

      const text = await res.text();

      console.log("REVIEWS POST STATUS:", res.status);
      console.log("REVIEWS POST BODY:", text);

      let data: any = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = null;
      }

      if (!res.ok) {
        setErr(data?.error ?? text ?? "Sistem trenutno ne može da sačuva recenziju.");
        return;
      }

      setMsg(data?.message ?? "Recenzija je uspešno ostavljena.");
      setRating(0);
      setComment("");
      await load();
    } catch (e: any) {
      setErr(e?.message ?? String(e) ?? "Network error");
    } finally {
      setSaving(false);
    }
  }

  const avg =
    reviews.length === 0
      ? 0
      : reviews.reduce((acc, r) => acc + (r.rating ?? 0), 0) / reviews.length;

  return (
    <section className="mt-10 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Recenzije</h2>
        <div className="text-sm opacity-80">
          Prosek: <Stars value={avg} /> ({reviews.length})
        </div>
      </div>

      <div className="rounded-lg border bg-white p-4 space-y-3">
        <div className="font-medium">Ostavi recenziju</div>

        <StarPicker value={rating} onChange={setRating} />

        <textarea
          className="w-full rounded border p-2"
          rows={3}
          placeholder="Komentar (opciono)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />

        <button
          type="button"
          onClick={submit}
          disabled={saving}
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {saving ? "Čuvam..." : "Pošalji recenziju"}
        </button>

        {msg && <div className="text-sm text-green-700">{msg}</div>}
        {err && <div className="text-sm text-red-700">{err}</div>}
      </div>

      {loading ? (
        <div>Učitavam...</div>
      ) : err ? (
        <div className="text-red-700">{err}</div>
      ) : reviews.length === 0 ? (
        <div className="opacity-70">Nema recenzija još uvek.</div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="rounded-lg border bg-white p-4">
              <div className="flex items-center justify-between">
                <div className="font-medium">{r.user.name ?? r.user.email}</div>
                <div className="text-sm">
                  <Stars value={r.rating} />
                </div>
              </div>

              {r.comment && <div className="mt-2">{r.comment}</div>}

              <div className="mt-2 text-xs opacity-60">
                {new Date(r.createdAt).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}