"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error("GLOBAL ERROR:", error);

  return (
    <html>
      <body style={{ padding: 20, fontFamily: "sans-serif" }}>
        <h2>Client error:</h2>
        <pre style={{ whiteSpace: "pre-wrap" }}>{error?.message}</pre>
        {error?.stack && (
          <>
            <h3>Stack:</h3>
            <pre style={{ whiteSpace: "pre-wrap" }}>{error.stack}</pre>
          </>
        )}
        <button onClick={() => reset()}>Try again</button>
      </body>
    </html>
  );
}
