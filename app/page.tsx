import {SignInButton} from '@asgardeo/nextjs';
import {redirect} from 'next/navigation';
import {getSessionId} from '@/lib/auth';

export default async function Home() {
  if (await getSessionId()) {
    redirect('/dashboard');
  }

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-2xl font-semibold tracking-tight">Bookmark Manager</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Save and organise your links in one place. Sign in to get started.
        </p>
        <div className="mt-6">
          <SignInButton>Sign In</SignInButton>
        </div>
      </div>
    </main>
  );
}
