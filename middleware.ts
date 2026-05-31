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
 *   /post-sign-in           → any signed-in user (redirects to their portal)
 *
 * Mismatched roles get redirected to /post-sign-in which sends them to the
 * right portal for their actual role — users can never land on the wrong
 * portal by URL guessing.
 *
 * Pass-through when Clerk isn't configured so the marketing site still runs.
 */

const isAdminRoute = createRouteMatcher(["/admin(.*)"]);
const isPhotoRoute = createRouteMatcher(["/admin/site/photos(.*)"]);
const isUltimateAdminRoute = createRouteMatcher([
  "/admin/users(.*)",
  "/admin/site", // top-level site surface; photos handled separately
]);
const isAdminGeneralRoute = createRouteMatcher([
  "/admin/support(.*)",
  "/admin/loyalty(.*)",
]);
const isPortalRoute = createRouteMatcher(["/portal(.*)"]);
const isAccountRoute = createRouteMatcher(["/account(.*)"]);
const isPostSignInRoute = createRouteMatcher(["/post-sign-in"]);

const CLERK_CONFIGURED = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

const passthrough = (_req: NextRequest) => NextResponse.next();

function bounceToPostSignIn(req: NextRequest) {
  return NextResponse.redirect(new URL("/post-sign-in", req.url));
}

export default CLERK_CONFIGURED
  ? clerkMiddleware(async (auth, req) => {
      const gated =
        isAdminRoute(req) ||
        isPortalRoute(req) ||
        isAccountRoute(req) ||
        isPostSignInRoute(req);
      if (!gated) return;

      const { userId, sessionClaims, redirectToSignIn } = await auth();
      if (!userId) return redirectToSignIn({ returnBackUrl: req.url });

      const claimRole = (
        sessionClaims as { publicMetadata?: { role?: unknown } } | null
      )?.publicMetadata?.role;
      const role: Role = parseRole(claimRole) ?? "customer";

      // /post-sign-in is the central role-router. Anyone authenticated may hit it.
      if (isPostSignInRoute(req)) return;

      // Photo subroute first (overlaps with isUltimateAdminRoute /admin/site).
      if (isPhotoRoute(req)) {
        if (!canManagePhotos(role)) return bounceToPostSignIn(req);
        return;
      }

      // Top-level Site Modifications + Users: ultimate_admin only.
      if (isUltimateAdminRoute(req)) {
        if (!isUltimateAdmin(role)) return bounceToPostSignIn(req);
        return;
      }

      // Support + Loyalty: super_admin is intentionally blocked (focused role).
      if (isAdminGeneralRoute(req)) {
        if (!canManageAdminGeneral(role)) return bounceToPostSignIn(req);
        return;
      }

      // Generic /admin (overview, applications, etc): admin family.
      if (isAdminRoute(req)) {
        if (!canReachAdmin(role)) return bounceToPostSignIn(req);
        return;
      }

      if (isPortalRoute(req)) {
        if (role !== "employee") return bounceToPostSignIn(req);
        return;
      }

      if (isAccountRoute(req)) {
        if (role !== "customer") return bounceToPostSignIn(req);
        return;
      }
    })
  : passthrough;

export const config = {
  matcher: [
    "/((?!_next|images|favicon\\.ico|.*\\.(?:png|jpg|jpeg|webp|svg|gif|ico|css|js|map)$).*)",
    "/(api|trpc)(.*)",
  ],
};
