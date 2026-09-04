import {SILENT_SIGN_IN_COOKIE} from '@/lib/auth';
import {startAuthorization} from '@/lib/start-oidc';


export async function GET() {
  const response = await startAuthorization({prompt: 'none'});


  response.cookies.set(SILENT_SIGN_IN_COOKIE, '1', {
    httpOnly: true,
    maxAge: 10 * 60,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
  return response;
}
