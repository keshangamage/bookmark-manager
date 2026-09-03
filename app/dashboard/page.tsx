import {redirect} from 'next/navigation';
import AddBookmarkForm from '@/app/_components/AddBookmarkForm';
import BookmarkList from '@/app/_components/BookmarkList';
import SiteHeader from '@/app/_components/SiteHeader';
import {getCurrentUserId} from '@/lib/auth';
import {listBookmarks} from '@/lib/bookmarks';

export default async function DashboardPage() {
  // proxy.ts already guards this route; this is the real check.
  if (!(await getCurrentUserId())) {
    redirect('/');
  }

  const items = await listBookmarks();

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
        <h1 className="text-2xl font-semibold tracking-tight">Your Bookmarks</h1>
        <div className="mt-6">
          <AddBookmarkForm />
        </div>
        <div className="mt-8">
          <BookmarkList items={items} />
        </div>
      </main>
    </>
  );
}
