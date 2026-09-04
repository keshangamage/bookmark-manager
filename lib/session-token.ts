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
