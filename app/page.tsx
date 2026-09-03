import {redirect} from 'next/navigation';
import {SignInButton, SignUpButton} from '@/app/_components/AuthButtons';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {getSessionId} from '@/lib/auth';

export default async function Home() {
  if (await getSessionId()) {
    redirect('/dashboard');
  }

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Bookmark Manager</CardTitle>
          <CardDescription>
            Save and organise your links in one place. Sign in to get started.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <SignInButton />
          <SignUpButton />
        </CardContent>
      </Card>
    </main>
  );
}
