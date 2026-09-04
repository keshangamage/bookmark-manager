import {createRemoteJWKSet, jwtVerify, type JWTPayload} from 'jose';

export type AccessTokenClaims = JWTPayload & {
  scope?: string;
  roles?: unknown;
  groups?: unknown;
};

function baseUrl(): string {
  const url = process.env.NEXT_PUBLIC_ASGARDEO_BASE_URL;
  if (!url) throw new Error('NEXT_PUBLIC_ASGARDEO_BASE_URL is not set.');
  return url.replace(/\/$/, '');
}

// Cached across requests: the JWKS is fetched once and refreshed on rotation,
// so verifying a token costs no network call in the common case.
let jwks: ReturnType<typeof createRemoteJWKSet> | undefined;
function keySet() {
  jwks ??= createRemoteJWKSet(new URL(`${baseUrl()}/oauth2/jwks`));
  return jwks;
}

/** Bearer token out of an Authorization header. Null when absent or malformed. */
export function bearerFrom(header: string | null): string | null {
  if (!header) return null;
  const [scheme, ...rest] = header.trim().split(/\s+/);
  if (scheme?.toLowerCase() !== 'bearer') return null;
  const token = rest.join('');
  return token.length > 0 ? token : null;
}

/**
 * Verifies an Asgardeo access token: RS256 signature against the tenant JWKS,
 * plus issuer and audience. Throws when the token cannot be trusted.
 */
export async function verifyAccessToken(
  token: string,
  options: {issuer?: string; audience?: string} = {},
): Promise<AccessTokenClaims> {
  const {payload} = await jwtVerify(token, keySet(), {
    issuer: options.issuer ?? `${baseUrl()}/oauth2/token`,
    audience: options.audience ?? process.env.NEXT_PUBLIC_ASGARDEO_CLIENT_ID,
  });
  return payload;
}


export function rolesFrom(claims: AccessTokenClaims): string[] {
  const raw = claims.roles ?? claims.groups;
  if (Array.isArray(raw)) return raw.filter((r): r is string => typeof r === 'string');
  if (typeof raw === 'string') return raw.split(/[\s,]+/).filter(Boolean);
  return [];
}

export function hasRole(claims: AccessTokenClaims, role: string): boolean {
  return rolesFrom(claims).includes(role);
}

export function hasScope(claims: AccessTokenClaims, scope: string): boolean {
  return typeof claims.scope === 'string' && claims.scope.split(/\s+/).includes(scope);
}
