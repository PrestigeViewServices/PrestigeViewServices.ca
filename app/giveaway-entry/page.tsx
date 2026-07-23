import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, Gift } from "lucide-react";
import { getDb } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Free Giveaway Entry | Prestige View Services",
  description:
    "Enter the current Prestige Club giveaway for free — no purchase necessary. Open to Ontario residents 18+.",
  alternates: { canonical: "/giveaway-entry" },
};

const inputCls =
  "h-11 w-full rounded-xl border border-surface-border bg-input/80 px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/**
 * NO-PURCHASE-NECESSARY entry form (Canadian contest compliance). Public,
 * free, no account needed. One entry per email per draw.
 */
export default async function GiveawayEntryPage(props: {
  searchParams: Promise<{ entered?: string }>;
}) {
  const searchParams = await props.searchParams;
  const db = getDb();
  const current = db
    ? await db.giveaway.findFirst({
        where: { status: "OPEN" },
        orderBy: { opensAt: "desc" },
      })
    : null;

  return (
    <section className="container-max flex min-h-[60vh] items-center py-14">
      <div className="mx-auto w-full max-w-lg">
        <p className="eyebrow text-primary">
          <Gift className="h-3.5 w-3.5" />
          The Prestige Club Giveaway
        </p>
        <h1 className="heading-section mt-2">Free entry, no purchase</h1>

        {searchParams.entered === "1" ? (
          <div className="surface-card mt-6 p-8 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-500/15 text-emerald-300">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-xl font-semibold">You&apos;re in!</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Your free entry is recorded. Winners are announced after the
              draw closes, watch your inbox. Good luck!
            </p>
          </div>
        ) : !current ? (
          <div className="surface-card mt-6 p-8">
            <p className="text-sm leading-relaxed text-muted-foreground">
              There&apos;s no draw open right now. Quarterly giveaways are
              announced on our social pages and inside{" "}
              <Link
                href="/account"
                className="font-medium text-primary hover:underline"
              >
                The Prestige Club portal
              </Link>
              , check back soon.
            </p>
          </div>
        ) : (
          <>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Current draw: <span className="font-semibold text-foreground">{current.title}</span>{" "}
              — prize: {current.prize}
              {current.closesAt &&
                `. Entries close ${current.closesAt.toLocaleDateString("en-CA", { month: "long", day: "numeric" })}`}
              . One free entry per person per draw, same odds per entry as any
              member entry. See the{" "}
              <Link
                href="/giveaway-rules"
                className="font-medium text-primary hover:underline"
              >
                official rules
              </Link>
              .
            </p>
            <form action={submitFreeEntry} className="surface-card mt-6 space-y-4 p-6">
              <input type="hidden" name="giveawayId" value={current.id} />
              {/* Honeypot */}
              <input
                type="text"
                name="hp"
                tabIndex={-1}
                aria-hidden="true"
                autoComplete="off"
                className="hidden"
              />
              <div>
                <label htmlFor="ge-name" className="mb-1.5 block text-sm font-medium">
                  Full name<span className="text-primary"> *</span>
                </label>
                <input id="ge-name" name="name" required maxLength={80} className={inputCls} />
              </div>
              <div>
                <label htmlFor="ge-email" className="mb-1.5 block text-sm font-medium">
                  Email<span className="text-primary"> *</span>
                </label>
                <input id="ge-email" name="email" type="email" required className={inputCls} />
              </div>
              <div>
                <label htmlFor="ge-town" className="mb-1.5 block text-sm font-medium">
                  Town<span className="text-primary"> *</span>
                </label>
                <input id="ge-town" name="town" required maxLength={60} placeholder="Petawawa" className={inputCls} />
              </div>
              <label className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  name="eligible"
                  required
                  className="mt-1 h-4 w-4 rounded border-surface-border accent-[#3B82F6]"
                />
                <span className="text-muted-foreground">
                  I confirm I am a resident of Ontario (not Quebec), 18 years
                  of age or older, and I agree to the official rules,
                  including answering a skill-testing question if selected.
                </span>
              </label>
              <Button type="submit" size="lg" className="w-full">
                Enter the draw, free
              </Button>
            </form>
          </>
        )}

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Questions? {siteConfig.phoneDisplay} · {siteConfig.email}
        </p>
      </div>
    </section>
  );
}

// --- server action ----------------------------------------------------------

async function submitFreeEntry(formData: FormData) {
  "use server";
  const db = getDb();
  if (!db) throw new Error("Unavailable");

  // Ballot-stuffing protection: entries are per-email deduped, but junk
  // rows still dilute nothing — cap the firehose anyway.
  const { headers } = await import("next/headers");
  const h = await headers();
  const ip =
    h.get("x-real-ip") ||
    (h.get("x-forwarded-for") ?? "").split(",")[0].trim() ||
    "unknown";
  const { rateLimit } = await import("@/lib/rate-limit");
  const limited = await rateLimit("giveaway-entry", ip, 5, 3600);
  if (!limited.ok) redirect("/giveaway-entry?entered=1"); // soft-drop

  if (formData.get("hp")) redirect("/giveaway-entry?entered=1"); // bot: pretend

  const giveawayId = String(formData.get("giveawayId") ?? "");
  const name = String(formData.get("name") ?? "").trim().slice(0, 80);
  const email = String(formData.get("email") ?? "").trim().toLowerCase().slice(0, 120);
  const town = String(formData.get("town") ?? "").trim().slice(0, 60);
  const eligible = formData.get("eligible") === "on";
  if (!giveawayId || !name || !email || !town || !eligible) {
    throw new Error("All fields are required");
  }

  const giveaway = await db.giveaway.findUnique({ where: { id: giveawayId } });
  if (!giveaway || giveaway.status !== "OPEN") {
    redirect("/giveaway-entry");
  }

  // One free entry per email per draw.
  const existing = await db.giveawayEntry.findFirst({
    where: { giveawayId, source: "no_purchase", entrantEmail: email },
  });
  if (!existing) {
    await db.giveawayEntry.create({
      data: {
        giveawayId,
        source: "no_purchase",
        entrantName: name,
        entrantEmail: email,
        entrantTown: town,
      },
    });
  }
  redirect("/giveaway-entry?entered=1");
}
