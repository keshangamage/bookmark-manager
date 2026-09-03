import {index, pgTable, text, timestamp, uuid} from 'drizzle-orm/pg-core';

export const bookmarks = pgTable(
  'bookmarks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // Asgardeo `sub` claim. Every query filters on this.
    userId: text('user_id').notNull(),
    url: text('url').notNull(),
    title: text('title'),
    tag: text('tag'),
    createdAt: timestamp('created_at', {withTimezone: true}).notNull().defaultNow(),
  },
  (table) => [index('bookmarks_user_id_created_at_idx').on(table.userId, table.createdAt)],
);

export type Bookmark = typeof bookmarks.$inferSelect;
export type NewBookmark = typeof bookmarks.$inferInsert;
