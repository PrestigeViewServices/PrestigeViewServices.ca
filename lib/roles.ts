/**
 * Phase-1 role model + per-role capability helpers.
 *
 * Roles, from most to least privileged:
 *   ultimate_admin  - all access, only role that can change other users' roles
 *   super_admin     - can manage gallery photos + hiring status, NOTHING else
 *   admin           - manage applications, support, loyalty, users (read-only)
 *   employee        - employee portal only
 *   customer        - customer account area only
 *
 * Single source of truth: Clerk's publicMetadata.role (mirrored to Postgres).
 * UI never sets ultimate_admin; that's env-allowlisted only.
 *
 * The capability helpers (canManagePhotos, canManageHiring, etc.) are how
 * pages and components decide what to show. NEVER inline string comparisons
 * in callers — use these helpers so the matrix lives in one place.
 */
export const ROLES = [
  "ultimate_admin",
  "super_admin",
  "admin",
  "manager",
  "employee",
  "rep",
  "customer",
] as const;

export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  ultimate_admin: "Ultimate Admin",
  super_admin: "Super Admin",
  admin: "Admin",
  manager: "Manager",
  employee: "Employee",
  rep: "Sales Rep",
  customer: "Customer",
};

/** Roles ultimate_admin can assign via the Users view. */
export const ULTIMATE_ADMIN_ASSIGNABLE_ROLES: Role[] = [
  "ultimate_admin",
  "super_admin",
  "admin",
  "manager",
  "employee",
  "rep",
  "customer",
];

// ---- Capability helpers ----------------------------------------------------

/** Roles allowed to reach /admin (overview + admin shell). */
export function canReachAdmin(role: Role | null | undefined): boolean {
  return (
    role === "ultimate_admin" ||
    role === "admin" ||
    role === "super_admin" ||
    role === "manager"
  );
}

/** Roles allowed to run field ops: pipeline, dispatch, accounts, jobs. */
export function canDispatch(role: Role | null | undefined): boolean {
  return (
    role === "ultimate_admin" || role === "admin" || role === "manager"
  );
}

/**
 * Roles allowed to EDIT finance (invoices, AR actions). Managers run ops but
 * cannot touch money — only the owner tier can. super_admin is ops-narrow and
 * also excluded.
 */
export function canEditFinance(role: Role | null | undefined): boolean {
  return role === "ultimate_admin" || role === "admin";
}

/** Roles allowed to view + change application hiring status. */
export function canManageHiring(role: Role | null | undefined): boolean {
  return (
    role === "ultimate_admin" ||
    role === "admin" ||
    role === "super_admin"
  );
}

/** Roles allowed to upload + remove site gallery photos. */
export function canManagePhotos(role: Role | null | undefined): boolean {
  return role === "ultimate_admin" || role === "super_admin";
}

/** Roles allowed to view (read-only) the Users view. */
export function canViewUsers(role: Role | null | undefined): boolean {
  return role === "ultimate_admin" || role === "admin";
}

/** Only ultimate_admin can change roles or hit the top-level Site Modifications surface. */
export function isUltimateAdmin(role: Role | null | undefined): boolean {
  return role === "ultimate_admin";
}

/** Roles allowed to see Support and Loyalty (admin-style management features). */
export function canManageAdminGeneral(role: Role | null | undefined): boolean {
  // super_admin is intentionally OUT — they're a focused role for photos + hiring only.
  return role === "ultimate_admin" || role === "admin";
}

/** Convenience for "is in the admin family" — used by the redirect router. */
export function isAdminLike(role: Role | null | undefined): boolean {
  return canReachAdmin(role);
}

/**
 * Roles allowed into the /rep canvassing app. Reps live there; the ops tier
 * can also open it (useful for testing routes and covering shifts).
 */
export function canCanvass(role: Role | null | undefined): boolean {
  return (
    role === "rep" ||
    role === "manager" ||
    role === "admin" ||
    role === "ultimate_admin"
  );
}

/** Roles allowed to see the admin Canvassing dashboard (live rep map, stats). */
export function canViewCanvassing(role: Role | null | undefined): boolean {
  return canDispatch(role);
}

// ---- Misc ------------------------------------------------------------------

export function parseRole(value: unknown): Role | null {
  if (typeof value !== "string") return null;
  return (ROLES as readonly string[]).includes(value)
    ? (value as Role)
    : null;
}

export function ultimateAdminEmails(): string[] {
  return (process.env.ULTIMATE_ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function isUltimateAdminEmail(
  email: string | null | undefined
): boolean {
  if (!email) return false;
  return ultimateAdminEmails().includes(email.trim().toLowerCase());
}

/** Where this role belongs after sign-in. Used by /post-sign-in. */
export function homePathForRole(role: Role): string {
  switch (role) {
    case "customer":
      return "/account";
    case "employee":
      return "/portal";
    case "rep":
      return "/rep";
    case "manager":
    case "admin":
    case "super_admin":
    case "ultimate_admin":
      return "/admin";
  }
}
