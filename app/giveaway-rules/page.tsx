import type { Metadata } from "next";
import Link from "next/link";
import { ScrollText } from "lucide-react";
import { getDb } from "@/lib/db";
import { siteConfig } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Giveaway Official Rules | Prestige View Services",
  description:
    "Official rules for The Prestige Club quarterly giveaways: eligibility, entry methods including no purchase necessary, odds, draw dates, and prizes.",
  alternates: { canonical: "/giveaway-rules" },
  robots: { index: true, follow: true },
};

/**
 * OFFICIAL CONTEST RULES — Canadian promotional-contest compliance page.
 *
 * ⚠️ LEGAL REVIEW REQUIRED: AG should have these rules reviewed by a lawyer
 * familiar with Canadian contest law (Competition Act s.74.06 + provincial
 * rules) BEFORE the first draw runs. The structure below covers the
 * standard requirements (no purchase necessary, skill-testing question,
 * eligibility, odds disclosure, Quebec exclusion) but is not legal advice.
 */
export default async function GiveawayRulesPage() {
  const db = getDb();
  const current = db
    ? await db.giveaway.findFirst({
        where: { status: "OPEN" },
        orderBy: { opensAt: "desc" },
      })
    : null;

  return (
    <section className="container-max py-14 sm:py-20">
      <div className="mx-auto max-w-3xl">
        <p className="eyebrow text-primary">
          <ScrollText className="h-3.5 w-3.5" />
          The Prestige Club
        </p>
        <h1 className="heading-section mt-2">Giveaway Official Rules</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Last updated July 23, 2026 · Sponsor: Prestige View Services,{" "}
          {siteConfig.address.streetAddress}, {siteConfig.address.locality},{" "}
          {siteConfig.address.region}
        </p>

        {current && (
          <div className="mt-6 rounded-2xl border border-primary/30 bg-primary/10 p-5 text-sm">
            <p className="font-semibold">Current draw: {current.title}</p>
            <p className="mt-1 text-muted-foreground">
              Prize: {current.prize}
              {current.closesAt &&
                ` · Entries close ${current.closesAt.toLocaleDateString(
                  "en-CA",
                  { month: "long", day: "numeric", year: "numeric" }
                )}`}
            </p>
          </div>
        )}

        <div className="prose-invert mt-8 space-y-6 text-sm leading-relaxed text-foreground/90">
          <Rule n={1} title="No purchase necessary">
            No purchase is required to enter or win. Anyone eligible may enter
            each draw for free using the{" "}
            <Link
              href="/giveaway-entry"
              className="font-medium text-primary hover:underline"
            >
              free online entry form
            </Link>{" "}
            or by mailing a hand-written entry (full name, email, town, and
            the words &quot;Prestige Club Giveaway Entry&quot;) to Prestige
            View Services, {siteConfig.address.streetAddress},{" "}
            {siteConfig.address.locality}, {siteConfig.address.region}. Free
            entries have the same odds per entry as member entries. Limit one
            free entry per person per draw.
          </Rule>
          <Rule n={2} title="Eligibility">
            Open to legal residents of Ontario, Canada who are 18 years of
            age or older at the time of entry.{" "}
            <span className="font-semibold">
              This contest is not open to residents of Quebec.
            </span>{" "}
            Employees of Prestige View Services and members of their immediate
            households are not eligible.
          </Rule>
          <Rule n={3} title="Entry methods and entry counts">
            (a) Prestige Club members automatically receive entries per draw
            based on their membership tier: Member and Insider receive 1
            entry, Elite receives 2 entries, Prestige receives 3 entries. (b)
            Members receive 1 bonus entry for each referral whose first
            service is completed and paid during the draw period. (c) Free
            entries as described in Rule 1. Joining The Prestige Club is free
            and does not require a purchase.
          </Rule>
          <Rule n={4} title="Draw and odds">
            One winner is selected at random from all eligible entries after
            entries close. Odds of winning depend on the total number of
            entries received. Draw dates are published with each giveaway;
            draws are conducted quarterly.
          </Rule>
          <Rule n={5} title="Skill-testing question">
            Before being declared a winner, the selected entrant must
            correctly answer, unaided, a time-limited mathematical
            skill-testing question (for example: &quot;(5 × 4) + 10 − 2 =
            ?&quot;). If the question is answered incorrectly or the selected
            entrant cannot be reached within 5 business days, another entrant
            may be selected.
          </Rule>
          <Rule n={6} title="Prizes">
            The prize for each draw is described on the giveaway page and in
            these rules while the draw is open (for example: a free fall
            gutter cleaning, a spring window cleaning package, or a $250
            service credit). Prizes are services or service credits, have no
            cash value, are not transferable, and must be redeemed within 12
            months at an address inside the PVS service area.
          </Rule>
          <Rule n={7} title="Winner announcement and consent">
            By entering, entrants consent to the publication of their first
            name and town if they win (e.g. &quot;Jordan from
            Petawawa&quot;). Full contact details are never published.
          </Rule>
          <Rule n={8} title="General">
            The sponsor may cancel, suspend, or modify a draw where required
            by law. Decisions of the sponsor are final. Personal information
            collected for a draw is used only to administer the draw and,
            where the entrant separately opts in, for PVS communications.
            Questions:{" "}
            <a
              href={`mailto:${siteConfig.email}`}
              className="font-medium text-primary hover:underline"
            >
              {siteConfig.email}
            </a>{" "}
            or {siteConfig.phoneDisplay}.
          </Rule>
        </div>

        <p className="mt-10 text-xs text-muted-foreground">
          The Prestige Club is operated by Prestige View Services. Quality you
          can see. Rewards you can feel.
        </p>
      </div>
    </section>
  );
}

function Rule({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="surface-card p-5">
      <h2 className="text-base font-semibold">
        {n}. {title}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {children}
      </p>
    </div>
  );
}
