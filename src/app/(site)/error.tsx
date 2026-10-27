"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="grid min-h-[50vh] place-items-center px-6 text-center">
      <div>
        <h1 className="text-xl font-bold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted">Please try again in a moment.</p>
        <button type="button" onClick={reset} className="mt-5 h-11 rounded-lg bg-accent px-5 text-sm font-bold text-accent-ink">
          Try again
        </button>
      </div>
    </div>
  );
}
