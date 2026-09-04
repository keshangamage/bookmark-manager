import {startAuthorization} from '@/lib/start-oidc';

// A server redirect rather than the SDK's client-side router.push, which fetches
// an RSC payload from Asgardeo, fails CORS, and repeats the whole handshake.
export async function GET() {
  return startAuthorization();
}
