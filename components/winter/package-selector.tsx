"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  FileText,
  Loader2,
  MessageSquare,
  Share2,
  Shovel,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ADD_ON_DEFS,
  DRIVEWAY_TIER_DEFS,
  SHOVELING_TIER_DEFS,
  addOnIsIncluded,
  formatCents,
  formatMonthly,
  getDrivewayTier,
  getShovelingTier,
  monthlyCents,
  selectionLines,
  selectionSummary,
  tierMonthlyFromCents,
  MONTHLY_INSTALLMENTS,
  type AddOnKey,
  type DrivewaySize,
  type DrivewayTier,
  type ShovelingTier,
} from "@/lib/content/winter-packages";
import {
  cardFileName,
  downloadBlob,
  packageCardPdf,
  sharePackageCard,
  type PackageCardData,
} from "@/components/winter/package-card-image";
import { siteConfig } from "@/lib/site";
import { AuroraLeadForm } from "@/components/AuroraLeadForm";
import { QuotePhoto } from "@/components/quote-photo";

/** Walkway packs offered on this page. The 15-pack stays sellable by phone. */
const OFFERED_PACKS: ShovelingTier[] = ["PASS_10", "PASS_25", "PASS_50"];

const TEL = siteConfig.phone.replace(/[^0-9+]/g, "");

type CardState =
  | { kind: "idle" }
  | { kind: "working" }
  | { kind: "done"; message: string }
  | { kind: "error"; message: string };

/**
 * `comparison` is the server-rendered tier table. It is passed in rather than
 * built here so the table stays static HTML (good for SEO and for the initial
 * paint) while still sitting in the brief's reading order, between the
 * add-ons and the save-to-phone card.
 */
