import {BookmarkIcon, SearchXIcon} from 'lucide-react';
import {Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle} from '@/components/ui/empty';
import type {Bookmark} from '@/lib/db/schema';
import BookmarkRow from './BookmarkRow';

export default function BookmarkList({items, filtered = false}: {items: Bookmark[]; filtered?: boolean}) {
  if (items.length === 0) {
    // "Nothing saved yet" is wrong when a filter is what emptied the list.
    return filtered ? (
      <Empty className="rounded-2xl border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <SearchXIcon />
          </EmptyMedia>
          <EmptyTitle>No matches</EmptyTitle>
          <EmptyDescription>Try a different search, or clear the filters.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    ) : (
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
        <span className="font-heading text-sm font-semibold">{filtered ? 'Matches' : 'Saved'}</span>
        <span className="font-mono text-xs text-muted-foreground">{items.length}</span>
      </div>
      <ul className="divide-y">
        {items.map((item) => (
          <BookmarkRow key={item.id} item={item} />
        ))}
      </ul>
    </div>
  );
}
