'use client';

import {useActionState} from 'react';
import {addBookmark} from '@/lib/bookmarks';

const input =
  'w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950';

export default function AddBookmarkForm() {
  const [state, formAction, pending] = useActionState(
    async (_prev: {error?: string}, formData: FormData) => addBookmark(formData),
    {},
  );

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-[2fr_1.5fr_1fr_auto]">
      <input className={input} name="url" placeholder="https://example.com" required />
      <input className={input} name="title" placeholder="Title (optional)" />
      <input className={input} name="tag" placeholder="Tag (optional)" />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {pending ? 'Adding…' : 'Add'}
      </button>
      {state?.error ? (
        <p className="text-sm text-red-600 sm:col-span-4 dark:text-red-400">{state.error}</p>
      ) : null}
    </form>
  );
}
