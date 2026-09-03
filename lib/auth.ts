import {CookieConfig} from '@asgardeo/node';
import {asgardeo} from '@asgardeo/nextjs/server';
import {jwtVerify} from 'jose';
import {cookies} from 'next/headers';

// Reads and verifies the session cookie. Null when signed out or expired.
export async function getSessionId(): Promise<string | null> {
  const {getSessionId: read} = await asgardeo();
  return (await read()) ?? null;
}

// The SDK exposes no server-side accessor for the user's `sub`, so read it from
// the session cookie it signs. Never trust a user id sent from the client.
export async function getCurrentUserId(): Promise<string | null> {
  const token = (await cookies()).get(CookieConfig.SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const secret = process.env.ASGARDEO_SECRET;
  if (!secret) throw new Error('ASGARDEO_SECRET is not set.');

  try {
    const {payload} = await jwtVerify(token, new TextEncoder().encode(secret));
    return payload.type === 'session' ? (payload.sub ?? null) : null;
  } catch {
    return null;
  }
}
