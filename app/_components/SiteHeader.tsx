import {SignedIn} from '@asgardeo/nextjs';
import Link from 'next/link';
import {SignOutButton} from './AuthButtons';
import ThemeToggle from './ThemeToggle';
import UserBadge from './UserBadge';

export default function SiteHeader() {
  return (
    <header className="border-b">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-6 py-3">
        <Link href="/" className="font-heading font-semibold tracking-tight">
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
