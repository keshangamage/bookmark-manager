import {jwtVerify} from 'jose';


export async function readUserIdFromSessionToken(
  token: string | undefined,
  secret: string | undefined,
): Promise<string | null> {
  if (!token) return null;
  if (!secret) throw new Error('ASGARDEO_SECRET is not set.');

  try {
    const {payload} = await jwtVerify(token, new TextEncoder().encode(secret));
    if (payload.type !== 'session') return null;
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

/**
 * The access token the SDK stashed in the session cookie. Needed to call
 * Asgardeo's own APIs (SCIM) as the signed-in user.
 */
export async function readAccessTokenFromSessionToken(
  token: string | undefined,
  secret: string | undefined,
): Promise<string | null> {
  if (!token) return null;
  if (!secret) throw new Error('ASGARDEO_SECRET is not set.');

  try {
    const {payload} = await jwtVerify(token, new TextEncoder().encode(secret));
    if (payload.type !== 'session') return null;
    return typeof payload.accessToken === 'string' ? payload.accessToken : null;
  } catch {
    return null;
  }
}
