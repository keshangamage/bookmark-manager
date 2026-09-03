import {asgardeoMiddleware} from '@asgardeo/nextjs/middleware';

// Completes the OIDC redirect and refreshes tokens.
// Next.js 16 renamed middleware.ts to proxy.ts.
export default asgardeoMiddleware();

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
