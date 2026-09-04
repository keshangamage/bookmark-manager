import {redirect} from 'next/navigation';
import AddBookmarkForm from '@/app/_components/AddBookmarkForm';
import BookmarkFilters from '@/app/_components/BookmarkFilters';
import BookmarkList from '@/app/_components/BookmarkList';
import {getCurrentUserId} from '@/lib/auth';
import {listBookmarks, listTags} from '@/lib/bookmarks';

export default async function DashboardPage({searchParams}: PageProps<'/dashboard'>) {
  // proxy.ts already guards this route; this is the real check.
  if (!(await getCurrentUserId())) {
    redirect('/');
  }

  const params = await searchParams;
  const q = typeof params.q === 'string' ? params.q : '';
  const tag = typeof params.tag === 'string' ? params.tag : '';
  const filtered = Boolean(q.trim() || tag.trim());

  // The tag list is deliberately unfiltered: narrowing it to the current
  // results would make the chips disappear as soon as you used one.
  const [items, tags] = await Promise.all([listBookmarks({q, tag}), listTags()]);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <h1 className="font-heading text-3xl font-semibold tracking-tight">Your bookmarks</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Only you can see these. Add a link and give it a tag to find it later.
      </p>
      <div className="mt-8">
        <AddBookmarkForm />
      </div>
      <div className="mt-6">
        <BookmarkFilters tags={tags} q={q} tag={tag} />
      </div>
      <div className="mt-4">
        <BookmarkList items={items} filtered={filtered} />
      </div>
    </main>
  );
}