export function PackageSelector({
  comparison,
}: {
  comparison?: React.ReactNode;
}) {
  const [tier, setTier] = useState<DrivewayTier | null>(null);
  const [pack, setPack] = useState<ShovelingTier>("NONE");
  const [addOns, setAddOns] = useState<AddOnKey[]>([]);

  // Starting prices on this page are quoted for a single-car driveway; the
  // exact size is captured in the Aurora quote form.
  const size: DrivewaySize = "ONE_CAR";
  const [card, setCard] = useState<CardState>({ kind: "idle" });

  const formRef = useRef<HTMLDivElement>(null);

  const selection = useMemo(
    () =>
      tier
        ? { drivewayTier: tier, drivewaySize: size, shovelingTier: pack, addOns }
        : null,
    [tier, size, pack, addOns]
  );

  const summary = selection ? selectionSummary(selection) : "";

  // Live "from" price for the chosen tier and driveway size. Walkway packs
  // and add-ons are quoted to the property, so they are not folded in here.
  const monthlyFrom = tier
    ? monthlyCents(getDrivewayTier(tier).priceCents[size])
    : null;

  /** Everything the shareable card needs, derived from the live selection. */
  const cardData: PackageCardData | null = useMemo(() => {
    if (!selection || !tier) return null;
    return {
      tierName: getDrivewayTier(tier).name,
      accent: getDrivewayTier(tier).accent,
      lines: selectionLines({
        ...selection,
        drivewaySize: null,
      }),
      dateLabel: new Date().toLocaleDateString("en-CA", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      phone: siteConfig.phoneDisplay,
      siteLabel: "prestigeviewservices.ca/winter-packages",
    };
  }, [selection, tier]);

  const toggleAddOn = useCallback((key: AddOnKey) => {
    setAddOns((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }, []);

  function choose(next: DrivewayTier) {
    setTier(next);
    setCard({ kind: "idle" });
  }

  function scrollToForm() {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // Pre-filled text message for the sticky bar. "?&body=" is the spelling
  // both iOS and Android accept.
  const smsHref = useMemo(() => {
    const body = selection
      ? `Hi PVS, I'd like a quote for: ${summary}.`
      : "Hi PVS, I'd like a quote for a seasonal snow pass.";
    return `sms:${TEL}?&body=${encodeURIComponent(body)}`;
  }, [selection, summary]);

  async function onSaveCard(kind: "share" | "pdf") {
    if (!cardData) return;
    setCard({ kind: "working" });
    try {
      if (kind === "pdf") {
        const blob = await packageCardPdf(cardData);
        downloadBlob(blob, cardFileName(cardData.tierName, "pdf"));
        setCard({ kind: "done", message: "PDF saved to your downloads." });
        return;
      }
      const how = await sharePackageCard(cardData);
      setCard({
        kind: "done",
        message:
          how === "shared"
            ? "Sent to your share sheet."
            : "Image saved to your downloads.",
      });
    } catch (err) {
      setCard({
        kind: "error",
        message:
          err instanceof Error
            ? err.message
            : "Could not build the card. Try the download instead.",
      });
    }
  }


  return (
    <>
      {/* ── Package cards ── */}
      <section id="packages" className="container-max scroll-mt-24 py-12">
        <div className="max-w-2xl">
          <p className="eyebrow text-primary">Step 1</p>
          <h2 className="heading-section mt-2 text-balance">
            Pick your package
          </h2>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            Every pass covers your driveway and apron for the whole winter,
            paid in {MONTHLY_INSTALLMENTS} easy monthly payments. Moving up the
            tiers buys speed: an earlier trigger, more passes per storm, and a
            tighter completion window.
          </p>
        </div>

        <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:items-start">
          {DRIVEWAY_TIER_DEFS.map((t) => (
            <TierCard
              key={t.slug}
              tier={t}
              selected={tier === t.slug}
              onSelect={() => choose(t.slug)}
            />
          ))}
        </div>

        <p className="mt-6 text-sm text-muted-foreground">
          Starting prices are for a single-car driveway, split into{" "}
          {MONTHLY_INSTALLMENTS} equal monthly payments across the winter.
          Larger and rural driveways are quoted to your exact property before
          anything is billed.{" "}
          <strong className="text-foreground">
            Free quote, no payment today.
          </strong>
        </p>
      </section>

      {/* ── Add-ons ── */}
      <section id="add-ons" className="container-max scroll-mt-24 py-12">
        <div className="max-w-2xl">
          <p className="eyebrow text-primary">Step 2</p>
          <h2 className="heading-section mt-2 text-balance">
            Add the extras you want
          </h2>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            Optional, and all of it rides along on the same quote.
          </p>
        </div>

        <div className="mt-8">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <Shovel className="h-4 w-4 text-primary" aria-hidden />
            Walkway shovelling pack
          </h3>
          <p className="mt-1.5 text-sm text-muted-foreground">
            One visit clears your walkway, porch, and back deck. Big storms
            often use two. Packs never expire mid-season and you can top up
            anytime.
          </p>
          <div
            role="radiogroup"
            aria-label="Walkway shovelling pack"
            className="mt-4 flex flex-wrap gap-2.5"
          >
            <PackChip
              label="No walkways"
              selected={pack === "NONE"}
              onClick={() => setPack("NONE")}
            />
            {OFFERED_PACKS.map((slug) => {
              const def = getShovelingTier(slug)!;
              return (
                <PackChip
                  key={slug}
                  label={`${def.passes} visits`}
                  selected={pack === slug}
                  onClick={() => setPack(slug)}
                />
              );
            })}
          </div>
        </div>

        <div className="mt-9">
          <h3 className="text-sm font-semibold">Other add-ons</h3>
          <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {ADD_ON_DEFS.map((a) => {
              const included = tier ? addOnIsIncluded(a.key, tier) : false;
              return (
                <AddOnChip
                  key={a.key}
                  label={a.label}
                  hint={included ? `Already included with ${getDrivewayTier(tier!).name}` : a.hint}
                  included={included}
                  selected={addOns.includes(a.key)}
                  onClick={() => toggleAddOn(a.key)}
                />
              );
            })}
          </div>
        </div>
      </section>

      {comparison}

      {/* ── Save to phone ── */}
      {cardData && (
        <section id="save" className="container-max scroll-mt-24 py-12">
          <div className="surface-card overflow-hidden p-6 sm:p-9">
            <div className="grid items-center gap-8 lg:grid-cols-[1.3fr_1fr]">
              <div>
                <p className="eyebrow text-primary">Step 3</p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                  Keep a copy of what you picked
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  We will make you a card with your exact selection on it. Save
                  it to your photos, or send it straight to us so there is no
                  back and forth about what you asked for.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Button
                    type="button"
                    size="lg"
                    onClick={() => onSaveCard("share")}
                    disabled={card.kind === "working"}
                  >
                    {card.kind === "working" ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    ) : (
                      <Share2 className="h-4 w-4" aria-hidden />
                    )}
                    Save my package
                  </Button>
                  <Button
                    type="button"
                    size="lg"
                    variant="outline"
                    onClick={() => onSaveCard("pdf")}
                    disabled={card.kind === "working"}
                  >
                    <FileText className="h-4 w-4" aria-hidden />
                    Download as PDF
                  </Button>
                </div>

                <p
                  role="status"
                  aria-live="polite"
                  className={`mt-3 min-h-[1.25rem] text-sm ${
                    card.kind === "error" ? "text-rose-300" : "text-emerald-300"
                  }`}
                >
                  {card.kind === "done" || card.kind === "error"
                    ? card.message
                    : ""}
                </p>
              </div>

              <CardPreview
                tierName={cardData.tierName}
                accent={cardData.accent}
                lines={cardData.lines}
              />
            </div>
          </div>
        </section>
      )}

      {/* ── Quote form ── */}
      <section
        id="quote"
        ref={formRef}
        className="container-max grid scroll-mt-24 gap-10 py-12 lg:grid-cols-12"
      >
        <div className="lg:col-span-5">
          <div>
            {/* The save-card step only exists once something is selected, so
                this step renumbers itself rather than skipping a number. */}
            <p className="eyebrow text-primary">Step {cardData ? 4 : 3}</p>
            <h2 className="heading-section mt-2 text-balance">
              Get your free quote
            </h2>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">
              Tell us about your property below. We confirm your route spot
              within 24 hours. No payment today.
            </p>
          </div>

          {tier && (
            <div className="mt-6 rounded-2xl border border-primary/30 bg-primary/10 p-5">
              <p className="eyebrow text-primary">Your selection</p>
              <p className="mt-2 text-lg font-bold tracking-tight">{summary}</p>
              {monthlyFrom !== null && (
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Driveway pass from{" "}
                  <strong className="text-foreground">
                    {formatMonthly(monthlyFrom)}/month
                  </strong>{" "}
                  for a single-car driveway. Mention this package in the form
                  so we quote the right thing.
                </p>
              )}
            </div>
          )}

          <ul className="mt-6 space-y-2.5 text-sm text-muted-foreground">
            {[
              "Route spot confirmed within 24 hours",
              "No payment today, billed monthly once confirmed",
              "Storms trigger your clearing automatically",
            ].map((p) => (
              <li key={p} className="flex items-start gap-2.5">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
                {p}
              </li>
            ))}
          </ul>

          <QuotePhoto
            src="/images/gallery/snow-removal/tractor-cleared-driveway-bluebird-day.webp"
            alt="Driveway cleared by a PVS tractor on a bright winter morning"
            caption="Cleared before you head out the door."
            className="mt-8 hidden lg:block"
          />
        </div>

        <div className="lg:col-span-7">
          <AuroraLeadForm id="quote-form" />
        </div>
      </section>

      {/* ── Sticky selection bar ── */}
      {tier && (
        <StickyBar
          summary={summary}
          priceLabel={
            monthlyFrom !== null
              ? `From ${formatMonthly(monthlyFrom)}/mo`
              : null
          }
          onQuote={scrollToForm}
          smsHref={smsHref}
        />
      )}
    </>
  );
}


// ---------------------------------------------------------------------------

function TierCard({
  tier,
  selected,
  onSelect,
}: {
  tier: (typeof DRIVEWAY_TIER_DEFS)[number];
  selected: boolean;
  onSelect: () => void;
}) {
  const popular = Boolean(tier.badge);
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      style={
        selected
          ? {
              borderColor: tier.accent,
              boxShadow: `0 0 0 1px ${tier.accent}, 0 12px 40px -12px ${tier.accent}80`,
            }
          : undefined
      }
      className={`group relative flex h-full flex-col rounded-3xl border p-6 text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
        selected
          ? "bg-white/[0.07]"
          : "border-surface-border bg-white/[0.02] hover:-translate-y-1 hover:border-white/20"
      } ${popular ? "lg:-mt-3 lg:pb-8" : ""}`}
    >
      {popular && (
        <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full bg-gradient-primary px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-glow">
          <Star className="h-3 w-3 fill-current" aria-hidden />
          {tier.badge}
        </span>
      )}

      <div className="flex items-center gap-2.5">
        <span
          aria-hidden
          className="h-3 w-3 shrink-0 rounded-full"
          style={{ backgroundColor: tier.accent }}
        />
        <h3 className="text-xl font-bold tracking-tight">{tier.name}</h3>
      </div>

      <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
        {tier.blurb}
      </p>

      <div className="mt-5 border-t border-surface-border pt-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Starting at
        </p>
        <p className="mt-1 flex items-baseline gap-1">
          <span className="text-3xl font-bold tracking-tight">
            {formatMonthly(tierMonthlyFromCents(tier))}
          </span>
          <span className="text-sm font-medium text-muted-foreground">
            /month
          </span>
        </p>
        <p className="mt-1 text-xs leading-snug text-muted-foreground">
          Single-car driveway · {MONTHLY_INSTALLMENTS} monthly payments ·{" "}
          {formatCents(tierMonthlyFromCents(tier) * MONTHLY_INSTALLMENTS)} per
          season
        </p>
      </div>

      <ul className="mt-5 space-y-2.5 text-sm">
        {tier.features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <Check
              className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400"
              strokeWidth={3}
              aria-hidden
            />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-6">
        <p className="text-xs text-muted-foreground">Free quote, no payment today</p>
        <span
          className={`mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold transition-colors ${
            selected
              ? "text-blue-950"
              : "border border-surface-border text-foreground group-hover:border-white/25"
          }`}
          style={selected ? { backgroundColor: tier.accent } : undefined}
        >
          {selected ? (
            <>
              <Check className="h-4 w-4" strokeWidth={3} aria-hidden />
              Selected
            </>
          ) : (
            `Choose ${tier.name}`
          )}
        </span>
      </div>
    </button>
  );
}

function PackChip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={`rounded-full border px-5 py-2.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
        selected
          ? "border-primary bg-primary/20 text-foreground"
          : "border-surface-border text-muted-foreground hover:border-white/25 hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}

function AddOnChip({
  label,
  hint,
  selected,
  included,
  onClick,
}: {
  label: string;
  hint: string;
  selected: boolean;
  included: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
        selected
          ? "border-primary bg-primary/15"
          : "border-surface-border hover:border-white/20"
      }`}
    >
      <span
        aria-hidden
        className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-colors ${
          selected
            ? "border-primary bg-primary text-white"
            : "border-surface-border"
        }`}
      >
        {selected && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium">{label}</span>
        <span
          className={`mt-0.5 block text-xs leading-snug ${
            included ? "text-emerald-300" : "text-muted-foreground"
          }`}
        >
          {hint}
        </span>
      </span>
    </button>
  );
}

function CardPreview({
  tierName,
  accent,
  lines,
}: {
  tierName: string;
  accent: string;
  lines: { label: string; value: string }[];
}) {
  return (
    <div
      aria-hidden
      className="mx-auto w-full max-w-[248px] overflow-hidden rounded-2xl border border-white/10 bg-[#0A1220] shadow-2xl"
      style={{ aspectRatio: "1080 / 1350" }}
    >
      <div className="flex h-full flex-col p-4">
        <div
          className="h-1 w-10 rounded-full"
          style={{ backgroundColor: accent }}
        />
        <p
          className="mt-3 text-[8px] font-bold uppercase tracking-[0.2em]"
          style={{ color: accent }}
        >
          Seasonal Snow Pass
        </p>
        <p className="mt-1 text-xl font-bold leading-none text-white">
          {tierName}
        </p>
        <div className="mt-3 space-y-1.5 rounded-lg border border-white/10 bg-white/5 p-2.5">
          {lines.slice(0, 4).map((l) => (
            <div key={`${l.label}-${l.value}`}>
              <p className="text-[6px] uppercase tracking-widest text-sky-100/50">
                {l.label}
              </p>
              <p className="truncate text-[9px] font-semibold text-white">
                {l.value}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-auto border-t border-white/10 pt-2">
          <p className="text-[8px] font-bold text-white">
            {siteConfig.phoneDisplay}
          </p>
          <p className="text-[6px]" style={{ color: accent }}>
            prestigeviewservices.ca
          </p>
        </div>
      </div>
    </div>
  );
}

function StickyBar({
  summary,
  priceLabel,
  onQuote,
  smsHref,
}: {
  summary: string;
  priceLabel: string | null;
  onQuote: () => void;
  smsHref: string;
}) {
  // Reserve the bar's height at the end of the document so the footer is
  // always reachable and the bar never sits on top of real content. The data
  // attribute hides the site-wide StickyCta, which would otherwise stack on
  // top of this bar at the same z-index (see globals.css).
  useEffect(() => {
    const prev = document.body.style.paddingBottom;
    document.body.style.paddingBottom = "104px";
    document.body.dataset.pageStickyBar = "winter";
    return () => {
      document.body.style.paddingBottom = prev;
      delete document.body.dataset.pageStickyBar;
    };
  }, []);

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#0A1220]/95 backdrop-blur-md">
      <div className="container-max flex items-center gap-3 py-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
            Your selection
          </p>
          <p className="truncate text-sm font-semibold">
            {summary}
            {priceLabel && (
              <span className="ml-2 font-normal text-muted-foreground">
                {priceLabel}
              </span>
            )}
          </p>
        </div>
        <a
          href={smsHref}
          aria-label="Text us your selection"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-surface-border text-muted-foreground transition-colors hover:border-white/25 hover:text-foreground sm:hidden"
        >
          <MessageSquare className="h-4 w-4" aria-hidden />
        </a>
        <Button type="button" onClick={onQuote} className="shrink-0">
          Get my free quote
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}


