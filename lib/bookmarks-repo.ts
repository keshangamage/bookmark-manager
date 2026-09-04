import {and, desc, eq, isNotNull} from 'drizzle-orm';
import {filterCondition, type BookmarkFilter} from './bookmark-filter';
import {db} from './db';
import {bookmarks, type Bookmark} from './db/schema';

export type {BookmarkFilter};

export function listForUser(userId: string, filter: BookmarkFilter = {}): Promise<Bookmark[]> {
  return db
    .select()
    .from(bookmarks)
    .where(filterCondition(userId, filter))
    .orderBy(desc(bookmarks.createdAt));
}

/** Every tag this user has used, for the filter bar. */
export async function listTagsForUser(userId: string): Promise<string[]> {
  const rows = await db
    .selectDistinct({tag: bookmarks.tag})
    .from(bookmarks)
    .where(and(eq(bookmarks.userId, userId), isNotNull(bookmarks.tag)));

  return rows
    .map((row) => row.tag)
    .filter((tag): tag is string => Boolean(tag?.trim()))
    .sort((a, b) => a.localeCompare(b));
}

export function createForUser(
  userId: string,
  values: {url: string; title?: string | null; tag?: string | null},
): Promise<Bookmark[]> {
  return db
    .insert(bookmarks)
    .values({userId, url: values.url, title: values.title ?? null, tag: values.tag ?? null})
    .returning();
}

/** Matches on both id and owner, so knowing an id is not enough to edit a row. */
export function updateForUser(
  userId: string,
  id: string,
  values: {url: string; title?: string | null; tag?: string | null},
): Promise<Bookmark[]> {
  return db
    .update(bookmarks)
    .set({url: values.url, title: values.title ?? null, tag: values.tag ?? null})
    .where(and(eq(bookmarks.id, id), eq(bookmarks.userId, userId)))
    .returning();
}

/** Matches on both id and owner, so knowing an id is not enough to delete a row. */
export function deleteForUser(userId: string, id: string): Promise<Bookmark[]> {
  return db
    .delete(bookmarks)
    .where(and(eq(bookmarks.id, id), eq(bookmarks.userId, userId)))
    .returning();
}

/** Every bookmark, for administrators. Callers must check the role first. */
export function listAll(): Promise<Bookmark[]> {
  return db.select().from(bookmarks).orderBy(desc(bookmarks.createdAt));
}
