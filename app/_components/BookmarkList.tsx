import {deleteBookmark} from '@/lib/bookmarks';
import type {Bookmark} from '@/lib/db/schema';

export default function BookmarkList({items}: {items: Bookmark[]}) {
  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700">
        No bookmarks yet. Add your first one above.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
      {items.map((item) => (
        <li key={item.id} className="flex items-start justify-between gap-4 p-4">
          <div className="min-w-0">
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer noopener"
              className="font-medium hover:underline"
            >
              {item.title || item.url}
            </a>
            <p className="truncate text-xs text-zinc-500">{item.url}</p>
            {item.tag ? (
              <span className="mt-2 inline-block rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                {item.tag}
              </span>
            ) : null}
          </div>
          <form action={deleteBookmark}>
            <input type="hidden" name="id" value={item.id} />
            <button
              type="submit"
              className="shrink-0 text-sm text-zinc-500 hover:text-red-600 dark:hover:text-red-400"
            >
              Delete
            </button>
          </form>
        </li>
      ))}
    </ul>
  );
}
