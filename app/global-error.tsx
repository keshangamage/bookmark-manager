'use client';

// Replaces the root layout, so it gets none of its styles, fonts or metadata.
// Global CSS must be imported here, and the title set with React's <title>.
import './globals.css';

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & {digest?: string};
  retry: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-svh items-center justify-center bg-background p-6 text-foreground">
        <title>Something went wrong — Bookmark Manager</title>
        <div className="w-full max-w-md text-center">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            The app failed to start
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This is an error in the app itself rather than in a single page. Reloading may help.
          </p>
          <button
            type="button"
            onClick={() => retry()}
            className="mt-6 inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Try again
          </button>
          {error.digest ? (
            <p className="mt-6 font-mono text-xs text-muted-foreground">
              Reference: {error.digest}
            </p>
          ) : null}
        </div>
      </body>
    </html>
  );
}
