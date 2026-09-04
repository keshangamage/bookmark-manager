import {CookieConfig} from '@asgardeo/node';
import {asgardeo} from '@asgardeo/nextjs/server';
import {cookies} from 'next/headers';
import {readAccessTokenFromSessionToken, readUserIdFromSessionToken} from './session-token';

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


export async function getAccessToken(): Promise<string | null> {
  const token = (await cookies()).get(CookieConfig.SESSION_COOKIE_NAME)?.value;
  return readAccessTokenFromSessionToken(token, process.env.ASGARDEO_SECRET);
}
