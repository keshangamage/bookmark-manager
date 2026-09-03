import {redirect} from 'next/navigation';
import AddBookmarkForm from '@/app/_components/AddBookmarkForm';
import BookmarkList from '@/app/_components/BookmarkList';
import {getCurrentUserId} from '@/lib/auth';
import {listBookmarks} from '@/lib/bookmarks';

export default async function DashboardPage() {
  // proxy.ts already guards this route; this is the real check.
  if (!(await getCurrentUserId())) {
    redirect('/');
  }

  const items = await listBookmarks();

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
        <BookmarkList items={items} />
      </div>
    </main>
  );
}
