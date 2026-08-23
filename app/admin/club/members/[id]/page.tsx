import Link from "next/link";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ArrowLeft, KeyRound, Link2, Medal, PlusCircle, UserCog } from "lucide-react";
import { getDb } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import {
  CATEGORY_LABELS,
  formatCents,
  formatPoints,
  pointsBalance,
  recalcTier,
  tierDef,
} from "@/lib/loyalty";
import { hashPassword } from "@/lib/customer-auth";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = ["ultimate_admin", "super_admin", "admin", "manager"] as const;

const inputCls =
  "h-10 w-full rounded-xl border border-surface-border bg-input/80 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

type Params = { id: string };

/** Member lookup: profile, ledger, service records, points adjustments,
 * Jobber link, veteran verification. Adjustments create ledger entries —
 * history is never edited. */
export default async function ClubMemberPage(props: {
  params: Promise<Params>;
}) {
  const params = await props.params;
  await requireRole([...ADMIN_ROLES]);
  const db = getDb();
  if (!db) return null;

  const member = await db.member.findUnique({
    where: { id: params.id },
    include: {
      profile: true,
      points: { orderBy: { createdAt: "desc" }, take: 100 },
      serviceRecords: { orderBy: { serviceDate: "desc" }, take: 50 },
      tickets: { orderBy: { updatedAt: "desc" }, take: 10 },
    },
  });
  if (!member) notFound();

  const balance = await pointsBalance(db, member.id);
  const tier = tierDef(member.profile?.tier ?? "MEMBER");

  return (
    <div className="space-y-8">
      <Link
        href="/admin/club"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        All members
      </Link>

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {member.firstName} {member.lastName ?? ""}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {member.email}
            {member.phone ? ` · ${member.phone}` : ""} · joined{" "}
            {member.createdAt.toLocaleDateString("en-CA")}
          </p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold tabular-nums">
            {formatPoints(balance)} pts
          </p>
          <p className="text-xs text-muted-foreground">
            {tier.name} · {formatCents(member.profile?.tierSpend12moCents ?? 0)}{" "}
            paid / 12mo
          </p>
        </div>
      </header>

      {member.passwordHash === "" && member.inviteToken && (
        <div className="rounded-2xl border border-blue-500/25 bg-blue-500/10 p-4 text-sm">
          <p className="font-semibold">Unclaimed account (Jobber import)</p>
          <p className="mt-1 text-xs text-muted-foreground">
            This customer hasn&apos;t set a password yet. Share their personal
            claim link, or they can simply sign up at /account with this
            email:
          </p>
          <p className="mt-2 break-all rounded-lg bg-surface/70 px-3 py-2 font-mono text-xs">
            {`${process.env.NEXT_PUBLIC_SITE_URL ?? "https://prestigeviewservices.ca"}/claim/${member.inviteToken}`}
          </p>
        </div>
      )}

      {member.profile?.veteranStatus === "SELF_DECLARED" && (
        <form
          action={verifyVeteran}
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sky-400/25 bg-sky-500/5 p-4"
        >
          <input type="hidden" name="memberId" value={member.id} />
          <p className="flex items-center gap-2 text-sm">
            <Medal className="h-4 w-4 text-sky-400" />
            Self-declared military / veteran / first responder, verify on
            first service.
          </p>
          <Button type="submit" size="sm" variant="outline">
            Mark verified
          </Button>
        </form>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ---- Points adjustment ---- */}
        <section className="surface-card p-5">
          <div className="flex items-center gap-2">
            <PlusCircle className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Adjust points</h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Creates a ledger entry (positive or negative). History is never
            edited or deleted.
          </p>
          <form action={adjustPoints} className="mt-4 space-y-3">
            <input type="hidden" name="memberId" value={member.id} />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium">
                  Points (+/−)
                </label>
                <input
                  name="amount"
                  type="number"
                  required
                  step={1}
                  min={-100000}
                  max={100000}
                  placeholder="e.g. 250 or -100"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Type</label>
                <select name="type" defaultValue="ADMIN_ADJUST" className={inputCls}>
                  <option value="ADMIN_ADJUST">Adjustment</option>
                  <option value="EARN_REVIEW">Review bonus</option>
                  <option value="EARN_REFERRAL">Referral bonus</option>
                  <option value="EARN_CROSS_CATEGORY">
                    Cross-category bonus
                  </option>
                  <option value="EARN_SNOW_EARLYBIRD">
                    Snow early-bird
                  </option>
                  <option value="EARN_BIRTHDAY">Birthday bonus</option>
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">
                Reason (shown in the customer&apos;s ledger)
              </label>
              <input
                name="note"
                required
                maxLength={140}
                placeholder="e.g. Verified Google review"
                className={inputCls}
              />
            </div>
            <Button type="submit" size="sm">
              Post ledger entry
            </Button>
          </form>
        </section>

        {/* ---- Jobber link ---- */}
        <section className="surface-card p-5">
          <div className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Jobber link</h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {member.profile?.jobberClientId
              ? `Linked to Jobber client ${member.profile.jobberClientId}.`
              : "Not linked. Paste the Jobber client ID to connect service history when emails don't match."}
          </p>
          <form action={linkJobber} className="mt-4 flex gap-2">
            <input type="hidden" name="memberId" value={member.id} />
            <input
              name="jobberClientId"
              defaultValue={member.profile?.jobberClientId ?? ""}
              placeholder="Jobber client ID"
              className={inputCls}
            />
            <Button type="submit" size="sm" variant="outline" className="shrink-0">
              Save link
            </Button>
          </form>
          <div className="mt-5 border-t border-surface-border pt-4 text-sm">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Profile
            </p>
            <p className="mt-2">
              {[
                member.profile?.streetAddress,
                member.profile?.city,
                member.profile?.postalCode,
              ]
                .filter(Boolean)
                .join(", ") || "No address on file"}
            </p>
            <p className="mt-1 text-muted-foreground">
              Birthday month:{" "}
              {member.profile?.birthdayMonth
                ? new Date(2000, member.profile.birthdayMonth - 1).toLocaleString(
                    "en-CA",
                    { month: "long" }
                  )
                : "not set"}{" "}
              · Veteran: {member.profile?.veteranStatus.toLowerCase().replace("_", " ")}
            </p>
          </div>
        </section>
      </div>

      {/* ---- Account details ---- */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="surface-card p-5">
          <div className="flex items-center gap-2">
            <UserCog className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Account details</h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Correct a contact detail or address. Changing the email also
            changes the address this customer signs in with.
          </p>
          <form action={updateAccount} className="mt-4 space-y-3">
            <input type="hidden" name="memberId" value={member.id} />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium">
                  First name
                </label>
                <input
                  name="firstName"
                  defaultValue={member.firstName}
                  required
                  className={inputCls}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">
                  Last name
                </label>
                <input
                  name="lastName"
                  defaultValue={member.lastName ?? ""}
                  className={inputCls}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium">Email</label>
                <input
                  name="email"
                  type="email"
                  defaultValue={member.email}
                  required
                  className={inputCls}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Phone</label>
                <input
                  name="phone"
                  defaultValue={member.phone ?? ""}
                  className={inputCls}
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">
                Street address
              </label>
              <input
                name="streetAddress"
                defaultValue={member.profile?.streetAddress ?? ""}
                className={inputCls}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium">City</label>
                <input
                  name="city"
                  defaultValue={member.profile?.city ?? ""}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">
                  Province
                </label>
                <input
                  name="region"
                  defaultValue={member.profile?.region ?? "ON"}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">
                  Postal code
                </label>
                <input
                  name="postalCode"
                  defaultValue={member.profile?.postalCode ?? ""}
                  className={inputCls}
                />
              </div>
            </div>
            <Button type="submit" size="sm">
              Save changes
            </Button>
          </form>
        </section>

        <section className="surface-card p-5">
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Password</h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Sets a new password immediately, for when a customer is locked out
            and calls in. Read it to them once and tell them to change it from
            their own account page. It is never stored or shown again.
          </p>
          <form action={setMemberPassword} className="mt-4 space-y-3">
            <input type="hidden" name="memberId" value={member.id} />
            <div>
              <label className="mb-1 block text-xs font-medium">
                New password
              </label>
              <input
                name="password"
                type="text"
                required
                minLength={8}
                maxLength={72}
                autoComplete="off"
                placeholder="At least 8 characters"
                className={inputCls}
              />
            </div>
            <Button type="submit" size="sm" variant="outline">
              Set password
            </Button>
          </form>
          <p className="mt-4 border-t border-surface-border pt-3 text-xs text-muted-foreground">
            Status:{" "}
            <span className="font-medium text-foreground">
              {member.passwordHash === ""
                ? "No password set, account is unclaimed"
                : "Password on file"}
            </span>
          </p>
        </section>
      </div>

      {/* ---- Service records ---- */}
      <section>
        <h2 className="text-lg font-semibold">Service records</h2>
        <div className="mt-3 surface-card divide-y divide-surface-border">
          {member.serviceRecords.length === 0 && (
            <p className="p-5 text-sm text-muted-foreground">
              No service records linked yet.
            </p>
          )}
          {member.serviceRecords.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between gap-3 px-5 py-3 text-sm"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{r.title}</p>
                <p className="text-xs text-muted-foreground">
                  {CATEGORY_LABELS[r.category]} ·{" "}
                  {r.serviceDate.toLocaleDateString("en-CA")} · {r.status}
                  {r.pointsAwarded ? " · points posted" : ""}
                </p>
              </div>
              <span className="shrink-0 tabular-nums">
                {formatCents(r.amountCents)}
                <span
                  className={`ml-2 text-xs ${r.paid ? "text-emerald-300" : "text-amber-200"}`}
                >
                  {r.paid ? "paid" : "unpaid"}
                </span>
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ---- Ledger ---- */}
      <section>
        <h2 className="text-lg font-semibold">Points ledger</h2>
        <div className="mt-3 surface-card divide-y divide-surface-border">
          {member.points.length === 0 && (
            <p className="p-5 text-sm text-muted-foreground">
              No ledger entries.
            </p>
          )}
          {member.points.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between gap-3 px-5 py-3 text-sm"
            >
              <div className="min-w-0">
                <p className="truncate">{tx.note ?? tx.type}</p>
                <p className="text-xs text-muted-foreground">
                  {tx.type} · {tx.createdAt.toLocaleString("en-CA")}
                </p>
              </div>
              <span
                className={`shrink-0 font-bold tabular-nums ${
                  tx.amount >= 0 ? "text-emerald-300" : "text-rose-300"
                }`}
              >
                {tx.amount >= 0 ? "+" : ""}
                {formatPoints(tx.amount)}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// --- server actions ---------------------------------------------------------

const ADJUST_TYPES = [
  "ADMIN_ADJUST",
  "EARN_REVIEW",
  "EARN_REFERRAL",
  "EARN_CROSS_CATEGORY",
  "EARN_SNOW_EARLYBIRD",
  "EARN_BIRTHDAY",
] as const;

async function adjustPoints(formData: FormData) {
  "use server";
  await requireRole([...ADMIN_ROLES]);
  const db = getDb();
  if (!db) throw new Error("DB not configured");

  const memberId = String(formData.get("memberId") ?? "");
  const amount = Math.trunc(Number(formData.get("amount")));
  const note = String(formData.get("note") ?? "").trim().slice(0, 140);
  const typeRaw = String(formData.get("type") ?? "ADMIN_ADJUST");
  const type = ADJUST_TYPES.includes(typeRaw as (typeof ADJUST_TYPES)[number])
    ? (typeRaw as (typeof ADJUST_TYPES)[number])
    : "ADMIN_ADJUST";

  if (!memberId || !Number.isFinite(amount) || amount === 0 || !note) {
    throw new Error("Amount and reason are required");
  }

  await db.pointsTransaction.create({
    data: { memberId, type, amount, note, sourceRef: "admin" },
  });
  revalidatePath(`/admin/club/members/${memberId}`);
  revalidatePath("/admin/club");
}

async function linkJobber(formData: FormData) {
  "use server";
  await requireRole([...ADMIN_ROLES]);
  const db = getDb();
  if (!db) throw new Error("DB not configured");

  const memberId = String(formData.get("memberId") ?? "");
  const jobberClientId = String(formData.get("jobberClientId") ?? "").trim();
  if (!memberId) return;

  await db.customerProfile.upsert({
    where: { memberId },
    create: { memberId, jobberClientId: jobberClientId || null },
    update: { jobberClientId: jobberClientId || null },
  });
  await recalcTier(db, memberId);
  revalidatePath(`/admin/club/members/${memberId}`);
}

async function verifyVeteran(formData: FormData) {
  "use server";
  await requireRole([...ADMIN_ROLES]);
  const db = getDb();
  if (!db) throw new Error("DB not configured");

  const memberId = String(formData.get("memberId") ?? "");
  if (!memberId) return;
  await db.customerProfile.updateMany({
    where: { memberId, veteranStatus: "SELF_DECLARED" },
    data: { veteranStatus: "VERIFIED" },
  });
  revalidatePath(`/admin/club/members/${memberId}`);
}

async function updateAccount(formData: FormData) {
  "use server";
  await requireRole([...ADMIN_ROLES]);
  const db = getDb();
  if (!db) throw new Error("DB not configured");

  const memberId = String(formData.get("memberId") ?? "");
  if (!memberId) return;

  const str = (k: string, max: number) =>
    String(formData.get(k) ?? "").trim().slice(0, max);
  const firstName = str("firstName", 80);
  const email = str("email", 160).toLowerCase();
  const lastName = str("lastName", 80);
  const phone = str("phone", 40);

  if (!firstName || !email) {
    throw new Error("First name and email are required");
  }

  // email is @unique — surface a readable message instead of a raw Prisma
  // P2002 when the address already belongs to a different member.
  const clash = await db.member.findUnique({
    where: { email },
    select: { id: true },
  });
  if (clash && clash.id !== memberId) {
    throw new Error(`Another member already uses ${email}`);
  }

  await db.member.update({
    where: { id: memberId },
    data: {
      firstName,
      lastName: lastName || null,
      email,
      phone: phone || null,
    },
  });

  const streetAddress = str("streetAddress", 200);
  const city = str("city", 80);
  const region = str("region", 40);
  const postalCode = str("postalCode", 20);
  await db.customerProfile.upsert({
    where: { memberId },
    create: {
      memberId,
      streetAddress: streetAddress || null,
      city: city || null,
      region: region || "ON",
      postalCode: postalCode || null,
    },
    update: {
      streetAddress: streetAddress || null,
      city: city || null,
      region: region || "ON",
      postalCode: postalCode || null,
    },
  });

  revalidatePath(`/admin/club/members/${memberId}`);
  revalidatePath("/admin/club");
}

/** Admin-set password for a locked-out customer. Hashed with the same
 * scrypt helper the customer signup path uses; the plaintext is never
 * stored, logged, or echoed back to the page. */
async function setMemberPassword(formData: FormData) {
  "use server";
  await requireRole([...ADMIN_ROLES]);
  const db = getDb();
  if (!db) throw new Error("DB not configured");

  const memberId = String(formData.get("memberId") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!memberId) return;
  if (password.length < 8 || password.length > 72) {
    throw new Error("Password must be 8-72 characters");
  }

  await db.member.update({
    where: { id: memberId },
    data: {
      passwordHash: await hashPassword(password),
      // Setting a password claims the account, so retire any invite link.
      inviteToken: null,
    },
  });
  revalidatePath(`/admin/club/members/${memberId}`);
}
