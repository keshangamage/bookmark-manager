import {BookmarkIcon, Trash2Icon} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle} from '@/components/ui/empty';
import {deleteBookmark} from '@/lib/bookmarks';
import type {Bookmark} from '@/lib/db/schema';
import DomainMonogram, {domainOf} from './DomainMonogram';

export default function BookmarkList({items}: {items: Bookmark[]}) {
  if (items.length === 0) {
    return (
      <Empty className="rounded-2xl border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <BookmarkIcon />
          </EmptyMedia>
          <EmptyTitle>Nothing saved yet</EmptyTitle>
          <EmptyDescription>Paste a link above to keep your first bookmark.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <div className="flex items-center justify-between border-b px-4 py-2.5">
        <span className="font-heading text-sm font-semibold">Saved</span>
        <span className="font-mono text-xs text-muted-foreground">{items.length}</span>
      </div>
      <ul className="divide-y">
        {items.map((item) => (
          <li key={item.id} className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50">
            <DomainMonogram url={item.url} />
            <div className="min-w-0 flex-1">
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer noopener"
                className="truncate text-sm font-medium underline-offset-4 outline-none hover:underline focus-visible:underline"
              >
                {item.title || domainOf(item.url)}
              </a>
              <p className="truncate font-mono text-xs text-muted-foreground">{item.url}</p>
            </div>
            {item.tag ? (
              <span className="mark hidden shrink-0 font-mono text-[0.7rem] sm:inline-block">{item.tag}</span>
            ) : null}
            <form action={deleteBookmark}>
              <input type="hidden" name="id" value={item.id} />
              <Button
                type="submit"
                variant="ghost"
                size="icon-sm"
                aria-label={`Delete ${item.title || domainOf(item.url)}`}
                className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 hover:text-destructive"
              >
                <Trash2Icon />
              </Button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
