import { revalidatePath } from "next/cache";
import { KeyRound, ShieldCheck, TriangleAlert } from "lucide-react";
import { requireRole } from "@/lib/auth";
import {
  MIN_ADMIN_PASSWORD_LENGTH,
  readAdminCredential,
  setAdminCredential,
} from "@/lib/admin-credentials";
import { checkAdminPassword } from "@/lib/admin-session";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const inputCls =
  "h-10 w-full rounded-xl border border-surface-border bg-input/80 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/**
 * The owner's own login settings.
 *
 * Until this page existed the /admin password could only be changed by editing
 * the ADMIN_PASSWORD environment variable in Vercel and redeploying. Saving
 * here writes an AdminCredential row, which takes precedence over the env var
 * from the next sign-in onward.
 */
export default async function AdminAccountPage() {
  await requireRole(["ultimate_admin", "admin"]);
  const { credential, status } = await readAdminCredential();

  const envEmail = (process.env.ADMIN_EMAIL ?? "").trim();
  const activeEmail = credential?.email ?? envEmail;
  const needsMigration = status === "no-table";
  const dbDown = status === "error" || status === "no-db";

  return (
    <div className="max-w-2xl space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">My Account</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The email and password you use to sign in to this dashboard.
        </p>
      </header>

      <section className="surface-card p-5">
        <div className="flex items-center gap-2">
          {status === "ok" ? (
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
          ) : (
            <TriangleAlert className="h-5 w-5 text-amber-400" />
          )}
          <h2 className="text-lg font-semibold">
            {status === "ok"
              ? "Signing in with your saved password"
              : "Signing in with the environment password"}
          </h2>
        </div>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex gap-2">
            <dt className="w-28 shrink-0 text-muted-foreground">Email</dt>
            <dd className="font-medium">{activeEmail || "not set"}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-28 shrink-0 text-muted-foreground">Password</dt>
            <dd className="font-medium">
              {status === "ok"
                ? `changed ${credential!.updatedAt.toLocaleDateString("en-CA")}`
                : "from ADMIN_PASSWORD"}
            </dd>
          </div>
        </dl>

        {status !== "ok" && (
          <p className="mt-4 rounded-xl border border-surface-border bg-surface/60 p-3 text-xs text-muted-foreground">
            {needsMigration ? (
              <>
                The credential table does not exist in this database yet. Run{" "}
                <code>npm run db:deploy</code> against it, then reload this
                page. Sign-in keeps working from <code>ADMIN_PASSWORD</code>{" "}
                until then.
              </>
            ) : dbDown ? (
              <>
                The database is unreachable, so sign-in is falling back to{" "}
                <code>ADMIN_PASSWORD</code>. Saving a new password will not work
                until the connection is restored.
              </>
            ) : (
              <>
                You have not set a password here yet, so sign-in still uses the{" "}
                <code>ADMIN_PASSWORD</code> environment variable. Save one below
                and it takes over immediately.
              </>
            )}
          </p>
        )}
      </section>

      <section className="surface-card p-5">
        <div className="flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Change email &amp; password</h2>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Enter the password you sign in with today to confirm it is you.
        </p>

        <form action={changeAdminCredential} className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium">
              Current password
            </label>
            <input
              name="currentPassword"
              type="password"
              required
              autoComplete="current-password"
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">
              Sign-in email
            </label>
            <input
              name="email"
              type="email"
              required
              defaultValue={activeEmail}
              autoComplete="username"
              className={inputCls}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium">
                New password
              </label>
              <input
                name="newPassword"
                type="password"
                required
                minLength={MIN_ADMIN_PASSWORD_LENGTH}
                autoComplete="new-password"
                placeholder={`At least ${MIN_ADMIN_PASSWORD_LENGTH} characters`}
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">
                Confirm new password
              </label>
              <input
                name="confirmPassword"
                type="password"
                required
                minLength={MIN_ADMIN_PASSWORD_LENGTH}
                autoComplete="new-password"
                className={inputCls}
              />
            </div>
          </div>
          <Button type="submit">Save new password</Button>
        </form>

        <div className="mt-5 space-y-2 border-t border-surface-border pt-4 text-xs text-muted-foreground">
          <p>
            Existing sign-ins on other devices stay valid after a change. To
            force everyone out, rotate <code>ADMIN_SESSION_SECRET</code> in
            Vercel.
          </p>
          <p>
            Keep <code>ADMIN_PASSWORD</code> set in Vercel. It is the way back
            in if the database is ever unreachable.
          </p>
        </div>
      </section>
    </div>
  );
}

/**
 * Verifies the CURRENT password through the same path the login route uses —
 * so it accepts either the stored credential or, on first change, the env
 * password — then writes the new one.
 */
async function changeAdminCredential(formData: FormData) {
  "use server";
  await requireRole(["ultimate_admin", "admin"]);

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const email = String(formData.get("email") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!(await checkAdminPassword(currentPassword))) {
    throw new Error("Current password is incorrect");
  }
  if (newPassword !== confirmPassword) {
    throw new Error("The two new passwords do not match");
  }
  if (newPassword === currentPassword) {
    throw new Error("The new password must be different from the current one");
  }

  // Throws with a readable message on validation failure.
  await setAdminCredential(email, newPassword);

  revalidatePath("/admin/account");
}
