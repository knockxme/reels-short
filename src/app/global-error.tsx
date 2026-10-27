"use client";

/*
 * Shown only when the root layout itself fails. It replaces the whole document, so it carries its
 * own minimal styles (the site stylesheet and fonts may not have loaded).
 */
export default function GlobalError({ reset, retry }: { error: unknown; reset?: () => void; retry?: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: "100dvh", display: "grid", placeItems: "center", background: "#09090d", color: "#f4f4f7", fontFamily: "system-ui, sans-serif", textAlign: "center", padding: 24 }}>
        <title>Something went wrong</title>
        <div>
          <h1 style={{ fontSize: 22, margin: 0 }}>Something went wrong</h1>
          <p style={{ color: "#a1a1b2", fontSize: 14 }}>Please try again in a moment.</p>
          <button
            type="button"
            onClick={() => (retry ?? reset)?.()}
            style={{ marginTop: 16, height: 44, padding: "0 20px", border: 0, borderRadius: 12, background: "#e11d48", color: "#fff", fontWeight: 700, cursor: "pointer" }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
