import { Gift, Users } from "lucide-react";
import { getDb } from "@/lib/db";
import { getMember } from "@/lib/customer-auth";
import { POINTS, generateReferralCode } from "@/lib/loyalty";
import { ShareButtons } from "@/components/account/share-buttons";
import { siteConfig } from "@/lib/site";

export const dynamic = "force-dynamic";

const REF_STATUS_META: Record<string, { label: string; cls: string }> = {
  INVITED: {
    label: "Invited",
    cls: "bg-slate-500/15 text-slate-200 border-slate-500/25",
  },
  BOOKED: {
    label: "Booked",
    cls: "bg-blue-500/15 text-blue-300 border-blue-500/25",
  },
  COMPLETED: {
    label: "First service done",
    cls: "bg-amber-500/15 text-amber-200 border-amber-500/25",
  },
  AWARDED: {
    label: "Points awarded",
    cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
  },
};

/** Mask the friend's email in the member-facing list. */
function maskEmail(email: string | null): string {
  if (!email) return "A friend";
  const [user, domain] = email.split("@");
  if (!domain) return "A friend";
  const visible = user.slice(0, 2);
  return `${visible}${"•".repeat(Math.max(2, user.length - 2))}@${domain}`;
}

export default async function ReferralsPage() {
  const member = await getMember();
  if (!member) return null;
  const db = getDb();
  if (!db) return null;

  // Generate the shareable code on first visit (retry on the rare collision).
  let code = member.referralCode;
  if (!code) {
    for (let attempt = 0; attempt < 5 && !code; attempt++) {
      const candidate = generateReferralCode(member.firstName);
      try {
        await db.member.update({
          where: { id: member.id },
          data: { referralCode: candidate },
        });
        code = candidate;
      } catch {
        // unique collision — try again
      }
    }
  }
  if (!code) return null;

  const referrals = await db.referral.findMany({
    where: { referrerId: member.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const url = `${siteConfig.url}/r/${code}`;
  const shareMessage = `PVS handles our windows/lawn/snow and they're great — use my link and you get $25 off your first service:`;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Refer a friend
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          They get $25 off their first service. You get{" "}
          {POINTS.REFERRAL} points when it&apos;s completed and paid.
        </p>
      </header>

      {/* ---- Share card ---- */}
      <section className="surface-card p-5 sm:p-7">
        <div className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Your referral link</h2>
        </div>
        <div className="mt-4 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3">
          <p className="break-all font-mono text-sm">{url}</p>
        </div>
        <div className="mt-4">
          <ShareButtons url={url} message={shareMessage} />
        </div>
        <ol className="mt-5 grid gap-2 border-t border-surface-border pt-4 text-xs text-muted-foreground sm:grid-cols-3">
          <li>
            <span className="font-semibold text-foreground">1.</span> Share
            your link with a neighbour or friend.
          </li>
          <li>
            <span className="font-semibold text-foreground">2.</span> They
            request a quote through it and get $25 off their first service.
          </li>
          <li>
            <span className="font-semibold text-foreground">3.</span> Once
            their first service is completed and paid,{" "}
            {POINTS.REFERRAL} points land in your ledger.
          </li>
        </ol>
      </section>

      {/* ---- Referral list ---- */}
      <section>
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Your referrals</h2>
        </div>
        {referrals.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No referrals yet. Petawawa talks, one share usually does it.
          </p>
        ) : (
          <div className="mt-3 surface-card divide-y divide-surface-border">
            {referrals.map((r) => {
              const meta = REF_STATUS_META[r.status] ?? REF_STATUS_META.INVITED;
              return (
                <div
                  key={r.id}
                  className="flex items-center justify-between gap-3 px-5 py-3 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {maskEmail(r.referredEmail)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {r.createdAt.toLocaleDateString("en-CA")}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium ${meta.cls}`}
                  >
                    {meta.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
