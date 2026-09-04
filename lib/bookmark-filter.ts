import {and, eq, ilike, or, type SQL} from 'drizzle-orm';
import {bookmarks} from './db/schema';

export type BookmarkFilter = {q?: string | null; tag?: string | null};

/**
 * `%` and `_` are wildcards in LIKE, so a search for "50%" would otherwise
 * match everything. Postgres treats backslash as the default escape character.
 */
export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

/**
 * Kept out of bookmarks-repo.ts so it can be tested without a database:
 * that module imports the Neon client, which throws when DATABASE_URL is unset.
 */
export function filterCondition(userId: string, filter: BookmarkFilter = {}): SQL | undefined {
  const conditions: (SQL | undefined)[] = [eq(bookmarks.userId, userId)];

  const q = filter.q?.trim();
  if (q) {
    const pattern = `%${escapeLike(q)}%`;
    conditions.push(or(ilike(bookmarks.title, pattern), ilike(bookmarks.url, pattern)));
  }

  const tag = filter.tag?.trim();
  if (tag) conditions.push(eq(bookmarks.tag, tag));

  return and(...conditions);
}
