import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import {
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  LifeBuoy,
  Pencil,
  ArrowRight,
} from "lucide-react";
import { getDb, isDbReady } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { ReviewCta } from "@/components/review-cta";

export const dynamic = "force-dynamic";

// TODO: edit profile — Phase 2. We'll surface a form here that writes to
// User (firstName, lastName, phone, streetAddress, city, region, postalCode)
// and mirrors changes to Clerk user metadata.

export default async function AccountHomePage() {
  const session = await getSession();
  // Layout already redirected non-customers; this is belt-and-braces.
  if (!session || session.role !== "customer") return null;

  const clerkUser = await currentUser();
  const email =
    clerkUser?.primaryEmailAddress?.emailAddress ?? "(unknown email)";

  // Customer rows are scoped strictly to the signed-in user. We only ever
  // read by `id = session.userId` or by `email = thisUserEmail`.
  let profile = null as Awaited<ReturnType<NonNullable<ReturnType<typeof getDb>>["user"]["findUnique"]>>;
  let supportRequests: Awaited<
    ReturnType<NonNullable<ReturnType<typeof getDb>>["supportRequest"]["findMany"]>
  > = [];

  if (isDbReady()) {
    const db = getDb()!;
    try {
      profile = await db.user.findUnique({ where: { id: session.userId } });
      // Customer's own support requests, matched by email.
      supportRequests = await db.supportRequest.findMany({
        where: { email: email },
        orderBy: { createdAt: "desc" },
        take: 25,
      });
    } catch {
      // Quietly degrade if the DB hiccups; the Clerk-only fallback below renders.
    }
  }

  const name =
    [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") ||
    [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ") ||
    "Customer";

  return (
    <div className="space-y-10">
      <header>
        <p className="eyebrow text-primary">My Account</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Welcome, {name}
        </h1>
        <p className="mt-1.5 text-muted-foreground">
          This is your private area. Only you can see what's on this page.
        </p>
      </header>

      <ReviewCta />


      <section className="surface-card p-6">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-semibold inline-flex items-center gap-2">
            <UserIcon className="h-4 w-4 text-primary" />
            Profile
          </h2>
          <span
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
            title="Editing profile fields is Phase 2"
          >
            <Pencil className="h-3.5 w-3.5" />
            Read-only
          </span>
        </div>

        <dl className="mt-5 grid gap-4 sm:grid-cols-2 text-sm">
          <Row
            icon={<UserIcon className="h-4 w-4 text-primary" />}
            label="Name"
            value={name}
          />
          <Row
            icon={<Mail className="h-4 w-4 text-primary" />}
            label="Email"
            value={email}
          />
          <Row
            icon={<Phone className="h-4 w-4 text-primary" />}
            label="Phone"
            value={profile?.phone || "—"}
          />
          <Row
            icon={<MapPin className="h-4 w-4 text-primary" />}
            label="Address"
            value={formatAddress(profile)}
          />
        </dl>

        <p className="mt-6 text-xs text-muted-foreground">
          Need to update your profile? Email{" "}
          <a
            href="mailto:contact@prestigeviewservices.ca"
            className="text-primary hover:underline"
          >
            contact@prestigeviewservices.ca
          </a>{" "}
          for now — in-place editing is coming soon.
        </p>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold inline-flex items-center gap-2">
            <LifeBuoy className="h-4 w-4 text-primary" />
            My support requests
          </h2>
          <Link
            href="/support"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-blue-300"
          >
            File a new request
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-5">
          {!isDbReady() ? (
            <div className="surface-card p-6 text-sm text-muted-foreground">
              Service history will appear here once the database is wired up.
            </div>
          ) : supportRequests.length === 0 ? (
            <div className="surface-card p-6 text-sm text-muted-foreground">
              You haven't filed any support requests yet.
            </div>
          ) : (
            <ul className="space-y-3">
              {supportRequests.map((r) => (
                <li key={r.id} className="surface-card p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">
                        {r.type} ·{" "}
                        {r.createdAt.toLocaleDateString("en-CA")}
                      </p>
                      <p className="mt-1.5 text-sm text-foreground/90 whitespace-pre-wrap">
                        {r.details}
                      </p>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

type ProfileLite = {
  streetAddress: string | null;
  city: string | null;
  region: string | null;
  postalCode: string | null;
} | null;

function formatAddress(p: ProfileLite): string {
  if (!p) return "—";
  const parts = [
    p.streetAddress,
    [p.city, p.region].filter(Boolean).join(", "),
    p.postalCode,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : "—";
}

function Row({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div>
      <dt className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </dt>
      <dd className="mt-1.5 text-sm text-foreground/90 break-all">{value}</dd>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    NEW: "border-blue-500/30 bg-blue-500/10 text-blue-300",
    IN_PROGRESS: "border-yellow-500/30 bg-yellow-500/10 text-yellow-200",
    RESOLVED: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  };
  return (
    <span
      className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
        styles[status] ?? "border-surface-border text-muted-foreground"
      }`}
    >
      {status.replace("_", " ")}
    </span>
  );
}
