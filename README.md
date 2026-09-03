# Bookmark Manager

A personal bookmark manager built to learn [WSO2 Asgardeo](https://wso2.com/asgardeo/) — an
Identity-as-a-Service platform — with a real Next.js app rather than a login-only demo.

Sign up or sign in with Asgardeo (OIDC), land on a protected dashboard, and save, tag, and delete your own
bookmarks. Every bookmark is scoped to the `sub` claim of the signed-in user, so no account can see
or delete another's rows.

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16.3.4 (App Router, React 19) |
| Language | TypeScript |
| Auth | Asgardeo via `@asgardeo/nextjs` 0.3.29 |
| Database | Neon Postgres (serverless) |
| ORM | Drizzle ORM 0.45 + drizzle-kit |
| UI | Tailwind CSS v4 + shadcn/ui (`nova` preset) |
| Runtime | Bun 1.3 (npm/pnpm work too) |

## How it fits together

```
Browser ──▶ proxy.ts ──▶ App Router
             │             │
             │             ├─ /            landing, redirects to /dashboard when signed in
             │             └─ /dashboard   protected; lists + mutates bookmarks
             │
             ├─ completes the OIDC redirect (code + state → session cookie)
             └─ refreshes the access token before it expires

Server Actions ──▶ getCurrentUserId() ──▶ Drizzle ──▶ Neon Postgres
                   (reads `sub` from             (every query filtered by user_id)
                    the signed session cookie)
```

## Prerequisites

- Node.js 20+ (or Bun 1.3+)
- An Asgardeo account with an application registered
- A Neon project

## Setup

### 1. Install

```bash
git clone <your-repo-url> bookmark-manager
cd bookmark-manager
bun install
```

### 2. Configure the Asgardeo application

In the [Asgardeo Console](https://console.asgardeo.io/):

1. **Applications → New Application → Standard-Based Application → OpenID Connect.**
   (A "Traditional Web Application" also works — this app uses the authorization code flow with a
   client secret.)
2. On the **Protocol** tab set:

   | Field | Value |
   | --- | --- |
   | Allowed grant types | `Code`, `Refresh Token` |
   | Authorized redirect URL | `http://localhost:3000` |
   | Allowed origins | `http://localhost:3000` (only needed if you hit CORS; the token exchange is server-side) |
   | Public client / PKCE | **Off** — the SDK sets `enablePKCE: false` and authenticates with the client secret |

   The redirect URL is the **app origin**, not a `/api/auth/callback` path. See
   [Gotchas](#1-there-is-no-apiauthcallback-route) — this is the single most likely thing to get wrong.
3. On the **User Attributes** tab, make sure `email` is a requested attribute, otherwise the header
   shows a user ID instead of an email address.
4. **Login & Registration → Self-Registration → Enable**, so new users can create accounts. The
   "Create account" button links to Asgardeo's hosted registration page.
5. Copy the **Client ID** and **Client Secret** from the Protocol tab.

### 3. Configure Neon

```bash
npx neon@latest init --agent   # links the project and writes .neon
```

This authenticates, creates/links a project, and pulls `DATABASE_URL` and `DATABASE_URL_UNPOOLED`
into `.env.local`. If you already have a Neon project, `neon link` then `neon env pull` is enough.

### 4. Environment variables

Create `.env.local` (already gitignored):

```bash
# Asgardeo — from the Protocol tab of your application
NEXT_PUBLIC_ASGARDEO_BASE_URL="https://api.asgardeo.io/t/<your-org>"
NEXT_PUBLIC_ASGARDEO_CLIENT_ID="<client-id>"
ASGARDEO_CLIENT_SECRET="<client-secret>"
NEXT_PUBLIC_ASGARDEO_SCOPES="openid profile email internal_login"

# Self-registration page. Must be set explicitly — see gotcha 12.
NEXT_PUBLIC_ASGARDEO_SIGN_UP_URL="https://accounts.asgardeo.io/t/<your-org>/accountrecoveryendpoint/register.do?client_id=<client-id>&sp=<application-name>"

# Signs the session JWT cookie. Generate with:
#   node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
ASGARDEO_SECRET="<random-32-byte-string>"

# Neon — written by `neon env pull`
DATABASE_URL="postgresql://..."
DATABASE_URL_UNPOOLED="postgresql://..."
```

The `NEXT_PUBLIC_` prefixes are not optional — they are the exact names the SDK reads
(see `decorateConfigWithNextEnv` in `@asgardeo/nextjs`).

### 5. Create the database table

```bash
bun run db:migrate
```

### 6. Run

```bash
bun run dev      # http://localhost:3000
```

## Available scripts

| Command | What it does |
| --- | --- |
| `bun run dev` | Dev server |
| `bun run build` | Production build |
| `bun run start` | Serve the production build |
| `bun run lint` | ESLint |
| `bun run db:generate` | Generate a migration from `lib/db/schema.ts` |
| `bun run db:migrate` | Apply pending migrations to Neon |
| `bun run db:studio` | Drizzle Studio |

## Project structure

```
app/
  page.tsx                  landing page; redirects to /dashboard when signed in
  dashboard/page.tsx        protected route; lists bookmarks
  _components/              AuthButtons, SiteHeader, UserBadge, AddBookmarkForm, BookmarkList
components/ui/              shadcn/ui components
lib/
  auth.ts                   getSessionId() and getCurrentUserId()
  bookmarks.ts              server actions: list / add / delete
  db/schema.ts              Drizzle schema
  db/index.ts               Drizzle client over @neondatabase/serverless
drizzle/                    generated SQL migrations
proxy.ts                    Asgardeo middleware + route protection
```

## How per-user scoping works

`bookmarks.user_id` stores the Asgardeo `sub` claim. It is read **only** on the server, from the
signed session cookie — never from a form field or request body, since a client-supplied user ID
would let anyone read anyone else's bookmarks.

Deletes match on `(id, user_id)`, not `id` alone, so knowing another user's bookmark UUID is not
enough to delete it.

---

## Gotchas / things I learned

These are the actual problems hit while building this, in the order they came up.

### 1. There is no `/api/auth/callback` route

Most OIDC integrations want a dedicated callback route, so I registered
`http://localhost:3000/api/auth/callback` in Asgardeo first. That fails.

`@asgardeo/nextjs` detects the callback by spotting `code` **and** `state` query parameters on *any*
matched route, then exchanges the code from the client provider. The `redirect_uri` it actually sends
is `afterSignInUrl`, which defaults to the app origin.

Rather than guess, I printed what the SDK sends by calling its own URL builder from a throwaway
route handler:

```ts
const url = await AsgardeoNext.getInstance().getAuthorizeRequestUrl({}, 'debug');
new URL(String(url)).searchParams.get('redirect_uri');
// → "http://localhost:3000"
```

**Fix:** register the app origin. To land on `/dashboard` directly instead, set
`NEXT_PUBLIC_ASGARDEO_AFTER_SIGN_IN_URL` and register *that* exact URL — the token exchange sends
`redirect_uri` from the same value, so the two must always match.

### 2. Next.js 16 renamed `middleware.ts` to `proxy.ts`

The Asgardeo docs still show `middleware.ts`. In Next.js 16 that convention is deprecated in favour
of `proxy.ts`. The import path is unchanged (`@asgardeo/nextjs/middleware`) — only the file name and
export moved. There is a codemod: `npx @next/codemod@canary middleware-to-proxy .`

### 3. Render props cannot cross the Server → Client Component boundary

```
Error: Functions are not valid as a child of Client Components.
```

`<User>{(user) => ...}</User>` takes a render prop, and a Server Component cannot pass a function as
`children` to a Client Component. **Fix:** put `<User>` inside a component marked `'use client'`
(`app/_components/UserBadge.tsx`).

### 4. `ASGARDEO_SECRET` fails silently in dev and loudly in production

This variable signs the session cookie and is not in the quick-start. Without it, dev logs a warning
and falls back to a hardcoded string, while production **throws**. Easy to miss until deploy.

### 5. The SDK config is a singleton — dev-server restarts matter

`AsgardeoNextClient.initialize()` returns early if already initialized. Changing provider props or
env vars does nothing until you restart `next dev`. I chased a "fix that didn't work" for a few
minutes here.

Related: the singleton initialized during a page render is **not** shared into a route handler's
module graph, which throws `Client is not initialized` — call `initialize({})` there yourself.

### 6. Branding lookups 404 if the org has no branding

Every render logged `BPM-60002 Branding preferences are not configured`. Silence it with:

```tsx
<AsgardeoProvider preferences={{theme: {inheritFromBranding: false}}}>
```

### 7. The build fails without `force-dynamic`

`AsgardeoProvider` calls `headers()`, which cannot run during static prerendering. The provider
catches the resulting error but leaves the singleton half-attached, so the *next* call fails with a
misleading message:

```
Error occurred prerendering page "/"
TypeError: Cannot read properties of undefined (reading 'getConfigData')
```

The real cause is the `headers()` call several lines earlier. Since every route here needs the
session cookie anyway, `export const dynamic = 'force-dynamic'` in the root layout fixes it.

### 8. Getting the user's `sub` on the server

The SDK has no public server-side accessor for it. `getSessionPayload` is internal,
`getDecodedIdToken` depends on storage that is not reliable across server contexts, and the client
`user` object cannot be trusted for authorization.

So `getCurrentUserId()` verifies the session cookie directly with `jose`, using the SDK's own
`CookieConfig.SESSION_COOKIE_NAME` constant rather than hardcoding `__asgardeo__session`.

**Trade-off:** this depends on the SDK's cookie structure, so a major SDK upgrade could break it.
It is the part of this codebase most worth re-checking on `@asgardeo/nextjs` updates.

### 9. `internal_login` scope is required for the user profile

`<User>` renders from `/scim2/Me`. Without `internal_login` in the scopes that call is rejected and
the user object stays empty, so the header renders nothing useful. `email` is needed for the email
claim.

### 10. drizzle-kit does not read `.env.local`

It reads `.env`. Next.js reads `.env.local`. Rather than duplicate secrets, the `db:*` scripts pass
the file explicitly:

```json
"db:migrate": "bun --env-file=.env.local drizzle-kit migrate"
```

Migrations also use `DATABASE_URL_UNPOOLED` — DDL should go over a direct connection, not the pooler.

### 11. Asgardeo's UI components ignore `className`

`SignInButton` / `SignOutButton` render emotion-styled markup, so they cannot be restyled with
Tailwind. The documented render-prop escape hatch does not help either: `BaseSignInButton` drops
`onClick` when `children` is a function, and the Next.js wrapper never forwards `signIn` into the
render arguments, so you get `signIn: undefined`.

**Fix:** call the public `useAsgardeo()` hook directly — which is what those buttons do internally —
and render your own button (`app/_components/AuthButtons.tsx`).

### 12. The SDK's `<SignUpButton>` is a no-op out of the box

`signUpAction` hardcodes an empty sign-up URL when called without a payload:

```js
if (!payload) {
  const defaultSignUpUrl = '';
  return {data: {signUpUrl: String(defaultSignUpUrl)}, success: true};
}
```

`SignUpButton` only navigates `if (signUpUrl)`, so with nothing configured the button renders and
does nothing at all — no error, no navigation. You must set
`NEXT_PUBLIC_ASGARDEO_SIGN_UP_URL`.

Nor can you deep-link to registration through `signIn()`: passing options makes the payload
non-empty, which sends the SDK down its *embedded* flow instead of the redirect flow.

The registration URL is not in the SDK. I found it by probing endpoints until one returned a real
sign-up form:

```
https://accounts.asgardeo.io/t/<org>/accountrecoveryendpoint/register.do?client_id=<id>&sp=<app-name>
```

Note this is on `accounts.asgardeo.io`, not the `api.asgardeo.io` host used for
`NEXT_PUBLIC_ASGARDEO_BASE_URL` — the same path on `api.` returns 403. `SignUpButton` renders
nothing when the URL is unset, so a misconfiguration shows as a missing button rather than a dead one.

### 13. Smaller ones

- A folder named `_debug/` is a **private folder** in the App Router and is excluded from routing —
  it 404s rather than serving a route.
- shadcn's docs mention a `base-nova` preset; the CLI rejects it. Valid names are `nova`, `vega`,
  `maia`, `lyra`, `mira`, `luma`, `sera`, `rhea`.
- shadcn configures dark mode as a **class** variant (`.dark`), not `prefers-color-scheme`, so the
  app no longer follows the OS theme without a theme provider.

## Testing the security properties

Asgardeo signs the session cookie with `ASGARDEO_SECRET`, so a valid session can be minted locally
to test scoping without going through a browser login:

```ts
await new SignJWT({sessionId: 'sess-1', type: 'session', accessToken: '', refreshToken: '', scopes: ''})
  .setProtectedHeader({alg: 'HS256'})
  .setSubject('test-user-alice')
  .setExpirationTime(Math.floor(Date.now() / 1000) + 3600)
  .sign(new TextEncoder().encode(process.env.ASGARDEO_SECRET));
```

Then `curl --cookie "__asgardeo__session=<jwt>" http://localhost:3000/dashboard`. Verified this way:

- each user sees only their own bookmarks
- a request with no cookie is redirected and leaks nothing
- a cookie with a tampered signature is rejected
- a cross-user delete affects zero rows

## Licence

MIT
