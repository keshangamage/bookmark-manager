import {BookmarkIcon, Trash2Icon} from 'lucide-react';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle} from '@/components/ui/empty';
import {Item, ItemActions, ItemContent, ItemDescription, ItemTitle} from '@/components/ui/item';
import {deleteBookmark} from '@/lib/bookmarks';
import type {Bookmark} from '@/lib/db/schema';

export default function BookmarkList({items}: {items: Bookmark[]}) {
  if (items.length === 0) {
    return (
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <BookmarkIcon />
          </EmptyMedia>
          <EmptyTitle>No bookmarks yet</EmptyTitle>
          <EmptyDescription>Add your first one using the form above.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => (
        <Item key={item.id} variant="outline">
          <ItemContent>
            <ItemTitle>
              <a href={item.url} target="_blank" rel="noreferrer noopener" className="hover:underline">
                {item.title || item.url}
              </a>
              {item.tag ? <Badge variant="secondary">{item.tag}</Badge> : null}
            </ItemTitle>
            <ItemDescription>{item.url}</ItemDescription>
          </ItemContent>
          <ItemActions>
            <form action={deleteBookmark}>
              <input type="hidden" name="id" value={item.id} />
              <Button type="submit" variant="ghost" size="icon-sm" aria-label="Delete bookmark">
                <Trash2Icon />
              </Button>
            </form>
          </ItemActions>
        </Item>
      ))}
    </div>
  );
}
