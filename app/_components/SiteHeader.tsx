import {SignedIn, SignOutButton} from '@asgardeo/nextjs';
import Link from 'next/link';
import UserBadge from './UserBadge';

export default function SiteHeader() {
  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="font-semibold tracking-tight">
          Bookmark Manager
        </Link>
        <SignedIn>
          <div className="flex items-center gap-4">
            <UserBadge />
            <SignOutButton>Sign Out</SignOutButton>
          </div>
        </SignedIn>
      </div>
    </header>
  );
}
