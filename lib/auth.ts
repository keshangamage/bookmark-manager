import {CookieConfig} from '@asgardeo/node';
import {asgardeo} from '@asgardeo/nextjs/server';
import {cookies} from 'next/headers';
import {readUserIdFromSessionToken} from './session-token';

// Reads and verifies the session cookie. Null when signed out or expired.
export async function getSessionId(): Promise<string | null> {
  const {getSessionId: read} = await asgardeo();
  return (await read()) ?? null;
}

// The SDK exposes no server-side accessor for the user's `sub`, so read it from
// the session cookie it signs. Never trust a user id sent from the client.
export async function getCurrentUserId(): Promise<string | null> {
  const token = (await cookies()).get(CookieConfig.SESSION_COOKIE_NAME)?.value;
  return readUserIdFromSessionToken(token, process.env.ASGARDEO_SECRET);
}

/**
 * Marks that /welcome has already spent its one silent sign-in attempt, so a
 * failed attempt cannot bounce the browser back into another one.
 */
export const SILENT_SIGN_IN_COOKIE = 'silent-sign-in-attempted';

export async function hasTriedSilentSignIn(): Promise<boolean> {
  return (await cookies()).has(SILENT_SIGN_IN_COOKIE);
}
