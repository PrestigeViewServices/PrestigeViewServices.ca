import { revalidatePath } from "next/cache";
import { KeyRound, ShieldCheck, TriangleAlert, Users } from "lucide-react";
import { requireRole } from "@/lib/auth";
import {
  ADMIN_CREDENTIAL_ID,
  MIN_ADMIN_PASSWORD_LENGTH,
  findAdminCredentialByEmail,
  listAdminCredentials,
  readAdminCredential,
  setAdminCredential,
} from "@/lib/admin-credentials";
import { checkAdminPassword } from "@/lib/admin-session";
import { verifyPassword } from "@/lib/customer-auth";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const inputCls =
  "h-10 w-full rounded-xl border border-surface-border bg-input/80 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/**
 * Dashboard sign-ins.
 *
 * Two accounts exist: the owner's, and the office account
 * (contact@prestigeviewservices.ca), which is provisioned automatically the
 * first time this page loads or that email signs in. Either password can be
 * changed here; changing one never touches the other. Both unlock the same
 * dashboard, so treat both passwords with the same care.
 */
export default async function AdminAccountPage() {
  await requireRole(["ultimate_admin", "admin"]);
  const [{ credential, status }, accounts] = await Promise.all([
    readAdminCredential(),
    listAdminCredentials(),
  ]);

  const envEmail = (process.env.ADMIN_EMAIL ?? "").trim();
  const ownerEmail = credential?.email ?? envEmail;
  const needsMigration = status === "no-table";
  const dbDown = status === "error" || status === "no-db";

  const rows =
    accounts.length > 0
      ? accounts
      : ownerEmail
        ? [
            {
              id: ADMIN_CREDENTIAL_ID,
              email: ownerEmail,
              passwordHash: "",
              updatedAt: new Date(),
            },
          ]
        : [];

  return (
    <div className="max-w-2xl space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Sign-ins</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The accounts that can open this dashboard, and where their passwords
          are changed.
        </p>
      </header>

      <section className="surface-card p-5">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Dashboard accounts</h2>
        </div>
        <ul className="mt-4 divide-y divide-surface-border text-sm">
          {rows.map((a) => (
            <li
              key={a.id}
              className="flex flex-wrap items-center justify-between gap-2 py-3"
            >
              <div>
                <p className="font-medium">{a.email}</p>
                <p className="text-xs text-muted-foreground">
                  {a.id === ADMIN_CREDENTIAL_ID
                    ? "Owner account"
                    : "Office account"}
                  {a.passwordHash
                    ? ` · password updated ${a.updatedAt.toLocaleDateString("en-CA")}`
                    : " · using the environment password"}
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
                <ShieldCheck className="h-3 w-3" />
                Full access
              </span>
            </li>
          ))}
          {rows.length === 0 && (
            <li className="py-3 text-muted-foreground">
              No accounts on record yet. Sign-in is using the{" "}
              <code>ADMIN_PASSWORD</code> environment variable.
            </li>
          )}
        </ul>

        {(needsMigration || dbDown) && (
          <p className="mt-4 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-100/90">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
            <span>
              {needsMigration ? (
                <>
                  The credential table does not exist in this database yet. Run{" "}
                  <code>npm run db:deploy</code>, then reload. Sign-in keeps
                  working from <code>ADMIN_PASSWORD</code> until then.
                </>
              ) : (
                <>
                  The database is unreachable, so sign-in is falling back to{" "}
                  <code>ADMIN_PASSWORD</code>. Password changes will not save
                  until the connection is restored.
                </>
              )}
            </span>
          </p>
        )}
      </section>

      <section className="surface-card p-5">
        <div className="flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Change a password</h2>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Enter the account&apos;s email and its current password to confirm it
          is you, then set the new one.
        </p>

        <form action={changeAdminCredential} className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium">
              Account email
            </label>
            <input
              name="email"
              type="email"
              required
              defaultValue={ownerEmail}
              autoComplete="username"
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">
              Current password for that account
            </label>
            <input
              name="currentPassword"
              type="password"
              required
              autoComplete="current-password"
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
 * Verifies the CURRENT password of the account named by email — through the
 * account's own stored hash, or the env fallback while the owner has no
 * stored credential yet — then writes the new one to that same account.
 */
async function changeAdminCredential(formData: FormData) {
  "use server";
  await requireRole(["ultimate_admin", "admin"]);

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const email = String(formData.get("email") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  const row = await findAdminCredentialByEmail(email);
  let accountId = ADMIN_CREDENTIAL_ID;
  let currentOk = false;
  if (row) {
    accountId = row.id;
    currentOk = await verifyPassword(currentPassword, row.passwordHash).catch(
      () => false
    );
  } else {
    // Owner without a stored credential yet — same env path as login.
    currentOk = await checkAdminPassword(currentPassword);
  }
  if (!currentOk) {
    throw new Error("Current password is incorrect");
  }
  if (newPassword !== confirmPassword) {
    throw new Error("The two new passwords do not match");
  }
  if (newPassword === currentPassword) {
    throw new Error("The new password must be different from the current one");
  }

  // Throws with a readable message on validation failure.
  await setAdminCredential(email, newPassword, accountId);

  revalidatePath("/admin/account");
}
