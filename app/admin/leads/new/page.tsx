import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ArrowLeft } from "lucide-react";
import type { Division, LeadSource } from "@prisma/client";
import { getDb, isDbReady, missingDbEnvVars } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { NotConfigured } from "@/components/admin/not-configured";
import { PageHeader, Panel, adminBtn } from "@/components/admin/page-header";
import { allServiceOptions } from "@/lib/content/services";
import { DIVISION_LABEL } from "@/lib/dashboard";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = [
  "ultimate_admin",
  "super_admin",
  "admin",
  "manager",
] as const;

const DIVISIONS: Division[] = ["LAWNPROS", "CLEARVIEW", "SNOWLAND"];
const SOURCES: { value: LeadSource; label: string }[] = [
  { value: "PHONE", label: "Phone call" },
  { value: "DOOR_TO_DOOR", label: "Door to door" },
  { value: "MANUAL", label: "Other / walk-in / referral" },
];

const input =
  "[color-scheme:dark] h-9 w-full rounded-sm border border-white/[0.09] bg-white/[0.03] px-3 text-[13px] text-slate-100 placeholder:text-slate-500 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/25";
const label = "mb-1.5 block text-[12px] font-medium text-slate-300";

type SearchParams = { error?: string };

/**
 * Manual lead entry: phone calls, door knocks and walk-ins go straight
 * into the same inbox as website quote requests, so the pipeline, funnel
 * and break-even numbers include every opportunity.
 */
