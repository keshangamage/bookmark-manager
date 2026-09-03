import {SignedIn, SignedOut, SignInButton, SignOutButton} from '@asgardeo/nextjs';
import UserBadge from './_components/UserBadge';

export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-2xl font-semibold tracking-tight">Bookmark Manager</h1>

        <SignedOut>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Save and organise your links. Sign in to get started.
          </p>
          <div className="mt-6">
            <SignInButton>Sign In</SignInButton>
          </div>
        </SignedOut>

        <SignedIn>
          <div className="mt-2">
            <UserBadge />
          </div>
          <div className="mt-6">
            <SignOutButton>Sign Out</SignOutButton>
          </div>
        </SignedIn>
      </div>
    </main>
  );
}
