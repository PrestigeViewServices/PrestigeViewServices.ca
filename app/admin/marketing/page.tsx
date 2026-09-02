import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  ExternalLink,
  FileDown,
  Globe,
  Megaphone,
  Search,
  Star,
  TrendingUp,
} from "lucide-react";
import { getDb, isDbReady } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { siteConfig } from "@/lib/site";
import { services } from "@/lib/content/services";
import { serviceAreas, serviceOfferedInArea } from "@/lib/content/service-areas";
import { guides } from "@/lib/content/guides";
import { CopyButton } from "@/components/admin/copy-button";

export const dynamic = "force-dynamic";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Marketing & SEO hub — where the website stops being a brochure and starts
 * being a lead machine. Three jobs:
 *  1. Show what Google can see (indexable pages, top content, referrers).
 *  2. Keep the review engine running (reviews are the #1 local ranking
 *     signal for a service business).
 *  3. Hand the owner ready-to-post seasonal campaign copy and the printable
 *     flyers already in the repo.
 */
export default async function AdminMarketingPage() {
  await requireRole(["ultimate_admin", "super_admin", "admin", "manager"]);

  // SEO-facing page inventory, computed from the same content files that
  // build the live sitemap, so this number is what Google is actually given.
  let comboPages = 0;
  for (const s of services) {
    for (const a of serviceAreas) {
      if (serviceOfferedInArea(s.slug, a)) comboPages++;
    }
  }
  const indexablePages =
    18 + services.length + serviceAreas.length + comboPages + guides.length;

  // Traffic context (optional — the page renders fine without a database).
  const db = isDbReady() ? getDb() : null;
  const since30d = new Date(Date.now() - 30 * DAY_MS);
  let topPages: { path: string; views: number }[] = [];
  let topReferrers: { referrer: string; views: number }[] = [];
  let leads30d = 0;
  let bySource: { source: string; count: number }[] = [];
  if (db) {
    try {
      const [pages, refs, leadCount, sources] = await Promise.all([
        db.pageView.groupBy({
          by: ["path"],
          where: { createdAt: { gte: since30d } },
          _count: { _all: true },
          orderBy: { _count: { path: "desc" } },
          take: 8,
        }),
        db.pageView.groupBy({
          by: ["referrer"],
          where: { createdAt: { gte: since30d }, referrer: { not: null } },
          _count: { _all: true },
          orderBy: { _count: { referrer: "desc" } },
          take: 6,
        }),
        db.lead.count({ where: { createdAt: { gte: since30d } } }),
        db.lead.groupBy({
          by: ["source"],
          where: { createdAt: { gte: since30d } },
          _count: { _all: true },
        }),
      ]);
      topPages = pages.map((p) => ({ path: p.path, views: p._count._all }));
      topReferrers = refs.map((r) => ({
        referrer: r.referrer ?? "direct",
        views: r._count._all,
      }));
      leads30d = leadCount;
      bySource = sources.map((s) => ({
        source: s.source.replace(/_/g, " ").toLowerCase(),
        count: s._count._all,
      }));
    } catch {
      // Stats stay empty; the playbook below is still useful.
    }
  }

  const reviewAsk = `Hi [name], it's AG from Prestige View Services. Thanks again for having us out today! If you were happy with the work, a quick Google review helps our small local crew more than you'd think: ${siteConfig.googleReviewUrl} Thank you!`;

  const fallPost = `Fall cleanup season is here in the Ottawa Valley! Leaves, gutters, and one last cut before the snow flies. Prestige View Services is booking fall cleanups in Petawawa and Pembroke now. Fully insured, veteran operated, free quotes in one business day. Book at prestigeviewservices.ca/fall-winter or call ${siteConfig.phoneDisplay}.`;

  const winterPost = `Snow is coming. Lock in your driveway before the first storm! Prestige View Services seasonal snow passes cover you storm by storm, all winter long, with monthly payment options. Petawawa routes fill up fast. Reserve at prestigeviewservices.ca/winter-packages or call ${siteConfig.phoneDisplay}.`;

  const checklist: { label: string; done: boolean; note: string }[] = [
    {
      label: "Sitemap submitted to Google",
      done: true,
      note: "The site publishes /sitemap.xml automatically. Confirm it is submitted in Google Search Console.",
    },
    {
      label: `${indexablePages} indexable pages live`,
      done: true,
      note: "Home, services, service areas, service + city combos, guides, and seasonal pages, each with its own title and description.",
    },
    {
      label: "LocalBusiness schema on every page",
      done: true,
      note: "Name, address, phone, hours, and service area are marked up for Google's local results.",
    },
    {
      label: "Google Business Profile posts weekly",
      done: false,
      note: "Post a photo + one paragraph weekly. Use the campaign copy below; it takes five minutes and feeds the local map pack.",
    },
    {
      label: "Reply to every Google review",
      done: false,
      note: "Replies (even two sentences) are a ranking signal and show prospects you answer.",
    },
    {
      label: "Before/after photo on every finished job",
      done: false,
      note: "Crews snap two photos per job. Upload the best in Photos; fresh content keeps pages ranking.",
    },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Marketing &amp; SEO</h1>
        <p className="mt-1.5 text-muted-foreground">
          What Google sees, how the website is earning leads, and ready-to-post
          campaign material.
        </p>
      </header>

      {/* ---- KPI context ---- */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="surface-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Globe className="h-4 w-4" />
            <p className="text-xs font-medium uppercase tracking-wider">
              Pages Google can rank
            </p>
          </div>
          <p className="mt-2 text-2xl font-bold tabular-nums">
            {indexablePages}
          </p>
          <a
            href="/sitemap.xml"
            target="_blank"
            className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            View live sitemap
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        <div className="surface-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            <p className="text-xs font-medium uppercase tracking-wider">
              Leads, last 30 days
            </p>
          </div>
          <p className="mt-2 text-2xl font-bold tabular-nums">{leads30d}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {bySource.length > 0
              ? bySource.map((s) => `${s.count} ${s.source}`).join(" · ")
              : "by source once leads arrive"}
          </p>
        </div>
        <div className="surface-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Star className="h-4 w-4" />
            <p className="text-xs font-medium uppercase tracking-wider">
              Review engine
            </p>
          </div>
          <p className="mt-2 text-sm">
            Reviews are the #1 local ranking signal. Ask after every job.
          </p>
          <a
            href={siteConfig.googleReviewUrl}
            target="_blank"
            className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            Open the review link
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* ---- SEO checklist ---- */}
      <section className="surface-card p-6">
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Google SEO checklist</h2>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          The technical side ships with the website. The unchecked items are
          the weekly habits that win the map pack.
        </p>
        <ul className="mt-4 space-y-3">
          {checklist.map((c) => (
            <li key={c.label} className="flex items-start gap-3">
              {c.done ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
              ) : (
                <Circle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
              )}
              <div>
                <p className="text-sm font-medium">{c.label}</p>
                <p className="text-xs text-muted-foreground">{c.note}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* ---- Campaign kit ---- */}
      <section className="surface-card p-6">
        <div className="flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Fall &amp; winter campaign kit</h2>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Copy, paste, post. Facebook, Instagram caption, or a Google Business
          Profile update; same text works for all three.
        </p>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-surface-border bg-surface/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-300">
              Fall cleanup push
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/90">
              {fallPost}
            </p>
            <CopyButton
              text={fallPost}
              label="Copy post"
              variant="outline"
              size="sm"
              className="mt-3"
            />
          </div>
          <div className="rounded-xl border border-surface-border bg-surface/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-cyan-300">
              Snow pass push
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/90">
              {winterPost}
            </p>
            <CopyButton
              text={winterPost}
              label="Copy post"
              variant="outline"
              size="sm"
              className="mt-3"
            />
          </div>
          <div className="rounded-xl border border-surface-border bg-surface/60 p-4 lg:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
              Review ask (text after every job)
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/90">
              {reviewAsk}
            </p>
            <CopyButton
              text={reviewAsk}
              label="Copy message"
              variant="outline"
              size="sm"
              className="mt-3"
            />
          </div>
        </div>

        <div className="mt-5 border-t border-surface-border pt-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Printable flyers (already designed)
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <a
              href="/marketing/pvs-snow-passes-flyer.pdf"
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-full border border-surface-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-white/15 hover:text-foreground"
            >
              <FileDown className="h-3.5 w-3.5" />
              Snow passes flyer (PDF)
            </a>
            <a
              href="/marketing/pvs-window-cleaning-flyer.pdf"
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-full border border-surface-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-white/15 hover:text-foreground"
            >
              <FileDown className="h-3.5 w-3.5" />
              Window cleaning flyer (PDF)
            </a>
            <a
              href="/marketing/pvs-snow-passes-social.png"
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-full border border-surface-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-white/15 hover:text-foreground"
            >
              <FileDown className="h-3.5 w-3.5" />
              Snow passes social image
            </a>
            <a
              href="/marketing/pvs-window-cleaning-social.png"
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-full border border-surface-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-white/15 hover:text-foreground"
            >
              <FileDown className="h-3.5 w-3.5" />
              Window cleaning social image
            </a>
          </div>
        </div>
      </section>

      {/* ---- What's working ---- */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="surface-card p-6">
          <h2 className="text-lg font-semibold">
            Most-visited pages, 30 days
          </h2>
          <ul className="mt-4 divide-y divide-surface-border text-sm">
            {topPages.length === 0 && (
              <li className="py-4 text-muted-foreground">
                No traffic recorded yet.
              </li>
            )}
            {topPages.map((p) => (
              <li
                key={p.path}
                className="flex items-center justify-between gap-3 py-2"
              >
                <span className="truncate">{p.path}</span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {p.views}
                </span>
              </li>
            ))}
          </ul>
        </section>
        <section className="surface-card p-6">
          <h2 className="text-lg font-semibold">Where visitors come from</h2>
          <ul className="mt-4 divide-y divide-surface-border text-sm">
            {topReferrers.length === 0 && (
              <li className="py-4 text-muted-foreground">
                No referrer data yet. Direct visits and searches will show
                here.
              </li>
            )}
            {topReferrers.map((r) => (
              <li
                key={r.referrer}
                className="flex items-center justify-between gap-3 py-2"
              >
                <span className="truncate">{r.referrer}</span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {r.views}
                </span>
              </li>
            ))}
          </ul>
          <Link
            href="/admin/traffic"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary"
          >
            Full traffic report
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </div>
    </div>
  );
}
