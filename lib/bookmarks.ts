'use server';

import {and, desc, eq} from 'drizzle-orm';
import {revalidatePath} from 'next/cache';
import {getCurrentUserId} from './auth';
import {db} from './db';
import {bookmarks, type Bookmark} from './db/schema';
import {normaliseUrl} from './url';

export type ActionResult = {error: string} | {error?: never};

async function requireUserId(): Promise<string> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Not authenticated');
  return userId;
}

export async function listBookmarks(): Promise<Bookmark[]> {
  const userId = await requireUserId();
  return db
    .select()
    .from(bookmarks)
    .where(eq(bookmarks.userId, userId))
    .orderBy(desc(bookmarks.createdAt));
}

export async function addBookmark(formData: FormData): Promise<ActionResult> {
  const userId = await requireUserId();

  const url = normaliseUrl(String(formData.get('url') ?? ''));
  if (!url) return {error: 'Enter a valid http(s) URL.'};

  const title = String(formData.get('title') ?? '').trim();
  const tag = String(formData.get('tag') ?? '').trim();

  await db.insert(bookmarks).values({
    userId,
    url,
    title: title || null,
    tag: tag || null,
  });

  revalidatePath('/dashboard');
  return {};
}

export async function deleteBookmark(formData: FormData): Promise<void> {
  const userId = await requireUserId();

  const id = String(formData.get('id') ?? '');
  if (!id) return;

  // userId in the WHERE clause is what stops one user deleting another's row.
  await db.delete(bookmarks).where(and(eq(bookmarks.id, id), eq(bookmarks.userId, userId)));

  revalidatePath('/dashboard');
}
