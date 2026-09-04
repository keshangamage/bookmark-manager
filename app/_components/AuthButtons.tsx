'use client';

import {useAsgardeo} from '@asgardeo/nextjs';
import {LogInIcon, LogOutIcon, UserPlusIcon} from 'lucide-react';
import {Button} from '@/components/ui/button';

// Plain navigation to our own route. Going through the SDK's signIn() would
// push an external URL through the Next router, which costs an extra failed
// RSC fetch and a repeated authorize round-trip.
export function SignInButton() {
  return (
    <Button nativeButton={false} render={<a href="/api/sign-in" />}>
      <LogInIcon data-icon="inline-start" />
      Sign In
    </Button>
  );
}

// signUpUrl comes from NEXT_PUBLIC_ASGARDEO_SIGN_UP_URL. Renders nothing when
// unset, rather than showing a button that silently does nothing.
export function SignUpButton() {
  const {signUpUrl} = useAsgardeo();
  if (!signUpUrl) return null;

  return (
    <Button variant="outline" nativeButton={false} render={<a href={signUpUrl} />}>
      <UserPlusIcon data-icon="inline-start" />
      Create account
    </Button>
  );
}

// The SDK's own button renders emotion-styled markup that ignores className,
// so drive the context hook directly and use a shadcn Button instead.
export function SignOutButton() {
  const {signOut, isLoading} = useAsgardeo();
  return (
    <Button variant="outline" size="sm" onClick={() => void signOut?.()} disabled={isLoading}>
      <LogOutIcon data-icon="inline-start" />
      Sign Out
    </Button>
  );
}
