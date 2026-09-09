import { revalidatePath } from "next/cache";
import { LifeBuoy, TriangleAlert, Users } from "lucide-react";
import { requireRole } from "@/lib/auth";
import {
  ADMIN_CREDENTIAL_ID,
  MIN_ADMIN_PASSWORD_LENGTH,
  createAdminAccount,
  deleteAdminAccount,
  listAdminCredentials,
  setAdminAccountEmail,
  setAdminAccountPassword,
} from "@/lib/admin-credentials";
import { isRecoveryLoginConfigured } from "@/lib/admin-session";
import {
  SignInsManager,
  type ActionState,
  type SignInRow,
} from "@/components/admin/sign-ins-manager";

export const dynamic = "force-dynamic";

/**
 * Dashboard sign-ins.
 *
 * Any number of admins can exist, each with their own email and password,
 * created right here. They all get the SAME full access — there is no admin
 * hierarchy in this dashboard, so only add people you'd trust with the
 * whole business.
 *
 * Behind all of them sits the recovery login (ADMIN_EMAIL +
 * ADMIN_PASSWORD from the hosting environment), which always works. That is
 * the way back in if a password is forgotten or Postgres is unreachable.
 */
export default async function AdminAccountPage() {
  await requireRole(["ultimate_admin", "admin"]);
  const { accounts, status } = await listAdminCredentials();

  const envEmail = (process.env.ADMIN_EMAIL ?? "").trim();
  const needsMigration = status === "no-table";
  const dbDown = status === "error" || status === "no-db";
  const recoveryOn = isRecoveryLoginConfigured();

  const rows: SignInRow[] = accounts.map((a) => ({
    id: a.id,
    email: a.email,
    isOwner: a.id === ADMIN_CREDENTIAL_ID,
    updatedAt: a.updatedAt.toLocaleDateString("en-CA"),
  }));

  return (
    <div className="max-w-2xl space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Sign-ins</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The accounts that can open this dashboard. Add as many admins as you
          need — each gets their own email and password.
        </p>
      </header>

      {(needsMigration || dbDown) && (
        <p className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100/90">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          <span>
            {needsMigration ? (
              <>
                The admin sign-in table does not exist in this database yet, so
                admins cannot be saved. Run <code>npm run db:deploy</code>, then
                reload. Sign-in keeps working from the recovery login until
                then.
              </>
            ) : (
              <>
                The database is unreachable, so admins cannot be listed or
                saved right now. Sign-in is falling back to the recovery login.
              </>
            )}
          </span>
        </p>
      )}

      <SignInsManager
        accounts={rows}
        minPasswordLength={MIN_ADMIN_PASSWORD_LENGTH}
        addAction={addAdmin}
        passwordAction={resetAdminPassword}
        emailAction={changeAdminEmail}
        removeAction={removeAdmin}
      />

      <section className="surface-card p-5">
        <div className="flex items-center gap-2">
          <LifeBuoy className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Locked out? Recovery login</h2>
        </div>
        <div className="mt-3 space-y-2 text-sm text-muted-foreground">
          <p>
            Signing in with <code>ADMIN_EMAIL</code> and{" "}
            <code>ADMIN_PASSWORD</code> from the hosting environment always
            works, even when a password above is forgotten or the database is
            down. Keep both set in Vercel.
          </p>
          <p>
            Recovery login is currently{" "}
            {recoveryOn ? (
              <strong className="text-emerald-300">on</strong>
            ) : (
              <strong className="text-rose-300">
                off — ADMIN_PASSWORD is not set
              </strong>
            )}
            {envEmail ? (
              <>
                {" "}
                for <strong className="text-foreground">{envEmail}</strong>.
              </>
            ) : recoveryOn ? (
              <>
                {" "}
                for any email, because <code>ADMIN_EMAIL</code> is not set. Set
                it so the recovery password alone isn&apos;t enough.
              </>
            ) : (
              "."
            )}
          </p>
          <p>
            From a terminal with <code>DATABASE_URL</code> in{" "}
            <code>.env.local</code>, <code>npm run admin</code> lists, adds,
            resets, and removes these accounts without signing in at all.
          </p>
          <p>
            To force every device to sign in again, rotate{" "}
            <code>ADMIN_SESSION_SECRET</code> in Vercel.
          </p>
        </div>
      </section>

      <section className="surface-card p-5">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Before you add someone</h2>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          Every sign-in has full access: customer records, pricing, leads, site
          content, and this page. There are no read-only or limited admins yet,
          so treat adding an admin as handing over the keys, and remove people
          the day they stop needing access.
        </p>
      </section>
    </div>
  );
}

// ---- Server actions --------------------------------------------------------

/**
 * Every action RETURNS its outcome instead of throwing. A thrown server
 * action drops the owner on a Next.js error page, which is the last thing
 * anyone needs while sorting out dashboard access.
 */
async function guard(): Promise<void> {
  await requireRole(["ultimate_admin", "admin"]);
}

function failure(err: unknown): ActionState {
  return {
    ok: false,
    message:
      err instanceof Error ? err.message : "Something went wrong. Try again.",
  };
}

async function addAdmin(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  "use server";
  await guard();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  try {
    const created = await createAdminAccount(email, password);
    revalidatePath("/admin/account");
    return {
      ok: true,
      message: `${created.email} can now sign in. Send them the password, and have them reset it once they're in.`,
    };
  } catch (err) {
    return failure(err);
  }
}

async function resetAdminPassword(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  "use server";
  await guard();
  const id = String(formData.get("id") ?? "");
  const password = String(formData.get("password") ?? "");
  try {
    await setAdminAccountPassword(id, password);
    revalidatePath("/admin/account");
    return {
      ok: true,
      message:
        "Password saved. Sessions already open on other devices stay signed in — rotate ADMIN_SESSION_SECRET to end those too.",
    };
  } catch (err) {
    return failure(err);
  }
}

async function changeAdminEmail(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  "use server";
  await guard();
  const id = String(formData.get("id") ?? "");
  const email = String(formData.get("email") ?? "");
  try {
    await setAdminAccountEmail(id, email);
    revalidatePath("/admin/account");
    return { ok: true, message: `Sign-in email is now ${email.trim().toLowerCase()}.` };
  } catch (err) {
    return failure(err);
  }
}

async function removeAdmin(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  "use server";
  await guard();
  const id = String(formData.get("id") ?? "");
  try {
    await deleteAdminAccount(id);
    revalidatePath("/admin/account");
    return { ok: true, message: "Sign-in removed." };
  } catch (err) {
    return failure(err);
  }
}
