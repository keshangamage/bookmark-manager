# Bookmark Manager

[![CI](https://github.com/keshangamage/bookmark-manager/actions/workflows/ci.yml/badge.svg)](https://github.com/keshangamage/bookmark-manager/actions/workflows/ci.yml)

A personal bookmark manager built to learn [WSO2 Asgardeo](https://wso2.com/asgardeo/) — an
Identity-as-a-Service platform — with a real Next.js app rather than a login-only demo.

Sign in with Asgardeo (OIDC), land on a protected dashboard, and save, edit, tag, search and delete
your own bookmarks. Every row is scoped to the `sub` claim of the signed-in user, so no account can
read or change another's.

**Built with** Next.js 16 (App Router, React 19) · TypeScript · `@asgardeo/nextjs` · Neon Postgres ·
Drizzle ORM · Tailwind v4 + shadcn/ui · Bun

> 📓 **[NOTES.md](NOTES.md)** — sixteen things that went wrong along the way and what fixed them.
> That is the interesting half of this repo.

## Quick start

You need Node 20+ (or Bun 1.3+), an Asgardeo account, and a Neon project.

```bash
bun install
npx neon@latest init --agent   # writes DATABASE_URL into .env.local
# add the Asgardeo variables below to .env.local
bun run db:migrate
bun run dev                    # http://localhost:3000
```

### Asgardeo setup

In the [console](https://console.asgardeo.io/), create an application (**Standard-Based →
OpenID Connect**) and set, on the **Protocol** tab:

| Field | Value |
| --- | --- |
| Grant types | `Code`, `Refresh Token` |
| Authorized redirect URL | `http://localhost:3000` — the app **origin**, not a callback path |
| Public client / PKCE | Off; the app authenticates with the client secret |

Then:

- **User Attributes** — request `email`, or the header shows a user ID instead.
- **General → Access URL** — set to `http://localhost:3000/welcome.html`. This is where Asgardeo
  sends people after they sign up.
- **Flows → Self Registration** — load a template, **Save Draft**, then publish with the toggle.
  Sign-ups cannot complete until this is published. Note it lives under *Flows*.

The redirect URL and the Access URL are the two most likely things to get wrong;
[NOTES.md](NOTES.md) explains both.

### Environment

`.env.local` (gitignored). The `NEXT_PUBLIC_` prefixes are the exact names the SDK reads.

```bash
NEXT_PUBLIC_ASGARDEO_BASE_URL="https://api.asgardeo.io/t/<your-org>"
NEXT_PUBLIC_ASGARDEO_CLIENT_ID="<client-id>"
ASGARDEO_CLIENT_SECRET="<client-secret>"
NEXT_PUBLIC_ASGARDEO_SCOPES="openid profile email internal_login"

# Signs the session cookie:
#   node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
ASGARDEO_SECRET="<random-32-byte-string>"

# Written by `neon env pull`
DATABASE_URL="postgresql://..."
DATABASE_URL_UNPOOLED="postgresql://..."
```

## How it fits together

```
Browser ──▶ proxy.ts ──▶ App Router
             │             ├─ /            landing; redirects to /dashboard when signed in
             │             ├─ /dashboard   protected; list, add, edit, delete, filter
             │             └─ /profile     protected; the Asgardeo profile over SCIM 2.0
             │
             ├─ completes the OIDC redirect (code + state → session cookie)
             └─ refreshes the access token before it expires

Server Actions ──▶ getCurrentUserId() ──▶ Drizzle ──▶ Neon Postgres
                   (reads `sub` from              (every query filtered by user_id)
                    the signed session cookie)
```

`bookmarks.user_id` holds the Asgardeo `sub`, read **only** on the server from the signed session
cookie — never from a form field, since a client-supplied user ID would let anyone read anyone
else's rows. Updates and deletes match on `(id, user_id)`, so knowing another user's bookmark UUID
is not enough to touch it.

## Layout

```
app/
  page.tsx                landing; also receives the OIDC ?code&state
  dashboard/              protected: list, add, edit, delete, search, filter by tag
  profile/                protected: read and edit the Asgardeo profile over SCIM
  api/sign-in/            starts sign-in with a server redirect
  api/bookmarks/          Bearer-token API for non-browser clients
  _components/            forms, list rows, header, theme toggle
lib/
  auth.ts                 getSessionId(), getCurrentUserId(), getAccessToken()
  session-token.ts        verifies the signed session cookie
  access-token.ts         verifies OAuth access tokens against the tenant JWKS
  bookmarks.ts            server actions: list / add / update / delete
  bookmarks-repo.ts       queries, shared by the actions and the API
  bookmark-filter.ts      search and tag filtering (no DB import, so it is unit-testable)
  profile.ts, scim.ts     SCIM 2.0 profile read and write
  db/                     Drizzle schema and client
public/welcome.html       static post-sign-up landing; see NOTES.md
proxy.ts                  Asgardeo middleware + route protection
```

## The bookmarks API

The dashboard uses server actions and a session cookie. `/api/bookmarks` is for everything else —
scripts, a CLI, a mobile client — and takes an **OAuth Bearer access token** instead. Cookies are
not accepted, so another site cannot drive it with the user's ambient credentials.

| Request | Behaviour |
| --- | --- |
| `GET /api/bookmarks` | the caller's own bookmarks |
| `GET /api/bookmarks?all=true` | every user's bookmarks — requires the admin role |
| `POST /api/bookmarks` | `{url, title?, tag?}`; the url is normalised and must be http(s) |

```bash
curl -H "Authorization: Bearer $TOKEN" https://<host>/api/bookmarks
```

Tokens are checked for RS256 signature against `<baseUrl>/oauth2/jwks`, issuer, and audience.
Failures return `401` and never say *which* check failed, so responses cannot be used to probe for
valid tokens. `?all=true` without the role returns `403`.

For the admin role: create it under **User Management → Roles**, assign it, and map the role
attribute into this application's token. It defaults to `bookmark-admin`, overridable with
`ASGARDEO_ADMIN_ROLE`. Asgardeo emits roles as `roles` or `groups`, and as an array or a delimited
string, so `rolesFrom()` accepts all of those shapes.

## Scripts

| Command | What it does |
| --- | --- |
| `bun run dev` / `build` / `start` | Dev server, production build, serve the build |
| `bun run lint` | ESLint |
| `bun run typecheck` | `next typegen` then `tsc --noEmit` |
| `bun run test` | Tests without `.env.local` — what CI runs |
| `bun run test:local` | Full suite, loading `.env.local` |
| `bun run db:generate` / `db:migrate` / `db:studio` | Drizzle migrations and studio |

## Tests

| File | Covers |
| --- | --- |
| `tests/url.test.ts` | URL normalisation, rejecting `javascript:` and `data:` bookmarks |
| `tests/bookmark-filter.test.ts` | LIKE escaping, so a search for `50%` does not match everything |
| `tests/session-token.test.ts` | Session cookie: forged signatures, tampering, expiry, `temp` tokens |
| `tests/access-token.test.ts` | Access tokens against a locally generated JWKS |
| `tests/scim.test.ts` | Parsing SCIM profiles and building PATCH bodies |
| `tests/scoping.test.ts` | Per-user isolation against a real database |

`tests/scoping.test.ts` needs `DATABASE_URL` and **skips** without one, so the unit tests still run
on forks. It writes rows under `citest-*` ids and cleans up after itself.

CI (`.github/workflows/ci.yml`) runs lint, typecheck, tests and a production build on every push and
PR, using placeholder credentials — every route is dynamic, so the build never contacts Asgardeo or
Postgres.

### Checking the scoping by hand

The session cookie is signed with `ASGARDEO_SECRET`, so you can mint one and skip the browser login:

```ts
await new SignJWT({sessionId: 'sess-1', type: 'session', accessToken: '', refreshToken: '', scopes: ''})
  .setProtectedHeader({alg: 'HS256'})
  .setSubject('test-user-alice')
  .setExpirationTime(Math.floor(Date.now() / 1000) + 3600)
  .sign(new TextEncoder().encode(process.env.ASGARDEO_SECRET));
```

Then `curl --cookie "__asgardeo__session=<jwt>" http://localhost:3000/dashboard`.

## Licence

MIT
