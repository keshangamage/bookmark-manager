import {asgardeoMiddleware, createRouteMatcher} from '@asgardeo/nextjs/middleware';

const isProtectedRoute = createRouteMatcher(['/dashboard(.*)']);

// Completes the OIDC redirect and refreshes tokens.
// Next.js 16 renamed middleware.ts to proxy.ts.
export default asgardeoMiddleware(async (asgardeo, req) => {
  if (isProtectedRoute(req)) {
    return asgardeo.protectRoute();
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
