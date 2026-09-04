import {Skeleton} from '@/components/ui/skeleton';

// Mirrors the dashboard layout so the page does not jump when data arrives.
export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <Skeleton className="h-9 w-56" />
      <Skeleton className="mt-3 h-4 w-80" />

      <div className="mt-8 rounded-2xl border bg-card p-4">
        <div className="grid gap-4 sm:grid-cols-[2fr_1.4fr_1fr]">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex flex-col gap-2">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-9 w-full" />
            </div>
          ))}
        </div>
        <Skeleton className="mt-4 h-8 w-36" />
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border bg-card">
        <div className="flex items-center justify-between border-b px-4 py-2.5">
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-4 w-4" />
        </div>
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3 border-b px-4 py-3 last:border-b-0">
            <Skeleton className="size-9 shrink-0 rounded-lg" />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-2/3" />
            </div>
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </main>
  );
}
