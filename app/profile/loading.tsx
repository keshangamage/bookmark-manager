import {Skeleton} from '@/components/ui/skeleton';

// Mirrors the profile layout: the SCIM round-trip to Asgardeo is a network hop,
// so this is on screen long enough to matter.
export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <Skeleton className="h-9 w-48" />
      <Skeleton className="mt-3 h-4 w-96" />

      <div className="mt-8 rounded-2xl border bg-card p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="flex flex-col gap-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-9 w-full" />
            </div>
          ))}
        </div>
        <Skeleton className="mt-4 h-8 w-32" />
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border bg-card">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-baseline gap-4 border-b px-4 py-3 last:border-b-0">
            <Skeleton className="h-3 w-44 shrink-0" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        ))}
      </div>
    </main>
  );
}
