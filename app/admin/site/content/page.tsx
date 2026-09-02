import Link from "next/link";
import { revalidatePath } from "next/cache";
import {
  ArrowLeft,
  ExternalLink,
  FileEdit,
  Megaphone,
  MonitorPlay,
  RotateCcw,
  Save,
  Sparkles,
} from "lucide-react";
import { getDb, isDbReady, missingDbEnvVars } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { NotConfigured } from "@/components/admin/not-configured";
import {
  customizedKeys,
  getSiteContent,
  resetSiteContentKey,
  saveSiteContentKey,
  type OfferContent,
  type SiteContentKey,
} from "@/lib/site-content";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const EDIT_ROLES = ["ultimate_admin", "super_admin", "admin"] as const;

/** Every public page that renders the edited content. */
const CONTENT_PATHS = ["/", "/quote", "/request-service", "/refer"];

/**
 * Page Content — the owner's editor for the public site's marketing surfaces:
 * the hero headline, the season banner, and the seasonal offers (cards +
 * promo modal). Saves apply to the live site immediately; every section has
 * a reset that brings the code copy back, so nothing can be broken for good.
 */
export default async function SiteContentPage() {
  await requireRole([...EDIT_ROLES]);

  if (!isDbReady()) {
    return (
      <NotConfigured
        service="Database"
        reason="Content overrides are stored in Postgres. Set DATABASE_URL and run `npm run db:migrate`."
        envVars={["DATABASE_URL"]}
        missing={missingDbEnvVars()}
      />
    );
  }
  const db = getDb()!;
  const [content, customized] = await Promise.all([
    getSiteContent(db),
    customizedKeys(db),
  ]);

  return (
    <div className="space-y-8">
      <Link
        href="/admin/site"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Site settings
      </Link>

      <header>
        <div className="flex items-center gap-2">
          <FileEdit className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Page Content</h1>
        </div>
        <p className="mt-1.5 max-w-2xl text-muted-foreground">
          Edit what the public site says. No code, no waiting. Saves go live
          immediately.{" "}
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
          >
            Open the site
            <ExternalLink className="h-3.5 w-3.5" />
          </a>{" "}
          in another tab to check your work. &ldquo;Reset section&rdquo; brings
          the original copy back, so nothing can be broken for good.
        </p>
      </header>

      {/* ================= Hero ================= */}
      <form action={saveHero} className="surface-card space-y-4 p-5 sm:p-7">
        <SectionHeader
          icon={<Sparkles className="h-5 w-5" />}
          title="Homepage hero"
          sub="The big headline visitors see first."
          customized={customized.includes("hero")}
        />
        <FieldText
          name="headlineTop"
          label="Headline, first part (white)"
          value={content.hero.headlineTop}
          max={120}
        />
        <FieldText
          name="headlineAccent"
          label="Headline, second part (blue gradient)"
          value={content.hero.headlineAccent}
          max={120}
        />
        <FieldArea
          name="subtext"
          label="Paragraph under the headline"
          value={content.hero.subtext}
          max={600}
        />
        <SectionButtons resetAction={resetHero} />
      </form>

      {/* ================= Season banner ================= */}
      <form action={saveBanner} className="surface-card space-y-4 p-5 sm:p-7">
        <SectionHeader
          icon={<Megaphone className="h-5 w-5" />}
          title="Season banner"
          sub="The slim amber strip above the hero."
          customized={customized.includes("seasonBanner")}
        />
        <label className="flex items-center gap-2.5 text-sm font-medium">
          <input
            type="checkbox"
            name="enabled"
            defaultChecked={content.seasonBanner.enabled}
            className="h-4 w-4 rounded border-surface-border"
          />
          Show the banner
        </label>
        <FieldText
          name="line1"
          label="Main line"
          value={content.seasonBanner.line1}
          max={160}
          hint="Wrap words in *asterisks* to colour them amber, e.g. Now booking *fall cleanups*."
        />
        <FieldText
          name="line2"
          label="Small second line (optional)"
          value={content.seasonBanner.line2}
          max={160}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldText
            name="ctaLabel"
            label="Button label"
            value={content.seasonBanner.ctaLabel}
            max={40}
          />
          <FieldText
            name="ctaHref"
            label="Button link (must start with /)"
            value={content.seasonBanner.ctaHref}
            max={200}
          />
        </div>
        <SectionButtons resetAction={resetBanner} />
      </form>

      {/* ================= Offers ================= */}
      <form action={saveOffers} className="surface-card space-y-6 p-5 sm:p-7">
        <SectionHeader
          icon={<MonitorPlay className="h-5 w-5" />}
          title="Seasonal offers"
          sub={`The "What to Book Right Now" cards on the homepage. "Feature in popup" also puts that one offer in the once-per-visit popup across the site — pick at most one.`}
          customized={customized.includes("offers")}
        />
        {content.offers.map((o, i) => (
          <OfferEditor key={o.id} offer={o} index={i} />
        ))}
        {content.offers.length < 4 && (
          <details className="rounded-xl border border-dashed border-surface-border p-4">
            <summary className="cursor-pointer text-sm font-medium text-primary">
              + Add another offer
            </summary>
            <div className="mt-4">
              <OfferEditor
                offer={{
                  id: `offer-${Date.now().toString(36)}`,
                  active: false,
                  eyebrow: "",
                  headline: "",
                  body: "",
                  ctaLabel: "Get a Quote",
                  ctaHref: "/quote",
                  accent: "clearview",
                  showInModal: false,
                }}
                index={content.offers.length}
              />
            </div>
          </details>
        )}
        <SectionButtons resetAction={resetOffers} />
      </form>

      <p className="text-xs text-muted-foreground">
        Photos have their own manager under{" "}
        <Link href="/admin/site/photos" className="font-medium text-primary hover:underline">
          Site → Photos
        </Link>
        . Prestige Club numbers (points, the 5% account discount, referral
        rewards) live in{" "}
        <Link href="/admin/club/settings" className="font-medium text-primary hover:underline">
          Program Settings
        </Link>
        . Service descriptions and city pages are SEO-tuned code content, ask
        for changes there and they ship with a deploy.
      </p>
    </div>
  );
}