export default async function NewLeadPage(props: {
  searchParams: Promise<SearchParams>;
}) {
  const searchParams = await props.searchParams;
  await requireRole([...ADMIN_ROLES]);

  if (!isDbReady()) {
    return (
      <NotConfigured
        service="Database"
        reason="Leads are stored in Postgres. Set DATABASE_URL and run `npm run db:migrate`."
        envVars={["DATABASE_URL"]}
        missing={missingDbEnvVars()}
      />
    );
  }

  // The public site may add this slug to the service catalogue; only add
  // the checkbox here when it is not already listed.
  const hasCommercialService = allServiceOptions.some(
    (s) => s.slug === "commercial-snow-removal",
  );
  const byDivision = (["lawnpros", "clearview", "snowland"] as const).map(
    (d) => ({
      key: d,
      label: DIVISION_LABEL[d.toUpperCase() as Division],
      services: allServiceOptions.filter((s) => s.division === d),
    }),
  );

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link
        href="/admin/leads"
        className="inline-flex items-center gap-1.5 text-[13px] text-slate-400 hover:text-slate-200"
      >
        <ArrowLeft className="h-4 w-4" />
        Leads inbox
      </Link>
      <PageHeader
        title="New lead"
        description="Log a phone call, door knock or walk-in. It lands in the Leads Inbox and counts toward pipeline and conversion."
      />

      {searchParams.error && (
        <p className="rounded-sm border border-rose-500/25 bg-rose-500/[0.06] px-3 py-2 text-[13px] text-rose-200">
          {searchParams.error}
        </p>
      )}

      <form action={createLead} className="space-y-4">
        <Panel title="Customer">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="nl-name" className={label}>
                Name *
              </label>
              <input
                id="nl-name"
                name="name"
                required
                maxLength={120}
                className={input}
              />
            </div>
            <div>
              <label htmlFor="nl-phone" className={label}>
                Phone *
              </label>
              <input
                id="nl-phone"
                name="phone"
                type="tel"
                required
                maxLength={40}
                className={input}
                placeholder="613-555-0100"
              />
            </div>
            <div>
              <label htmlFor="nl-email" className={label}>
                Email
              </label>
              <input
                id="nl-email"
                name="email"
                type="email"
                maxLength={200}
                className={input}
              />
            </div>
            <div>
              <label htmlFor="nl-address" className={label}>
                Property address
              </label>
              <input
                id="nl-address"
                name="propertyAddress"
                maxLength={300}
                className={input}
                placeholder="123 Main St, Petawawa"
              />
            </div>
          </div>
        </Panel>

        <Panel title="Opportunity">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="nl-division" className={label}>
                Division
              </label>
              <select
                id="nl-division"
                name="division"
                className={input}
                defaultValue=""
              >
                <option value="">Work it out from services</option>
                {DIVISIONS.map((d) => (
                  <option key={d} value={d}>
                    {DIVISION_LABEL[d]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="nl-source" className={label}>
                Source
              </label>
              <select
                id="nl-source"
                name="source"
                className={input}
                defaultValue="PHONE"
              >
                {SOURCES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="nl-estimate" className={label}>
                Estimate (CAD)
              </label>
              <input
                id="nl-estimate"
                name="estimate"
                inputMode="decimal"
                className={input}
                placeholder="e.g. 450"
              />
            </div>
          </div>

          <fieldset className="mt-5">
            <legend className={label}>Services of interest</legend>
            <div className="grid gap-4 sm:grid-cols-3">
              {byDivision.map((d) => (
                <div key={d.key}>
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">
                    {d.label}
                  </p>
                  <div className="space-y-1">
                    {d.services.map((s) => (
                      <label
                        key={s.slug}
                        className="flex items-center gap-2 text-[13px] text-slate-300"
                      >
                        <input
                          type="checkbox"
                          name="services"
                          value={s.slug}
                          className="h-3.5 w-3.5 accent-blue-500"
                        />
                        {s.name}
                      </label>
                    ))}
                    {d.key === "snowland" && !hasCommercialService && (
                      <label className="flex items-center gap-2 text-[13px] text-slate-300">
                        <input
                          type="checkbox"
                          name="services"
                          value="commercial-snow-removal"
                          className="h-3.5 w-3.5 accent-blue-500"
                        />
                        Commercial Snow Removal
                      </label>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </fieldset>

          <div className="mt-5">
            <label htmlFor="nl-message" className={label}>
              What they asked for
            </label>
            <textarea
              id="nl-message"
              name="message"
              rows={3}
              maxLength={5000}
              className={`${input} h-auto py-2`}
            />
          </div>
        </Panel>

        <div className="flex justify-end gap-2">
          <Link href="/admin/leads" className={adminBtn.secondary}>
            Cancel
          </Link>
          <button type="submit" className={adminBtn.primary}>
            Save lead
          </button>
        </div>
      </form>
    </div>
  );
}

async function createLead(formData: FormData) {
  "use server";
  await requireRole([...ADMIN_ROLES]);
  const db = getDb();
  if (!db) throw new Error("DB not configured");

  const str = (k: string, max: number) =>
    String(formData.get(k) ?? "")
      .trim()
      .slice(0, max);
  const name = str("name", 120);
  const phone = str("phone", 40);
  if (!name || !phone) {
    redirect(
      `/admin/leads/new?error=${encodeURIComponent("Name and phone are required.")}`,
    );
  }

  const knownSlugs = new Set([
    ...allServiceOptions.map((s) => s.slug),
    "commercial-snow-removal",
  ]);
  const services = formData
    .getAll("services")
    .map(String)
    .filter((s) => knownSlugs.has(s));

  let division = str("division", 20) as Division | "";
  if (!DIVISIONS.includes(division as Division)) division = "";
  if (!division && services.length) {
    const first = allServiceOptions.find((s) => s.slug === services[0]);
    division = first
      ? (first.division.toUpperCase() as Division)
      : services[0] === "commercial-snow-removal"
        ? "SNOWLAND"
        : "";
  }

  const sourceRaw = str("source", 20);
  const source = SOURCES.some((s) => s.value === sourceRaw)
    ? (sourceRaw as LeadSource)
    : "MANUAL";

  const estRaw = str("estimate", 20).replace(/[$,\s]/g, "");
  const est = estRaw ? Number(estRaw) : NaN;
  const estimateCents =
    Number.isFinite(est) && est >= 0 && est < 10_000_000
      ? Math.round(est * 100)
      : null;

  const lead = await db.lead.create({
    data: {
      name,
      phone,
      email: str("email", 200).toLowerCase(),
      propertyAddress: str("propertyAddress", 300) || null,
      division: division || null,
      serviceSlugs: services,
      message: str("message", 5000) || null,
      source,
      estimateCents,
    },
  });

  revalidatePath("/admin/leads");
  revalidatePath("/admin");
  redirect(`/admin/leads?q=${encodeURIComponent(lead.phone)}`);
}
