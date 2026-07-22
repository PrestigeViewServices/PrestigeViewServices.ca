import { NextResponse, type NextRequest } from "next/server";
import {
  clerkMiddleware,
  createRouteMatcher,
} from "@clerk/nextjs/server";
import {
  parseRole,
  canReachAdmin,
  canManagePhotos,
  isUltimateAdmin,
  canManageAdminGeneral,
  canCanvass,
  type Role,
} from "@/lib/roles";

/**
 * Route protection model:
 *
 *   /admin                  → admin family (admin, super_admin, ultimate_admin)
 *   /admin/applications     → admin family (hiring management)
 *   /admin/support          → admin + ultimate_admin only (super_admin excluded)
 *   /admin/loyalty          → admin + ultimate_admin only (billing — super_admin excluded)
 *   /admin/users            → ultimate_admin only (role changes)
 *   /admin/site             → ultimate_admin only (top-level CMS surface)
 *   /admin/site/photos      → ultimate_admin + super_admin (photo management)
 *   /portal                 → employee only
 *   /account                → customer only
 *   /post-sign-in           → any signed-in user (role-router)
 *
 * Mismatched roles bounce to /post-sign-in — users can never URL-guess
 * into the wrong portal.
 *
 * Clerk runs in **keyless mode** when env vars are absent: it auto-generates
 * temporary keys so sign-in works immediately. A "Configure your application"
 * prompt appears in the Clerk UI to claim the app for production.
 */

const isAdminRoute = createRouteMatcher(["/admin(.*)"]);
const isPhotoRoute = createRouteMatcher(["/admin/site/photos(.*)"]);
const isUltimateAdminRoute = createRouteMatcher([
  "/admin/users(.*)",
  "/admin/site",
]);
const isAdminGeneralRoute = createRouteMatcher([
  "/admin/support(.*)",
  "/admin/loyalty(.*)",
]);
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
    isAdminRoute(req) ||
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

  if (isPhotoRoute(req)) {
    if (!canManagePhotos(role)) return bounceToPostSignIn(req.url);
    return;
  }
  if (isUltimateAdminRoute(req)) {
    if (!isUltimateAdmin(role)) return bounceToPostSignIn(req.url);
    return;
  }
  if (isAdminGeneralRoute(req)) {
    if (!canManageAdminGeneral(role)) return bounceToPostSignIn(req.url);
    return;
  }
  if (isAdminRoute(req)) {
    if (!canReachAdmin(role)) return bounceToPostSignIn(req.url);
    return;
  }
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
