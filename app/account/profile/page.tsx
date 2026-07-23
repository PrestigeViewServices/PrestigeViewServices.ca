import { revalidatePath } from "next/cache";
import { Medal, Save } from "lucide-react";
import { getDb } from "@/lib/db";
import { getMember, requireMemberId } from "@/lib/customer-auth";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const inputCls =
  "h-11 w-full rounded-xl border border-surface-border bg-input/80 px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export default async function ProfilePage() {
  const member = await getMember();
  if (!member) return null;
  const p = member.profile;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Profile
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Keep your details current so crews and bonuses land in the right
          place.
        </p>
      </header>

      <form action={saveProfile} className="space-y-6">
        {/* ---- Contact ---- */}
        <section className="surface-card space-y-4 p-5 sm:p-7">
          <h2 className="text-lg font-semibold">Contact</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium" htmlFor="pf-first">
                First name
              </label>
              <input
                id="pf-first"
                name="firstName"
                required
                defaultValue={member.firstName}
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium" htmlFor="pf-last">
                Last name
              </label>
              <input
                id="pf-last"
                name="lastName"
                defaultValue={member.lastName ?? ""}
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium" htmlFor="pf-phone">
                Phone
              </label>
              <input
                id="pf-phone"
                name="phone"
                type="tel"
                defaultValue={member.phone ?? ""}
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Email</label>
              <input
                value={member.email}
                disabled
                className={`${inputCls} opacity-60`}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                To change your sign-in email, send us a request.
              </p>
            </div>
          </div>
        </section>

        {/* ---- Service address ---- */}
        <section className="surface-card space-y-4 p-5 sm:p-7">
          <h2 className="text-lg font-semibold">Service address</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium" htmlFor="pf-street">
                Street address
              </label>
              <input
                id="pf-street"
                name="streetAddress"
                defaultValue={p?.streetAddress ?? ""}
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium" htmlFor="pf-city">
                City / town
              </label>
              <input
                id="pf-city"
                name="city"
                placeholder="Petawawa"
                defaultValue={p?.city ?? ""}
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium" htmlFor="pf-postal">
                Postal code
              </label>
              <input
                id="pf-postal"
                name="postalCode"
                placeholder="K8H 1A1"
                defaultValue={p?.postalCode ?? ""}
                className={inputCls}
              />
            </div>
          </div>
        </section>

        {/* ---- Club details ---- */}
        <section className="surface-card space-y-4 p-5 sm:p-7">
          <h2 className="text-lg font-semibold">Club details</h2>
          <div>
            <label className="mb-1.5 block text-sm font-medium" htmlFor="pf-birthday">
              Birthday month
            </label>
            <select
              id="pf-birthday"
              name="birthdayMonth"
              defaultValue={p?.birthdayMonth?.toString() ?? ""}
              className={inputCls}
            >
              <option value="">Prefer not to say</option>
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-muted-foreground">
              Members with a birthday month on file get a 100-point bonus each
              year.
            </p>
          </div>

          <div className="rounded-2xl border border-sky-400/25 bg-sky-500/5 p-4">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                name="veteran"
                defaultChecked={p?.veteranStatus !== "NONE"}
                className="mt-1 h-4 w-4 rounded border-surface-border accent-[#3B82F6]"
              />
              <span className="text-sm leading-relaxed">
                <span className="inline-flex items-center gap-1.5 font-semibold">
                  <Medal className="h-4 w-4 text-sky-400" />
                  I&apos;m a military member, veteran, or first responder
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  Flags your account for the standing 10% PVS discount on
                  every service. Verified on your first service, thank you for
                  serving.
                  {p?.veteranStatus === "VERIFIED" && (
                    <span className="mt-1 block font-semibold text-emerald-300">
                      Verified — your discount is locked in.
                    </span>
                  )}
                </span>
              </span>
            </label>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">Email notifications</p>
            <label className="flex items-center gap-3 py-1 text-sm">
              <input
                type="checkbox"
                name="notifyServiceReminders"
                defaultChecked={p?.notifyServiceReminders ?? true}
                className="h-4 w-4 rounded border-surface-border accent-[#3B82F6]"
              />
              Service updates and request replies
            </label>
            <label className="flex items-center gap-3 py-1 text-sm">
              <input
                type="checkbox"
                name="notifyPromos"
                defaultChecked={p?.notifyPromos ?? true}
                className="h-4 w-4 rounded border-surface-border accent-[#3B82F6]"
              />
              Seasonal promos and early-bird offers
            </label>
          </div>
        </section>

        <Button type="submit" size="lg">
          <Save className="h-4 w-4" />
          Save profile
        </Button>
      </form>
    </div>
  );
}

// --- server action ----------------------------------------------------------

async function saveProfile(formData: FormData) {
  "use server";
  const memberId = await requireMemberId();
  const db = getDb();
  if (!db) throw new Error("DB not configured");

  const firstName = String(formData.get("firstName") ?? "").trim().slice(0, 60);
  const lastName = String(formData.get("lastName") ?? "").trim().slice(0, 60);
  const phone = String(formData.get("phone") ?? "").trim().slice(0, 30);
  const streetAddress = String(formData.get("streetAddress") ?? "")
    .trim()
    .slice(0, 140);
  const city = String(formData.get("city") ?? "").trim().slice(0, 60);
  const postalCode = String(formData.get("postalCode") ?? "")
    .trim()
    .slice(0, 12);
  const birthdayRaw = Number(formData.get("birthdayMonth"));
  const birthdayMonth =
    Number.isInteger(birthdayRaw) && birthdayRaw >= 1 && birthdayRaw <= 12
      ? birthdayRaw
      : null;
  const veteranChecked = formData.get("veteran") === "on";
  const notifyServiceReminders =
    formData.get("notifyServiceReminders") === "on";
  const notifyPromos = formData.get("notifyPromos") === "on";

  if (!firstName) throw new Error("First name is required");

  const existing = await db.customerProfile.findUnique({
    where: { memberId },
    select: { veteranStatus: true },
  });
  // Self-declaration never downgrades an admin-VERIFIED status; unchecking
  // clears a self-declaration only.
  const veteranStatus =
    existing?.veteranStatus === "VERIFIED"
      ? veteranChecked
        ? "VERIFIED"
        : "NONE"
      : veteranChecked
        ? "SELF_DECLARED"
        : "NONE";

  await db.$transaction([
    db.member.update({
      where: { id: memberId },
      data: {
        firstName,
        lastName: lastName || null,
        phone: phone || null,
      },
    }),
    db.customerProfile.upsert({
      where: { memberId },
      create: {
        memberId,
        streetAddress: streetAddress || null,
        city: city || null,
        postalCode: postalCode || null,
        birthdayMonth,
        veteranStatus,
        notifyServiceReminders,
        notifyPromos,
      },
      update: {
        streetAddress: streetAddress || null,
        city: city || null,
        postalCode: postalCode || null,
        birthdayMonth,
        veteranStatus,
        notifyServiceReminders,
        notifyPromos,
      },
    }),
  ]);

  revalidatePath("/account/profile");
  revalidatePath("/account");
}
