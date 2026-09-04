import Link from 'next/link';
import {redirect} from 'next/navigation';
import {SignInButton} from '@/app/_components/AuthButtons';
import BookmarkPreview from '@/app/_components/BookmarkPreview';
import {Spinner} from '@/components/ui/spinner';
import {getSessionId} from '@/lib/auth';

export default async function Home({searchParams}: PageProps<'/'>) {
  if (await getSessionId()) {
    redirect('/dashboard');
  }

  // Asgardeo redirects back here with ?code&state. The session cookie does not
  // exist until the client provider exchanges the code, so without this the
  // signed-out landing page flashes for the length of that round-trip.
  const {code, state, error} = await searchParams;
  if (code && state && !error) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-3 px-6">
        <Spinner className="size-5 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Signing you in…</p>
        {/* Escape hatch: a stale or replayed code never completes, and the
            client retries against the same URL. */}
        <Link href="/" className="text-xs text-muted-foreground underline underline-offset-4">
          Start over
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 items-center px-6 py-16">
      <div className="grid w-full items-center gap-14 lg:grid-cols-[1.05fr_1fr] lg:gap-20">
        <div>
          <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
            Personal bookmark manager
          </p>
          <h1 className="mt-5 font-heading text-5xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-6xl">
            Every link you meant to <span className="mark">keep</span>.
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-muted-foreground text-pretty">
            Save a URL, give it a tag, find it again later. Your bookmarks are scoped to your
            account — nobody else can read or delete them.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <SignInButton />
          </div>

          {/* Only /api/silent-sign-in asks for prompt=none, so this is a user
              who landed on /welcome without an Asgardeo session to reuse. */}
          {error === 'login_required' && (
            <p className="mt-4 text-sm text-muted-foreground">
              Your account is ready — sign in to continue.
            </p>
          )}
        </div>

        <BookmarkPreview />
      </div>
    </main>
  );
}
