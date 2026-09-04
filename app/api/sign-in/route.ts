import {AsgardeoNext} from '@asgardeo/nextjs';
import {CookieConfig, generateSessionId} from '@asgardeo/node';
import {SignJWT} from 'jose';
import {NextResponse} from 'next/server';


export async function GET() {
  const secret = process.env.ASGARDEO_SECRET;
  if (!secret) throw new Error('ASGARDEO_SECRET is not set.');

  const client = AsgardeoNext.getInstance();
  // The singleton from a page render is not shared into a route handler.
  await client.initialize({baseUrl: process.env.NEXT_PUBLIC_ASGARDEO_BASE_URL!});

  const sessionId = generateSessionId();
  const authorizeUrl = await client.getAuthorizeRequestUrl({}, sessionId);

  const tempSession = await new SignJWT({sessionId, type: 'temp'})
    .setProtectedHeader({alg: 'HS256'})
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(new TextEncoder().encode(secret));

  const response = NextResponse.redirect(String(authorizeUrl));
  response.cookies.set(CookieConfig.TEMP_SESSION_COOKIE_NAME, tempSession, {
    httpOnly: true,
    maxAge: 15 * 60,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
  return response;
}
