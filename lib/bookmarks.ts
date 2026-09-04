'use server';

import {revalidatePath} from 'next/cache';
import {getCurrentUserId} from './auth';
import {
  createForUser,
  deleteForUser,
  listForUser,
  listTagsForUser,
  updateForUser,
  type BookmarkFilter,
} from './bookmarks-repo';
import type {Bookmark} from './db/schema';
import {normaliseUrl} from './url';

export type ActionResult = {error: string} | {error?: never};

async function requireUserId(): Promise<string> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Not authenticated');
  return userId;
}

export async function listBookmarks(filter: BookmarkFilter = {}): Promise<Bookmark[]> {
  return listForUser(await requireUserId(), filter);
}

export async function listTags(): Promise<string[]> {
  return listTagsForUser(await requireUserId());
}

export async function addBookmark(formData: FormData): Promise<ActionResult> {
  const userId = await requireUserId();

  const url = normaliseUrl(String(formData.get('url') ?? ''));
  if (!url) return {error: 'Enter a valid http(s) URL.'};

  const title = String(formData.get('title') ?? '').trim();
  const tag = String(formData.get('tag') ?? '').trim();

  await createForUser(userId, {url, title: title || null, tag: tag || null});

  revalidatePath('/dashboard');
  return {};
}

export async function deleteBookmark(formData: FormData): Promise<void> {
  const userId = await requireUserId();

  const id = String(formData.get('id') ?? '');
  if (!id) return;

  await deleteForUser(userId, id);

  revalidatePath('/dashboard');
}

export async function updateBookmark(formData: FormData): Promise<ActionResult> {
  const userId = await requireUserId();

  const id = String(formData.get('id') ?? '');
  if (!id) return {error: 'Missing bookmark id.'};

  const url = normaliseUrl(String(formData.get('url') ?? ''));
  if (!url) return {error: 'Enter a valid http(s) URL.'};

  const title = String(formData.get('title') ?? '').trim();
  const tag = String(formData.get('tag') ?? '').trim();

  const [updated] = await updateForUser(userId, id, {
    url,
    title: title || null,
    tag: tag || null,
  });
  // Scoped to the owner, so a missing row means someone else's id was supplied.
  if (!updated) return {error: 'That bookmark no longer exists.'};

  revalidatePath('/dashboard');
  return {};
}
