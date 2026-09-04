import {SearchIcon, XIcon} from 'lucide-react';
import Link from 'next/link';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';

/**
 * Plain GET form and links rather than client state: the filter lives in the
 * URL, so it survives a reload, can be shared, and works before hydration.
 */
export default function BookmarkFilters({
  tags,
  q,
  tag,
}: {
  tags: string[];
  q: string;
  tag: string;
}) {
  const hrefFor = (next: string | null) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (next) params.set('tag', next);
    const query = params.toString();
    return query ? `/dashboard?${query}` : '/dashboard';
  };

  return (
    <div className="flex flex-col gap-3">
      <form method="GET" action="/dashboard" className="flex items-center gap-2">
        {/* Keeps the active tag when submitting a new search. */}
        {tag ? <input type="hidden" name="tag" value={tag} /> : null}
        <div className="relative flex-1">
          <SearchIcon
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search titles and links"
            aria-label="Search bookmarks"
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="outline" size="sm">
          Search
        </Button>
        {q || tag ? (
          <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/dashboard" />}>
            <XIcon data-icon="inline-start" />
            Clear
          </Button>
        ) : null}
      </form>

      {tags.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          {tags.map((name) => {
            const active = name === tag;
            return (
              <Badge
                key={name}
                variant={active ? 'default' : 'outline'}
                className="font-mono"
                // Clicking the active tag clears it, so a chip toggles.
                render={<Link href={hrefFor(active ? null : name)} aria-pressed={active} />}
              >
                {name}
              </Badge>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
