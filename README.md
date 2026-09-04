# Bookmark Manager

[![CI](https://github.com/keshangamage/bookmark-manager/actions/workflows/ci.yml/badge.svg)](https://github.com/keshangamage/bookmark-manager/actions/workflows/ci.yml)

A personal bookmark manager built to learn [WSO2 Asgardeo](https://wso2.com/asgardeo/) — an
Identity-as-a-Service platform — with a real Next.js app rather than a login-only demo.

Sign in with Asgardeo (OIDC), land on a protected dashboard, and save, tag, and delete your own
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
| UI | Tailwind CSS v4 + shadcn/ui (`nova` preset), `next-themes` |
| Type | Bricolage Grotesque (display), Geist Sans (body), Geist Mono (URLs) |
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
4. **Flows → Self Registration**, load a template (Basic Details loads by default), click
   **Save Draft**, then toggle the switch in the top-right to publish. Until this flow is
   published, the "Create account" button reaches a registration page but sign-ups cannot
   complete. Note this lives under *Flows*, not under *Login & Registration*.
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
| `bun run test` | Unit tests (DB suite skips without `DATABASE_URL`) |
| `bun run test:local` | Full suite, loading `.env.local` |
| `bun run db:generate` | Generate a migration from `lib/db/schema.ts` |
| `bun run db:migrate` | Apply pending migrations to Neon |
| `bun run db:studio` | Drizzle Studio |

## Project structure

```
app/
  page.tsx                  landing page; redirects to /dashboard when signed in
  api/sign-in/route.ts      starts sign-in with a server redirect
  api/bookmarks/route.ts    Bearer-token API for non-browser clients
  error.tsx                 error boundary for any route below the root layout
  global-error.tsx          replaces the root layout when it is the layout that failed
  not-found.tsx             404
  dashboard/page.tsx        protected route; lists bookmarks
  dashboard/loading.tsx     skeleton matching the dashboard layout
  _components/              AuthButtons, SiteHeader, UserBadge, AddBookmarkForm, BookmarkList
components/ui/              shadcn/ui components
lib/
  auth.ts                   getSessionId() and getCurrentUserId()
  access-token.ts           verifies OAuth access tokens against the tenant JWKS
  bookmarks-repo.ts         data access shared by the actions and the API
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

### 12. Registration cannot be deep-linked

The SDK's `<SignUpButton>` does nothing: `signUpAction` hardcodes an empty sign-up URL when called
without a payload, and the button only navigates `if (signUpUrl)`. `signIn({prompt: 'create'})` is
not a workaround either — passing options switches the SDK to its embedded flow, and Asgardeo rejects
the OIDC `prompt=create` parameter outright with `Invalid prompt variables passed`.

The obvious fix is to link straight at the registration page. **It does not work**, and it fails in a
way that looks like success.

Asgardeo's own "Create an account" link carries the whole OIDC transaction:

```
/accounts/register?flowType=REGISTRATION&sessionDataKey=…&commonAuthCallerPath=/t/<org>/oauth2/authorize
                  &relyingParty=…&spId=…&type=oidc&redirect_uri=…&state=…
```

A hand-built URL with just `flowType`, `client_id` and `redirect_uri` **renders the correct
registration form**, which is what makes this so easy to get wrong. But there is no pending
transaction to resume, so when registration completes Asgardeo has nowhere to send the user and drops
them in My Account. The account exists; the app never receives a code; the user appears not to be
signed in.

I confirmed this the wrong way round at first — I checked that the page rendered without
`sessionDataKey` and concluded the parameter was optional. Rendering is not completing.

Nor can the key be fetched ahead of time: `/authorize` sets HttpOnly cookies (`wpaf`,
`sessionNonceCookie-*`, later `JSESSIONID`) on Asgardeo's own domains, so a server-side fetch
collects them instead of the user's browser, and no other origin can set them.

**Why it cannot be deep-linked at all.** The hosted sign-in page hands the transaction to the
registration page through browser storage, not the URL:

```js
// on the sign-in page
localStorage.setItem("sessionDataKey", "…")

// on the registration page, once the flow completes
const sessionDataKey = localStorage.getItem("sessionDataKey");
const userAssertion = flow.data.additionalData?.userAssertion;
if (sessionDataKey && userAssertion) { /* POST to /commonauth → back to the app */ }
```

The `sessionDataKey` in the query string is **ignored**. With nothing in `localStorage` that
condition fails, `/commonauth` is never called, the authorization request is never resumed, and
Asgardeo sends the new user to My Account. `localStorage` belongs to the `accounts.asgardeo.io`
origin, so nothing outside it can seed the value.

I worked this out only after two failed attempts — first a hand-built URL, then scraping the real
link and redirecting to it server-side. Both render the correct form and both strand the user,
because the URL was never the mechanism.

**Where this landed.** There is no in-app sign-up button. Registration is reached from the
"Create an account" link on Asgardeo's own sign-in page, which is the only route where the
`localStorage` handoff happens. Even then, returning the new user to the app depends on the flow's
completion settings rather than anything this app controls, so shipping a button that promised
sign-up would have been promising something the integration does not reliably deliver.

Separately, enable **Auto Login** on the flow's End node (*Flows → Self Registration*), otherwise a
new user is created but must then sign in manually.

### 13. A successful sign-in looks like a failed one

After entering credentials you land back on `/` and see the signed-out landing page for several
seconds before the dashboard appears.

Nothing is broken. Asgardeo redirects to `/?code=…&state=…`, but the session cookie does not exist
until the *client* provider exchanges the code. The server render therefore sees no session and
renders the landing page for the length of that round-trip.

**Fix:** detect the callback parameters server-side and render a signing-in state instead:

```tsx
const {code, state, error} = await searchParams;
if (code && state && !error) return <SigningIn />;
```

Treat an `error` parameter as a cancelled login rather than a pending one, and include an escape
link — a stale or replayed code never completes, and the client keeps retrying the same URL.

### 14. `router.push` to an external URL runs the OIDC handshake twice

Clicking sign-in took 6–7 seconds. A request trace showed why:

```
  46ms  server action         →   72ms  ✅ 26ms
  77ms  GET /oauth2/authorize → 1765ms  302
1765ms  fetch login.do?_rsc=  → 2805ms  ✗ CORS failure
2815ms  GET /oauth2/authorize → 3976ms  302   ← whole handshake repeated
3976ms  login.do              → 5116ms  200
```

The SDK navigates with `router.push(authorizeUrl)`. Next's client router treats that as an internal
navigation and fetches an RSC payload from `accounts.asgardeo.io`, which fails CORS, then falls back
to a hard navigation that repeats the entire authorize round-trip — roughly 2.7s of pure waste.

**Fix:** start sign-in from a route handler that issues a real server redirect
(`app/api/sign-in/route.ts`), and make the button a plain `<a href="/api/sign-in">`. One handshake,
no RSC fetch: **6–7s → 3–4s, and zero failed requests.**

The catch is that `handleOAuthCallbackAction` refuses to exchange the code without the temporary
session cookie that the SDK's own `signInAction` sets, so the route has to mint that cookie itself,
mirroring `SessionManager.createTempSession` (HS256 over `ASGARDEO_SECRET`, `{sessionId, type:
'temp'}`, 15-minute expiry, `httpOnly` + `sameSite: lax`). Same coupling trade-off as gotcha 8 —
worth re-checking on an SDK upgrade.

### 15. Smaller ones

- A folder named `_debug/` is a **private folder** in the App Router and is excluded from routing —
  it 404s rather than serving a route.
- shadcn's docs mention a `base-nova` preset; the CLI rejects it. Valid names are `nova`, `vega`,
  `maia`, `lyra`, `mira`, `luma`, `sera`, `rhea`.
- shadcn configures dark mode as a **class** variant (`.dark`), not `prefers-color-scheme`, so
  adopting it silently disables OS-following dark mode. `next-themes` (`defaultTheme="system"`)
  restores it; `<html>` needs `suppressHydrationWarning` because the theme class is set before
  hydration.

## The bookmarks API

The dashboard uses server actions and a session cookie. `/api/bookmarks` exists for everything else —
scripts, a CLI, a mobile client — and authenticates differently: an **OAuth Bearer access token**,
verified against the tenant JWKS. Cookies are not accepted, so another site cannot drive it with the
user's ambient credentials.

| Request | Behaviour |
| --- | --- |
| `GET /api/bookmarks` | the caller's own bookmarks |
| `GET /api/bookmarks?all=true` | every user's bookmarks — requires the admin role |
| `POST /api/bookmarks` | `{url, title?, tag?}`; the url is normalised and must be http(s) |

Verification checks the RS256 signature against `<baseUrl>/oauth2/jwks`, plus the issuer
(`<baseUrl>/oauth2/token`) and the audience (the client id). Failures return `401` with a
`WWW-Authenticate` header and never say *which* check failed, so the response cannot be used to
probe for valid tokens. Requesting `?all=true` without the role returns `403`.

```bash
curl -H "Authorization: Bearer $TOKEN" https://<host>/api/bookmarks
curl -X POST -H "Authorization: Bearer $TOKEN" -H 'content-type: application/json' \
     -d '{"url":"example.com/article","tag":"reading"}' https://<host>/api/bookmarks
```

### Enabling the admin role

Create a role in the Asgardeo console (**User Management → Roles**), assign it to a user, and make
sure the role attribute is mapped into the token for this application. The role name defaults to
`bookmark-admin` and is overridable with `ASGARDEO_ADMIN_ROLE`.

Asgardeo emits roles inconsistently depending on that mapping — sometimes as `roles`, sometimes as
`groups`, and as either an array or a delimited string — so `rolesFrom()` accepts all of those shapes
rather than assuming one.

## Tests and CI

`bun run test:local` runs the whole suite; `bun run test` runs it without loading `.env.local`,
which is what CI does.

| File | Covers |
| --- | --- |
| `tests/url.test.ts` | URL normalisation, including rejecting `javascript:` and `data:` bookmarks |
| `tests/session-token.test.ts` | Session cookie verification: forged signatures, tampered tokens, expiry, and `temp` tokens being refused |
| `tests/scoping.test.ts` | Per-user isolation against a real database, including cross-user deletes |
| `tests/access-token.test.ts` | Access-token verification against a locally generated JWKS: bad signatures, wrong issuer, wrong audience, expiry, plus header and role-claim parsing |

`tests/scoping.test.ts` needs `DATABASE_URL` and **skips** without one, so the unit tests still run
on forks and in environments with no database. It writes rows under `citest-*` user ids and removes
them afterwards.

GitHub Actions (`.github/workflows/ci.yml`) runs lint, typecheck, tests, and a production build on
every push and pull request. The build step uses placeholder credentials: every route is dynamic, so
it never contacts Asgardeo or Postgres.

## Testing the security properties by hand

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
