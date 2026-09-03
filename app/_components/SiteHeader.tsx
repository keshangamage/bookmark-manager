import {SignedIn} from '@asgardeo/nextjs';
import Link from 'next/link';
import {SignOutButton} from './AuthButtons';
import ThemeToggle from './ThemeToggle';
import UserBadge from './UserBadge';

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-6 py-3.5">
        <Link
          href="/"
          className="font-heading text-[0.95rem] font-semibold tracking-tight outline-none focus-visible:underline"
        >
          Bookmark Manager
        </Link>
        <div className="flex min-w-0 items-center gap-3">
          <SignedIn>
            <UserBadge />
            <SignOutButton />
          </SignedIn>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
