"use client";

import { useActionState, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Loader2,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { suggestPassword } from "@/lib/password-suggest";

export type SignInRow = {
  id: string;
  email: string;
  isOwner: boolean;
  updatedAt: string;
};

/** What every sign-in server action hands back to the form. */
export type ActionState = { ok: boolean; message: string } | null;

export type SignInAction = (
  prev: ActionState,
  formData: FormData
) => Promise<ActionState>;

const inputCls =
  "h-10 w-full rounded-xl border border-surface-border bg-input/80 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/**
 * The whole "who can open this dashboard" surface: the list of sign-ins,
 * an add form, a password reset per account, and removal.
 *
 * Every action is a server action that RETURNS a message rather than
 * throwing — throwing from a server action drops the owner on a Next.js
 * error screen, which is a terrible thing to hit while locked out.
 */
export function SignInsManager({
  accounts,
  minPasswordLength,
  addAction,
  passwordAction,
  emailAction,
  removeAction,
}: {
  accounts: SignInRow[];
  minPasswordLength: number;
  addAction: SignInAction;
  passwordAction: SignInAction;
  emailAction: SignInAction;
  removeAction: SignInAction;
}) {
  return (
    <div className="space-y-6">
      <AddAdminCard
        addAction={addAction}
        minPasswordLength={minPasswordLength}
      />

      <section className="surface-card p-5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">
            Who can open this dashboard
          </h2>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {accounts.length === 0
            ? "No sign-ins saved yet. Add one above — until then only the recovery login works."
            : "Every account below has the same full access. Anyone here can add, reset, or remove anyone else."}
        </p>

        <ul className="mt-4 space-y-3">
          {accounts.map((a) => (
            <SignInCard
              key={a.id}
              account={a}
              canRemove={accounts.length > 1}
              minPasswordLength={minPasswordLength}
              passwordAction={passwordAction}
              emailAction={emailAction}
              removeAction={removeAction}
            />
          ))}
        </ul>
      </section>
    </div>
  );
}

function AddAdminCard({
  addAction,
  minPasswordLength,
}: {
  addAction: SignInAction;
  minPasswordLength: number;
}) {
  const [state, formAction, pending] = useActionState(addAction, null);
  const [password, setPassword] = useState("");

  return (
    <section className="surface-card p-5">
      <div className="flex items-center gap-2">
        <UserPlus className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Add an admin</h2>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Two fields and they&apos;re in. Send them the password over a channel
        you trust, and have them change it once they&apos;re signed in.
      </p>

      <form action={formAction} className="mt-4 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium" htmlFor="add-email">
              Their email
            </label>
            <input
              id="add-email"
              name="email"
              type="email"
              required
              autoComplete="off"
              placeholder="name@prestigeviewservices.ca"
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium" htmlFor="add-password">
              Their password
            </label>
            <div className="flex gap-2">
              <input
                id="add-password"
                name="password"
                type="text"
                required
                minLength={minPasswordLength}
                autoComplete="off"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={`At least ${minPasswordLength} characters`}
                className={`${inputCls} font-mono`}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                title="Generate a strong password"
                onClick={() => setPassword(suggestPassword())}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Shown in plain text so you can copy it once — it is stored
              hashed and can never be read back.
            </p>
          </div>
        </div>

        <Result state={state} />

        <Button type="submit" disabled={pending}>
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          Add admin
        </Button>
      </form>
    </section>
  );
}

function SignInCard({
  account,
  canRemove,
  minPasswordLength,
  passwordAction,
  emailAction,
  removeAction,
}: {
  account: SignInRow;
  canRemove: boolean;
  minPasswordLength: number;
  passwordAction: SignInAction;
  emailAction: SignInAction;
  removeAction: SignInAction;
}) {
  const [open, setOpen] = useState<null | "password" | "email">(null);

  return (
    <li className="rounded-xl border border-surface-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium">{account.email}</p>
          <p className="text-xs text-muted-foreground">
            {account.isOwner ? "Owner account" : "Admin"} · password updated{" "}
            {account.updatedAt}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setOpen(open === "password" ? null : "password")}
          >
            <KeyRound className="h-3.5 w-3.5" />
            Reset password
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setOpen(open === "email" ? null : "email")}
          >
            Change email
          </Button>
          {canRemove && (
            <RemoveForm account={account} removeAction={removeAction} />
          )}
        </div>
      </div>

      {open === "password" && (
        <ResetPasswordForm
          account={account}
          minPasswordLength={minPasswordLength}
          passwordAction={passwordAction}
        />
      )}
      {open === "email" && (
        <ChangeEmailForm account={account} emailAction={emailAction} />
      )}
    </li>
  );
}

function ResetPasswordForm({
  account,
  minPasswordLength,
  passwordAction,
}: {
  account: SignInRow;
  minPasswordLength: number;
  passwordAction: SignInAction;
}) {
  const [state, formAction, pending] = useActionState(passwordAction, null);
  const [password, setPassword] = useState("");

  return (
    <form action={formAction} className="mt-4 space-y-3 border-t border-surface-border pt-4">
      <input type="hidden" name="id" value={account.id} />
      <label className="block text-xs font-medium">
        New password for {account.email}
      </label>
      <div className="flex gap-2">
        <input
          name="password"
          type="text"
          required
          minLength={minPasswordLength}
          autoComplete="off"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={`At least ${minPasswordLength} characters`}
          className={`${inputCls} font-mono`}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          title="Generate a strong password"
          onClick={() => setPassword(suggestPassword())}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
      <Result state={state} />
      <Button type="submit" size="sm" disabled={pending}>
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        Save password
      </Button>
    </form>
  );
}

function ChangeEmailForm({
  account,
  emailAction,
}: {
  account: SignInRow;
  emailAction: SignInAction;
}) {
  const [state, formAction, pending] = useActionState(emailAction, null);

  return (
    <form action={formAction} className="mt-4 space-y-3 border-t border-surface-border pt-4">
      <input type="hidden" name="id" value={account.id} />
      <label className="block text-xs font-medium">Sign-in email</label>
      <input
        name="email"
        type="email"
        required
        defaultValue={account.email}
        autoComplete="off"
        className={inputCls}
      />
      <Result state={state} />
      <Button type="submit" size="sm" disabled={pending}>
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        Save email
      </Button>
    </form>
  );
}

function RemoveForm({
  account,
  removeAction,
}: {
  account: SignInRow;
  removeAction: SignInAction;
}) {
  const [state, formAction, pending] = useActionState(removeAction, null);

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (
          !window.confirm(
            `Remove ${account.email}? They lose dashboard access immediately.`
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={account.id} />
      <Button
        type="submit"
        variant="outline"
        size="sm"
        disabled={pending}
        className="text-rose-300 hover:text-rose-200"
      >
        {pending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Trash2 className="h-3.5 w-3.5" />
        )}
        Remove
      </Button>
      {state && !state.ok && (
        <p className="mt-1 text-xs text-rose-300">{state.message}</p>
      )}
    </form>
  );
}

/** Inline success/failure line shared by every form above. */
function Result({ state }: { state: ActionState }) {
  if (!state) return null;
  return (
    <p
      className={`flex items-start gap-2 rounded-xl border p-3 text-xs ${
        state.ok
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
          : "border-rose-500/30 bg-rose-500/10 text-rose-100"
      }`}
    >
      {state.ok ? (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
      ) : (
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      )}
      <span>{state.message}</span>
    </p>
  );
}
