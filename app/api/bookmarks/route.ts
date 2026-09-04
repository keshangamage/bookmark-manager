import {NextResponse, type NextRequest} from 'next/server';
import {bearerFrom, hasRole, rolesFrom, verifyAccessToken} from '@/lib/access-token';
import {createForUser, listAll, listForUser} from '@/lib/bookmarks-repo';
import {normaliseUrl} from '@/lib/url';



const ADMIN_ROLE = process.env.ASGARDEO_ADMIN_ROLE ?? 'bookmark-admin';

function unauthorized(detail: string, status = 401) {
  return NextResponse.json(
    {error: detail},
    // RFC 6750: tell the client how to authenticate.
    {status, headers: {'WWW-Authenticate': `Bearer error="invalid_token", error_description="${detail}"`}},
  );
}

async function authenticate(request: NextRequest) {
  const token = bearerFrom(request.headers.get('authorization'));
  if (!token) return {error: unauthorized('Missing Bearer token')};

  try {
    const claims = await verifyAccessToken(token);
    if (!claims.sub) return {error: unauthorized('Token has no subject')};
    return {claims, userId: claims.sub};
  } catch {
    // Signature, issuer, audience, or expiry — never say which.
    return {error: unauthorized('Invalid or expired token')};
  }
}

export async function GET(request: NextRequest) {
  const auth = await authenticate(request);
  if ('error' in auth) return auth.error;

  const wantsAll = request.nextUrl.searchParams.get('all') === 'true';
  if (wantsAll && !hasRole(auth.claims, ADMIN_ROLE)) {
    return NextResponse.json({error: `Requires the ${ADMIN_ROLE} role`}, {status: 403});
  }

  const data = wantsAll ? await listAll() : await listForUser(auth.userId);
  return NextResponse.json({
    data,
    scope: wantsAll ? 'all' : 'self',
    roles: rolesFrom(auth.claims),
  });
}

export async function POST(request: NextRequest) {
  const auth = await authenticate(request);
  if ('error' in auth) return auth.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({error: 'Body must be JSON'}, {status: 400});
  }

  const {url, title, tag} = (body ?? {}) as Record<string, unknown>;
  const normalised = normaliseUrl(typeof url === 'string' ? url : '');
  if (!normalised) {
    return NextResponse.json({error: 'Provide a valid http(s) url'}, {status: 400});
  }

  const [created] = await createForUser(auth.userId, {
    url: normalised,
    title: typeof title === 'string' && title.trim() ? title.trim() : null,
    tag: typeof tag === 'string' && tag.trim() ? tag.trim() : null,
  });
  return NextResponse.json({data: created}, {status: 201});
}
