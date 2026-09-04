import {SearchXIcon} from 'lucide-react';
import Link from 'next/link';
import {Button} from '@/components/ui/button';
import {Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle} from '@/components/ui/empty';

export default function NotFound() {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <Empty className="max-w-md">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <SearchXIcon />
          </EmptyMedia>
          <EmptyTitle>No page at this address</EmptyTitle>
          <EmptyDescription>
            The link may be out of date, or the address may have a typo.
          </EmptyDescription>
        </EmptyHeader>
        <Button nativeButton={false} render={<Link href="/" />}>
          Back to your bookmarks
        </Button>
      </Empty>
    </main>
  );
}