// ---- Small pieces ----------------------------------------------------------

function SectionHeader({
  icon,
  title,
  sub,
  customized,
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
  customized: boolean;
}) {
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/15 text-primary">
          {icon}
        </span>
        <h2 className="text-lg font-semibold">{title}</h2>
        {customized && (
          <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
            Customized
          </span>
        )}
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

function FieldText({
  name,
  label,
  value,
  max,
  hint,
}: {
  name: string;
  label: string;
  value: string;
  max: number;
  hint?: string;
}) {
  return (
    <div>
      <label htmlFor={`f-${name}`} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      <input
        id={`f-${name}`}
        name={name}
        defaultValue={value}
        maxLength={max}
        className="h-10 w-full rounded-xl border border-surface-border bg-input/80 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function FieldArea({
  name,
  label,
  value,
  max,
}: {
  name: string;
  label: string;
  value: string;
  max: number;
}) {
  return (
    <div>
      <label htmlFor={`f-${name}`} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      <textarea
        id={`f-${name}`}
        name={name}
        defaultValue={value}
        maxLength={max}
        rows={3}
        className="w-full rounded-xl border border-surface-border bg-input/80 px-3 py-2 text-sm leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </div>
  );
}

function OfferEditor({ offer, index }: { offer: OfferContent; index: number }) {
  const p = (field: string) => `offer_${index}_${field}`;
  return (
    <fieldset className="space-y-3 rounded-xl border border-surface-border p-4">
      <input type="hidden" name={p("id")} value={offer.id} />
      <div className="flex flex-wrap items-center gap-4">
        <legend className="text-sm font-semibold">
          Offer {index + 1}
          {offer.headline ? `: ${offer.headline.slice(0, 40)}` : ""}
        </legend>
        <label className="flex items-center gap-2 text-xs font-medium">
          <input
            type="checkbox"
            name={p("active")}
            defaultChecked={offer.active}
            className="h-3.5 w-3.5 rounded border-surface-border"
          />
          Show on site
        </label>
        <label className="flex items-center gap-2 text-xs font-medium">
          <input
            type="radio"
            name="modalOfferId"
            value={offer.id}
            defaultChecked={offer.showInModal}
            className="h-3.5 w-3.5 border-surface-border"
          />
          Feature in popup
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <FieldText name={p("eyebrow")} label="Small tag" value={offer.eyebrow} max={60} />
        <div>
          <label htmlFor={`f-${p("accent")}`} className="mb-1 block text-sm font-medium">
            Colour
          </label>
          <select
            id={`f-${p("accent")}`}
            name={p("accent")}
            defaultValue={offer.accent}
            className="h-10 w-full rounded-xl border border-surface-border bg-input/80 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="lawn">Green (lawn)</option>
            <option value="clearview">Blue (windows/exterior)</option>
            <option value="snowland">Sky (snow)</option>
          </select>
        </div>
      </div>
      <FieldText name={p("headline")} label="Headline" value={offer.headline} max={140} />
      <FieldArea name={p("body")} label="Body" value={offer.body} max={600} />
      <div className="grid gap-3 sm:grid-cols-2">
        <FieldText name={p("ctaLabel")} label="Button label" value={offer.ctaLabel} max={50} />
        <FieldText
          name={p("ctaHref")}
          label="Button link (must start with /)"
          value={offer.ctaHref}
          max={200}
        />
      </div>
    </fieldset>
  );
}

function SectionButtons({
  resetAction,
}: {
  resetAction: () => Promise<void>;
}) {
  return (
    <div className="flex flex-wrap gap-3 border-t border-surface-border pt-4">
      <Button type="submit" size="sm">
        <Save className="h-4 w-4" />
        Save &amp; publish
      </Button>
      <Button type="submit" size="sm" variant="outline" formAction={resetAction}>
        <RotateCcw className="h-4 w-4" />
        Reset section to original
      </Button>
    </div>
  );
}

// ---- Server actions --------------------------------------------------------

function refreshContentPaths() {
  for (const p of CONTENT_PATHS) revalidatePath(p);
  revalidatePath("/admin/site/content");
}

async function saveHero(formData: FormData) {
  "use server";
  await requireRole([...EDIT_ROLES]);
  const db = getDb();
  if (!db) return;
  await saveSiteContentKey(db, "hero", {
    headlineTop: String(formData.get("headlineTop") ?? "").trim().slice(0, 120),
    headlineAccent: String(formData.get("headlineAccent") ?? "").trim().slice(0, 120),
    subtext: String(formData.get("subtext") ?? "").trim().slice(0, 600),
  });
  refreshContentPaths();
}

async function saveBanner(formData: FormData) {
  "use server";
  await requireRole([...EDIT_ROLES]);
  const db = getDb();
  if (!db) return;
  await saveSiteContentKey(db, "seasonBanner", {
    enabled: formData.get("enabled") === "on",
    line1: String(formData.get("line1") ?? "").trim().slice(0, 160),
    line2: String(formData.get("line2") ?? "").trim().slice(0, 160),
    ctaLabel: String(formData.get("ctaLabel") ?? "").trim().slice(0, 40),
    ctaHref: String(formData.get("ctaHref") ?? "").trim().slice(0, 200),
  });
  refreshContentPaths();
}

async function saveOffers(formData: FormData) {
  "use server";
  await requireRole([...EDIT_ROLES]);
  const db = getDb();
  if (!db) return;

  const modalId = String(formData.get("modalOfferId") ?? "");
  const offers: OfferContent[] = [];
  for (let i = 0; i < 6; i++) {
    const id = formData.get(`offer_${i}_id`);
    if (!id) continue;
    const headline = String(formData.get(`offer_${i}_headline`) ?? "").trim();
    if (!headline) continue; // an empty add-another slot
    const accentRaw = String(formData.get(`offer_${i}_accent`) ?? "clearview");
    offers.push({
      id: String(id).slice(0, 60),
      active: formData.get(`offer_${i}_active`) === "on",
      eyebrow: String(formData.get(`offer_${i}_eyebrow`) ?? "").trim().slice(0, 60),
      headline: headline.slice(0, 140),
      body: String(formData.get(`offer_${i}_body`) ?? "").trim().slice(0, 600),
      ctaLabel: String(formData.get(`offer_${i}_ctaLabel`) ?? "").trim().slice(0, 50),
      ctaHref: String(formData.get(`offer_${i}_ctaHref`) ?? "").trim().slice(0, 200),
      accent: (["lawn", "clearview", "snowland"] as const).includes(
        accentRaw as "lawn"
      )
        ? (accentRaw as OfferContent["accent"])
        : "clearview",
      showInModal: String(id) === modalId,
    });
  }
  if (offers.length === 0) return;
  await saveSiteContentKey(db, "offers", offers);
  refreshContentPaths();
}

async function makeReset(key: SiteContentKey) {
  const db = getDb();
  if (!db) return;
  await resetSiteContentKey(db, key);
  refreshContentPaths();
}

async function resetHero() {
  "use server";
  await requireRole([...EDIT_ROLES]);
  await makeReset("hero");
}

async function resetBanner() {
  "use server";
  await requireRole([...EDIT_ROLES]);
  await makeReset("seasonBanner");
}

async function resetOffers() {
  "use server";
  await requireRole([...EDIT_ROLES]);
  await makeReset("offers");
}
