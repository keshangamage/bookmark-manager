import {and, desc, eq} from 'drizzle-orm';
import {db} from './db';
import {bookmarks, type Bookmark} from './db/schema';



export function listForUser(userId: string): Promise<Bookmark[]> {
  return db
    .select()
    .from(bookmarks)
    .where(eq(bookmarks.userId, userId))
    .orderBy(desc(bookmarks.createdAt));
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
