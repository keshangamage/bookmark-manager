'use client';

import {useAsgardeo} from '@asgardeo/nextjs';
import {LogInIcon, LogOutIcon} from 'lucide-react';
import {Button} from '@/components/ui/button';

// The SDK's own buttons render emotion-styled markup that ignores className,
// so drive the context hook directly and use a shadcn Button instead.
export function SignInButton() {
  const {signIn, isLoading} = useAsgardeo();
  return (
    <Button onClick={() => void signIn?.()} disabled={isLoading}>
      <LogInIcon data-icon="inline-start" />
      Sign In
    </Button>
  );
}

export function SignOutButton() {
  const {signOut, isLoading} = useAsgardeo();
  return (
    <Button variant="outline" size="sm" onClick={() => void signOut?.()} disabled={isLoading}>
      <LogOutIcon data-icon="inline-start" />
      Sign Out
    </Button>
  );
}
