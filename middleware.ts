import { NextResponse, type NextRequest } from "next/server";
import {
  clerkMiddleware,
  createRouteMatcher,
} from "@clerk/nextjs/server";
import { parseRole, canCanvass, type Role } from "@/lib/roles";

/**
 * Route protection model:
 *
 *   /admin(.*)   → INTERNAL password auth, not Clerk. The admin layout
 *                  (app/admin/layout.tsx) verifies the signed session cookie
 *                  server-side and renders the login screen when absent, and
 *                  every admin page/action still calls requireRole(), which
 *                  resolves the internal cookie to `ultimate_admin`
 *                  (lib/auth.ts). Middleware deliberately leaves /admin alone.
 *   /portal      → employee only (Clerk)
 *   /rep         → canvassing roles (Clerk)
 *   /account     → customer only (Clerk)
 *   /post-sign-in→ any signed-in Clerk user (role-router)
 *
 * Clerk runs in **keyless mode** when env vars are absent: it auto-generates
 * temporary keys so sign-in works immediately.
 */

const isPortalRoute = createRouteMatcher(["/portal(.*)"]);
const isRepRoute = createRouteMatcher(["/rep(.*)"]);
const isAccountRoute = createRouteMatcher(["/account(.*)"]);
const isPostSignInRoute = createRouteMatcher(["/post-sign-in"]);

function bounceToPostSignIn(reqUrl: string) {
  return NextResponse.redirect(new URL("/post-sign-in", reqUrl));
}

const CLERK_CONFIGURED = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const passthrough = (_req: NextRequest) => NextResponse.next();

export default CLERK_CONFIGURED
  ? clerkMiddleware(async (auth, req) => {
  const gated =
    isPortalRoute(req) ||
    isRepRoute(req) ||
    isAccountRoute(req) ||
    isPostSignInRoute(req);
  if (!gated) return;

  const { userId, sessionClaims, redirectToSignIn } = await auth();
  if (!userId) return redirectToSignIn({ returnBackUrl: req.url });

  // /post-sign-in is the central role-router — anyone signed in may hit it.
  if (isPostSignInRoute(req)) return;

  const claimRole = (
    sessionClaims as { publicMetadata?: { role?: unknown } } | null
  )?.publicMetadata?.role;
  const role: Role = parseRole(claimRole) ?? "customer";

  if (isPortalRoute(req)) {
    if (role !== "employee") return bounceToPostSignIn(req.url);
    return;
  }
  if (isRepRoute(req)) {
    if (!canCanvass(role)) return bounceToPostSignIn(req.url);
    return;
  }
  if (isAccountRoute(req)) {
    if (role !== "customer") return bounceToPostSignIn(req.url);
    return;
  }
})
  : passthrough;

export const config = {
  // Includes /__clerk/(.*) so keyless mode's internal endpoints reach
  // clerkMiddleware.
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
