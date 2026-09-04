import {neon} from '@neondatabase/serverless';
import {and, desc, eq} from 'drizzle-orm';
import {drizzle} from 'drizzle-orm/neon-http';
import {afterAll, beforeAll, describe, expect, it} from 'vitest';
import {bookmarks} from '@/lib/db/schema';

const url = process.env.DATABASE_URL;

// Needs a real database. Skipped locally when DATABASE_URL is unset so the unit
// suite still runs; CI supplies a Neon branch.
describe.skipIf(!url)('per-user scoping', () => {
  // Built lazily: Vitest still evaluates a skipped describe body, and neon()
  // throws when handed an undefined connection string.
  const db = drizzle(neon(url ?? 'postgresql://unused:unused@unused.invalid/unused'));
  const alice = `citest-alice-${crypto.randomUUID()}`;
  const bob = `citest-bob-${crypto.randomUUID()}`;

  // Mirrors listBookmarks() / deleteBookmark() from lib/bookmarks.ts.
  const listFor = (userId: string) =>
    db.select().from(bookmarks).where(eq(bookmarks.userId, userId)).orderBy(desc(bookmarks.createdAt));
  const deleteAs = (userId: string, id: string) =>
    db.delete(bookmarks).where(and(eq(bookmarks.id, id), eq(bookmarks.userId, userId))).returning();
  // Mirrors updateBookmark() from lib/bookmarks.ts.
  const updateAs = (userId: string, id: string, values: {url: string; title: string; tag: string}) =>
    db
      .update(bookmarks)
      .set(values)
      .where(and(eq(bookmarks.id, id), eq(bookmarks.userId, userId)))
      .returning();

  beforeAll(async () => {
    await db.insert(bookmarks).values([
      {userId: alice, url: 'https://alice.example.com', title: 'alice-row', tag: 'a'},
      {userId: bob, url: 'https://bob.example.com', title: 'bob-row', tag: 'b'},
    ]);
  });

  afterAll(async () => {
    await db.delete(bookmarks).where(eq(bookmarks.userId, alice));
    await db.delete(bookmarks).where(eq(bookmarks.userId, bob));
  });

  it('each user sees only their own rows', async () => {
    expect((await listFor(alice)).map((r) => r.title)).toEqual(['alice-row']);
    expect((await listFor(bob)).map((r) => r.title)).toEqual(['bob-row']);
  });

  it('an unknown user sees nothing', async () => {
    expect(await listFor(`citest-nobody-${crypto.randomUUID()}`)).toEqual([]);
  });

  it('one user cannot edit another user\'s row, even knowing its id', async () => {
    const [bobRow] = await listFor(bob);
    const values = {url: 'https://hijacked.example.com', title: 'hijacked', tag: 'x'};
    expect(await updateAs(alice, bobRow.id, values)).toHaveLength(0);
    expect((await listFor(bob)).map((r) => r.title)).toEqual(['bob-row']);
  });

  it('a user can edit their own row', async () => {
    const [aliceRow] = await listFor(alice);
    const values = {url: 'https://alice.example.com/edited', title: 'alice-edited', tag: 'z'};
    const [updated] = await updateAs(alice, aliceRow.id, values);
    expect(updated).toMatchObject(values);
  });

  it('one user cannot delete another user\'s row, even knowing its id', async () => {
    const [bobRow] = await listFor(bob);
    expect(await deleteAs(alice, bobRow.id)).toHaveLength(0);
    expect(await listFor(bob)).toHaveLength(1);
  });

  it('a user can delete their own row', async () => {
    const [aliceRow] = await listFor(alice);
    expect(await deleteAs(alice, aliceRow.id)).toHaveLength(1);
    expect(await listFor(alice)).toHaveLength(0);
  });
});
