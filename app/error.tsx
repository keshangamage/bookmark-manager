'use client';

import {RotateCcwIcon, TriangleAlertIcon} from 'lucide-react';
import {useEffect} from 'react';
import {Button} from '@/components/ui/button';
import {Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle} from '@/components/ui/empty';

export default function Error({
  error,
  retry,
}: {
  error: Error & {digest?: string};
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <Empty className="max-w-md">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <TriangleAlertIcon />
          </EmptyMedia>
          <EmptyTitle>This page didn&apos;t load</EmptyTitle>
          <EmptyDescription>
            Something failed while fetching your bookmarks. Trying again usually works.
          </EmptyDescription>
        </EmptyHeader>
        <Button onClick={() => retry()}>
          <RotateCcwIcon data-icon="inline-start" />
          Try again
        </Button>
        {/* Vercel logs this digest, so quoting it makes a report actionable. */}
        {error.digest ? (
          <p className="font-mono text-xs text-muted-foreground">Reference: {error.digest}</p>
        ) : null}
      </Empty>
    </main>
  );
}
