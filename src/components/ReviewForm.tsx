"use client";

import { useId, useState } from "react";

export default function ReviewForm({
  recipeId,
  initialRating = 5,
  initialComment = "",
}: {
  recipeId: string;
  initialRating?: number;
  initialComment?: string;
}) {
  const ratingId = useId();
  const commentId = useId();

  const [rating, setRating] = useState<number>(initialRating);
  const [comment, setComment] = useState<string>(initialComment);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(
    null
  );

  async function submit() {
    if (loading) return;

    setLoading(true);
    setMsg(null);

    try {
      const res = await fetch(`/api/recipes/${recipeId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        setMsg({
          type: "err",
          text: data?.error || "Greška pri slanju recenzije.",
        });
        return;
      }

      setMsg({ type: "ok", text: "Recenzija je sačuvana." });

      // Ako želiš da nakon uspeha očisti komentar, otkomentariši:
      // setComment("");

      window.location.reload();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6 rounded-lg border p-4">
      <h3 className="text-lg font-semibold">Ostavi recenziju</h3>

      <div className="mt-3">
        <label htmlFor={ratingId} className="block text-sm">
          Ocena (1–5)
        </label>
        <select
          id={ratingId}
          className="mt-1 w-full rounded border p-2"
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          disabled={loading}
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-3">
        <label htmlFor={commentId} className="block text-sm">
          Komentar
        </label>
        <textarea
          id={commentId}
          className="mt-1 w-full rounded border p-2"
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Napiši komentar..."
          maxLength={1000}
          disabled={loading}
        />
        <p className="mt-1 text-xs text-gray-500">
          {comment.length}/1000
        </p>
      </div>

      <button
        type="button"
        onClick={submit}
        disabled={loading}
        className="mt-3 rounded bg-black px-4 py-2 text-white disabled:opacity-50"
      >
        {loading ? "Čuvam..." : "Sačuvaj"}
      </button>

      {msg && (
        <p
          className={`mt-2 text-sm ${
            msg.type === "ok" ? "text-green-700" : "text-red-700"
          }`}
        >
          {msg.text}
        </p>
      )}
    </div>
  );
}
