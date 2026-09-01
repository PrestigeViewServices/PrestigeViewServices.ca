"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Check,
  Download,
  FileText,
  Loader2,
  MessageSquare,
  Share2,
  Shovel,
  Snowflake,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ADD_ON_DEFS,
  DRIVEWAY_SIZES,
  DRIVEWAY_SIZE_HINTS,
  DRIVEWAY_SIZE_LABELS,
  DRIVEWAY_TIER_DEFS,
  SHOVELING_TIER_DEFS,
  WINTER_TOWNS,
  WINTER_TOWN_LABELS,
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
  type WinterTown,
} from "@/lib/content/winter-packages";
import {
  cardFileName,
  downloadBlob,
  packageCardPdf,
  sharePackageCard,
  type PackageCardData,
} from "@/components/winter/package-card-image";
import { siteConfig } from "@/lib/site";

/** Walkway packs offered on this page. The 15-pack stays sellable by phone. */
const OFFERED_PACKS: ShovelingTier[] = ["PASS_10", "PASS_25", "PASS_50"];

const TEL = siteConfig.phone.replace(/[^0-9+]/g, "");

type SubmitState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "error"; message: string };

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

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [town, setTown] = useState<WinterTown>("PETAWAWA");
  const [otherTown, setOtherTown] = useState("");
  const [size, setSize] = useState<DrivewaySize>("TWO_CAR");
  // The size field has a sensible default so the form is submittable, but the
  // shareable card should not claim a size the customer never actually chose.
  const [sizeTouched, setSizeTouched] = useState(false);
  const [notes, setNotes] = useState("");
  const [hp, setHp] = useState("");

  const [submit, setSubmit] = useState<SubmitState>({ kind: "idle" });
  const [sent, setSent] = useState(false);
  const [card, setCard] = useState<CardState>({ kind: "idle" });

  const formRef = useRef<HTMLDivElement>(null);
  const confirmRef = useRef<HTMLDivElement>(null);

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
        drivewaySize: sizeTouched ? size : null,
      }),
      dateLabel: new Date().toLocaleDateString("en-CA", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      phone: siteConfig.phoneDisplay,
      siteLabel: "prestigeviewservices.ca/winter-packages",
    };
  }, [selection, tier, size, sizeTouched]);

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

  // Pre-filled text message, used by the sticky bar and the confirmation
  // screen. "?&body=" is the spelling both iOS and Android accept.
  const smsHref = useMemo(() => {
    const body = selection
      ? `Hi PVS, I'd like a quote for: ${summary}.` +
        `${name ? ` Name: ${name}.` : ""}` +
        `${streetAddress ? ` Address: ${streetAddress}, ${townLabel(town, otherTown)}.` : ""}` +
        ` Driveway: ${DRIVEWAY_SIZE_LABELS[size]}.`
      : "Hi PVS, I'd like a quote for a seasonal snow pass.";
    return `sms:${TEL}?&body=${encodeURIComponent(body)}`;
  }, [selection, summary, name, streetAddress, town, otherTown, size]);

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

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!tier) return;
    setSubmit({ kind: "submitting" });

    const res = await fetch("/api/winter-reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        phone,
        streetAddress,
        town,
        city: townLabel(town, otherTown),
        region: "ON",
        drivewayTier: tier,
        drivewaySize: size,
        shovelingTier: pack,
        addOns,
        customerNotes: notes,
        hp,
      }),
    }).catch(() => null);

    if (res?.ok) {
      setSent(true);
      setSubmit({ kind: "idle" });
      // Move focus and view to the confirmation so screen readers announce it.
      requestAnimationFrame(() => {
        confirmRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        confirmRef.current?.focus();
      });
      return;
    }

    const body = (await res?.json().catch(() => null)) as {
      error?: string;
      issues?: { message: string }[];
    } | null;
    setSubmit({
      kind: "error",
      message:
        body?.issues?.[0]?.message ??
        body?.error ??
        "Something went wrong. Please call or text us at " +
          siteConfig.phoneDisplay +
          ".",
    });
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
        className="container-max scroll-mt-24 py-12"
      >
        <div className="mx-auto max-w-3xl">
          <div className="max-w-2xl">
            {/* The save-card step only exists once something is selected, so
                this step renumbers itself rather than skipping a number. */}
            <p className="eyebrow text-primary">Step {cardData ? 4 : 3}</p>
            <h2 className="heading-section mt-2 text-balance">
              Get your free quote
            </h2>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">
              Your selection is already filled in below. We confirm your route
              spot within 24 hours. No payment today.
            </p>
          </div>

          {sent ? (
            <Confirmation
              ref={confirmRef}
              name={name}
              summary={summary}
              smsHref={smsHref}
              onSaveCard={() => onSaveCard("share")}
              cardBusy={card.kind === "working"}
              cardState={card}
            />
          ) : (
            <form onSubmit={onSubmit} className="surface-card mt-8 space-y-7 p-6 sm:p-8">
              <input
                type="text"
                name="company"
                value={hp}
                onChange={(e) => setHp(e.target.value)}
                autoComplete="off"
                tabIndex={-1}
                aria-hidden="true"
                className="hidden"
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name" required>
                  <Input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                  />
                </Field>
                <Field label="Phone" required>
                  <Input
                    required
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    autoComplete="tel"
                    placeholder="(613) 555-0199"
                  />
                </Field>
                <Field label="Email" required className="sm:col-span-2">
                  <Input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </Field>
                <Field label="Property address" required className="sm:col-span-2">
                  <Input
                    required
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    autoComplete="street-address"
                  />
                </Field>
                <Field label="Town" required>
                  <select
                    required
                    value={town}
                    onChange={(e) => setTown(e.target.value as WinterTown)}
                    className="h-11 w-full rounded-xl border border-surface-border bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    {WINTER_TOWNS.map((t) => (
                      <option key={t} value={t}>
                        {WINTER_TOWN_LABELS[t]}
                      </option>
                    ))}
                  </select>
                </Field>
                {town === "OTHER" && (
                  <Field label="Which town?" required>
                    <Input
                      required
                      value={otherTown}
                      onChange={(e) => setOtherTown(e.target.value)}
                      placeholder="Laurentian Valley"
                    />
                  </Field>
                )}
              </div>

              <fieldset>
                <legend className="text-sm font-medium">
                  Driveway size <span className="text-primary">*</span>
                </legend>
                <div className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                  {DRIVEWAY_SIZES.map((s) => (
                    <SizeOption
                      key={s}
                      size={s}
                      selected={size === s}
                      onSelect={() => {
                        setSize(s);
                        setSizeTouched(true);
                      }}
                    />
                  ))}
                </div>
              </fieldset>

              <div className="rounded-2xl border border-primary/30 bg-primary/10 p-5">
                <p className="eyebrow text-primary">Your selection</p>
                {tier ? (
                  <>
                    <p className="mt-2 text-lg font-bold tracking-tight">
                      {summary}
                    </p>
                    {monthlyFrom !== null && (
                      <p className="mt-1.5 text-sm text-muted-foreground">
                        Driveway pass from{" "}
                        <strong className="text-foreground">
                          {formatMonthly(monthlyFrom)}/month
                        </strong>{" "}
                        for a {DRIVEWAY_SIZE_LABELS[size].toLowerCase()}{" "}
                        driveway. Walkway packs and add-ons are priced in your
                        free quote.
                      </p>
                    )}
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      Not right?{" "}
                      <a href="#packages" className="text-primary hover:underline">
                        Change your package
                      </a>{" "}
                      or{" "}
                      <a href="#add-ons" className="text-primary hover:underline">
                        your add-ons
                      </a>
                      .
                    </p>
                  </>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">
                    No package picked yet.{" "}
                    <a href="#packages" className="text-primary hover:underline">
                      Choose one above
                    </a>{" "}
                    so we can quote the right thing.
                  </p>
                )}
              </div>

              <Field label="Anything we should know? (gate code, dogs, parking)">
                <Textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  maxLength={1500}
                />
              </Field>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-surface-border p-4 transition-colors hover:border-white/15">
                <input
                  type="checkbox"
                  checked={addOns.includes("VETERAN")}
                  onChange={() => toggleAddOn("VETERAN")}
                  aria-label="I am a serving member, veteran, or military family"
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-surface-border accent-sky-400"
                />
                <span className="text-sm">
                  I am a serving member, veteran, or military family.
                  <span className="block text-xs text-muted-foreground">
                    Applies the standing 10% discount to your quote.
                  </span>
                </span>
              </label>

              {submit.kind === "error" && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-100"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  <span>{submit.message}</span>
                </div>
              )}

              <Button
                type="submit"
                size="xl"
                className="w-full"
                disabled={submit.kind === "submitting" || !tier}
              >
                {submit.kind === "submitting" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Sending…
                  </>
                ) : (
                  <>
                    Get my free quote
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </>
                )}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                We reply within 24 hours. No payment is collected today.
              </p>
            </form>
          )}
        </div>
      </section>

      {/* ── Sticky selection bar ── */}
      {tier && !sent && (
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

/** Renders the town the customer actually typed when they pick "Other". */
function townLabel(town: WinterTown, other: string): string {
  if (town === "OTHER") return other.trim() || "Other Ottawa Valley";
  return WINTER_TOWN_LABELS[town];
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

/** Small illustrative driveway icons, one per size. */
function SizeIcon({ size }: { size: DrivewaySize }) {
  const bays =
    size === "ONE_CAR" ? 1 : size === "TWO_CAR" ? 2 : size === "THREE_PLUS_CAR" ? 3 : 1;
  const long = size === "LONG_RURAL";
  return (
    <svg viewBox="0 0 48 32" className="h-8 w-12" aria-hidden focusable="false">
      <rect
        x="1"
        y={long ? 4 : 8}
        width="46"
        height={long ? 24 : 16}
        rx="3"
        fill="currentColor"
        opacity="0.10"
      />
      {long ? (
        <path
          d="M6 26 L24 6 L42 26"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.85"
        />
      ) : (
        Array.from({ length: bays }, (_, i) => (
          <rect
            key={i}
            x={4 + i * (40 / bays)}
            y="11"
            width={40 / bays - 4}
            height="10"
            rx="2"
            fill="currentColor"
            opacity="0.85"
          />
        ))
      )}
    </svg>
  );
}

function SizeOption({
  size,
  selected,
  onSelect,
}: {
  size: DrivewaySize;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <label
      className={`flex cursor-pointer flex-col items-start gap-2 rounded-2xl border p-4 transition-colors ${
        selected
          ? "border-primary bg-primary/15"
          : "border-surface-border hover:border-white/20"
      }`}
    >
      <input
        type="radio"
        name="drivewaySize"
        checked={selected}
        onChange={onSelect}
        aria-label={`${DRIVEWAY_SIZE_LABELS[size]}, ${DRIVEWAY_SIZE_HINTS[size]}`}
        className="sr-only"
      />
      <span className={selected ? "text-primary" : "text-muted-foreground"}>
        <SizeIcon size={size} />
      </span>
      <span className="text-sm font-medium">{DRIVEWAY_SIZE_LABELS[size]}</span>
      <span className="text-xs leading-snug text-muted-foreground">
        {DRIVEWAY_SIZE_HINTS[size]}
      </span>
    </label>
  );
}

/** A miniature of the shareable card so people know what they will get. */
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

function Confirmation({
  ref,
  name,
  summary,
  smsHref,
  onSaveCard,
  cardBusy,
  cardState,
}: {
  ref: React.Ref<HTMLDivElement>;
  name: string;
  summary: string;
  smsHref: string;
  onSaveCard: () => void;
  cardBusy: boolean;
  cardState: CardState;
}) {
  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="status"
      aria-live="polite"
      className="surface-card mt-8 p-8 text-center focus:outline-none"
    >
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-500/15 text-emerald-300">
        <Check className="h-7 w-7" strokeWidth={3} aria-hidden />
      </div>
      <h3 className="mt-5 text-2xl font-bold tracking-tight">Request sent</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        Thanks{name ? `, ${name.split(" ")[0]}` : ""}. We will confirm your
        route spot within 24 hours. Your request:{" "}
        <strong className="text-foreground">{summary}</strong>.
      </p>

      <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
        <Button asChild variant="outline" size="lg">
          <a href={smsHref}>
            <MessageSquare className="h-4 w-4" aria-hidden />
            Text it instead
          </a>
        </Button>
        <Button type="button" size="lg" onClick={onSaveCard} disabled={cardBusy}>
          {cardBusy ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Download className="h-4 w-4" aria-hidden />
          )}
          Save my package card
        </Button>
      </div>

      {(cardState.kind === "done" || cardState.kind === "error") && (
        <p
          className={`mt-3 text-sm ${
            cardState.kind === "error" ? "text-rose-300" : "text-emerald-300"
          }`}
        >
          {cardState.message}
        </p>
      )}

      <p className="mt-6 text-xs text-muted-foreground">
        <Snowflake className="mr-1 inline h-3 w-3" aria-hidden />
        Storms trigger us automatically once your spot is confirmed. You never
        make a call.
      </p>
    </div>
  );
}

function Field({
  label,
  required,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label className="mb-1.5 block text-sm">
        {label}
        {required && <span className="text-primary"> *</span>}
      </Label>
      {children}
    </div>
  );
}
